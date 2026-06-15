import {
  encodeAbiParameters,
  keccak256,
  parseAbiParameters,
  type Hash,
} from "viem";
import { getChainConfig, isChainReady } from "./config.js";
import {
  disputeEscrowAbi,
  getPublicClient,
  getRelayerWallet,
  outcomeRegistryAbi,
  avfAbi,
} from "./client.js";
import { chainForId } from "./chains.js";

export type ResolutionOutcome = "plaintiff" | "defendant" | "tie";

export function computeOutcomeHash(input: {
  disputeId: string;
  caseNumber: number;
  resolutionOutcome: ResolutionOutcome;
  plaintiffVotes: number;
  defendantVotes: number;
}): `0x${string}` {
  return keccak256(
    encodeAbiParameters(
      parseAbiParameters("string, uint256, string, uint256, uint256"),
      [
        input.disputeId,
        BigInt(input.caseNumber),
        input.resolutionOutcome,
        BigInt(input.plaintiffVotes),
        BigInt(input.defendantVotes),
      ]
    )
  );
}

function outcomeToUint8(outcome: ResolutionOutcome): number {
  if (outcome === "tie") return 0;
  if (outcome === "plaintiff") return 1;
  return 2;
}

function outcomeToEscrowEnum(outcome: ResolutionOutcome): number {
  if (outcome === "tie") return 0;
  if (outcome === "plaintiff") return 1;
  return 2;
}

export async function anchorAndSettle(input: {
  disputeKey: `0x${string}`;
  outcomeHash: `0x${string}`;
  resolutionOutcome: ResolutionOutcome;
  recipient: `0x${string}`;
}): Promise<{ outcomeTxHash?: Hash; settleTxHash?: Hash; skipped: boolean }> {
  if (!isChainReady()) {
    return { skipped: true };
  }

  const config = getChainConfig();
  const wallet = getRelayerWallet();
  const publicClient = getPublicClient();
  if (!wallet || !publicClient || !config.outcomeRegistry || !config.disputeEscrow) {
    return { skipped: true };
  }

  if (!wallet.account) {
    return { skipped: true };
  }

  const chain = chainForId(config.chainId);
  const outcome = outcomeToUint8(input.resolutionOutcome);
  const escrowOutcome = outcomeToEscrowEnum(input.resolutionOutcome);
  const account = wallet.account;

  const anchorHash = await wallet.writeContract({
    account,
    chain,
    address: config.outcomeRegistry,
    abi: outcomeRegistryAbi,
    functionName: "anchor",
    args: [input.disputeKey, input.outcomeHash, outcome],
  });

  await publicClient.waitForTransactionReceipt({ hash: anchorHash });

  const settleHash = await wallet.writeContract({
    account,
    chain,
    address: config.disputeEscrow,
    abi: disputeEscrowAbi,
    functionName: "settle",
    args: [input.disputeKey, escrowOutcome, input.recipient],
  });

  await publicClient.waitForTransactionReceipt({ hash: settleHash });

  return {
    outcomeTxHash: anchorHash,
    settleTxHash: settleHash,
    skipped: false,
  };
}

export async function mintAvfRewards(
  rewards: { walletAddress: string; amountAvf: number }[]
): Promise<{ txHashes: Hash[]; skipped: boolean }> {
  const config = getChainConfig();
  if (!config.rewardsOnChain || rewards.length === 0) {
    return { txHashes: [], skipped: true };
  }
  const wallet = getRelayerWallet();
  const publicClient = getPublicClient();
  if (!wallet || !publicClient || !config.avfToken) {
    return { txHashes: [], skipped: true };
  }

  if (!wallet.account) {
    return { txHashes: [], skipped: true };
  }

  const txHashes: Hash[] = [];
  const chain = chainForId(config.chainId);
  const account = wallet.account;

  for (const reward of rewards) {
    if (reward.amountAvf <= 0) continue;
    const amount = BigInt(Math.round(reward.amountAvf * 1e18));
    const hash = await wallet.writeContract({
      account,
      chain,
      address: config.avfToken,
      abi: avfAbi,
      functionName: "mint",
      args: [reward.walletAddress as `0x${string}`, amount],
    });
    await publicClient.waitForTransactionReceipt({ hash });
    txHashes.push(hash);
  }

  return { txHashes, skipped: false };
}

export async function checkChainHealth(): Promise<"connected" | "disabled" | "error" | "misconfigured"> {
  const config = getChainConfig();
  if (!config.enabled) return "disabled";
  if (!config.avfToken) return "misconfigured";

  try {
    const client = getPublicClient();
    if (!client) return "misconfigured";
    await client.getBlockNumber();
    return "connected";
  } catch {
    return "error";
  }
}
