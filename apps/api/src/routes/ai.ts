import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/async-handler.js";
import { analyzeDispute, suggestResolution } from "../services/ai.service.js";
import { requestGoogleIndexing } from "../services/google-indexing.service.js";

export const aiRouter = Router();

aiRouter.post(
  "/analyze",
  asyncHandler(async (req, res) => {
    const schema = z.object({
      title: z.string(),
      description: z.string(),
      category: z.string(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const summary = await analyzeDispute(parsed.data);
    res.json({ summary });
  })
);

aiRouter.post(
  "/suggest-resolution",
  asyncHandler(async (req, res) => {
    const schema = z.object({
      description: z.string(),
      votes: z.array(z.object({ choice: z.string(), count: z.number() })),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const recommendation = await suggestResolution(parsed.data);
    res.json({ recommendation });
  })
);

aiRouter.post(
  "/index-url",
  asyncHandler(async (req, res) => {
    const schema = z.object({
      url: z.string().url(),
      type: z.enum(["URL_UPDATED", "URL_DELETED"]).optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const result = await requestGoogleIndexing(
      parsed.data.url,
      parsed.data.type ?? "URL_UPDATED"
    );
    res.json(result);
  })
);

aiRouter.get(
  "/index-logs",
  asyncHandler(async (_req, res) => {
    const logs = await prisma.seoIndexLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    res.json(logs);
  })
);
