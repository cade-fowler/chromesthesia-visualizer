import { afterEach, describe, expect, it, vi } from 'vitest';
import type { NowPlaying } from '@chromesthesia/shared';
import { deleteColor, getColors, saveColor } from './databaseAPI';

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

        await expect(saveColor(nowPlaying, '#ff0000')).resolves.toEqual(entry);

        const [[songUrl, songInit], [colorUrl, colorInit]] = fetchMock.mock.calls;
        expect(songUrl).toBe('/api/songs/track%201');
        expect(songInit?.method).toBe('PUT');
        expect(JSON.parse(songInit?.body as string)).toEqual({
            title: 'A Horse with No Name',
            artists: ['America', 'George Martin'],
            songUrl: 'https://open.spotify.com/track/1',
            albumImageUrl: 'https://i.scdn.co/image/1',
        });
        expect(colorUrl).toBe('/api/songs/track%201/colors');
        expect(colorInit?.method).toBe('POST');
        expect(JSON.parse(colorInit?.body as string)).toEqual({ color: '#ff0000' });
    });

    it("doesn't post the color if saving the song fails", async () => {
        fetchMock.mockResolvedValueOnce(respond(500));

        await expect(saveColor(nowPlaying, '#ff0000')).rejects.toThrow('Saving song failed');
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('throws if posting the color fails', async () => {
        fetchMock.mockResolvedValueOnce(respond(200, {})).mockResolvedValueOnce(respond(400));

        await expect(saveColor(nowPlaying, '#ff0000')).rejects.toThrow('Saving color failed');
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
