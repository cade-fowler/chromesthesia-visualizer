import 'dotenv/config';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { connectDb, songs } from './db.js';

const connectionString = process.env.CONNECTION_STRING;
if (!connectionString) {
    throw new Error('CONNECTION_STRING is not set. Copy server/.env.example to server/.env.');
}
const PORT = Number(process.env.PORT) || 5050;

const passwordHash = process.env.OWNER_PASSWORD_HASH;
const sessionSecret = process.env.SESSION_SECRET;
if (!passwordHash?.startsWith('scrypt:') || !sessionSecret || sessionSecret.length < 32) {
    throw new Error(
        'OWNER_PASSWORD_HASH and SESSION_SECRET (32+ characters) must be set. ' +
            'Run: npm run hash-password -w server, and paste its output into server/.env.',
    );
}

// In production the server also serves the built client, so the site is one origin
const production = process.env.NODE_ENV === 'production';
const clientDir =
    process.env.CLIENT_DIR ||
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
if (production && !existsSync(path.join(clientDir, 'index.html'))) {
    throw new Error(`No built client at ${clientDir}. Run: npm run build`);
}

await connectDb(connectionString, process.env.DB_NAME || 'colordatabase');

// Songs from before the colors collection still embed their colors, which the API ignores
if (await songs().countDocuments({ colors: { $exists: true } }, { limit: 1 })) {
    console.warn(
        'Some songs still embed their colors and will show none. ' +
            'Run: npm run migrate:split-colors -w server',
    );
}

createApp(
    {
        passwordHash,
        sessionSecret,
        secureCookies: production,
        trustCloudflare: process.env.TRUST_CLOUDFLARE === 'true',
    },
    { clientDir: production ? clientDir : undefined },
).listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});
