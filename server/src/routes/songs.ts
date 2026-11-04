import { Router } from "express";
import { z } from "zod";
import type { Filter } from "mongodb";
import type { AddColorRequest, ApiError, HexColor, Song } from "@chromesthesia/shared";
import { songs } from "../db.js";

const router = Router();

// Accepts #rgb or #rrggbb in any case; stores lowercase #rrggbb so "#FFF" and "#ffffff" match
const hexColor = z
    .string()
    .regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, "Expected a color like #ff8800")
    .transform(hex => {
        const digits = hex.slice(1).toLowerCase();
        return digits.length === 3
            ? `#${[...digits].map(d => d + d).join("")}`
            : `#${digits}`;
    });

const addColorSchema = z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    artists: z.array(z.string()),
    albumImageUrl: z.url().optional(),
    songUrl: z.url(),
    color: hexColor,
}) satisfies z.ZodType<AddColorRequest>;

// Only these query params are passed through to Mongo, and only as plain strings.
// Passing req.query straight to find() would let ?field[$ne]=x inject operators.
const listQuerySchema = z.object({
    title: z.string().optional(),
    artist: z.string().optional(),
});

// Don't leak Mongo's _id; the Spotify track id is the public identifier
const withoutMongoId = { projection: { _id: 0 } } as const;

// List songs, optionally filtered by ?title= or ?artist=
router.get<{}, Song[] | ApiError>("/", async (req, res) => {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ error: "Invalid query" });

    const filter: Filter<Song> = {};
    if (parsed.data.title) filter.title = parsed.data.title;
    if (parsed.data.artist) filter.artists = parsed.data.artist;

    const results = await songs.find(filter, withoutMongoId).limit(50).toArray();
    res.json(results);
});

// Get one song by Spotify track id
router.get<{ id: string }, Song | ApiError>("/:id", async (req, res) => {
    const song = await songs.findOne({ id: req.params.id }, withoutMongoId);
    if (!song) return res.status(404).json({ error: "Song not found" });
    res.json(song);
});

// Get the colors for one song
router.get<{ id: string }, HexColor[] | ApiError>("/:id/colors", async (req, res) => {
    const song = await songs.findOne({ id: req.params.id }, withoutMongoId);
    if (!song) return res.status(404).json({ error: "Song not found" });
    res.json(song.colors ?? []);
});

// Add a color to a song, creating the song if it's new
router.post<{}, Song | ApiError>("/", async (req, res) => {
    const parsed = addColorSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: z.prettifyError(parsed.error) });
    }
    const { color, ...song } = parsed.data;
    const existed = (await songs.countDocuments({ id: song.id }, { limit: 1 })) > 0;

    // Upsert: refresh the song's metadata and add the color if it isn't there yet
    const updated = await songs.findOneAndUpdate(
        { id: song.id },
        { $set: song, $addToSet: { colors: color } },
        { upsert: true, returnDocument: "after", ...withoutMongoId },
    );
    res.status(existed ? 200 : 201).json(updated!);
});

// TODO: remove a color from a song
router.delete("/:id", (_req, res) => {
    res.status(501).json({ error: "Not implemented" });
});

export default router;
