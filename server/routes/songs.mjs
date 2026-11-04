import express from "express";
import db from "../db/conn.mjs";

const router = express.Router();
const songs = () => db.collection("songs");

// List songs, optionally filtered by query params
// TODO: whitelist filter fields before passing them to Mongo
router.get("/", async (req, res) => {
    const results = await songs().find(req.query).limit(50).toArray();
    res.json(results);
});

// Get one song by Spotify track id
router.get("/:id", async (req, res) => {
    const song = await songs().findOne({ id: req.params.id });
    if (!song) return res.status(404).json({ error: "Song not found" });
    res.json(song);
});

// Get the colors for one song
router.get("/:id/colors", async (req, res) => {
    const song = await songs().findOne({ id: req.params.id });
    if (!song) return res.status(404).json({ error: "Song not found" });
    res.json(song.colors ?? []);
});

// Add a new song, or add a color to an existing song
router.post("/", async (req, res) => {
    const { color, ...song } = req.body;
    if (!song.id || !color) {
        return res.status(400).json({ error: "Song id and color are required" });
    }

    const existing = await songs().findOne({ id: song.id });
    if (!existing) {
        await songs().insertOne({ ...song, colors: [color] });
        return res.status(201).json({ ...song, colors: [color] });
    }

    const updated = await songs().findOneAndUpdate(
        { id: song.id },
        { $addToSet: { colors: color } },
        { returnDocument: "after" }
    );
    res.status(200).json(updated);
});

// TODO: remove a color from a song
router.delete("/:id", (_req, res) => {
    res.status(501).json({ error: "Not implemented" });
});

export default router;
