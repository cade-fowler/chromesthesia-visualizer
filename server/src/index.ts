import "dotenv/config";
import "express-async-errors";
import express, { type ErrorRequestHandler } from "express";
import songs from "./routes/songs.js";

const PORT = Number(process.env.PORT) || 5050;
const app = express();

app.use(express.json());

app.use("/api/songs", songs);

// Unknown API routes
app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Not found" });
});

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    // Malformed JSON bodies come through here from express.json()
    if (err?.type === "entity.parse.failed") {
        res.status(400).json({ error: "Invalid JSON body" });
        return;
    }
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
};
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});
