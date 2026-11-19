import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { clerkMiddleware } from "@clerk/express";

import authRoutes from "./routes/authRoutes";
import chatRoutes from "./routes/chatRoutes";
import messageRoutes from "./routes/messageRoutes";
import userRoutes from "./routes/userRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import taskRoutes from "./routes/taskRoutes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

const allowedOrigins = [
  "http://localhost:8081",
  "http://127.0.0.1:8081",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // In development, allow localhost, 127.0.0.1, or configured frontend
      if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);

app.use(express.json()); // parses incoming JSON request bodies and makes them available as req.body in your route handlers
app.use(clerkMiddleware());

// Serve uploaded files statically
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/tasks", taskRoutes);

// serve frontend
const potentialDistPaths = [
  path.resolve(process.cwd(), "../web/dist"),
  path.resolve(__dirname, "../../web/dist"),
  path.resolve("/app/web/dist"),
];
const distPath = potentialDistPaths.find((p) => fs.existsSync(p));

if (distPath) {
  console.log("Serving frontend from:", distPath);
  app.use(express.static(distPath));

  app.get("/{*any}", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads") || req.path.startsWith("/health")) {
      return next();
    }
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// error handlers must come after all the routes and other middlewares so they can catch errors passed with next(err) or thrown inside async handlers.
app.use(errorHandler);

export default app;
