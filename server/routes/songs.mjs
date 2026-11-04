import express from "express";
import db from "../db/conn.mjs";

const router = express.Router();

// Get song
router.get("/:id", async (req, res) => {
    console.log(req.params.id);
    // TODO Validate id

    let query = {id: req.params.id};
    let result = await db.collection("songs").findOne(query);
  
    if (!result) res.send("Not found").status(404);
    else res.send(result).status(200);
});

// Add new song or new color to existing song
router.post("/", async (req, res) => {
    // const query = {id: req.params.id};
    let color = req.body.color
    let song = req.body
    delete song.color
    song.colors = [color]

    let result = await db.collection("songs").findOne({id: req.body.id});

    if (!result) {
        try {
            let newSong = await db.collection("songs").insertOne(song)
            res.send(newSong).status(201);
        } catch (error) {
            console.log(error)
            res.send({"Error": "Unable to add song"}).status(400)
        }
    } else {
        try {
            let r = await db.collection("songs").updateOne(
                {id: req.body.id},
                {$addToSet: {colors: color}}
            )
            res.send(result).status(201);
        } catch (error) {
            console.log(error)
            res.send({"Error": "Unable to add color"}).status(400)
        }
    }
});

// Get song colors
router.get("/:id/colors/", async (req, res) => {
    let query = {id: req.params.id};
    let song = await db.collection("songs").findOne(query);
    if (!song) {
        res.send({'message': 'Song not found.'}).status(404);
    } else {
        res.send(song.colors).status(200);
    }
});

// Get songs 
// TODO Make this better
router.get("/", async (req, res) => {
    const filters = req.query;
    let results = await db.collection("songs").find(filters)
      .limit(50)
      .toArray();
    res.send(results).status(200);
});

router.delete("/:id", async (req, res) => {
    console.log(req.params.id)
    console.log(req.body.color)
});


export default router;
  