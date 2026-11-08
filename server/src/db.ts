import { MongoClient, type Db, type ObjectId } from 'mongodb';
import type { ColorEntry, OwnerSettings, Song } from '@chromesthesia/shared';

/** How a ColorEntry is stored: Mongo's _id is its id, and createdAt is a real Date. */
export interface ColorDoc extends Omit<ColorEntry, 'id' | 'createdAt'> {
    _id: ObjectId;
    createdAt: Date;
    /** Set on entries created by the split-colors migration (never exposed by the API) */
    migratedAt?: Date;
}

/** The owner's settings: one document, with _id 'owner'. */
export interface SettingsDoc extends Partial<OwnerSettings> {
    _id: 'owner';
}

let client: MongoClient | undefined;
let db: Db | undefined;

export async function connectDb(uri: string, dbName: string): Promise<void> {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
    await ensureIndexes(db);
}

export async function disconnectDb(): Promise<void> {
    await client?.close();
    client = undefined;
    db = undefined;
}

function getDb(): Db {
    if (!db) throw new Error('Database not connected; call connectDb() first');
    return db;
}

export const songs = () => getDb().collection<Song>('songs');
export const colors = () => getDb().collection<ColorDoc>('colors');
export const settings = () => getDb().collection<SettingsDoc>('settings');

/**
 * Sort for a song's colors in song order: by where the part starts, then by when it was saved.
 * Whole-song colors have no startMs, which Mongo sorts before any number, so they come first.
 * Keep in step with compareColorEntries() in the client.
 */
export const songOrder = { startMs: 1, createdAt: 1, _id: 1 } as const;

/** Creates the indexes the app relies on. A no-op when they already exist. */
export async function ensureIndexes(target: Db): Promise<void> {
    await target.collection('songs').createIndex({ id: 1 }, { unique: true });
    // Serves GET /api/albums/:id
    await target.collection('songs').createIndex({ 'album.id': 1 });
    // Serves colorsFor()'s filter and sort. Replaces { songId: 1, createdAt: 1 }.
    await target.collection('colors').createIndex({ songId: 1, startMs: 1, createdAt: 1 });
    await target
        .collection('colors')
        .dropIndex('songId_1_createdAt_1')
        .catch((err) => {
            if (err?.codeName !== 'IndexNotFound') throw err;
        });
    await target.collection('colors').createIndex({ color: 1 });
}

/** Maps a stored color to its API shape. */
export function toColorEntry({ _id, createdAt, migratedAt: _, ...rest }: ColorDoc): ColorEntry {
    return { id: _id.toHexString(), createdAt: createdAt.toISOString(), ...rest };
}
