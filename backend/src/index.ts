import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { registerSocketHandlers } from "./socket/socketHandlers";
import { searchYouTube } from "./services/youtubeService";

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Middleware
app.use(
  cors({
    origin: "*",
  }),
);
app.use((req, res, next) => {
  // Normalize multiple slashes (e.g. //api/search -> /api/search)
  req.url = req.url.replace(/\/+/g, "/");
  next();
});
app.use(express.json());

// Routes
app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.get("/api/search", async (req, res) => {
  try {
    const q = (req.query.q as string) || "";
    const results = await searchYouTube(q);
    res.json({ success: true, results });
  } catch (err: any) {
    console.error("Search route error:", err);
    res.status(500).json({ success: false, error: "Search failed" });
  }
});

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

registerSocketHandlers(io);

server.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`🎶 SyncTune Server is running on http://localhost:${PORT}`);
  console.log(`🌐 Allowed Client: ${CLIENT_URL}`);
  if (!process.env.YOUTUBE_API_KEY) {
    console.log(
      "ℹ️  No YOUTUBE_API_KEY provided; using built-in music catalog for searches.",
    );
  } else {
    console.log("🔑 YouTube Data API key detected.");
  }
});
