import "./loadEnvironment.mjs";
import "express-async-errors";
import express from "express";
import songs from "./routes/songs.mjs";

const PORT = process.env.PORT || 5050;
const app = express();

app.use(express.json());

app.use("/api/songs", songs);

// Unknown API routes
app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Not found" });
});

// Global error handling
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
});

app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});
