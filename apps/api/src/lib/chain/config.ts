import { AVF_TESTNET_TOKEN, defaultRpcUrl, networkLabel } from "./chains.js";

export interface ChainConfig {
  enabled: boolean;
  chainId: number;
  rpcUrl: string;
  network: string;
  avfToken?: `0x${string}`;
  disputeEscrow?: `0x${string}`;
  outcomeRegistry?: `0x${string}`;
  relayerConfigured: boolean;
  rewardsOnChain: boolean;
}

export function getChainConfig(): ChainConfig {
  const enabled = process.env.CHAIN_ENABLED === "true";
  const chainId = Number(process.env.CHAIN_ID ?? 11155111);
  const rpcUrl =
    process.env.CHAIN_RPC_URL ??
    process.env.BASE_RPC_URL ??
    defaultRpcUrl(chainId);

  const avfToken = (process.env.AVF_TOKEN_ADDRESS ?? AVF_TESTNET_TOKEN) as `0x${string}`;
  const disputeEscrow = process.env.DISPUTE_ESCROW_ADDRESS as `0x${string}` | undefined;
  const outcomeRegistry = process.env.OUTCOME_REGISTRY_ADDRESS as `0x${string}` | undefined;

  return {
    enabled,
    chainId,
    rpcUrl,
    network: networkLabel(chainId),
    avfToken: avfToken.startsWith("0x") ? avfToken : undefined,
    disputeEscrow: disputeEscrow?.startsWith("0x") ? disputeEscrow : undefined,
    outcomeRegistry: outcomeRegistry?.startsWith("0x") ? outcomeRegistry : undefined,
    relayerConfigured: Boolean(process.env.RELAYER_PRIVATE_KEY?.startsWith("0x")),
    rewardsOnChain: process.env.AVF_REWARDS_ON_CHAIN === "true",
  };
}

export function isEscrowReady(config: ChainConfig = getChainConfig()): boolean {
  return Boolean(config.enabled && config.avfToken && config.disputeEscrow);
}

export function isChainReady(config: ChainConfig = getChainConfig()): boolean {
  return Boolean(
    isEscrowReady(config) &&
      config.outcomeRegistry &&
      config.relayerConfigured
  );
}

export function normalizeWallet(address: string): string {
  return address.toLowerCase();
}
