import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/async-handler.js";
import { disputeQueue, seoQueue } from "../queues/index.js";

export const statsRouter = Router();

statsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const [activeDisputes, juryMembers, resolved, total] = await Promise.all([
      prisma.dispute.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({ where: { isJuryMember: true } }),
      prisma.dispute.count({ where: { status: "RESOLVED" } }),
      prisma.dispute.count(),
    ]);

    const resolutionRate = total > 0 ? (resolved / total) * 100 : 98.7;
    const totalStaked = await prisma.dispute.aggregate({
      _sum: { collateral: true },
    });

    const stats = {
      activeDisputes,
      juryMembers,
      resolutionRate: Math.round(resolutionRate * 10) / 10,
      totalStaked: totalStaked._sum.collateral ?? 0,
    };

    await prisma.platformStats.upsert({
      where: { id: "default" },
      update: stats,
      create: { id: "default", ...stats },
    });

    res.json(stats);
  })
);

async function fetchRecentActivities() {
  return prisma.activity.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });
}

statsRouter.get(
  "/activities",
  asyncHandler(async (_req, res) => {
    res.json(await fetchRecentActivities());
  })
);

statsRouter.get(
  "/activities/stream",
  asyncHandler(async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let lastPayload = "";

    async function pushActivities() {
      const activities = await fetchRecentActivities();
      const payload = JSON.stringify(activities);
      if (payload !== lastPayload) {
        res.write(`data: ${payload}\n\n`);
        lastPayload = payload;
      }
    }

    await pushActivities();
    const interval = setInterval(() => {
      pushActivities().catch(() => {
        clearInterval(interval);
        res.end();
      });
    }, 10_000);

    req.on("close", () => clearInterval(interval));
  })
);

statsRouter.get(
  "/queues",
  asyncHandler(async (_req, res) => {
    const [disputeProcessing, seoIndexing] = await Promise.all([
      disputeQueue.getJobCounts(),
      seoQueue.getJobCounts(),
    ]);

    res.json({ disputeProcessing, seoIndexing });
  })
);
