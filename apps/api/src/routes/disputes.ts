import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/async-handler.js";
import { disputeLookup, paramId } from "../lib/params.js";
import { enqueueDisputeAnalysis, enqueueSeoIndexing } from "../queues/index.js";
import { analyzeDispute, suggestResolution } from "../services/ai.service.js";
import { buildDisputeWhere } from "../lib/dispute-filters.js";
import { isValidStatusTransition, statusTransitionError } from "../lib/dispute-status.js";
import { computeResolutionOutcome, outcomeLabel } from "../lib/vote-outcome.js";
import { getChainConfig, isChainReady, isEscrowReady, normalizeWallet } from "../lib/chain/config.js";
import {
  avfToWei,
  verifyEscrowDeposit,
  readAvfBalance,
} from "../lib/chain/client.js";
import {
  anchorAndSettle,
  computeOutcomeHash,
  mintAvfRewards,
} from "../lib/chain/hybrid.js";

export const disputesRouter = Router();

const createDisputeSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  category: z.enum([
    "CONTRACT",
    "PAYMENT",
    "SERVICE",
    "INTELLECTUAL",
    "EMPLOYMENT",
  ]),
  collateral: z.number().positive(),
  defendantAddress: z.string().min(3),
  plaintiffId: z.string().optional(),
  status: z.enum(["ACTIVE", "PENDING"]).optional(),
  disputeKey: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/)
    .optional(),
  escrowTxHash: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/)
    .optional(),
});

disputesRouter.get(
  "/active/voting",
  asyncHandler(async (req, res) => {
    const userId =
      typeof req.query.userId === "string" ? req.query.userId : undefined;

    const dispute = await prisma.dispute.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      include: { votes: true },
    });

    if (!dispute) {
      res.json(null);
      return;
    }

    const plaintiffVotes = dispute.votes.filter((v) => v.choice === "plaintiff").length;
    const defendantVotes = dispute.votes.filter((v) => v.choice === "defendant").length;
    const total = plaintiffVotes + defendantVotes;

    let userVote: string | null = null;
    if (userId) {
      const vote = dispute.votes.find((v) => v.userId === userId);
      userVote = vote?.choice ?? null;
    }

    res.json({
      id: dispute.id,
      caseNumber: dispute.caseNumber,
      title: dispute.title,
      description: dispute.description,
      deadline: dispute.deadline,
      tally: {
        plaintiff: total > 0 ? Math.round((plaintiffVotes / total) * 100) : 50,
        defendant: total > 0 ? Math.round((defendantVotes / total) * 100) : 50,
      },
      userVote,
    });
  })
);

disputesRouter.get(
  "/counts",
  asyncHandler(async (req, res) => {
    const plaintiffId =
      typeof req.query.plaintiffId === "string" ? req.query.plaintiffId : undefined;
    const baseWhere = plaintiffId ? { plaintiffId } : undefined;

    const [all, active, pending, resolved, cancelled, categoryGroups] = await Promise.all([
      prisma.dispute.count({ where: baseWhere }),
      prisma.dispute.count({ where: { ...baseWhere, status: "ACTIVE" } }),
      prisma.dispute.count({ where: { ...baseWhere, status: "PENDING" } }),
      prisma.dispute.count({ where: { ...baseWhere, status: "RESOLVED" } }),
      prisma.dispute.count({ where: { ...baseWhere, status: "CANCELLED" } }),
      prisma.dispute.groupBy({
        by: ["category"],
        where: baseWhere,
        _count: { _all: true },
      }),
    ]);

    const byCategory = Object.fromEntries(
      categoryGroups.map((group) => [group.category, group._count._all])
    );

    res.json({
      ALL: all,
      ACTIVE: active,
      PENDING: pending,
      RESOLVED: resolved,
      CANCELLED: cancelled,
      byCategory,
    });
  })
);

disputesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const status =
      typeof req.query.status === "string" ? req.query.status : undefined;
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    const category =
      typeof req.query.category === "string" ? req.query.category : undefined;
    const plaintiffId =
      typeof req.query.plaintiffId === "string" ? req.query.plaintiffId : undefined;
    const userId =
      typeof req.query.userId === "string" ? req.query.userId : undefined;

    const disputes = await prisma.dispute.findMany({
      where: buildDisputeWhere(status, q, category, plaintiffId),
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        plaintiff: { select: { name: true, walletAddress: true } },
        votes: { select: { choice: true } },
        _count: { select: { votes: true } },
      },
    });

    let userVoteByDispute: Record<string, string> = {};
    if (userId && disputes.length > 0) {
      const userVotes = await prisma.vote.findMany({
        where: {
          userId,
          disputeId: { in: disputes.map((dispute) => dispute.id) },
        },
        select: { disputeId: true, choice: true },
      });
      userVoteByDispute = Object.fromEntries(
        userVotes.map((vote) => [vote.disputeId, vote.choice])
      );
    }

    res.json(
      disputes.map(({ votes, _count, ...dispute }) => {
        const plaintiffVotes = votes.filter((v) => v.choice === "plaintiff").length;
        const defendantVotes = votes.filter((v) => v.choice === "defendant").length;
        const total = plaintiffVotes + defendantVotes;

        return {
          ...dispute,
          voteCount: _count.votes,
          voteTally:
            total > 0
              ? {
                  plaintiff: plaintiffVotes,
                  defendant: defendantVotes,
                  plaintiffPct: Math.round((plaintiffVotes / total) * 100),
                  defendantPct: Math.round((defendantVotes / total) * 100),
                }
              : null,
          ...(userId
            ? { userVote: userVoteByDispute[dispute.id] ?? null }
            : {}),
        };
      })
    );
  })
);

disputesRouter.post(
  "/:id/analyze",
  asyncHandler(async (req, res) => {
    const id = paramId(req.params.id);
    const dispute = await prisma.dispute.findFirst({
      where: disputeLookup(id),
    });

    if (!dispute) {
      res.status(404).json({ error: "Dispute not found" });
      return;
    }

    const summary = await analyzeDispute({
      title: dispute.title,
      description: dispute.description,
      category: dispute.category,
    });

    const updated = await prisma.dispute.update({
      where: { id: dispute.id },
      data: { aiSummary: summary },
    });

    res.json({ summary, dispute: updated });
  })
);

disputesRouter.post(
  "/:id/suggest-resolution",
  asyncHandler(async (req, res) => {
    const id = paramId(req.params.id);
    const dispute = await prisma.dispute.findFirst({
      where: disputeLookup(id),
      include: { votes: true },
    });

    if (!dispute) {
      res.status(404).json({ error: "Dispute not found" });
      return;
    }

    const voteTally = dispute.votes.reduce<Record<string, number>>((acc, vote) => {
      acc[vote.choice] = (acc[vote.choice] ?? 0) + 1;
      return acc;
    }, {});

    const votes = Object.entries(voteTally).map(([choice, count]) => ({ choice, count }));

    const recommendation = await suggestResolution({
      description: dispute.description,
      votes,
    });

    res.json({ recommendation, votes });
  })
);

disputesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
  const id = paramId(req.params.id);
  const userId =
    typeof req.query.userId === "string" ? req.query.userId : undefined;

  const dispute = await prisma.dispute.findFirst({
    where: disputeLookup(id),
    include: {
      plaintiff: true,
      votes: { include: { user: { select: { name: true, walletAddress: true } } } },
    },
  });

  if (!dispute) {
    res.status(404).json({ error: "Dispute not found" });
    return;
  }

  const userVote = userId
    ? (dispute.votes.find((vote) => vote.userId === userId)?.choice ?? null)
    : null;

  res.json({ ...dispute, userVote });
  })
);

