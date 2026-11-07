import { Router } from 'express';
import type { AlbumWithSongs, ApiError, ColorEntry, Song } from '@chromesthesia/shared';
import { colors, songOrder, songs, toColorEntry } from '../db.js';

const router = Router();

// Track order: by disc, then track. Songs saved before track numbers were stored go last, by
// title. A song with a track number but no disc number counts as disc 1.
const compareTracks = (a: Song, b: Song) => {
    const known = (song: Song) => song.trackNumber !== undefined;
    if (known(a) !== known(b)) return known(a) ? -1 : 1;
    if (known(a)) {
        const disc = (a.discNumber ?? 1) - (b.discNumber ?? 1);
        if (disc !== 0) return disc;
        const track = a.trackNumber! - b.trackNumber!;
        if (track !== 0) return track;
    }
    return a.title.localeCompare(b.title) || a.id.localeCompare(b.id);
};

// One album, with the logged songs from it and their colors
router.get<{ id: string }, AlbumWithSongs | ApiError>('/:id', async (req, res) => {
    const albumSongs = await songs()
        .find({ 'album.id': req.params.id }, { projection: { _id: 0 } })
        .toArray();
    if (albumSongs.length === 0) return res.status(404).json({ error: 'Album not found' });
    albumSongs.sort(compareTracks);

    // All the songs' colors in one query; sorted in song order, so each song's stay in order
    const docs = await colors()
        .find({ songId: { $in: albumSongs.map((song) => song.id) } })
        .sort(songOrder)
        .toArray();
    const colorsBySong = new Map<string, ColorEntry[]>();
    for (const doc of docs) {
        const list = colorsBySong.get(doc.songId) ?? [];
        list.push(toColorEntry(doc));
        colorsBySong.set(doc.songId, list);
    }

    const artists = [...new Set(albumSongs.flatMap((song) => song.artists))];
    const albumImageUrl = albumSongs.find((song) => song.albumImageUrl)?.albumImageUrl;
    res.json({
        album: albumSongs[0].album!,
        ...(albumImageUrl && { albumImageUrl }),
        artists,
        songs: albumSongs.map((song) => ({ ...song, colors: colorsBySong.get(song.id) ?? [] })),
    });
});

export default router;
