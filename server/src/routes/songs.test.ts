import { describe, expect, it } from 'vitest';
import { colors, songs } from '../db.js';
import { useTestDb } from '../test/db.js';
import { ownerAgent, testApp } from '../test/auth.js';

useTestDb();
const app = testApp();
// Every request is sent as the owner; auth.test.ts covers requests without a session
const api = ownerAgent(app);

const id = '1XZPtZVqcOzzxbYIR7MjQw';
const song = {
    title: 'Ontario',
    artists: ['Novo Amor', 'Lowswimmer'],
    songUrl: 'https://open.spotify.com/track/1XZPtZVqcOzzxbYIR7MjQw',
    albumImageUrl: 'https://i.scdn.co/image/abc',
};

const album = {
    id: '3kEtdS2pH6hKcMU9Wioob1',
    name: 'Strange Trails',
    url: 'https://open.spotify.com/album/3kEtdS2pH6hKcMU9Wioob1',
    releaseDate: '2015-04-07',
    releaseDatePrecision: 'day',
    type: 'album',
};

const putSong = (body: object = song, songId = id) => api.put(`/api/songs/${songId}`).send(body);
const addColor = (body: object, songId = id) => api.post(`/api/songs/${songId}/colors`).send(body);

describe('PUT /api/songs/:id', () => {
    it('creates a song with 201', async () => {
        const res = await putSong();

        expect(res.status).toBe(201);
        expect(res.body).toEqual({ id, ...song });
        expect(res.body).not.toHaveProperty('_id');
    });

    it('updates an existing song with 200 without duplicating it', async () => {
        await putSong();
        const res = await putSong({ ...song, title: 'Ontario (Remastered)' });

        expect(res.status).toBe(200);
        expect(res.body.title).toBe('Ontario (Remastered)');
        expect(await songs().countDocuments()).toBe(1);
    });

    it('removes albumImageUrl when it is no longer sent', async () => {
        await putSong();
        await putSong({ ...song, albumImageUrl: undefined });

        expect(await songs().findOne({ id })).not.toHaveProperty('albumImageUrl');
    });

    it('stores durationMs and keeps it when a save leaves it out', async () => {
        await putSong({ ...song, durationMs: 215000 });
        const res = await putSong();

        expect(res.body.durationMs).toBe(215000);
        expect((await putSong({ ...song, durationMs: 0 })).status).toBe(400);
    });

    it('keeps notes when a save leaves them out, and clears them with []', async () => {
        await putSong({ ...song, notes: ['glossy'] });
        const res = await putSong();
        expect(res.body.notes).toEqual(['glossy']);

        await putSong({ ...song, notes: [] });
        expect((await songs().findOne({ id }))?.notes).toEqual([]);
    });

    const artistUrls = ['https://open.spotify.com/artist/a', 'https://open.spotify.com/artist/b'];

    it('stores track and disc numbers and keeps them when a save leaves them out', async () => {
        await putSong({ ...song, trackNumber: 3, discNumber: 2 });
        const res = await putSong();

        expect(res.body).toMatchObject({ trackNumber: 3, discNumber: 2 });
    });

    it.each([0, -1, 1.5, '3'])('rejects a track number of %j', async (trackNumber) => {
        expect((await putSong({ ...song, trackNumber })).status).toBe(400);
    });

    it('stores the album and artist links and keeps them when a save leaves them out', async () => {
        await putSong({ ...song, album, artistUrls });
        const res = await putSong();

        expect(res.body.album).toEqual(album);
        expect(res.body.artistUrls).toEqual(artistUrls);
    });

    it.each([
        ['a bad release date', { ...album, releaseDate: '7 April 2015' }],
        ['an unknown album type', { ...album, type: 'ep' }],
        ['a missing album name', { ...album, name: undefined }],
    ])('rejects an album with %s with 400', async (_name, badAlbum) => {
        expect((await putSong({ ...song, album: badAlbum })).status).toBe(400);
    });

    it('rejects invalid song notes with 400', async () => {
        const res = await putSong({ ...song, notes: ['glossy', ' glossy '] });
        expect(res.status).toBe(400);
    });

    it('enforces one document per song id', async () => {
        await putSong();
        await expect(songs().insertOne({ id, ...song })).rejects.toThrow(/duplicate key/);
    });

    it.each([
        ['a missing title', { ...song, title: undefined }],
        ['a non-URL songUrl', { ...song, songUrl: 'nope' }],
        ['non-array artists', { ...song, artists: 'Novo Amor' }],
    ])('rejects %s with 400', async (_label, body) => {
        const res = await putSong(body);

        expect(res.status).toBe(400);
        expect(res.body.error).toEqual(expect.any(String));
        expect(await songs().countDocuments()).toBe(0);
    });

    it('rejects malformed JSON with 400', async () => {
        const res = await api
            .put(`/api/songs/${id}`)
            .set('Content-Type', 'application/json')
            .send('{"title":');

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Invalid JSON body' });
    });
});

