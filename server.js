import express from "express";
import { createServer } from "http";
import("./bot.js"); // Import your bot logic

const app = express();
const PORT = process.env.PORT || 8000;

app.get("/", (req, res) => {
  res.send("Bot is running!");
});

const server = createServer(app);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
