import express from "express";
import db from "../db/conn.mjs";
import { ObjectId } from "mongodb";

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

// Add new song
router.post("/", async (req, res) => {
    // const query = {id: req.params.id};

    let result = await db.collection("songs").findOne(req.body.id);
    console.log(req.body.id)
  
    if (!result) res.send("Not found").status(404);
    else res.send(result).status(200);

});

// // Add new colors to song
// router.post("/", async (req, res) => {
//     const query = {id: req.params.id};

//     let song = await db.collection("songs").insertOne(req.body);
//     let result = song.colors;
  
//     if (!result) res.send("Not found").status(404);
//     else res.send(result).status(200);

// });

// Get song colors
router.get("/:id/colors/", async (req, res) => {
    let query = {id: req.params.id};
    let song = await db.collection("songs").findOne(query);
    let result = song.colors;
  
    if (!result) res.send("Not found").status(404);
    else res.send(result).status(200);
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




export default router;
  