disputesRouter.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const schema = z.object({
      status: z.enum(["ACTIVE", "RESOLVED", "CANCELLED", "PENDING"]),
      userId: z.string(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const id = paramId(req.params.id);
    const dispute = await prisma.dispute.findFirst({
      where: disputeLookup(id),
    });

    if (!dispute) {
      res.status(404).json({ error: "Dispute not found" });
      return;
    }

    if (!parsed.data.userId) {
      res.status(400).json({ error: "userId is required to update dispute status" });
      return;
    }

    if (parsed.data.userId !== dispute.plaintiffId) {
      res.status(403).json({ error: "Only the case plaintiff can update status" });
      return;
    }

    if (!isValidStatusTransition(dispute.status, parsed.data.status)) {
      res.status(400).json({
        error: statusTransitionError(dispute.status, parsed.data.status),
      });
      return;
    }

    let updated = dispute;

    if (parsed.data.status === "RESOLVED") {
      const votes = await prisma.vote.findMany({
        where: { disputeId: dispute.id },
        select: { userId: true, choice: true, user: { select: { walletAddress: true } } },
      });

      const resolutionOutcome = computeResolutionOutcome(votes);
      const plaintiffVotes = votes.filter((v) => v.choice === "plaintiff").length;
      const defendantVotes = votes.filter((v) => v.choice === "defendant").length;

      let outcomeHash: `0x${string}` | null = null;
      let outcomeTxHash: string | null = null;

      if (isChainReady() && dispute.disputeKey) {
        const computedOutcomeHash = computeOutcomeHash({
          disputeId: dispute.id,
          caseNumber: dispute.caseNumber,
          resolutionOutcome,
          plaintiffVotes,
          defendantVotes,
        });
        outcomeHash = computedOutcomeHash;

        const plaintiffWallet = (
          await prisma.user.findUnique({
            where: { id: dispute.plaintiffId },
            select: { walletAddress: true },
          })
        )?.walletAddress;

        const recipient =
          resolutionOutcome === "defendant"
            ? (dispute.defendantAddress as `0x${string}`)
            : ((plaintiffWallet ?? dispute.defendantAddress) as `0x${string}`);

        const chainResult = await anchorAndSettle({
          disputeKey: dispute.disputeKey as `0x${string}`,
          outcomeHash: computedOutcomeHash,
          resolutionOutcome,
          recipient,
        });

        outcomeTxHash = chainResult.outcomeTxHash ?? null;
      }

      updated = await prisma.dispute.update({
        where: { id: dispute.id },
        data: {
          status: "RESOLVED",
          resolutionOutcome,
          outcomeHash,
          outcomeTxHash,
          chainId: getChainConfig().enabled ? getChainConfig().chainId : dispute.chainId,
        },
      });

      await Promise.all(
        votes.map((vote) => {
          const bonus =
            resolutionOutcome !== "tie" && vote.choice === resolutionOutcome ? 5 : 0;
          return prisma.user.update({
            where: { id: vote.userId },
            data: { avfBalance: { increment: 25 + bonus } },
          });
        })
      );

      await mintAvfRewards(
        votes.map((vote) => {
          const bonus =
            resolutionOutcome !== "tie" && vote.choice === resolutionOutcome ? 5 : 0;
          return {
            walletAddress: vote.user.walletAddress,
            amountAvf: 25 + bonus,
          };
        })
      );

      if (getChainConfig().rewardsOnChain) {
        await Promise.all(
          votes.map(async (vote) => {
            const balance = await readAvfBalance(vote.user.walletAddress);
            if (balance === null) return;
            await prisma.user.update({
              where: { id: vote.userId },
              data: { avfBalance: balance },
            });
          })
        );
      }

      await prisma.activity.create({
        data: {
          type: "resolved",
          title: `Dispute #${dispute.caseNumber} resolved — ${outcomeLabel(resolutionOutcome)}`,
          metadata: {
            disputeId: dispute.id,
            caseNumber: dispute.caseNumber,
            resolutionOutcome,
          },
        },
      });
    } else {
      updated = await prisma.dispute.update({
        where: { id: dispute.id },
        data: {
          status: parsed.data.status,
          ...(parsed.data.status === "CANCELLED" ? { resolutionOutcome: null } : {}),
        },
      });
    }

    if (parsed.data.status === "CANCELLED") {
      await prisma.activity.create({
        data: {
          type: "dispute",
          title: `Dispute #${dispute.caseNumber} cancelled`,
          metadata: { disputeId: dispute.id, caseNumber: dispute.caseNumber },
        },
      });
    }

    if (parsed.data.status === "ACTIVE" && dispute.status === "PENDING") {
      await prisma.activity.create({
        data: {
          type: "dispute",
          title: `Dispute #${dispute.caseNumber} is now open for jury voting`,
          metadata: { disputeId: dispute.id, caseNumber: dispute.caseNumber },
        },
      });
    }

    res.json(updated);
  })
);

disputesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
  const parsed = createDisputeSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { title, description, category, collateral, defendantAddress, plaintiffId, status, disputeKey, escrowTxHash } =
    parsed.data;

  const disputeStatus = status ?? "ACTIVE";
  const chainConfig = getChainConfig();

  if (isEscrowReady()) {
    if (!disputeKey || !escrowTxHash) {
      res.status(400).json({
        error: "On-chain escrow required: provide disputeKey and escrowTxHash",
      });
      return;
    }

    if (!plaintiffId) {
      res.status(400).json({ error: "plaintiffId (connected wallet user) is required for escrow" });
      return;
    }

    const plaintiffForEscrow = await prisma.user.findUnique({ where: { id: plaintiffId } });
    if (!plaintiffForEscrow) {
      res.status(404).json({ error: "Plaintiff not found" });
      return;
    }

    const verification = await verifyEscrowDeposit({
      disputeKey: disputeKey as `0x${string}`,
      txHash: escrowTxHash as `0x${string}`,
      expectedPlaintiff: plaintiffForEscrow.walletAddress,
      expectedDefendant: defendantAddress,
      expectedAmountWei: avfToWei(collateral),
    });

    if (!verification.ok) {
      res.status(400).json({ error: verification.reason });
      return;
    }
  }

  let plaintiff = plaintiffId
    ? await prisma.user.findUnique({ where: { id: plaintiffId } })
    : null;

  if (!plaintiff) {
    plaintiff = await prisma.user.upsert({
      where: { walletAddress: "0x1234567890123456789012345678901234567890" },
      update: {},
      create: {
        walletAddress: "0x1234567890123456789012345678901234567890",
        name: "John Doe",
        email: "john@example.com",
        trustScore: 87,
        avfBalance: 2847.5,
      },
    });
  }

  const dispute = await prisma.dispute.create({
    data: {
      title,
      description,
      category,
      collateral,
      defendantAddress,
      plaintiffId: plaintiff.id,
      status: disputeStatus,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      disputeKey: disputeKey ?? null,
      escrowTxHash: escrowTxHash ?? null,
      chainId: chainConfig.enabled ? chainConfig.chainId : null,
    },
  });

  await enqueueDisputeAnalysis({
    disputeId: dispute.id,
    title,
    description,
    category,
  });

  await enqueueSeoIndexing(dispute.caseNumber);

  await prisma.activity.create({
    data: {
      userId: plaintiff.id,
      type: "dispute",
      title: `New dispute filed: ${title}`,
      metadata: { disputeId: dispute.id, caseNumber: dispute.caseNumber },
    },
  });

  res.status(201).json(dispute);
  })
);

disputesRouter.post(
  "/:id/vote",
  asyncHandler(async (req, res) => {
  const schema = z.object({
    userId: z.string(),
    choice: z.enum(["plaintiff", "defendant"]),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const id = paramId(req.params.id);
  const dispute = await prisma.dispute.findUnique({
    where: { id },
  });

  if (!dispute) {
    res.status(404).json({ error: "Dispute not found" });
    return;
  }

  if (dispute.status !== "ACTIVE") {
    res.status(400).json({ error: "Voting is only allowed on active disputes" });
    return;
  }

  const voter = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { isJuryMember: true, trustScore: true, walletAddress: true },
  });

  if (!voter) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (!voter.isJuryMember) {
    res.status(403).json({ error: "Only jury members can vote" });
    return;
  }

  const existingVote = await prisma.vote.findUnique({
    where: {
      disputeId_userId: {
        disputeId: dispute.id,
        userId: parsed.data.userId,
      },
    },
  });

  const vote = await prisma.vote.upsert({
    where: {
      disputeId_userId: {
        disputeId: dispute.id,
        userId: parsed.data.userId,
      },
    },
    update: { choice: parsed.data.choice },
    create: {
      disputeId: dispute.id,
      userId: parsed.data.userId,
      choice: parsed.data.choice,
    },
  });

  if (!existingVote) {
    await prisma.user.update({
      where: { id: parsed.data.userId },
      data: {
        avfBalance: { increment: 10 },
        trustScore: Math.min(100, (voter.trustScore ?? 0) + 1),
      },
    });

    await mintAvfRewards([{ walletAddress: voter.walletAddress, amountAvf: 10 }]);
    if (getChainConfig().rewardsOnChain) {
      const balance = await readAvfBalance(voter.walletAddress);
      if (balance !== null) {
        await prisma.user.update({
          where: { id: parsed.data.userId },
          data: { avfBalance: balance },
        });
      }
    }
  }

  await prisma.activity.create({
    data: {
      userId: parsed.data.userId,
      type: "vote",
      title: `Vote cast on Case #${dispute.caseNumber} — ${parsed.data.choice}`,
      metadata: {
        disputeId: dispute.id,
        caseNumber: dispute.caseNumber,
        choice: parsed.data.choice,
      },
    },
  });

  res.json({
    vote,
    rewarded: !existingVote,
  });
  })
);
