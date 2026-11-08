import { afterAll, beforeAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { colors, connectDb, disconnectDb, settings, songs } from '../db.js';

/** Connects to a fresh in-memory MongoDB for this test file and empties it before each test. */
export function useTestDb(): void {
    let mongo: MongoMemoryServer;

    beforeAll(async () => {
        mongo = await MongoMemoryServer.create();
        await connectDb(mongo.getUri(), 'test');
    });

    afterAll(async () => {
        await disconnectDb();
        await mongo.stop();
    });

    beforeEach(async () => {
        await songs().deleteMany({});
        await colors().deleteMany({});
        await settings().deleteMany({});
    });
}
