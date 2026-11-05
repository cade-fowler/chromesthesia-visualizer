import type {
    AddColorRequest,
    ColorEntry,
    HexColor,
    NowPlaying,
    UpsertSongRequest,
} from '@chromesthesia/shared';

const songPath = (id: string) => `/api/songs/${encodeURIComponent(id)}`;

const sendJson = (url: string, method: string, body: unknown) =>
    fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

export const getColors = async (songId: string): Promise<ColorEntry[]> => {
    const response = await fetch(`${songPath(songId)}/colors`);
    if (!response.ok) return [];
    return response.json();
};

/** Saves the song's metadata, then assigns it a color. */
export const saveColor = async (song: NowPlaying, color: HexColor): Promise<ColorEntry> => {
    const { id, artist, isPlaying: _isPlaying, ...rest } = song;
    const metadata: UpsertSongRequest = {
        ...rest,
        artists: artist.split(',').map((a) => a.trim()),
    };

    const songResponse = await sendJson(songPath(id), 'PUT', metadata);
    if (!songResponse.ok) throw new Error(`Saving song failed (${songResponse.status})`);

    const body: AddColorRequest = { color };
    const colorResponse = await sendJson(`${songPath(id)}/colors`, 'POST', body);
    if (!colorResponse.ok) throw new Error(`Saving color failed (${colorResponse.status})`);
    return colorResponse.json();
};

/** Deletes one color entry. One that's already gone counts as deleted. */
export const deleteColor = async (id: string): Promise<void> => {
    const response = await fetch(`/api/colors/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!response.ok && response.status !== 404) {
        throw new Error(`Deleting color failed (${response.status})`);
    }
};
