import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { useTestDb } from '../test/db.js';
import { ownerAgent, testApp } from '../test/auth.js';

useTestDb();
const app = testApp();
const owner = ownerAgent(app);

const album = (releaseDate: string) => ({
    id: 'album',
    name: 'Album',
    url: 'https://open.spotify.com/album/album',
    releaseDate,
    releaseDatePrecision: 'year',
    type: 'album',
});

const putSong = (id: string, body: object) =>
    owner.put(`/api/songs/${id}`).send({
        title: id,
        artists: ['Someone'],
        songUrl: `https://open.spotify.com/track/${id}`,
        ...body,
    });

describe('GET /api/stats', () => {
    it('counts zero when nothing is logged', async () => {
        const res = await request(app).get('/api/stats');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ songs: 0, colors: 0, artists: 0, parts: 0, decades: [] });
    });

    it('counts songs, colors, distinct artists, parts and decades, without logging in', async () => {
        await putSong('a', { artists: ['One', 'Two'], album: album('2016-05-01') });
        await putSong('b', { artists: ['Two'], album: album('1994') });
        await putSong('c', { artists: ['Three'], album: album('2019-01') });
        await putSong('d', { artists: ['One'] }); // no album
        await owner.post('/api/songs/a/colors').send({ color: '#ff0000' });
        await owner.post('/api/songs/a/colors').send({ color: '#00ff00', startMs: 0, endMs: 10 });
        await owner.post('/api/songs/b/colors').send({ color: '#0000ff', startMs: 5, endMs: 9 });

        const res = await request(app).get('/api/stats');

        expect(res.body).toEqual({
            songs: 4,
            colors: 3,
            artists: 3,
            parts: 2,
            decades: [1990, 2010],
        });
    });
});
