import { base, baseSepolia, sepolia } from "viem/chains";

export const AVF_TESTNET_TOKEN =
  "0x45D39B5C90685AF368EecbacB6EB7bbA6f9B1936" as const;

export const AVF_TESTNET_EXPLORER =
  "https://sepolia.etherscan.io/address/0x45D39B5C90685AF368EecbacB6EB7bbA6f9B1936";

export const AVF_TOKEN_SOURCE = "https://github.com/EthereumCommonwealth/AVF_Token";
export const AVF_TOKEN_SOURCE_COMMIT =
  "https://github.com/EthereumCommonwealth/AVF_Token/commit/937de593aeeab167b1d8bec85922c2b7a5355041";

/** Official token: 28M initial supply, 8B max cap, ERC-223 standard() = 223 */
export const AVF_TOKEN_METADATA = {
  name: "AVF token",
  symbol: "AVF",
  decimals: 18,
  initialSupply: 28_000_000,
  maxCap: 8_000_000_000,
  standard: 223,
  depositMethod: "transfer(to, amount, abi.encode(disputeKey, defendant))",
  recipientHook: "tokenReceived",
} as const;

export function chainForId(chainId: number) {
  if (chainId === base.id) return base;
  if (chainId === baseSepolia.id) return baseSepolia;
  if (chainId === sepolia.id) return sepolia;
  return sepolia;
}

export function networkLabel(chainId: number): string {
  if (chainId === base.id) return "base";
  if (chainId === baseSepolia.id) return "base-sepolia";
  if (chainId === sepolia.id) return "sepolia";
  return `chain-${chainId}`;
}

export function defaultRpcUrl(chainId: number): string {
  if (chainId === base.id) return "https://mainnet.base.org";
  if (chainId === baseSepolia.id) return "https://sepolia.base.org";
  if (chainId === sepolia.id) return "https://rpc.sepolia.org";
  return "https://rpc.sepolia.org";
}

function blockExplorerBaseUrl(chainId: number): string {
  if (chainId === base.id) return "https://basescan.org";
  if (chainId === baseSepolia.id) return "https://sepolia.basescan.org";
  return "https://sepolia.etherscan.io";
}

export function blockExplorerUrl(
  chainId: number,
  kind: "tx" | "address" | "block",
  value: string
): string {
  return `${blockExplorerBaseUrl(chainId)}/${kind}/${value}`;
}

export function txExplorerUrl(chainId: number, txHash: string): string {
  return blockExplorerUrl(chainId, "tx", txHash);
}

export function addressExplorerUrl(chainId: number, address: string): string {
  return blockExplorerUrl(chainId, "address", address);
}
