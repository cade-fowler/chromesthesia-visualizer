import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { useTestDb } from '../test/db.js';
import { ownerAgent, testApp } from '../test/auth.js';
import { colors } from '../db.js';

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

describe('GET /api/stats/hues', () => {
    it('is empty when nothing is logged', async () => {
        const res = await request(app).get('/api/stats/hues');

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    it('lists every color entry with its song, hue and lightness, without logging in', async () => {
        await putSong('a', { title: 'Song A', artists: ['One', 'Two'] });
        await putSong('b', { title: 'Song B' });
        const red = await owner.post('/api/songs/a/colors').send({ color: '#ff0000' });
        await owner.post('/api/songs/a/colors').send({ color: '#ff0000', startMs: 0, endMs: 10 });
        const grey = await owner.post('/api/songs/b/colors').send({ color: '#808080' });

        const res = await request(app).get('/api/stats/hues');

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(3);
        expect(res.body[0]).toEqual({
            id: red.body.id,
            color: '#ff0000',
            songId: 'a',
            title: 'Song A',
            artists: ['One', 'Two'],
            hue: expect.closeTo(29.2, 0),
            lightness: expect.closeTo(0.628, 2),
        });
        // A duplicate hex is its own entry
        expect(res.body[1]).toMatchObject({ color: '#ff0000', songId: 'a' });
        expect(res.body[2]).toMatchObject({ id: grey.body.id, title: 'Song B', hue: null });
        expect(res.body[2].lightness).toBeCloseTo(0.6, 1);
    });
});

describe('GET /api/stats/progress', () => {
    const albumOf = (id: string, releaseDate: string, type = 'album') => ({
        ...album(releaseDate),
        id,
        name: `Album ${id}`,
        type,
    });

    it('needs the owner login', async () => {
        const res = await request(app).get('/api/stats/progress');

        expect(res.status).toBe(401);
    });

    it('lists every bucket, family and decade with zeros when nothing is logged', async () => {
        const res = await owner.get('/api/stats/progress');

        expect(res.status).toBe(200);
        expect(res.body.songs).toBe(0);
        expect(res.body.loggedAt).toEqual([]);
        expect(res.body.colorBuckets).toHaveLength(20);
        expect(res.body.colorBuckets.every((b: { songs: number }) => b.songs === 0)).toBe(true);
        expect(res.body.families).toHaveLength(8);
        expect(res.body.decades[0]).toEqual({ decade: 1960, songs: 0 });
        expect(res.body.decades.at(-1).decade).toBe(Math.floor(new Date().getFullYear() / 10) * 10);
        expect(res.body.thinAlbums).toEqual([]);
        expect(res.body.oneSongArtists).toEqual([]);
        expect(res.body.oneColorSongs).toEqual([]);
    });

    it('counts coverage and finds the gaps', async () => {
        await putSong('a', { artists: ['One', 'Two'], album: albumOf('x', '1994') });
        await putSong('b', { artists: ['One'], album: albumOf('x', '1994') });
        await putSong('c', { artists: ['Three'], album: albumOf('y', '1955') });
        await putSong('d', { artists: ['One'], album: albumOf('z', '2016', 'single') });
        // a: two reds of the same shade count once; c: one whole-song color
        await owner.post('/api/songs/a/colors').send({ color: '#ff0000' });
        await owner.post('/api/songs/a/colors').send({ color: '#ee1111', startMs: 0, endMs: 9 });
        await owner.post('/api/songs/a/colors').send({ color: '#000080' });
        await owner.post('/api/songs/b/colors').send({ color: '#ff0000' });
        await owner.post('/api/songs/b/colors').send({ color: '#ffffff' });
        await owner.post('/api/songs/c/colors').send({ color: '#add8e6' });
        await owner.post('/api/songs/d/colors').send({ color: '#ff0000', startMs: 0, endMs: 5 });

        const res = await owner.get('/api/stats/progress');
        const bucket = (family: string, shade: string | null) =>
            res.body.colorBuckets.find(
                (b: { family: string; shade: string | null }) =>
                    b.family === family && b.shade === shade,
            ).songs;
        const family = (name: string) =>
            res.body.families.find((f: { family: string }) => f.family === name);
        const decade = (year: number) =>
            res.body.decades.find((d: { decade: number }) => d.decade === year)?.songs;

        expect(res.body.songs).toBe(4);
        expect(res.body.colors).toBe(7);
        expect(res.body.loggedAt).toHaveLength(4);
        expect(bucket('red', 'mid')).toBe(3);
        expect(bucket('blue', 'deep')).toBe(1);
        expect(bucket('blue', 'pale')).toBe(1);
        expect(bucket('white', null)).toBe(1);
        expect(family('red')).toMatchObject({ songs: 3 });
        expect(family('red').colors).toHaveLength(3);
        expect(family('blue')).toEqual({
            family: 'blue',
            songs: 2,
            colors: ['#add8e6', '#000080'],
        });
        // Older decades with songs are added before the 1960s
        expect(res.body.decades[0]).toEqual({ decade: 1950, songs: 1 });
        expect(decade(1990)).toBe(2);
        expect(decade(1970)).toBe(0);
        // Singles never count as thin albums
        expect(res.body.thinAlbums).toEqual(
            expect.arrayContaining([
                { id: 'x', name: 'Album x', songs: 2 },
                { id: 'y', name: 'Album y', songs: 1 },
            ]),
        );
        expect(res.body.thinAlbums).toHaveLength(2);
        expect(res.body.oneSongArtists.sort()).toEqual(['Three', 'Two']);
        expect(res.body.oneColorSongs).toEqual([{ id: 'c', title: 'c', artists: ['Three'] }]);
    });

    it('leaves songs first logged over 90 days ago out of loggedAt', async () => {
        await putSong('old', {});
        await owner.post('/api/songs/old/colors').send({ color: '#ff0000' });
        await colors().updateMany({}, { $set: { createdAt: new Date('2020-01-01') } });

        const res = await owner.get('/api/stats/progress');

        expect(res.body.songs).toBe(1);
        expect(res.body.loggedAt).toEqual([]);
    });
});
