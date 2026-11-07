import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { useTestDb } from '../test/db.js';
import { ownerAgent, testApp } from '../test/auth.js';

useTestDb();
const app = testApp();
const owner = ownerAgent(app);

const album = {
    id: 'album1',
    name: 'Stick Season',
    url: 'https://open.spotify.com/album/album1',
    releaseDate: '2022-10-14',
    releaseDatePrecision: 'day',
    type: 'album',
};

const putSong = (id: string, body: object = {}) =>
    owner.put(`/api/songs/${id}`).send({
        title: id,
        artists: ['Noah Kahan'],
        songUrl: `https://open.spotify.com/track/${id}`,
        album,
        ...body,
    });
const addColor = (songId: string, body: object) =>
    owner.post(`/api/songs/${songId}/colors`).send(body);

const getAlbum = (id = album.id) => request(app).get(`/api/albums/${id}`);

describe('GET /api/albums/:id', () => {
    it('returns 404 for an album with no logged songs', async () => {
        await putSong('other', { album: { ...album, id: 'album2' } });

        const res = await getAlbum();
        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: 'Album not found' });
    });

    it('returns the album and its songs with their colors in song order, without logging in', async () => {
        await putSong('a', { albumImageUrl: 'https://i.scdn.co/image/a', trackNumber: 1 });
        await putSong('b', { artists: ['Noah Kahan', 'Post Malone'], trackNumber: 2 });
        await putSong('elsewhere', { album: { ...album, id: 'album2' } });
        await addColor('a', { color: '#000002', startMs: 1000, endMs: 2000 });
        await addColor('a', { color: '#000001' });
        await addColor('elsewhere', { color: '#ffffff' });

        const res = await getAlbum();

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({
            album,
            albumImageUrl: 'https://i.scdn.co/image/a',
            artists: ['Noah Kahan', 'Post Malone'],
        });
        expect(res.body.songs.map((s: { id: string }) => s.id)).toEqual(['a', 'b']);
        expect(res.body.songs[0].colors.map((c: { color: string }) => c.color)).toEqual([
            '#000001',
            '#000002',
        ]);
        expect(res.body.songs[0].colors[0].id).toEqual(expect.any(String));
        expect(res.body.songs[1].colors).toEqual([]);
        expect(res.body.songs[0]).not.toHaveProperty('_id');
        expect(res.body.songs[0].colors[0]).not.toHaveProperty('_id');
    });

    it('orders songs by disc and track, then songs without numbers by title', async () => {
        await putSong('Zed');
        await putSong('Alpha');
        await putSong('d2t1', { discNumber: 2, trackNumber: 1 });
        await putSong('d1t9', { discNumber: 1, trackNumber: 9 });
        await putSong('t3', { trackNumber: 3 });

        const res = await getAlbum();
        expect(res.body.songs.map((s: { id: string }) => s.id)).toEqual([
            't3',
            'd1t9',
            'd2t1',
            'Alpha',
            'Zed',
        ]);
    });
});
