"use client";

import { useChainWallet } from "@/context/Web3Provider";
import { getChainConfig, isChainConfigured } from "@/lib/chain/config";
import { formatWallet } from "@/lib/api";

export function WalletConnectButton() {
  const chainConfig = getChainConfig();
  const configured = isChainConfigured();
  const { address, isConnected, isConnecting, chainId, connect, disconnect } = useChainWallet();

  if (!chainConfig.enabled) {
    return (
      <span className="text-xs text-white/70 font-semibold hidden sm:inline">
        Demo mode (Base L2 off)
      </span>
    );
  }

  if (!configured) {
    return (
      <span className="text-xs text-amber-200 font-semibold hidden sm:inline">
        Base contracts not configured
      </span>
    );
  }

  if (isConnected && address) {
    const wrongChain = chainId !== chainConfig.chainId;
    return (
      <div className="flex items-center gap-2">
        {wrongChain && (
          <span className="text-xs text-amber-200 font-semibold">Wrong network</span>
        )}
        <button
          type="button"
          className="btn-glass btn-sm font-mono text-xs"
          onClick={() => disconnect()}
          title="Disconnect wallet"
        >
          {formatWallet(address)}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="btn-glass btn-sm text-xs"
      disabled={isConnecting}
      onClick={() => connect().catch(() => {})}
    >
      {isConnecting ? "Connecting..." : "Connect Wallet"}
    </button>
  );
}
