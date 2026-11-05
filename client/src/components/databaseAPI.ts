import type {
    AddColorRequest,
    ColorEntry,
    NowPlaying,
    UpdateColorRequest,
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

/** Reads the server's error message, falling back to the status code. */
const errorFrom = async (response: Response, what: string) => {
    const body = await response.json().catch(() => null);
    const detail = body && typeof body.error === 'string' ? `: ${body.error}` : '';
    return new Error(`${what} failed (${response.status})${detail}`);
};

/** Saves the song's metadata, then assigns it a color (for the whole song or one part). */
export const saveColor = async (
    song: NowPlaying,
    request: AddColorRequest,
): Promise<ColorEntry> => {
    const { id, artist, isPlaying: _isPlaying, progressMs: _progressMs, ...rest } = song;
    const metadata: UpsertSongRequest = {
        ...rest,
        artists: artist.split(',').map((a) => a.trim()),
    };

    const songResponse = await sendJson(songPath(id), 'PUT', metadata);
    if (!songResponse.ok) throw await errorFrom(songResponse, 'Saving song');

    const colorResponse = await sendJson(`${songPath(id)}/colors`, 'POST', request);
    if (!colorResponse.ok) throw await errorFrom(colorResponse, 'Saving color');
    return colorResponse.json();
};

/** Changes some fields of one color entry; null clears a field. */
export const updateColor = async (id: string, patch: UpdateColorRequest): Promise<ColorEntry> => {
    const response = await sendJson(`/api/colors/${encodeURIComponent(id)}`, 'PATCH', patch);
    if (!response.ok) throw await errorFrom(response, 'Updating color');
    return response.json();
};

/** Deletes one color entry. One that's already gone counts as deleted. */
export const deleteColor = async (id: string): Promise<void> => {
    const response = await fetch(`/api/colors/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!response.ok && response.status !== 404) {
        throw new Error(`Deleting color failed (${response.status})`);
    }
};
