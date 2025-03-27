import express from "express";
import db from "../db/conn.mjs";
import { ObjectId } from "mongodb";

const router = express.Router();

// Get song
router.get("/:id", async (req, res) => {
    console.log(req.params.id);
    // TODO Validate id

    let query = {_id: new ObjectId(req.params.id)};
    let result = await db.collection("songs").findOne(query);
  
    if (!result) res.send("Not found").status(404);
    else res.send(result).status(200);
});

// Add new color to song
router.post("/:id", async (req, res) => {
    let query = {_id: new ObjectId(req.params.id)};
    let song = await db.collection("songs").findOne(query);
    let result = song.colors;
  
    if (!result) res.send("Not found").status(404);
    else res.send(result).status(200);
});

// Get song colors
router.get("/:id/colors/", async (req, res) => {
    let query = {_id: new ObjectId(req.params.id)};
    let song = await db.collection("songs").findOne(query);
    console.log(song);
    let result = song.colors;
  
    if (!result) res.send("Not found").status(404);
    else res.send(result).status(200);
});

// Get songs 
// TODO Make this better
router.get("/", async (req, res) => {
    const filters = req.query;
    console.log(filters);
    let results = await db.collection("songs").find(filters)
      .limit(50)
      .toArray();
    console.log(results.length);
    res.send(results).status(200);
});




export default router;
  