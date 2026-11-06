import { Router } from 'express';
import type { ApiError, LibraryStats } from '@chromesthesia/shared';
import { colors, songs } from '../db.js';

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

export default router;
