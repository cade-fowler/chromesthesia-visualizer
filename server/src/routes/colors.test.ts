import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { ObjectId } from 'mongodb';
import { createApp } from '../app.js';
import { colors } from '../db.js';
import { useTestDb } from '../test/db.js';

useTestDb();
const app = createApp();

const id = '1XZPtZVqcOzzxbYIR7MjQw';

const seedColor = async (color: string) => {
    await request(app)
        .put(`/api/songs/${id}`)
        .send({
            title: 'Ontario',
            artists: ['Novo Amor'],
            songUrl: 'https://open.spotify.com/track/1XZPtZVqcOzzxbYIR7MjQw',
        });
    const res = await request(app).post(`/api/songs/${id}/colors`).send({ color });
    return res.body.id as string;
};

describe('DELETE /api/colors/:id', () => {
    it('deletes only that entry with 204', async () => {
        const red = await seedColor('#ff0000');
        await seedColor('#00ff00');

        const res = await request(app).delete(`/api/colors/${red}`);

        expect(res.status).toBe(204);
        expect(res.body).toEqual({});
        const left = await request(app).get(`/api/songs/${id}/colors`);
        expect(left.body.map((c: { color: string }) => c.color)).toEqual(['#00ff00']);
    });

    it('returns 404 for an unknown id', async () => {
        await seedColor('#ff0000');
        const res = await request(app).delete(`/api/colors/${new ObjectId().toHexString()}`);

        expect(res.status).toBe(404);
        expect(await colors().countDocuments()).toBe(1);
    });

    it.each(['nope', 'abcdefghijkl', `${'a'.repeat(24)}0`])(
        'rejects the malformed id %s with 400',
        async (badId) => {
            const res = await request(app).delete(`/api/colors/${badId}`);
            expect(res.status).toBe(400);
        },
    );
});
