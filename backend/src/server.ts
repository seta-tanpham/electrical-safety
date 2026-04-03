import "dotenv/config";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import { Pool } from "pg";
import { createTrainingRouter } from "./routes/training.js";

type ApiError = Error & { statusCode?: number };

const app = express();
const PORT = Number(process.env.PORT ?? 3001);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.PG_POOL_MAX ?? 10),
  ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : undefined,
});

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", async (_req, res, next) => {
  try {
    const db = await pool.query<{ now: string }>("SELECT NOW()::text AS now");
    res.status(200).json({
      ok: true,
      service: "electrical-safety-backend",
      dbTime: db.rows[0].now,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

app.use("/api", createTrainingRouter(pool));

app.use((_req, _res, next) => {
  const error = new Error("Route not found.") as ApiError;
  error.statusCode = 404;
  next(error);
});

app.use((error: ApiError, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = error.statusCode ?? 500;
  res.status(statusCode).json({
    error: {
      message: error.message || "Internal server error.",
      statusCode,
    },
  });
});

async function start() {
  if (!process.env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL environment variable.");
  }

  await pool.query("SELECT 1");

  app.listen(PORT, () => {
    console.log(`✅ Backend running at http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error("❌ Failed to start backend.");
  console.error(error);
  process.exit(1);
});
