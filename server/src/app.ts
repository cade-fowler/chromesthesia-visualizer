import 'express-async-errors';
import express, { type ErrorRequestHandler } from 'express';
import path from 'node:path';
import songs from './routes/songs.js';
import colors from './routes/colors.js';
import stats from './routes/stats.js';
import albums from './routes/albums.js';
import { authRouter } from './routes/auth.js';
import type { AuthConfig } from './auth.js';
import { securityHeaders } from './security.js';

export interface AppOptions {
    /** The built client (client/dist). When set, the app serves it, with index.html for routes. */
    clientDir?: string;
}

/**
 * Builds the Express app without starting it, so tests can drive it directly. The owner login
 * config is passed in rather than read from the env, so tests can use known values.
 */
export function createApp(auth: AuthConfig, { clientDir }: AppOptions = {}) {
    const app = express();
    // Read by requireOwner and the auth routes
    app.locals.auth = auth;

    app.use(securityHeaders());
    app.use(express.json());

    app.use('/api/auth', authRouter());
    app.use('/api/songs', songs);
    app.use('/api/colors', colors);
    app.use('/api/stats', stats);
    app.use('/api/albums', albums);

    // Unknown API routes
    app.use('/api', (_req, res) => {
        res.status(404).json({ error: 'Not found' });
    });

    if (clientDir) {
        app.use(
            express.static(clientDir, {
                index: false,
                setHeaders(res, file) {
                    // Vite puts a content hash in these names, so they never change
                    if (file.includes(`${path.sep}assets${path.sep}`)) {
                        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                    }
                },
            }),
        );
        // Client routes (/, /songs/:id, ...) all get the app; React Router takes it from there.
        // Missing files (anything with an extension) stay 404s instead of getting the page.
        app.get('*', (req, res, next) => {
            if (path.extname(req.path)) {
                next();
                return;
            }
            res.setHeader('Cache-Control', 'no-cache');
            res.sendFile(path.join(clientDir, 'index.html'));
        });
    }

    const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
        // Malformed JSON bodies come through here from express.json()
        if (err?.type === 'entity.parse.failed') {
            res.status(400).json({ error: 'Invalid JSON body' });
            return;
        }
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    };
    app.use(errorHandler);

    return app;
}
