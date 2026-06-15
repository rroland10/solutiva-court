import { AVF_TESTNET_EXPLORER, AVF_TESTNET_TOKEN, defaultRpcUrl, networkLabel } from "./chains";

export interface ChainConfig {
  enabled: boolean;
  chainId: number;
  rpcUrl: string;
  network: string;
  avfToken?: `0x${string}`;
  disputeEscrow?: `0x${string}`;
  outcomeRegistry?: `0x${string}`;
}

export function getChainConfig(): ChainConfig {
  const enabled = process.env.NEXT_PUBLIC_CHAIN_ENABLED === "true";
  const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 11155111);
  const rpcUrl =
    process.env.NEXT_PUBLIC_CHAIN_RPC_URL ??
    process.env.NEXT_PUBLIC_BASE_RPC_URL ??
    defaultRpcUrl(chainId);

  const avfToken = (process.env.NEXT_PUBLIC_AVF_TOKEN_ADDRESS ??
    AVF_TESTNET_TOKEN) as `0x${string}`;
  const disputeEscrow = process.env.NEXT_PUBLIC_DISPUTE_ESCROW_ADDRESS as
    | `0x${string}`
    | undefined;
  const outcomeRegistry = process.env.NEXT_PUBLIC_OUTCOME_REGISTRY_ADDRESS as
    | `0x${string}`
    | undefined;

  return {
    enabled,
    chainId,
    rpcUrl,
    network: networkLabel(chainId),
    avfToken: avfToken.startsWith("0x") ? avfToken : undefined,
    disputeEscrow: disputeEscrow?.startsWith("0x") ? disputeEscrow : undefined,
    outcomeRegistry: outcomeRegistry?.startsWith("0x") ? outcomeRegistry : undefined,
  };
}

export function isEscrowReady(config: ChainConfig = getChainConfig()): boolean {
  return Boolean(config.enabled && config.avfToken && config.disputeEscrow);
}

export function isChainConfigured(config: ChainConfig = getChainConfig()): boolean {
  return isEscrowReady(config);
}

export const HYBRID_OFF_CHAIN = [
  "Dispute text, search, filters",
  "AI summaries & suggestions",
  "Activity feed, SSE, SEO",
  "Jury UX & fast vote tallying",
] as const;

export const HYBRID_ON_CHAIN = [
  "Wallet auth (Sepolia / Base)",
  "AVF ERC-223 token",
  "Collateral escrow",
  "Outcome anchoring",
  "Optional on-chain jury mints",
] as const;

export { AVF_TESTNET_EXPLORER, AVF_TESTNET_TOKEN };
