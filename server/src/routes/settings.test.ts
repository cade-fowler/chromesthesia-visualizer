import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { useTestDb } from '../test/db.js';
import { ownerAgent, testApp } from '../test/auth.js';

useTestDb();
const app = testApp();
const owner = ownerAgent(app);

describe('GET /api/settings', () => {
    it('needs the owner login', async () => {
        const res = await request(app).get('/api/settings');

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: 'Not logged in' });
    });

    it('gives the defaults before anything is changed', async () => {
        const res = await owner.get('/api/settings');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ dailyGoal: 10 });
    });
});

describe('PATCH /api/settings', () => {
    it('needs the owner login', async () => {
        const res = await request(app).patch('/api/settings').send({ dailyGoal: 5 });

        expect(res.status).toBe(401);
    });

    it('changes the daily goal and keeps it', async () => {
        const res = await owner.patch('/api/settings').send({ dailyGoal: 15 });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ dailyGoal: 15 });
        expect((await owner.get('/api/settings')).body).toEqual({ dailyGoal: 15 });
    });

    it.each([
        ['zero', { dailyGoal: 0 }],
        ['too big', { dailyGoal: 101 }],
        ['not a whole number', { dailyGoal: 2.5 }],
        ['a string', { dailyGoal: '10' }],
        ['an unknown setting', { dailyGoal: 10, theme: 'dark' }],
        ['nothing', {}],
    ])('rejects %s', async (_name, body) => {
        const res = await owner.patch('/api/settings').send(body);

        expect(res.status).toBe(400);
        expect((await owner.get('/api/settings')).body).toEqual({ dailyGoal: 10 });
    });
});