describe('POST /api/songs/:id/colors', () => {
    it('adds a color entry with 201', async () => {
        await putSong();
        const res = await addColor({ color: '#ff0000' });

        expect(res.status).toBe(201);
        expect(res.body).toEqual({
            id: expect.stringMatching(/^[0-9a-f]{24}$/),
            songId: id,
            color: '#ff0000',
            createdAt: expect.any(String),
        });
        expect(new Date(res.body.createdAt).toISOString()).toBe(res.body.createdAt);
        expect(await colors().countDocuments({ songId: id })).toBe(1);
    });

    it('stores a song part with its range, label and notes', async () => {
        await putSong();
        const part = {
            color: '#00ff00',
            startMs: 1000,
            endMs: 5000,
            label: 'chorus',
            notes: ['glossy'],
        };
        const res = await addColor(part);

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject(part);
    });

    it('keeps duplicate colors as separate entries', async () => {
        await putSong();
        await addColor({ color: '#ff0000' });
        await addColor({ color: '#ff0000' });

        expect(await colors().countDocuments({ songId: id })).toBe(2);
    });

    it('normalizes colors to lowercase #rrggbb', async () => {
        await putSong();
        const res = await addColor({ color: '#F0A' });

        expect(res.body.color).toBe('#ff00aa');
    });

    it('returns 404 for an unknown song', async () => {
        const res = await addColor({ color: '#ff0000' }, 'missing');

        expect(res.status).toBe(404);
        expect(await colors().countDocuments()).toBe(0);
    });

    it.each([
        ['an invalid color', { color: 'red' }],
        ['startMs without endMs', { color: '#fff', startMs: 1000 }],
        ['endMs without startMs', { color: '#fff', endMs: 1000 }],
        ['endMs before startMs', { color: '#fff', startMs: 5000, endMs: 1000 }],
        ['an empty range', { color: '#fff', startMs: 1000, endMs: 1000 }],
        ['a negative startMs', { color: '#fff', startMs: -1, endMs: 1000 }],
        ['a fractional endMs', { color: '#fff', startMs: 0, endMs: 1.5 }],
        ['a blank label', { color: '#fff', label: '   ' }],
        ['a label over 50 chars', { color: '#fff', label: 'x'.repeat(51) }],
        ['a blank note', { color: '#fff', notes: [' '] }],
        ['a note over 200 chars', { color: '#fff', notes: ['x'.repeat(201)] }],
        ['repeated notes', { color: '#fff', notes: ['glossy', 'glossy'] }],
        ['a string instead of a notes list', { color: '#fff', notes: 'glossy' }],
    ])('rejects %s with 400', async (_label, body) => {
        await putSong();
        const res = await addColor(body);

        expect(res.status).toBe(400);
        expect(res.body.error).toEqual(expect.any(String));
        expect(await colors().countDocuments()).toBe(0);
    });
});

