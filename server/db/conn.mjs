import { MongoClient } from "mongodb";

const connectionString = process.env.CONNECTION_STRING;
if (!connectionString) {
  throw new Error("CONNECTION_STRING is not set. Copy server/.env.example to server/.env.");
}

const client = new MongoClient(connectionString);
await client.connect();

const db = client.db(process.env.DB_NAME || "colordatabase");
export default db;
