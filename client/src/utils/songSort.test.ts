import { describe, expect, it } from 'vitest';
import type { SongSummary } from '@chromesthesia/shared';
import { activeSort, sortSongs, sortsFor } from './songSort';

const song = (id: string, title: string, artist: string, colors: number): SongSummary => ({
    id,
    title,
    artists: [artist],
    songUrl: `https://open.spotify.com/track/${id}`,
    colors: Array.from({ length: colors }, () => '#808080'),
});

// In the server's order: newest first
const songs = [
    song('a', 'beta', 'Zed', 1),
    song('b', 'Alpha', 'Yan', 3),
    song('c', 'Gamma', 'yan', 3),
];
const ids = (list: SongSummary[]) => list.map((s) => s.id);

describe('sortSongs', () => {
    it("keeps the server's order for newest and closest", () => {
        expect(ids(sortSongs(songs, 'newest'))).toEqual(['a', 'b', 'c']);
        expect(ids(sortSongs(songs, 'closest'))).toEqual(['a', 'b', 'c']);
    });

    it('sorts by title, ignoring case', () => {
        expect(ids(sortSongs(songs, 'title'))).toEqual(['b', 'a', 'c']);
    });

    it('sorts by first artist, then title', () => {
        expect(ids(sortSongs(songs, 'artist'))).toEqual(['b', 'c', 'a']);
    });

    it('puts the most colors first, keeping ties in order', () => {
        expect(ids(sortSongs(songs, 'colors'))).toEqual(['b', 'c', 'a']);
    });

    it("doesn't change the list it's given", () => {
        sortSongs(songs, 'title');
        expect(ids(songs)).toEqual(['a', 'b', 'c']);
    });
});

describe('sortsFor and activeSort', () => {
    it('offers Closest, first, only for a search by color', () => {
        expect(sortsFor({ q: 'x' })).not.toContain('closest');
        expect(sortsFor({ q: '', family: 'red' })[0]).toBe('closest');
    });

    it('falls back to the first sort on offer', () => {
        expect(activeSort({ q: '' })).toBe('newest');
        expect(activeSort({ q: '', sort: 'closest' })).toBe('newest');
        expect(activeSort({ q: '', family: 'red' })).toBe('closest');
        expect(activeSort({ q: '', family: 'red', sort: 'title' })).toBe('title');
    });
});
