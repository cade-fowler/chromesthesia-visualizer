import { describe, expect, it } from 'vitest';
import type { Album, SongSummary } from '@chromesthesia/shared';
import { albumMatches } from './albumMatches';

const album = (id: string, name: string): Album => ({
    id,
    name,
    url: `https://open.spotify.com/album/${id}`,
    releaseDate: '2020',
    releaseDatePrecision: 'year',
    type: 'album',
});

const song = (id: string, extra: Partial<SongSummary>): SongSummary => ({
    id,
    title: id,
    artists: ['Someone'],
    songUrl: `https://open.spotify.com/track/${id}`,
    colors: [],
    ...extra,
});

describe('albumMatches', () => {
    const cape = album('cape', 'Cape Elizabeth');
    const songs = [
        song('a', { album: cape, artists: ['Noah Kahan'], colors: ['#111111'] }),
        song('b', { album: album('other', 'Other'), colors: ['#222222'] }),
        song('c', {
            album: cape,
            artists: ['Noah Kahan', 'Guest'],
            colors: ['#333333', '#444444'],
            albumImageUrl: 'https://i.scdn.co/image/c',
        }),
        song('cape song', {}), // matched by title, no album
    ];

    it('groups the songs whose album name contains the search, ignoring case', () => {
        expect(albumMatches(songs, ' CAPE ')).toEqual([
            {
                album: cape,
                albumImageUrl: 'https://i.scdn.co/image/c',
                artists: ['Noah Kahan', 'Guest'],
                songCount: 2,
                colors: ['#111111', '#333333', '#444444'],
            },
        ]);
    });

    it('finds nothing for an empty search or a name that does not match', () => {
        expect(albumMatches(songs, '')).toEqual([]);
        expect(albumMatches(songs, 'zzz')).toEqual([]);
    });
});
