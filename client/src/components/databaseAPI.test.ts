import { afterEach, describe, expect, it, vi } from 'vitest';
import type { NowPlaying } from '@chromesthesia/shared';
import { deleteColor, getColors, getSong, listSongs, saveColor, updateColor } from './databaseAPI';

const fetchMock = vi.fn<typeof fetch>();
vi.stubGlobal('fetch', fetchMock);

afterEach(() => {
    fetchMock.mockReset();
});

const respond = (status: number, body?: unknown) =>
    new Response(body === undefined ? null : JSON.stringify(body), { status });

const nowPlaying: NowPlaying = {
    id: 'track 1',
    title: 'A Horse with No Name',
    artist: 'America, George Martin',
    songUrl: 'https://open.spotify.com/track/1',
    albumImageUrl: 'https://i.scdn.co/image/1',
    isPlaying: true,
    progressMs: 61000,
    durationMs: 252000,
    album: {
        id: 'album1',
        name: 'America',
        url: 'https://open.spotify.com/album/album1',
        releaseDate: '1971',
        releaseDatePrecision: 'year',
        type: 'album',
    },
    artistUrls: ['https://open.spotify.com/artist/1', 'https://open.spotify.com/artist/2'],
};

const entry = {
    id: '6aeca540c62af3be3e341c61',
    songId: 'track 1',
    color: '#ff0000',
    createdAt: '2026-11-05T00:00:00.000Z',
};

describe('saveColor', () => {
    it('saves the song, then posts the color', async () => {
        fetchMock
            .mockResolvedValueOnce(respond(201, {}))
            .mockResolvedValueOnce(respond(201, entry));

        await expect(saveColor(nowPlaying, { color: '#ff0000' })).resolves.toEqual(entry);

        const [[songUrl, songInit], [colorUrl, colorInit]] = fetchMock.mock.calls;
        expect(songUrl).toBe('/api/songs/track%201');
        expect(songInit?.method).toBe('PUT');
        expect(JSON.parse(songInit?.body as string)).toEqual({
            title: 'A Horse with No Name',
            artists: ['America', 'George Martin'],
            songUrl: 'https://open.spotify.com/track/1',
            albumImageUrl: 'https://i.scdn.co/image/1',
            durationMs: 252000,
            album: nowPlaying.album,
            artistUrls: nowPlaying.artistUrls,
        });
        expect(colorUrl).toBe('/api/songs/track%201/colors');
        expect(colorInit?.method).toBe('POST');
        expect(JSON.parse(colorInit?.body as string)).toEqual({ color: '#ff0000' });
    });

    it('posts a part with its range, label and notes', async () => {
        fetchMock
            .mockResolvedValueOnce(respond(200, {}))
            .mockResolvedValueOnce(respond(201, entry));
        const part = {
            color: '#ff0000',
            startMs: 1000,
            endMs: 5000,
            label: 'chorus',
            notes: ['glossy'],
        };

        await saveColor(nowPlaying, part);

        expect(JSON.parse(fetchMock.mock.calls[1][1]?.body as string)).toEqual(part);
    });

    it("doesn't post the color if saving the song fails", async () => {
        fetchMock.mockResolvedValueOnce(respond(500));

        await expect(saveColor(nowPlaying, { color: '#ff0000' })).rejects.toThrow(
            'Saving song failed (500)',
        );
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('throws if posting the color fails', async () => {
        fetchMock
            .mockResolvedValueOnce(respond(200, {}))
            .mockResolvedValueOnce(respond(400, { error: 'endMs must be greater than startMs' }));

        await expect(saveColor(nowPlaying, { color: '#ff0000' })).rejects.toThrow(
            'Saving color failed (400): endMs must be greater than startMs',
        );
    });
});

describe('updateColor', () => {
    it('sends PATCH with the changed fields', async () => {
        fetchMock.mockResolvedValueOnce(respond(200, { ...entry, label: 'chorus' }));

        await expect(updateColor(entry.id, { label: 'chorus', notes: null })).resolves.toEqual({
            ...entry,
            label: 'chorus',
        });

        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe(`/api/colors/${entry.id}`);
        expect(init?.method).toBe('PATCH');
        expect(JSON.parse(init?.body as string)).toEqual({ label: 'chorus', notes: null });
    });

    it('throws with the server message when the update fails', async () => {
        fetchMock.mockResolvedValueOnce(respond(404, { error: 'Color not found' }));
        await expect(updateColor(entry.id, { label: 'x' })).rejects.toThrow(
            'Updating color failed (404): Color not found',
        );
    });
});

describe('getColors', () => {
    it("returns the song's entries", async () => {
        fetchMock.mockResolvedValueOnce(respond(200, [entry]));
        await expect(getColors('track 1')).resolves.toEqual([entry]);
        expect(fetchMock.mock.calls[0][0]).toBe('/api/songs/track%201/colors');
    });

    it('returns no entries for an unknown song', async () => {
        fetchMock.mockResolvedValueOnce(respond(404, { error: 'Song not found' }));
        await expect(getColors('missing')).resolves.toEqual([]);
    });
});

describe('deleteColor', () => {
    it('sends DELETE for the entry', async () => {
        fetchMock.mockResolvedValueOnce(respond(204));

        await deleteColor(entry.id);

        expect(fetchMock).toHaveBeenCalledWith(`/api/colors/${entry.id}`, { method: 'DELETE' });
    });

    it('treats an already-deleted entry as deleted', async () => {
        fetchMock.mockResolvedValueOnce(respond(404, { error: 'Color not found' }));
        await expect(deleteColor(entry.id)).resolves.toBeUndefined();
    });

    it('throws when the delete fails', async () => {
        fetchMock.mockResolvedValueOnce(respond(500));
        await expect(deleteColor(entry.id)).rejects.toThrow('Deleting color failed (500)');
    });
});

describe('listSongs', () => {
    it('returns the songs', async () => {
        const songs = [{ id: 'a', title: 'A', artists: ['X'], songUrl: 'u' }];
        fetchMock.mockResolvedValueOnce(respond(200, songs));

        await expect(listSongs()).resolves.toEqual(songs);
        expect(fetchMock.mock.calls[0][0]).toBe('/api/songs');
    });

    it('throws on an error response', async () => {
        fetchMock.mockResolvedValueOnce(respond(500, { error: 'boom' }));
        await expect(listSongs()).rejects.toThrow('Loading songs failed (500): boom');
    });
});

describe('getSong', () => {
    it('returns the song with its colors', async () => {
        const song = { id: 'track 1', title: 'A', artists: ['X'], songUrl: 'u', colors: [entry] };
        fetchMock.mockResolvedValueOnce(respond(200, song));

        await expect(getSong('track 1')).resolves.toEqual(song);
        expect(fetchMock.mock.calls[0][0]).toBe('/api/songs/track%201');
    });

    it('returns null for an unknown song', async () => {
        fetchMock.mockResolvedValueOnce(respond(404, { error: 'Song not found' }));
        await expect(getSong('nope')).resolves.toBeNull();
    });

    it('throws on other error responses', async () => {
        fetchMock.mockResolvedValueOnce(respond(500));
        await expect(getSong('a')).rejects.toThrow('Loading song failed (500)');
    });
});
