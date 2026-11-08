import { Router } from 'express';
import { z } from 'zod';
import type { Document } from 'mongodb';
import { ObjectId } from 'mongodb';
import type {
    ApiError,
    ColorEntry,
    ColorFamily,
    ColorMatch,
    HexColor,
    SimilarSong,
    Song,
    SongSummary,
    SongWithColors,
} from '@chromesthesia/shared';
import { requireOwner } from '../auth.js';
import {
    CLOSE_DISTANCE,
    FAMILY_COLORS,
    SIMILAR_DISTANCE,
    colorDistance,
    familyOf,
    inColorRange,
    rangeCenterDistance,
    songDistance,
    type ColorRange,
} from '../color.js';
import { colors, songOrder, songs, toColorEntry } from '../db.js';
import {
    addColorSchema,
    listQuerySchema,
    randomQuerySchema,
    similarQuerySchema,
    upsertSongSchema,
} from '../validation.js';

const router = Router();

type NoParams = Record<string, never>;
type IdParams = { id: string };

// Don't leak Mongo's _id; the Spotify track id is the public identifier
const withoutMongoId = { projection: { _id: 0 } } as const;

const songExists = async (id: string) => (await songs().countDocuments({ id }, { limit: 1 })) > 0;

// A song's colors in song order (see songOrder)
const colorsFor = async (songId: string): Promise<ColorEntry[]> => {
    const docs = await colors().find({ songId }).sort(songOrder).toArray();
    return docs.map(toColorEntry);
};

// The song's color closest to target, among those in family when one is given
const closestColor = (
    hexes: HexColor[],
    target: HexColor,
    family?: ColorFamily,
): ColorMatch | undefined => {
    let best: ColorMatch | undefined;
    for (const hex of hexes) {
        if (family !== undefined && familyOf(hex) !== family) continue;
        const distance = colorDistance(hex, target);
        if (!best || distance < best.distance) best = { color: hex, distance };
    }
    return best;
};

// For a range search: how many of the song's colors are in the range, and the one closest to
// the range's middle (undefined when none are)
const rangeMatch = (hexes: HexColor[], range: ColorRange): ColorMatch | undefined => {
    let best: ColorMatch | undefined;
    let inRange = 0;
    for (const hex of hexes) {
        if (!inColorRange(hex, range)) continue;
        inRange++;
        const distance = rangeCenterDistance(hex, range);
        if (!best || distance < best.distance) best = { color: hex, distance };
    }
    return best && { ...best, inRange };
};

// Aggregation stages that give each song its colors' hex values in song order (as in
// colorsFor()) and addedAt, the time of its first color (null when it has none)
const summaryStages: Document[] = [
    {
        $lookup: {
            from: 'colors',
            localField: 'id',
            foreignField: 'songId',
            pipeline: [{ $sort: songOrder }, { $project: { _id: 0, color: 1, createdAt: 1 } }],
            as: 'colorDocs',
        },
    },
    {
        $addFields: {
            colors: '$colorDocs.color',
            addedAt: { $min: '$colorDocs.createdAt' },
        },
    },
];

type SummaryDoc = Song & { colors: HexColor[]; addedAt: Date | null };

const toSummary = ({ addedAt, ...song }: SummaryDoc): SongSummary =>
    addedAt ? { ...song, addedAt: addedAt.toISOString() } : song;

