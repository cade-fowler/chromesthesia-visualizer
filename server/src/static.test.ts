import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { useTestDb } from './test/db.js';
import { TEST_AUTH } from './test/auth.js';
import { createApp } from './app.js';

useTestDb();

// A stand-in for client/dist
const clientDir = mkdtempSync(path.join(tmpdir(), 'client-dist-'));
mkdirSync(path.join(clientDir, 'assets'));
writeFileSync(path.join(clientDir, 'index.html'), '<!doctype html><div id="root"></div>');
writeFileSync(path.join(clientDir, 'assets', 'index-abc123.js'), 'console.log(1);');
writeFileSync(path.join(clientDir, 'robots.txt'), 'User-agent: *');
afterAll(() => rmSync(clientDir, { recursive: true, force: true }));

const app = createApp(TEST_AUTH, { clientDir });

describe('serving the built client', () => {
    it.each(['/', '/songs/abc', '/albums/xyz', '/studio?song=abc'])(
        'serves index.html for %s, uncached',
        async (url) => {
            const res = await request(app).get(url);
            expect(res.status).toBe(200);
            expect(res.headers['content-type']).toMatch(/text\/html/);
            expect(res.text).toContain('<div id="root">');
            expect(res.headers['cache-control']).toBe('no-cache');
            expect(res.headers['content-security-policy']).toContain("script-src 'self'");
        },
    );

    it('caches hashed assets forever and other files normally', async () => {
        const asset = await request(app).get('/assets/index-abc123.js');
        expect(asset.status).toBe(200);
        expect(asset.headers['cache-control']).toContain('immutable');

        const robots = await request(app).get('/robots.txt');
        expect(robots.status).toBe(200);
        expect(robots.headers['cache-control']).not.toContain('immutable');
    });

    it('404s missing files instead of sending the page', async () => {
        expect((await request(app).get('/assets/missing.js')).status).toBe(404);
        expect((await request(app).get('/nope.png')).status).toBe(404);
    });

    it('keeps API routes and API 404s as JSON', async () => {
        const songs = await request(app).get('/api/songs');
        expect(songs.status).toBe(200);
        expect(Array.isArray(songs.body)).toBe(true);

        const missing = await request(app).get('/api/nope');
        expect(missing.status).toBe(404);
        expect(missing.body).toEqual({ error: 'Not found' });
    });

    it("doesn't serve the client unless asked", async () => {
        expect((await request(createApp(TEST_AUTH)).get('/')).status).toBe(404);
    });
});
