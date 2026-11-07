import { Router } from 'express';
import { z } from 'zod';
import type { Document } from 'mongodb';
import { ObjectId } from 'mongodb';
import type {
    ApiError,
    ColorEntry,
    Song,
    SongSummary,
    SongWithColors,
} from '@chromesthesia/shared';
import { requireOwner } from '../auth.js';
import { colors, songs, toColorEntry } from '../db.js';
import {
    addColorSchema,
    listQuerySchema,
    randomQuerySchema,
    upsertSongSchema,
} from '../validation.js';

const router = Router();

type NoParams = Record<string, never>;
type IdParams = { id: string };

// Don't leak Mongo's _id; the Spotify track id is the public identifier
const withoutMongoId = { projection: { _id: 0 } } as const;

const songExists = async (id: string) => (await songs().countDocuments({ id }, { limit: 1 })) > 0;

// Song order: by where the part starts, then by when it was saved. Whole-song colors have no
// startMs, which Mongo sorts before any number, so they come first. Keep in step with
// compareColorEntries() in the client.
const colorsFor = async (songId: string): Promise<ColorEntry[]> => {
    const docs = await colors()
        .find({ songId })
        .sort({ startMs: 1, createdAt: 1, _id: 1 })
        .toArray();
    return docs.map(toColorEntry);
};

// Escapes text so it matches literally inside a RegExp
const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// List songs, newest first, each with its colors' hex values. Filters: ?title= and ?artist=
// (exact), ?q= (text in the title, an artist or the album name), ?decade= and ?limit=.
router.get<NoParams, SongSummary[] | ApiError>('/', async (req, res) => {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid query' });
    const { title, artist, q, decade, limit = 50 } = parsed.data;

    const filter: Document = {};
    if (title) filter.title = title;
    if (artist) filter.artists = artist;
    if (q) {
        const text = new RegExp(escapeRegExp(q), 'i');
        filter.$or = [{ title: text }, { artists: text }, { 'album.name': text }];
    }
    // releaseDate starts with the year, so 1990 matches "199…"
    if (decade !== undefined) filter['album.releaseDate'] = { $regex: `^${decade / 10}` };

    const docs = await songs()
        .aggregate<Song & { colors: string[]; addedAt: Date | null }>([
            { $match: filter },
            {
                $lookup: {
                    from: 'colors',
                    localField: 'id',
                    foreignField: 'songId',
                    // Song order, as in colorsFor()
                    pipeline: [
                        { $sort: { startMs: 1, createdAt: 1, _id: 1 } },
                        { $project: { _id: 0, color: 1, createdAt: 1 } },
                    ],
                    as: 'colorDocs',
                },
            },
            {
                $addFields: {
                    colors: '$colorDocs.color',
                    addedAt: { $min: '$colorDocs.createdAt' },
                },
            },
            // Songs with no colors have a null addedAt, which sorts last
            { $sort: { addedAt: -1, title: 1, id: 1 } },
            { $limit: limit },
            { $project: { _id: 0, colorDocs: 0 } },
        ])
        .toArray();

    res.json(
        docs.map(({ addedAt, ...song }) =>
            addedAt ? { ...song, addedAt: addedAt.toISOString() } : song,
        ),
    );
});

// One random song that has colors, with its colors. ?not= skips a song (the one on screen)
// unless it's the only one.
router.get<NoParams, SongWithColors | ApiError>('/random', async (req, res) => {
    const parsed = randomQuerySchema.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid query' });

    const sample = async (match: Document) => {
        const [song] = await songs()
            .aggregate<Song>([
                { $match: match },
                {
                    $lookup: {
                        from: 'colors',
                        localField: 'id',
                        foreignField: 'songId',
                        pipeline: [{ $limit: 1 }, { $project: { _id: 1 } }],
                        as: 'anyColor',
                    },
                },
                { $match: { 'anyColor.0': { $exists: true } } },
                { $sample: { size: 1 } },
                { $project: { _id: 0, anyColor: 0 } },
            ])
            .toArray();
        return song;
    };

    const { not } = parsed.data;
    const song = (not !== undefined && (await sample({ id: { $ne: not } }))) || (await sample({}));
    if (!song) return res.status(404).json({ error: 'No songs with colors yet' });
    res.json({ ...song, colors: await colorsFor(song.id) });
});

// Get one song by Spotify track id, with its colors in song order
router.get<IdParams, SongWithColors | ApiError>('/:id', async (req, res) => {
    const song = await songs().findOne({ id: req.params.id }, withoutMongoId);
    if (!song) return res.status(404).json({ error: 'Song not found' });
    res.json({ ...song, colors: await colorsFor(song.id) });
});

// Create or update a song's metadata
router.put<IdParams, Song | ApiError>('/:id', requireOwner, async (req, res) => {
    const parsed = upsertSongSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: z.prettifyError(parsed.error) });
    }
    const song: Song = { id: req.params.id, ...parsed.data };

    // $set only touches the given fields, so drop an albumImageUrl the client no longer sends
    const update =
        song.albumImageUrl === undefined
            ? { $set: song, $unset: { albumImageUrl: '' as const } }
            : { $set: song };
    const result = await songs().updateOne({ id: song.id }, update, { upsert: true });
    // Read it back: notes the request left out are kept, so the body isn't the whole song
    const saved = await songs().findOne({ id: song.id }, withoutMongoId);
    res.status(result.upsertedCount ? 201 : 200).json(saved!);
});

// Get the colors for one song, in song order
router.get<IdParams, ColorEntry[] | ApiError>('/:id/colors', async (req, res) => {
    if (!(await songExists(req.params.id))) {
        return res.status(404).json({ error: 'Song not found' });
    }
    res.json(await colorsFor(req.params.id));
});

// Assign a color to a song or part of it
router.post<IdParams, ColorEntry | ApiError>('/:id/colors', requireOwner, async (req, res) => {
    const parsed = addColorSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: z.prettifyError(parsed.error) });
    }
    if (!(await songExists(req.params.id))) {
        return res.status(404).json({ error: 'Song not found' });
    }

    const doc = {
        _id: new ObjectId(),
        songId: req.params.id,
        ...parsed.data,
        createdAt: new Date(),
    };
    await colors().insertOne(doc);
    res.status(201).json(toColorEntry(doc));
});

export default router;