// Escapes text so it matches literally inside a RegExp
const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// List songs, newest first, each with its colors' hex values. Filters: ?title= and ?artist=
// (exact), ?q= (text in the title, an artist or the album name), ?decade=, and a search by
// color: ?color= (close to this hex) or ?family= (any color in that family), which rank the
// closest match first, or a range search: ?hue= and/or ?light= (colors in those ranges), which
// ranks songs with the biggest share of their colors in range first. ?limit= caps the results.
router.get<NoParams, SongSummary[] | ApiError>('/', async (req, res) => {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid query' });
    const { title, artist, q, decade, color, family, hue, light, limit = 50 } = parsed.data;

    const filter: Document = {};
    if (title) filter.title = title;
    if (artist) filter.artists = artist;
    if (q) {
        const text = new RegExp(escapeRegExp(q), 'i');
        filter.$or = [{ title: text }, { artists: text }, { 'album.name': text }];
    }
    // releaseDate starts with the year, so 1990 matches "199…"
    if (decade !== undefined) filter['album.releaseDate'] = { $regex: `^${decade / 10}` };

    // A search by color scores every song in Node (Mongo can't do the color math), so the limit
    // applies after ranking instead of in the pipeline
    const byRange = hue !== undefined || light !== undefined;
    const byColor = color !== undefined || family !== undefined || byRange;

    const docs = await songs()
        .aggregate<SummaryDoc>([
            { $match: filter },
            ...summaryStages,
            // Songs with no colors have a null addedAt, which sorts last
            { $sort: { addedAt: -1, title: 1, id: 1 } },
            ...(byColor ? [] : [{ $limit: limit }]),
            { $project: { _id: 0, colorDocs: 0 } },
        ])
        .toArray();

    const summaries = docs.map(toSummary);
    if (!byColor) return res.json(summaries);

    if (byRange) {
        const share = (song: SongSummary & { match: ColorMatch }) =>
            song.match.inRange! / song.colors.length;
        const ranked = summaries
            .map((song) => ({ ...song, match: rangeMatch(song.colors, { hue, light }) }))
            .filter((song): song is SongSummary & { match: ColorMatch } => !!song.match)
            // Stable sort, so songs that tie stay newest first
            .sort((a, b) => share(b) - share(a) || a.match.distance - b.match.distance)
            .slice(0, limit);
        return res.json(ranked);
    }

    const target = color ?? FAMILY_COLORS[family!];
    const ranked = summaries
        .map((song) => ({ ...song, match: closestColor(song.colors, target, family) }))
        .filter((song): song is SongSummary & { match: ColorMatch } => {
            if (!song.match) return false;
            // A family match counts however far it is from the swatch; an exact search has a cutoff
            return family !== undefined || song.match.distance <= CLOSE_DISTANCE;
        })
        // Stable sort, so equally close songs stay newest first
        .sort((a, b) => a.match.distance - b.match.distance)
        .slice(0, limit);
    res.json(ranked);
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

// Delete a song and all its colors. The colors go first, so a failure partway leaves the song
// in place to retry rather than colors pointing at a song that's gone.
router.delete<IdParams, ApiError>('/:id', requireOwner, async (req, res) => {
    await colors().deleteMany({ songId: req.params.id });
    const result = await songs().deleteOne({ id: req.params.id });
    if (!result.deletedCount) return res.status(404).json({ error: 'Song not found' });
    res.status(204).end();
});

// Songs whose colors are close to this one's (songDistance() within SIMILAR_DISTANCE, and at
// least one color within CLOSE_DISTANCE of one of this song's), closest first. Every song is scored in Node, like a search by color. ?limit= caps the results.
router.get<IdParams, SimilarSong[] | ApiError>('/:id/similar', async (req, res) => {
    const parsed = similarQuerySchema.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid query' });
    const { limit = 6 } = parsed.data;

    if (!(await songExists(req.params.id))) {
        return res.status(404).json({ error: 'Song not found' });
    }
    const target = (await colorsFor(req.params.id)).map((entry) => entry.color);
    if (target.length === 0) return res.json([]);

    const docs = await songs()
        .aggregate<SummaryDoc>([
            { $match: { id: { $ne: req.params.id } } },
            ...summaryStages,
            { $match: { 'colors.0': { $exists: true } } },
            // Newest first, so equally close songs stay in that order after the stable sort
            { $sort: { addedAt: -1, title: 1, id: 1 } },
            { $project: { _id: 0, colorDocs: 0 } },
        ])
        .toArray();

    const similar: SimilarSong[] = docs
        .map((doc) => {
            const { distance, close } = songDistance(target, doc.colors);
            return { ...toSummary(doc), similarity: { distance, close, total: target.length } };
        })
        .filter(({ similarity }) => similarity.distance <= SIMILAR_DISTANCE && similarity.close > 0)
        .sort((a, b) => a.similarity.distance - b.similarity.distance)
        .slice(0, limit);
    res.json(similar);
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
