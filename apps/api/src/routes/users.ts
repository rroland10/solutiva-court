import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/async-handler.js";
import { paramId } from "../lib/params.js";
import { getChainConfig, normalizeWallet } from "../lib/chain/config.js";
import { readAvfBalance } from "../lib/chain/client.js";

export const usersRouter = Router();

usersRouter.get(
  "/wallet/:walletAddress",
  asyncHandler(async (req, res) => {
    const walletAddress = normalizeWallet(paramId(req.params.walletAddress));
    const chainConfig = getChainConfig();

    if (!/^0x[a-f0-9]{40}$/.test(walletAddress)) {
      res.status(400).json({ error: "Invalid wallet address" });
      return;
    }

    let user = await prisma.user.findUnique({ where: { walletAddress } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress,
          chainId: chainConfig.enabled ? chainConfig.chainId : null,
        },
      });
    }

    const onChainBalance = await readAvfBalance(walletAddress);
    if (onChainBalance !== null) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          avfBalance: onChainBalance,
          chainId: chainConfig.chainId,
        },
      });
    }

    res.json(user);
  })
);

usersRouter.get(
  "/demo",
  asyncHandler(async (_req, res) => {
    const user = await prisma.user.upsert({
      where: { walletAddress: "0x1234567890123456789012345678901234567890" },
      update: { isJuryMember: true },
      create: {
        walletAddress: "0x1234567890123456789012345678901234567890",
        name: "John Doe",
        email: "john@example.com",
        trustScore: 87,
        avfBalance: 2847.5,
        isJuryMember: true,
      },
    });

    res.json(user);
  })
);

usersRouter.get(
  "/:id/history",
  asyncHandler(async (req, res) => {
    const id = paramId(req.params.id);

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const [disputes, votes] = await Promise.all([
      prisma.dispute.findMany({
        where: { plaintiffId: id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          caseNumber: true,
          title: true,
          status: true,
          resolutionOutcome: true,
          createdAt: true,
        },
      }),
      prisma.vote.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          dispute: {
            select: {
              caseNumber: true,
              title: true,
              status: true,
              resolutionOutcome: true,
            },
          },
        },
      }),
    ]);

    res.json({
      disputes,
      votes: votes.map((vote) => ({
        id: vote.id,
        choice: vote.choice,
        createdAt: vote.createdAt,
        caseNumber: vote.dispute.caseNumber,
        title: vote.dispute.title,
        disputeId: vote.disputeId,
        disputeStatus: vote.dispute.status,
        resolutionOutcome: vote.dispute.resolutionOutcome,
      })),
    });
  })
);

usersRouter.get(
  "/:id/stats",
  asyncHandler(async (req, res) => {
    const id = paramId(req.params.id);

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const [votesCast, disputesFiled] = await Promise.all([
      prisma.vote.count({ where: { userId: id } }),
      prisma.dispute.count({ where: { plaintiffId: id } }),
    ]);

    res.json({
      casesParticipated: votesCast + disputesFiled,
      votesCast,
      disputesFiled,
    });
  })
);

usersRouter.patch(
  "/:id/jury",
  asyncHandler(async (req, res) => {
  const id = paramId(req.params.id);
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isJuryMember: !user.isJuryMember },
  });

  await prisma.activity.create({
    data: {
      userId: user.id,
      type: "jury",
      title: updated.isJuryMember ? "Joined jury pool" : "Left jury pool",
    },
  });

  res.json(updated);
  })
);

usersRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
  const id = paramId(req.params.id);
  const { name, email } = req.body as { name?: string; email?: string };

  const updated = await prisma.user.update({
    where: { id },
    data: { name, email },
  });

  res.json(updated);
  })
);
