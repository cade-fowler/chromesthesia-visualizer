// One-off migration: move colors embedded in songs (Song.colors: string[]) into the
// `colors` collection, one ColorEntry per color, and reshape songs to the current Song.
//
// Safe to rerun: a song keeps its embedded `colors` until its entries are written, and
// rerunning first deletes entries an earlier, interrupted run made for that song.
//
// It loads every song into memory, which is fine for a personal library.

import { isDeepStrictEqual } from 'node:util';
import { ObjectId, type Db, type Document } from 'mongodb';
import type { HexColor, Song } from '@chromesthesia/shared';
import type { ColorDoc } from '../db.js';
import { hexColor, upsertSongSchema } from '../validation.js';

/** Fields a stored song keeps; anything else (old Spotify fields, `colors`) is dropped. */
const SONG_FIELDS = new Set(['_id', 'id', 'title', 'artists', 'albumImageUrl', 'songUrl', 'notes']);

export interface SplitColorsReport {
    dryRun: boolean;
    songsScanned: number;
    /** Song ids that had several documents, merged into the oldest one */
    merged: { id: string; removed: number }[];
    /** Songs whose embedded colors became color entries */
    converted: { id: string; colors: number }[];
    /** Songs whose stored shape changed, with any fields that were dropped */
    reshaped: { id: string; dropped: string[] }[];
    /** Songs left untouched because they couldn't be migrated safely */
    skipped: { id: string; reason: string }[];
    colorsCreated: number;
}

/** A song as stored, in whatever shape it was written (old _ids may not be ObjectIds). */
type RawSong = Document;

interface Plan {
    id: string;
    keep: RawSong;
    duplicates: RawSong[];
    /** The duplicates merged into one document (still in the old shape) */
    merged: RawSong;
    song: Song;
    /** Normalized embedded colors, or undefined if the song has no `colors` field */
    colors?: HexColor[];
}

const unique = <T>(items: T[]) => [...new Set(items)];

const withoutUndefined = <T extends object>(obj: T) =>
    Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;

/** Merges documents for the same song id: the oldest wins, the others fill gaps. */
function mergeDuplicates([oldest, ...rest]: RawSong[]): RawSong {
    const merged: RawSong = { ...oldest };
    for (const doc of rest) {
        for (const [key, value] of Object.entries(doc)) {
            if (key === '_id') continue;
            if ((key === 'colors' || key === 'notes') && Array.isArray(merged[key])) {
                if (Array.isArray(value)) merged[key] = unique([...merged[key], ...value]);
            } else if (merged[key] === undefined) {
                merged[key] = value;
            }
        }
    }
    return merged;
}

/** Converts a stored song, in any shape this app has used, to the current Song. */
function normalize(raw: RawSong): { song: Song; colors?: HexColor[] } | { error: string } {
    // Old documents are raw Spotify tracks: `name`, artist objects, `external_urls`
    const artists: unknown = Array.isArray(raw.artists)
        ? raw.artists
              .map((a: unknown) => (typeof a === 'string' ? a : (a as { name?: unknown })?.name))
              .map((a: unknown) => (typeof a === 'string' ? a.trim() : a))
              .filter((a: unknown) => a !== '')
        : raw.artists;
    const notes: unknown =
        typeof raw.notes === 'string'
            ? [raw.notes.trim()]
            : Array.isArray(raw.notes)
              ? unique(raw.notes.map((n: unknown) => (typeof n === 'string' ? n.trim() : n)))
              : raw.notes;

    const parsed = upsertSongSchema.safeParse(
        withoutUndefined({
            title: raw.title ?? raw.name,
            artists,
            albumImageUrl: raw.albumImageUrl ?? raw.album?.images?.[0]?.url,
            songUrl: raw.songUrl ?? raw.external_urls?.spotify,
            notes,
        }),
    );
    if (!parsed.success) {
        const issue = parsed.error.issues[0];
        return { error: `${issue.path.join('.') || 'song'}: ${issue.message}` };
    }
    const song: Song = { id: raw.id, ...withoutUndefined(parsed.data) };

    if (raw.colors === undefined) return { song };
    if (!Array.isArray(raw.colors)) return { error: 'colors is not a list' };
    const colors: HexColor[] = [];
    for (const value of raw.colors) {
        const color = hexColor.safeParse(value);
        if (!color.success) return { error: `invalid color ${JSON.stringify(value)}` };
        colors.push(color.data);
    }
    return { song, colors: unique(colors) };
}

export async function migrateSplitColors(
    db: Db,
    { dryRun = false }: { dryRun?: boolean } = {},
): Promise<SplitColorsReport> {
    const songs = db.collection<RawSong>('songs');
    const colors = db.collection<ColorDoc>('colors');
    const report: SplitColorsReport = {
        dryRun,
        songsScanned: 0,
        merged: [],
        converted: [],
        reshaped: [],
        skipped: [],
        colorsCreated: 0,
    };

    // Group documents by song id, oldest first (there was no unique index before)
    const groups = new Map<string, RawSong[]>();
    for (const doc of await songs.find().sort({ _id: 1 }).toArray()) {
        report.songsScanned++;
        if (typeof doc.id !== 'string' || !doc.id) {
            report.skipped.push({ id: String(doc._id), reason: 'missing id' });
            continue;
        }
        groups.set(doc.id, [...(groups.get(doc.id) ?? []), doc]);
    }

    const plans: Plan[] = [];
    for (const [id, docs] of groups) {
        const merged = mergeDuplicates(docs);
        const result = normalize(merged);
        if ('error' in result) {
            report.skipped.push({ id, reason: result.error });
            continue;
        }
        plans.push({ id, keep: docs[0], duplicates: docs.slice(1), merged, ...result });
    }

    const runAt = new Date();
    for (const plan of plans) {
        const { id, keep, duplicates, merged, song } = plan;
        // Removing the embedded colors is reported as a conversion, not a reshape
        const { _id: _, colors: _colors, ...current } = merged;
        const reshaped = !isDeepStrictEqual(current, song);
        if (!duplicates.length && !plan.colors && !reshaped) continue; // already migrated

        if (duplicates.length) report.merged.push({ id, removed: duplicates.length });
        if (plan.colors) report.converted.push({ id, colors: plan.colors.length });
        if (reshaped) {
            const dropped = Object.keys(merged).filter(
                (k) => !SONG_FIELDS.has(k) && k !== 'colors',
            );
            report.reshaped.push({ id, dropped });
        }
        report.colorsCreated += plan.colors?.length ?? 0;
        if (dryRun) continue;

        const byId = { _id: keep._id };

        // 1. Collapse duplicates first, keeping every embedded color on the surviving doc,
        //    so a crash here loses nothing and a rerun merges the same set again.
        if (duplicates.length) {
            await songs.replaceOne(byId, merged);
            await songs.deleteMany({ _id: { $in: duplicates.map((d) => d._id) } });
        }

        // 2. Write the color entries, replacing any from an interrupted run.
        if (plan.colors) {
            // Best available date: when the song was first saved (ObjectIds embed it)
            const createdAt = keep._id instanceof ObjectId ? keep._id.getTimestamp() : runAt;
            await colors.deleteMany({ songId: id, migratedAt: { $exists: true } });
            if (plan.colors.length) {
                await colors.insertMany(
                    plan.colors.map((color) => ({
                        _id: new ObjectId(),
                        songId: id,
                        color,
                        createdAt,
                        migratedAt: runAt,
                    })),
                );
            }
        }

        // 3. Only now drop the embedded colors (and any old fields) from the song.
        await songs.replaceOne(byId, song);
    }

    return report;
}
