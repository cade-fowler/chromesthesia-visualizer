import "dotenv/config";
import { createApp } from "./app.js";
import { connectDb } from "./db.js";

const connectionString = process.env.CONNECTION_STRING;
if (!connectionString) {
    throw new Error("CONNECTION_STRING is not set. Copy server/.env.example to server/.env.");
}
const PORT = Number(process.env.PORT) || 5050;

await connectDb(connectionString, process.env.DB_NAME || "colordatabase");

createApp().listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});
