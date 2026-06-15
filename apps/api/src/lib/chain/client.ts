import {
  createPublicClient,
  createWalletClient,
  http,
  type Hash,
  type PublicClient,
  type WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import AVFToken from "../../abi/AVF_Token.json";
import DisputeEscrow from "../../abi/DisputeEscrow.json";
import OutcomeRegistry from "../../abi/OutcomeRegistry.json";
import { getChainConfig } from "./config.js";
import { chainForId } from "./chains.js";

export function getPublicClient() {
  const config = getChainConfig();
  if (!config.enabled) return null;

  return createPublicClient({
    chain: chainForId(config.chainId),
    transport: http(config.rpcUrl),
  }) as PublicClient;
}

export function getRelayerWallet(): WalletClient | null {
  const config = getChainConfig();
  const key = process.env.RELAYER_PRIVATE_KEY;
  if (!config.enabled || !key?.startsWith("0x")) return null;

  const account = privateKeyToAccount(key as `0x${string}`);
  return createWalletClient({
    account,
    chain: chainForId(config.chainId),
    transport: http(config.rpcUrl),
  });
}

export const avfAbi = AVFToken.abi;
export const disputeEscrowAbi = DisputeEscrow.abi;
export const outcomeRegistryAbi = OutcomeRegistry.abi;

export async function readAvfBalance(walletAddress: string): Promise<number | null> {
  const config = getChainConfig();
  const client = getPublicClient();
  if (!client || !config.avfToken) return null;

  const raw = await client.readContract({
    address: config.avfToken,
    abi: avfAbi,
    functionName: "balanceOf",
    args: [walletAddress as `0x${string}`],
  });

  return Number(raw) / 1e18;
}

export async function verifyEscrowDeposit(input: {
  disputeKey: `0x${string}`;
  txHash: Hash;
  expectedPlaintiff: string;
  expectedDefendant: string;
  expectedAmountWei: bigint;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const config = getChainConfig();
  const client = getPublicClient();
  if (!client || !config.disputeEscrow) {
    return { ok: false, reason: "Chain not configured" };
  }

  const receipt = await client.getTransactionReceipt({ hash: input.txHash });
  if (!receipt || receipt.status !== "success") {
    return { ok: false, reason: "Escrow transaction not successful" };
  }

  const deposit = await client.readContract({
    address: config.disputeEscrow,
    abi: disputeEscrowAbi,
    functionName: "deposits",
    args: [input.disputeKey],
  });

  const [plaintiff, defendant, amount, settled] = deposit as [
    `0x${string}`,
    `0x${string}`,
    bigint,
    boolean,
  ];

  if (settled || amount === 0n) {
    return { ok: false, reason: "No escrow deposit found for dispute key" };
  }

  if (plaintiff.toLowerCase() !== input.expectedPlaintiff.toLowerCase()) {
    return { ok: false, reason: "Escrow plaintiff does not match connected wallet" };
  }

  if (defendant.toLowerCase() !== input.expectedDefendant.toLowerCase()) {
    return { ok: false, reason: "Escrow defendant does not match dispute" };
  }

  if (amount !== input.expectedAmountWei) {
    return { ok: false, reason: "Escrow amount does not match collateral" };
  }

  return { ok: true };
}

export function avfToWei(amount: number): bigint {
  return BigInt(Math.round(amount * 1e18));
}

export function weiToAvf(amount: bigint): number {
  return Number(amount) / 1e18;
}
