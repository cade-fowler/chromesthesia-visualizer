import type { HexColor, NowPlaying, Song } from '../types';

export const getColors = async (id: string): Promise<HexColor[]> => {
    const response = await fetch(`/api/songs/${encodeURIComponent(id)}/colors`);
    if (!response.ok) return [];
    return response.json();
};

export const postSong = async (song: NowPlaying, color: HexColor): Promise<Song> => {
    const { artist, isPlaying: _isPlaying, ...rest } = song;
    const body = {
        ...rest,
        artists: artist.split(',').map(a => a.trim()),
        color,
    };

    const response = await fetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`Saving color failed (${response.status})`);
    return response.json();
};
