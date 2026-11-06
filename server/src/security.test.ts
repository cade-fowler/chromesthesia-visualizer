import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { useTestDb } from './test/db.js';
import { testApp } from './test/auth.js';

useTestDb();

describe('security headers', () => {
    it('sends a strict Content-Security-Policy and the other helmet headers', async () => {
        const res = await request(testApp()).get('/api/songs');
        const csp = res.headers['content-security-policy'];

        expect(csp).toContain("default-src 'self'");
        expect(csp).toContain("script-src 'self'");
        expect(csp).not.toMatch(/script-src[^;]*unsafe/);
        expect(csp).toContain("frame-ancestors 'none'");
        expect(csp).toContain('connect-src');
        expect(csp).toContain('https://api.spotify.com');
        expect(res.headers['x-content-type-options']).toBe('nosniff');
        expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
        expect(res.headers['x-powered-by']).toBeUndefined();
    });
});
