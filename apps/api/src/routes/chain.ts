import { Router } from "express";
import { asyncHandler } from "../lib/async-handler.js";
import {
  AVF_TESTNET_EXPLORER,
  AVF_TESTNET_TOKEN,
  AVF_TOKEN_METADATA,
  AVF_TOKEN_SOURCE,
  AVF_TOKEN_SOURCE_COMMIT,
} from "../lib/chain/chains.js";
import { getChainConfig, isChainReady, isEscrowReady, normalizeWallet } from "../lib/chain/config.js";
import { readAvfBalance } from "../lib/chain/client.js";
import { checkChainHealth } from "../lib/chain/hybrid.js";
import { prisma } from "../lib/prisma.js";

export const chainRouter = Router();

chainRouter.get(
  "/config",
  asyncHandler(async (_req, res) => {
    const config = getChainConfig();
    res.json({
      enabled: config.enabled,
      chainId: config.chainId,
      network: config.network,
      hybrid: true,
      avfToken: {
        address: config.avfToken ?? AVF_TESTNET_TOKEN,
        standard: "ERC-223",
        explorer: AVF_TESTNET_EXPLORER,
        source: AVF_TOKEN_SOURCE,
        sourceCommit: AVF_TOKEN_SOURCE_COMMIT,
        name: AVF_TOKEN_METADATA.name,
        symbol: AVF_TOKEN_METADATA.symbol,
        decimals: AVF_TOKEN_METADATA.decimals,
        maxCap: AVF_TOKEN_METADATA.maxCap,
        depositMethod: AVF_TOKEN_METADATA.depositMethod,
        recipientHook: AVF_TOKEN_METADATA.recipientHook,
      },
      onChain: ["wallet-auth", "avf-erc223", "collateral-escrow", "outcome-anchoring", "jury-rewards"],
      offChain: [
        "dispute-text",
        "search-filters",
        "ai-summaries",
        "activity-feed",
        "sse",
        "seo",
        "jury-voting",
        "vote-tallying",
      ],
      contracts: {
        avfToken: config.avfToken ?? AVF_TESTNET_TOKEN,
        disputeEscrow: config.disputeEscrow ?? null,
        outcomeRegistry: config.outcomeRegistry ?? null,
      },
      relayerConfigured: config.relayerConfigured,
      rewardsOnChain: config.rewardsOnChain,
      escrowReady: isEscrowReady(),
      ready: isChainReady(),
    });
  })
);

chainRouter.get(
  "/health",
  asyncHandler(async (_req, res) => {
    const status = await checkChainHealth();
    res.json({ status, ready: isChainReady(), escrowReady: isEscrowReady() });
  })
);

chainRouter.get(
  "/balance/:walletAddress",
  asyncHandler(async (req, res) => {
    const walletAddress = normalizeWallet(String(req.params.walletAddress));
    const onChainBalance = await readAvfBalance(walletAddress);

    if (onChainBalance !== null) {
      res.json({
        walletAddress,
        avfBalance: onChainBalance,
        source: getChainConfig().network,
      });
      return;
    }

    const user = await prisma.user.findFirst({
      where: { walletAddress: { equals: walletAddress, mode: "insensitive" } },
      select: { avfBalance: true },
    });

    res.json({
      walletAddress,
      avfBalance: user?.avfBalance ?? 0,
      source: "off-chain-cache",
    });
  })
);
