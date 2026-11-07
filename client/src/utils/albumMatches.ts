import type { Album, HexColor, SongSummary } from '@chromesthesia/shared';

/** An album found by a search, built from the songs that came back. */
export interface AlbumMatch {
    album: Album;
    albumImageUrl?: string;
    /** Every artist on the matching songs, in order of first appearance */
    artists: string[];
    /** How many of the album's logged songs came back */
    songCount: number;
    /** The songs' colors, song after song */
    colors: HexColor[];
}

/**
 * The albums whose name contains the search text (ignoring case), from a search's song
 * results, in the order their first song came back. Empty for an empty search.
 */
export const albumMatches = (songs: SongSummary[], q: string): AlbumMatch[] => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    const matches = new Map<string, AlbumMatch>();
    for (const song of songs) {
        const { album } = song;
        if (!album || !album.name.toLowerCase().includes(needle)) continue;
        const match = matches.get(album.id) ?? {
            album,
            artists: [],
            songCount: 0,
            colors: [],
        };
        match.albumImageUrl ??= song.albumImageUrl;
        match.artists = [...new Set([...match.artists, ...song.artists])];
        match.songCount += 1;
        match.colors.push(...song.colors);
        matches.set(album.id, match);
    }
    return [...matches.values()];
};
