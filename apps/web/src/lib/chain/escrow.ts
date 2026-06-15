import {
  encodeAbiParameters,
  parseAbiParameters,
  parseUnits,
  type Hash,
  type WalletClient,
} from "viem";
import AVFToken from "@/abi/AVF_Token.json";
import { getChainConfig } from "./config";

export function buildDisputeKey(): `0x${string}` {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export async function depositAvfCollateral(
  walletClient: WalletClient,
  input: {
    account: `0x${string}`;
    disputeKey: `0x${string}`;
    defendantAddress: `0x${string}`;
    amountAvf: number;
  }
): Promise<Hash> {
  const config = getChainConfig();
  if (!config.avfToken || !config.disputeEscrow) {
    throw new Error("Base contracts are not configured");
  }

  const amount = parseUnits(input.amountAvf.toString(), 18);
  const data = encodeAbiParameters(parseAbiParameters("bytes32, address"), [
    input.disputeKey,
    input.defendantAddress,
  ]);

  return walletClient.writeContract({
    account: input.account,
    chain: walletClient.chain,
    address: config.avfToken,
    abi: AVFToken.abi,
    functionName: "transfer",
    args: [config.disputeEscrow, amount, data],
  });
}

export function filingFees(totalRestitutionAvf: number) {
  const filingFee = Math.round(totalRestitutionAvf * 0.02 * 100) / 100;
  const securityDeposit = Math.round(totalRestitutionAvf * 0.2 * 100) / 100;
  const total = Math.round((totalRestitutionAvf + filingFee + securityDeposit) * 100) / 100;
  return { filingFee, securityDeposit, total };
}
