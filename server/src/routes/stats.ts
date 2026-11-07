import { Router } from 'express';
import type { ApiError, HueChartColor, LibraryStats } from '@chromesthesia/shared';
import type { ObjectId } from 'mongodb';
import { colors, songs } from '../db.js';
import { GREY_CHROMA, hexToOkLch } from '../color.js';

const router = Router();

// Counts across everything logged, for the home page
router.get<Record<string, never>, LibraryStats | ApiError>('/', async (_req, res) => {
    const [songCount, colorCount, parts, artists, releaseDates] = await Promise.all([
        songs().countDocuments(),
        colors().countDocuments(),
        colors().countDocuments({ startMs: { $exists: true } }),
        songs().distinct('artists'),
        songs().distinct('album.releaseDate'),
    ]);
    const decades = new Set(
        (releaseDates as string[]).map((date) => Math.floor(Number(date.slice(0, 4)) / 10) * 10),
    );

    res.json({
        songs: songCount,
        colors: colorCount,
        artists: artists.length,
        parts,
        decades: [...decades].sort((a, b) => a - b),
    });
});

interface HueDoc {
    _id: ObjectId;
    color: string;
    songId: string;
    title: string;
    artists: string[];
}

// Every color entry with its song's title and artists, for the home page's hue chart. Greyish
// colors get a null hue (see GREY_CHROMA), so the chart can keep them apart from the hues.
router.get<Record<string, never>, HueChartColor[] | ApiError>('/hues', async (_req, res) => {
    const docs = await colors()
        .aggregate<HueDoc>([
            { $lookup: { from: 'songs', localField: 'songId', foreignField: 'id', as: 'song' } },
            // An entry whose song is gone has nowhere to link to
            { $unwind: '$song' },
            { $sort: { createdAt: 1, _id: 1 } },
            {
                $project: {
                    color: 1,
                    songId: 1,
                    title: '$song.title',
                    artists: '$song.artists',
                },
            },
        ])
        .toArray();

    res.json(
        docs.map(({ _id, color, songId, title, artists }) => {
            const { L, C, h } = hexToOkLch(color);
            return {
                id: _id.toHexString(),
                color,
                songId,
                title,
                artists,
                hue: C < GREY_CHROMA ? null : Math.round(h * 10) / 10,
                lightness: Math.round(L * 1000) / 1000,
            };
        }),
    );
});

export default router;
