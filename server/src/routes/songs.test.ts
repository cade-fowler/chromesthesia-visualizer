import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../app.js";
import { connectDb, disconnectDb, songs } from "../db.js";

let mongo: MongoMemoryServer;
const app = createApp();

const song = {
    id: "1XZPtZVqcOzzxbYIR7MjQw",
    title: "Ontario",
    artists: ["Novo Amor", "Lowswimmer"],
    songUrl: "https://open.spotify.com/track/1XZPtZVqcOzzxbYIR7MjQw",
    albumImageUrl: "https://i.scdn.co/image/abc",
};

beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await connectDb(mongo.getUri(), "test");
});

afterAll(async () => {
    await disconnectDb();
    await mongo.stop();
});

beforeEach(async () => {
    await songs().deleteMany({});
});

describe("POST /api/songs", () => {
    it("creates a song with its first color", async () => {
        const res = await request(app).post("/api/songs").send({ ...song, color: "#ff0000" });

        expect(res.status).toBe(201);
        expect(res.body).toEqual({ ...song, colors: ["#ff0000"] });
        expect(res.body).not.toHaveProperty("_id");
    });

    it("adds a color to an existing song without duplicating it", async () => {
        await request(app).post("/api/songs").send({ ...song, color: "#ff0000" });
        await request(app).post("/api/songs").send({ ...song, color: "#00ff00" });
        const res = await request(app).post("/api/songs").send({ ...song, color: "#00ff00" });

        expect(res.status).toBe(200);
        expect(res.body.colors).toEqual(["#ff0000", "#00ff00"]);
        expect(await songs().countDocuments()).toBe(1);
    });

    it("normalizes colors to lowercase #rrggbb", async () => {
        await request(app).post("/api/songs").send({ ...song, color: "#F00" });
        const res = await request(app).post("/api/songs").send({ ...song, color: "#FF0000" });

        expect(res.body.colors).toEqual(["#ff0000"]);
    });

    it.each([
        ["an invalid color", { ...song, color: "red" }],
        ["a missing title", { ...song, title: undefined, color: "#ff0000" }],
        ["a non-URL songUrl", { ...song, songUrl: "nope", color: "#ff0000" }],
    ])("rejects %s with 400", async (_label, body) => {
        const res = await request(app).post("/api/songs").send(body);

        expect(res.status).toBe(400);
        expect(res.body.error).toEqual(expect.any(String));
        expect(await songs().countDocuments()).toBe(0);
    });

    it("rejects malformed JSON with 400", async () => {
        const res = await request(app)
            .post("/api/songs")
            .set("Content-Type", "application/json")
            .send('{"id":');

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: "Invalid JSON body" });
    });
});

describe("GET /api/songs", () => {
    beforeEach(async () => {
        await request(app).post("/api/songs").send({ ...song, color: "#ff0000" });
        await request(app)
            .post("/api/songs")
            .send({ ...song, id: "other", title: "Other", artists: ["Someone"], color: "#0000ff" });
    });

    it("gets one song by id", async () => {
        const res = await request(app).get(`/api/songs/${song.id}`);
        expect(res.status).toBe(200);
        expect(res.body.title).toBe("Ontario");
    });

    it("gets a song's colors", async () => {
        const res = await request(app).get(`/api/songs/${song.id}/colors`);
        expect(res.body).toEqual(["#ff0000"]);
    });

    it("returns 404 for an unknown song", async () => {
        const res = await request(app).get("/api/songs/missing");
        expect(res.status).toBe(404);
    });

    it("filters the list by artist", async () => {
        const res = await request(app).get("/api/songs").query({ artist: "Lowswimmer" });
        expect(res.body.map((s: { id: string }) => s.id)).toEqual([song.id]);
    });

    it("rejects Mongo operators in query params", async () => {
        const res = await request(app).get("/api/songs?title[$ne]=x");
        expect(res.status).toBe(400);
    });
});

it("returns JSON 404 for unknown API routes", async () => {
    const res = await request(app).get("/api/nope");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Not found" });
});
