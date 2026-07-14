import "express-async-errors";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { config } from "./config";
import { errorHandler } from "./middleware/errorHandler";

import authRouter      from "./routes/auth";
import coursesRouter   from "./routes/courses";
import avatarsRouter   from "./routes/avatars";
import questionsRouter from "./routes/questions";
import interviewsRouter from "./routes/interviews";
import { responsesRouter, reportsRouter } from "./routes/responsesReports";
import aiRouter        from "./routes/ai";

const app = express();

// ── Security & Parsing ────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: config.cors.origins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(config.nodeEnv === "production" ? "combined" : "dev"));

// ── Health ────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "AI Interview Platform API is running" });
});

app.get("/health", (_req, res) => {
  res.json({ status: "healthy", version: "1.0.0", runtime: "Node.js + TypeScript" });
});

// ── API Routes ────────────────────────────────────────────────
app.use("/api/auth",       authRouter);
app.use("/api/courses",    coursesRouter);
app.use("/api/avatars",    avatarsRouter);
app.use("/api/questions",  questionsRouter);
app.use("/api/interviews", interviewsRouter);
app.use("/api/responses",  responsesRouter);
app.use("/api/reports",    reportsRouter);
app.use("/api/ai",         aiRouter);

// ── 404 Handler ───────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ detail: "Route not found" });
});

// ── Global Error Handler ──────────────────────────────────────
app.use(errorHandler);

export default app;