describe('GET /api/songs', () => {
    const otherId = 'other';

    const seed = async () => {
        await putSong();
        await putSong({ ...song, title: 'Other', artists: ['Someone'] }, otherId);
        await addColor({ color: '#ff0000' });
        await addColor({ color: '#00ff00', startMs: 0, endMs: 1000 });
        await addColor({ color: '#0000ff' }, otherId);
    };

    it('gets one song by id with its colors, oldest first', async () => {
        await seed();
        const res = await api.get(`/api/songs/${id}`);

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ id, ...song });
        expect(res.body.colors.map((c: { color: string }) => c.color)).toEqual([
            '#ff0000',
            '#00ff00',
        ]);
    });

    it("gets a song's colors, oldest first", async () => {
        await seed();
        const res = await api.get(`/api/songs/${id}/colors`);

        expect(res.status).toBe(200);
        expect(res.body.map((c: { color: string }) => c.color)).toEqual(['#ff0000', '#00ff00']);
    });

    it('orders colors by where they start in the song, then by when they were saved', async () => {
        await putSong();
        // Saved in this order; each is a [color, startMs, endMs] (no range = whole song)
        const saved: [string, number?, number?][] = [
            ['#000005', 5000, 9000],
            ['#00000a', undefined, undefined],
            ['#000001', 1000, 3000],
            ['#000002', 1000, 2000], // same start as #000001: saved later, so after it
            ['#000000', 0, 500],
            ['#00000b', undefined, undefined],
        ];
        for (const [color, startMs, endMs] of saved) await addColor({ color, startMs, endMs });

        const expected = ['#00000a', '#00000b', '#000000', '#000001', '#000002', '#000005'];
        const list = await api.get(`/api/songs/${id}/colors`);
        const one = await api.get(`/api/songs/${id}`);
        expect(list.body.map((c: { color: string }) => c.color)).toEqual(expected);
        expect(one.body.colors.map((c: { color: string }) => c.color)).toEqual(expected);
    });

    it('returns an empty list for a song with no colors', async () => {
        await putSong();
        const res = await api.get(`/api/songs/${id}/colors`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    it('returns 404 for an unknown song', async () => {
        expect((await api.get('/api/songs/missing')).status).toBe(404);
        expect((await api.get('/api/songs/missing/colors')).status).toBe(404);
    });

    it("lists songs with their colors' hex values in song order, newest first", async () => {
        await seed();
        const res = await api.get('/api/songs');

        expect(res.status).toBe(200);
        // otherId got its first color last, so it comes first
        expect(res.body.map((s: { id: string }) => s.id)).toEqual([otherId, id]);
        expect(res.body[1]).toMatchObject({ id, ...song, colors: ['#ff0000', '#00ff00'] });
        expect(res.body[1].addedAt).toEqual(expect.any(String));
        expect(res.body[0]).not.toHaveProperty('_id');
        expect(res.body[0]).not.toHaveProperty('colorDocs');
    });

    it('dates a song by its first color, and lists songs with no colors last', async () => {
        await putSong();
        await putSong({ ...song, title: 'Other' }, otherId);
        await putSong({ ...song, title: 'Bare' }, 'bare');
        await addColor({ color: '#ff0000' });
        await addColor({ color: '#00ff00' }, otherId);
        await addColor({ color: '#0000ff' }); // a later color doesn't move id up

        const res = await api.get('/api/songs');
        expect(res.body.map((s: { id: string }) => s.id)).toEqual([otherId, id, 'bare']);
        expect(res.body[2]).toMatchObject({ colors: [] });
        expect(res.body[2]).not.toHaveProperty('addedAt');
    });

    it('searches titles, artists and album names, ignoring case', async () => {
        await putSong({ ...song, title: 'Ontario' });
        await putSong({ ...song, title: 'Hurricane', artists: ['Someone'] }, 'b');
        await putSong(
            {
                ...song,
                title: 'Third',
                artists: ['Nobody'],
                album: { ...album, name: 'Ontario Sessions' },
            },
            'c',
        );
        const ids = async (q: string) =>
            (await api.get('/api/songs').query({ q })).body.map((s: { id: string }) => s.id).sort();

        expect(await ids('ontario')).toEqual([id, 'c']);
        expect(await ids('LOWSWIM')).toEqual([id]);
        expect(await ids('hurr')).toEqual(['b']);
        expect(await ids('nothing')).toEqual([]);
    });

    it('treats regex characters in a search as plain text', async () => {
        await putSong({ ...song, title: 'Song (Live)' });
        await putSong({ ...song, title: 'Song Live' }, 'b');

        const res = await api.get('/api/songs').query({ q: '(live)' });
        expect(res.status).toBe(200);
        expect(res.body.map((s: { id: string }) => s.id)).toEqual([id]);
        expect((await api.get('/api/songs').query({ q: '.*' })).body).toEqual([]);
    });

    it('filters by the decade the album came out', async () => {
        await putSong({ ...song, album: { ...album, releaseDate: '1994-03-01' } });
        await putSong({ ...song, album: { ...album, releaseDate: '2016' } }, 'b');
        await putSong(song, 'c'); // no album

        const res = await api.get('/api/songs').query({ decade: '1990' });
        expect(res.body.map((s: { id: string }) => s.id)).toEqual([id]);
    });

    it('limits how many songs come back', async () => {
        await putSong();
        await putSong(song, 'b');
        await putSong(song, 'c');

        expect((await api.get('/api/songs').query({ limit: '2' })).body).toHaveLength(2);
    });

    it.each([
        ['a decade not ending in 0', { decade: '1995' }],
        ['a decade that is not a number', { decade: 'abcd' }],
        ['a limit of 0', { limit: '0' }],
        ['a limit over 200', { limit: '201' }],
        ['a limit that is not a number', { limit: 'ten' }],
        ['a color that is not a hex', { color: 'red' }],
        ['an unknown family', { family: 'teal' }],
        ['both a color and a family', { color: '#ff0000', family: 'red' }],
    ])('rejects %s with 400', async (_label, query) => {
        expect((await api.get('/api/songs').query(query)).status).toBe(400);
    });

    it('filters the list by artist', async () => {
        await seed();
        const res = await api.get('/api/songs').query({ artist: 'Lowswimmer' });

        expect(res.body.map((s: { id: string }) => s.id)).toEqual([id]);
    });

    describe('search by color', () => {
        type Found = { id: string; match?: { color: string; distance: number } };
        const ids = (body: Found[]) => body.map((s) => s.id);

        // Three songs: a red one with a blue part, a pink one, and a green one
        const seedColors = async () => {
            await putSong(song, 'red');
            await addColor({ color: '#d03020' }, 'red');
            await addColor({ color: '#2f6fd6', startMs: 0, endMs: 1000 }, 'red');
            await putSong({ ...song, title: 'Pink' }, 'pink');
            await addColor({ color: '#f2c4ce' }, 'pink');
            await putSong({ ...song, title: 'Green' }, 'green');
            await addColor({ color: '#3fa34d' }, 'green');
        };

        it('finds songs with a color close to ?color=, closest first', async () => {
            await seedColors();
            await putSong(song, 'near');
            await addColor({ color: '#d84030' }, 'near');

            const res = await api.get('/api/songs').query({ color: '#D03020' });
            expect(res.status).toBe(200);
            // The pink is too far from #d03020 to count; the green and blue are nowhere near
            expect(ids(res.body)).toEqual(['red', 'near']);
            expect(res.body[0].match).toEqual({ color: '#d03020', distance: 0 });
            expect(res.body[1].match.distance).toBeGreaterThan(0);
        });

        it("scores a song by its single closest color, even if it's only a part", async () => {
            await seedColors();
            const res = await api.get('/api/songs').query({ color: '#3070d0' });

            expect(ids(res.body)).toEqual(['red']);
            expect(res.body[0].match.color).toBe('#2f6fd6');
        });

        it('finds songs with any color in ?family=, closest to the swatch first', async () => {
            await seedColors();
            const res = await api.get('/api/songs').query({ family: 'red' });

            // Pastel pink is far from the red swatch but still counts as red
            expect(ids(res.body)).toEqual(['red', 'pink']);
            expect(res.body[0].match.color).toBe('#d03020');
            expect(res.body[1].match.color).toBe('#f2c4ce');
        });

        it('only matches colors in the family', async () => {
            await seedColors();
            const res = await api.get('/api/songs').query({ family: 'blue' });

            expect(ids(res.body)).toEqual(['red']);
            expect(res.body[0].match.color).toBe('#2f6fd6');
        });

        it('combines with the other filters', async () => {
            await seedColors();
            const res = await api.get('/api/songs').query({ family: 'red', q: 'pink' });

            expect(ids(res.body)).toEqual(['pink']);
        });

        it('applies the limit after ranking', async () => {
            await seedColors();
            const res = await api.get('/api/songs').query({ family: 'red', limit: '1' });

            expect(ids(res.body)).toEqual(['red']);
        });

        it('leaves match out of other lists', async () => {
            await seedColors();
            const res = await api.get('/api/songs');

            expect(res.body).toHaveLength(3);
            for (const found of res.body) expect(found).not.toHaveProperty('match');
        });
    });

    it('rejects Mongo operators in query params', async () => {
        expect((await api.get('/api/songs?title[$ne]=x')).status).toBe(400);
        expect((await api.get('/api/songs?q[$ne]=x')).status).toBe(400);
        expect((await api.get('/api/songs/random?not[$ne]=x')).status).toBe(400);
    });
});

describe('GET /api/songs/random', () => {
    it('returns 404 when no song has colors', async () => {
        expect((await api.get('/api/songs/random')).status).toBe(404);
        await putSong();
        expect((await api.get('/api/songs/random')).status).toBe(404);
    });

    it('returns a song that has colors, with its colors', async () => {
        await putSong();
        await putSong({ ...song, title: 'Bare' }, 'bare');
        await addColor({ color: '#ff0000' });

        for (let i = 0; i < 5; i++) {
            const res = await api.get('/api/songs/random');
            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({ id, ...song });
            expect(res.body.colors.map((c: { color: string }) => c.color)).toEqual(['#ff0000']);
            expect(res.body).not.toHaveProperty('_id');
            expect(res.body).not.toHaveProperty('anyColor');
        }
    });

    it('skips the song given as ?not, unless it is the only one', async () => {
        await putSong();
        await putSong({ ...song, title: 'Other' }, 'other');
        await addColor({ color: '#ff0000' });
        await addColor({ color: '#00ff00' }, 'other');

        for (let i = 0; i < 5; i++) {
            const res = await api.get('/api/songs/random').query({ not: id });
            expect(res.body.id).toBe('other');
        }
        await colors().deleteMany({ songId: 'other' });
        expect((await api.get('/api/songs/random').query({ not: id })).body.id).toBe(id);
    });
});

it('no longer accepts POST /api/songs', async () => {
    const res = await api.post('/api/songs').send({ id, ...song, color: '#ff0000' });
    expect(res.status).toBe(404);
});

it('returns JSON 404 for unknown API routes', async () => {
    const res = await api.get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
});
