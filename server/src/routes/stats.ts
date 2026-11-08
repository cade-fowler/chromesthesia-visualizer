import { Router } from 'express';
import type {
    ApiError,
    CollectionProgress,
    ColorFamily,
    ColorShade,
    HexColor,
    HueChartColor,
    LibraryStats,
    Song,
} from '@chromesthesia/shared';
import type { ObjectId } from 'mongodb';
import { requireOwner } from '../auth.js';
import { colors, songOrder, songs } from '../db.js';
import { FAMILY_COLORS, GREY_CHROMA, familyOf, hexToOkLch, shadeOf } from '../color.js';

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

/** How far back loggedAt goes: long enough for any streak worth showing. */
const LOGGED_AT_DAYS = 90;

/** The decades always listed in progress, even with no songs: 1960s to now. */
const FIRST_DECADE = 1960;

/** A family's coverage channel holds this many songs' colors. */
const CHANNEL_SIZE = 10;

const SHADES: ColorShade[] = ['pale', 'mid', 'deep'];

const decadeOf = (song: Song) =>
    song.album ? Math.floor(Number(song.album.releaseDate.slice(0, 4)) / 10) * 10 : undefined;

type ProgressDoc = Song & {
    colorDocs: { color: HexColor; createdAt: Date; startMs?: number }[];
};

// What the Studio's Logbook shows: progress, coverage and the gaps it suggests filling. Private
// to the owner.
router.get<Record<string, never>, CollectionProgress | ApiError>(
    '/progress',
    requireOwner,
    async (_req, res) => {
        const docs = await songs()
            .aggregate<ProgressDoc>([
                {
                    $lookup: {
                        from: 'colors',
                        localField: 'id',
                        foreignField: 'songId',
                        pipeline: [
                            { $sort: songOrder },
                            { $project: { _id: 0, color: 1, createdAt: 1, startMs: 1 } },
                        ],
                        as: 'colorDocs',
                    },
                },
                { $project: { _id: 0 } },
            ])
            .toArray();

        // Newest songs first, by first color, so channels show recent colors
        const addedAt = (doc: ProgressDoc) =>
            Math.min(...doc.colorDocs.map((c) => c.createdAt.getTime()));
        const logged = docs
            .filter((doc) => doc.colorDocs.length > 0)
            .sort((a, b) => addedAt(b) - addedAt(a));

        const since = Date.now() - LOGGED_AT_DAYS * 24 * 60 * 60 * 1000;
        const loggedAt = logged
            .map(addedAt)
            .filter((time) => time >= since)
            .map((time) => new Date(time).toISOString());

        const bucketKey = (family: ColorFamily, shade: ColorShade | null) =>
            `${family}:${shade ?? ''}`;
        const bucketSongs = new Map<string, number>();
        const familyColors = new Map<ColorFamily, HexColor[]>();
        const familySongs = new Map<ColorFamily, number>();
        for (const doc of logged) {
            const seenBuckets = new Set<string>();
            const seenFamilies = new Set<ColorFamily>();
            for (const { color } of doc.colorDocs) {
                const family = familyOf(color);
                const key = bucketKey(family, shadeOf(color));
                if (!seenBuckets.has(key)) {
                    seenBuckets.add(key);
                    bucketSongs.set(key, (bucketSongs.get(key) ?? 0) + 1);
                }
                if (!seenFamilies.has(family)) {
                    seenFamilies.add(family);
                    familySongs.set(family, (familySongs.get(family) ?? 0) + 1);
                    const hexes = familyColors.get(family) ?? [];
                    if (hexes.length < CHANNEL_SIZE) hexes.push(color);
                    familyColors.set(family, hexes);
                }
            }
        }
        const familyList = Object.keys(FAMILY_COLORS) as ColorFamily[];
        const colorBuckets = familyList.flatMap((family) =>
            (family === 'white' || family === 'black' ? [null] : SHADES).map((shade) => ({
                family,
                shade,
                songs: bucketSongs.get(bucketKey(family, shade)) ?? 0,
            })),
        );

        const decadeSongs = new Map<number, number>();
        for (const doc of docs) {
            const decade = decadeOf(doc);
            if (decade !== undefined) decadeSongs.set(decade, (decadeSongs.get(decade) ?? 0) + 1);
        }
        const thisDecade = Math.floor(new Date().getFullYear() / 10) * 10;
        const firstDecade = Math.min(FIRST_DECADE, ...decadeSongs.keys());
        const decades = [];
        for (let decade = firstDecade; decade <= thisDecade; decade += 10) {
            decades.push({ decade, songs: decadeSongs.get(decade) ?? 0 });
        }

        const albums = new Map<string, CollectionProgress['thinAlbums'][number]>();
        for (const doc of docs) {
            if (doc.album?.type !== 'album') continue;
            const album = albums.get(doc.album.id) ?? {
                id: doc.album.id,
                name: doc.album.name,
                songs: 0,
            };
            album.songs++;
            if (!album.imageUrl && doc.albumImageUrl) album.imageUrl = doc.albumImageUrl;
            albums.set(album.id, album);
        }

        const artistSongs = new Map<string, number>();
        for (const doc of docs) {
            for (const artist of new Set(doc.artists.map((name) => name.trim()))) {
                if (artist) artistSongs.set(artist, (artistSongs.get(artist) ?? 0) + 1);
            }
        }

        res.json({
            songs: docs.length,
            colors: docs.reduce((sum, doc) => sum + doc.colorDocs.length, 0),
            loggedAt,
            colorBuckets,
            families: familyList.map((family) => ({
                family,
                songs: familySongs.get(family) ?? 0,
                colors: familyColors.get(family) ?? [],
            })),
            decades,
            thinAlbums: [...albums.values()].filter((album) => album.songs <= 2),
            oneSongArtists: [...artistSongs]
                .filter(([, count]) => count === 1)
                .map(([artist]) => artist),
            oneColorSongs: logged
                .filter(
                    (doc) => doc.colorDocs.length === 1 && doc.colorDocs[0].startMs === undefined,
                )
                .map(({ id, title, artists }) => ({ id, title, artists })),
        });
    },
);

export default router;
