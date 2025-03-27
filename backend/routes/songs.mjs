import express from "express";
import db from "../db/conn.mjs";
import { ObjectId } from "mongodb";

const router = express.Router();

// Get song
router.get("/:id", async (req, res) => {
    console.log(req.params.id);
    // TODO Validate id

    let collection = await db.collection("songs");
    let query = {_id: new ObjectId(req.params.id)};
    let result = await collection.findOne(query);
  
    if (!result) res.send("Not found").status(404);
    else res.send(result).status(200);
});

// Get song colors
router.get("/colors/:id", async (req, res) => {
    let collection = await db.collection("songs");
    let query = {_id: ObjectId(req.params.id)};
    let song = await collection.findOne(query);
    let result = song.colors;
  
    if (!result) res.send("Not found").status(404);
    else res.send(result).status(200);
});

  // Get a list of 50 songs
router.get("/", async (req, res) => {
    let collection = await db.collection("songs");
    let results = await collection.find({})
      .limit(50)
      .toArray();
  
    res.send("here").status(200);
});

export default router;
  