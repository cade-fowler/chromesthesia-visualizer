import { MongoClient } from "mongodb";
import type { Song } from "@chromesthesia/shared";

const connectionString = process.env.CONNECTION_STRING;
if (!connectionString) {
  throw new Error("CONNECTION_STRING is not set. Copy server/.env.example to server/.env.");
}

const client = new MongoClient(connectionString);
await client.connect();

const db = client.db(process.env.DB_NAME || "colordatabase");

export const songs = db.collection<Song>("songs");
