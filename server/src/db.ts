import { MongoClient, type Db } from "mongodb";
import type { Song } from "@chromesthesia/shared";

let client: MongoClient | undefined;
let db: Db | undefined;

/** Connect once at startup (or per test suite). */
export async function connectDb(uri: string, dbName: string): Promise<void> {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
}

export async function disconnectDb(): Promise<void> {
    await client?.close();
    client = undefined;
    db = undefined;
}

function getDb(): Db {
    if (!db) throw new Error("Database not connected; call connectDb() first");
    return db;
}

export const songs = () => getDb().collection<Song>("songs");
