import { MongoClient, type Db, type ObjectId } from 'mongodb';
import type { ColorEntry, Song } from '@chromesthesia/shared';

/** How a ColorEntry is stored: Mongo's _id is its id, and createdAt is a real Date. */
export interface ColorDoc extends Omit<ColorEntry, 'id' | 'createdAt'> {
    _id: ObjectId;
    createdAt: Date;
}

let client: MongoClient | undefined;
let db: Db | undefined;

export async function connectDb(uri: string, dbName: string): Promise<void> {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
    await ensureIndexes();
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

/** Creates the indexes the app relies on. A no-op when they already exist. */
async function ensureIndexes(): Promise<void> {
    await songs().createIndex({ id: 1 }, { unique: true });
    await colors().createIndex({ songId: 1, createdAt: 1 });
    await colors().createIndex({ color: 1 });
}

/** Maps a stored color to its API shape. */
export function toColorEntry({ _id, createdAt, ...rest }: ColorDoc): ColorEntry {
    return { id: _id.toHexString(), createdAt: createdAt.toISOString(), ...rest };
}
