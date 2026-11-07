import { afterAll, beforeAll, expect, it } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import { ensureIndexes } from './db.js';

let mongo: MongoMemoryServer;
let client: MongoClient;

beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    client = await MongoClient.connect(mongo.getUri());
});

afterAll(async () => {
    await client.close();
    await mongo.stop();
});

const indexNames = async (db: ReturnType<MongoClient['db']>, name: string) =>
    (await db.collection(name).indexes()).map((i) => i.name).sort();

it('creates the indexes on an empty database, and is safe to run again', async () => {
    const db = client.db('fresh');
    await ensureIndexes(db);
    await ensureIndexes(db);

    expect(await indexNames(db, 'songs')).toEqual(['_id_', 'album.id_1', 'id_1']);
    expect(await indexNames(db, 'colors')).toEqual([
        '_id_',
        'color_1',
        'songId_1_startMs_1_createdAt_1',
    ]);
});

it('replaces the old songId + createdAt index', async () => {
    const db = client.db('upgraded');
    await db.collection('colors').createIndex({ songId: 1, createdAt: 1 });

    await ensureIndexes(db);

    expect(await indexNames(db, 'colors')).not.toContain('songId_1_createdAt_1');
});
