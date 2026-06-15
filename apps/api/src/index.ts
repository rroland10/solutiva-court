import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { disputesRouter } from "./routes/disputes.js";
import { statsRouter } from "./routes/stats.js";
import { aiRouter } from "./routes/ai.js";
import { usersRouter } from "./routes/users.js";
import { chainRouter } from "./routes/chain.js";
import { startWorkers, disputeQueue } from "./queues/index.js";
import { prisma } from "./lib/prisma.js";
import { checkChainHealth } from "./lib/chain/hybrid.js";
import { getChainConfig } from "./lib/chain/config.js";

async function checkRedis(): Promise<"connected" | "error"> {
  try {
    await disputeQueue.getJobCounts();
    return "connected";
  } catch {
    return "error";
  }
}

const app = express();
const port = Number(process.env.API_PORT) || 4000;

app.use(helmet());
app.use(
  cors({
    origin: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

app.get("/health", async (_req, res) => {
  let database = "disconnected";
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "connected";
  } catch {
    database = "error";
  }

  const redis = await checkRedis();
  const chain = await checkChainHealth();
  const chainConfig = getChainConfig();
  const healthy = database === "connected" && redis === "connected";

  res.json({
    status: healthy ? "ok" : "degraded",
    service: "solutiva-api",
    database,
    redis,
    chain,
    chainEnabled: chainConfig.enabled,
    stack: ["express", "prisma", "postgresql", "bullmq", "redis", "ai", "base-l2-hybrid"],
  });
});

app.use("/api/disputes", disputesRouter);
app.use("/api/stats", statsRouter);
app.use("/api/ai", aiRouter);
app.use("/api/users", usersRouter);
app.use("/api/chain", chainRouter);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("API error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
);

try {
  startWorkers();
} catch (err) {
  console.warn("Queue workers disabled:", err instanceof Error ? err.message : err);
}

app.listen(port, () => {
  console.log(`Solutiva API running on http://localhost:${port}`);
});
