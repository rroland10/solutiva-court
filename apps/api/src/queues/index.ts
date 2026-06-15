import { Queue, Worker, Job } from "bullmq";
import { redisConnectionOptions } from "../lib/redis.js";
import { analyzeDispute } from "../services/ai.service.js";
import { indexDisputePage } from "../services/google-indexing.service.js";
import { prisma } from "../lib/prisma.js";

export const QUEUE_NAMES = {
  DISPUTE_PROCESSING: "dispute-processing",
  SEO_INDEXING: "seo-indexing",
} as const;

export const disputeQueue = new Queue(QUEUE_NAMES.DISPUTE_PROCESSING, {
  connection: redisConnectionOptions,
});

export const seoQueue = new Queue(QUEUE_NAMES.SEO_INDEXING, {
  connection: redisConnectionOptions,
});

interface DisputeJobData {
  disputeId: string;
  title: string;
  description: string;
  category: string;
}

interface SeoJobData {
  caseNumber: number;
}

export function startWorkers() {
  const disputeWorker = new Worker<DisputeJobData>(
    QUEUE_NAMES.DISPUTE_PROCESSING,
    async (job: Job<DisputeJobData>) => {
      const summary = await analyzeDispute({
        title: job.data.title,
        description: job.data.description,
        category: job.data.category,
      });

      await prisma.dispute.update({
        where: { id: job.data.disputeId },
        data: { aiSummary: summary },
      });

      return { summary };
    },
    { connection: redisConnectionOptions }
  );

  const seoWorker = new Worker<SeoJobData>(
    QUEUE_NAMES.SEO_INDEXING,
    async (job: Job<SeoJobData>) => {
      await indexDisputePage(job.data.caseNumber);
      return { indexed: job.data.caseNumber };
    },
    { connection: redisConnectionOptions }
  );

  disputeWorker.on("failed", (job, err) => {
    console.error(`Dispute job ${job?.id} failed:`, err.message);
  });

  seoWorker.on("failed", (job, err) => {
    console.error(`SEO job ${job?.id} failed:`, err.message);
  });

  return { disputeWorker, seoWorker };
}

export async function enqueueDisputeAnalysis(data: DisputeJobData) {
  return disputeQueue.add("analyze", data, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
  });
}

export async function enqueueSeoIndexing(caseNumber: number) {
  return seoQueue.add("index", { caseNumber }, { attempts: 2 });
}
