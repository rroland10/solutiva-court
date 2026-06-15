"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createWalletClient,
  custom,
  type Hash,
  type WalletClient,
} from "viem";
import { getChainConfig } from "@/lib/chain/config";
import { chainForId } from "@/lib/chain/chains";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

interface ChainWalletContextValue {
  address: `0x${string}` | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | null;
  walletClient: WalletClient | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const ChainWalletContext = createContext<ChainWalletContextValue | null>(null);

function getEthereum(): EthereumProvider | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as Window & { ethereum?: EthereumProvider }).ethereum;
}

function resolveChain(chainId: number) {
  return chainForId(chainId);
}

export function Web3Provider({ children }: { children: ReactNode }) {
  const config = getChainConfig();
  const targetChain = resolveChain(config.chainId);
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const walletClient = useMemo(() => {
    const provider = getEthereum();
    if (!provider || !address) return null;
    return createWalletClient({
      account: address,
      chain: targetChain,
      transport: custom(provider),
    });
  }, [address, targetChain]);

  const syncAccounts = useCallback(async () => {
    const provider = getEthereum();
    if (!provider) {
      setAddress(null);
      setChainId(null);
      return;
    }

    const accounts = (await provider.request({ method: "eth_accounts" })) as string[];
    const nextAddress = accounts[0]?.toLowerCase() as `0x${string}` | undefined;
    setAddress(nextAddress ?? null);

    const hexChainId = (await provider.request({ method: "eth_chainId" })) as string;
    setChainId(Number.parseInt(hexChainId, 16));
  }, []);

  useEffect(() => {
    syncAccounts().catch(() => {});
    const provider = getEthereum();
    if (!provider?.on) return;

    const onAccounts = () => {
      syncAccounts().catch(() => {});
    };
    const onChain = () => {
      syncAccounts().catch(() => {});
    };

    provider.on("accountsChanged", onAccounts);
    provider.on("chainChanged", onChain);
    return () => {
      provider.removeListener?.("accountsChanged", onAccounts);
      provider.removeListener?.("chainChanged", onChain);
    };
  }, [syncAccounts]);

  const connect = useCallback(async () => {
    const provider = getEthereum();
    if (!provider) {
      throw new Error("No injected wallet found. Install MetaMask or another Base-compatible wallet.");
    }

    setIsConnecting(true);
    try {
      const accounts = (await provider.request({
        method: "eth_requestAccounts",
      })) as string[];
      const nextAddress = accounts[0]?.toLowerCase() as `0x${string}` | undefined;
      if (!nextAddress) throw new Error("Wallet connection was rejected");

      const hexChainId = (await provider.request({ method: "eth_chainId" })) as string;
      const currentChainId = Number.parseInt(hexChainId, 16);

      if (currentChainId !== config.chainId) {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${config.chainId.toString(16)}` }],
        });
      }

      setAddress(nextAddress);
      setChainId(config.chainId);
    } finally {
      setIsConnecting(false);
    }
  }, [config.chainId, config.rpcUrl, targetChain]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
  }, []);

  const value: ChainWalletContextValue = {
    address,
    isConnected: Boolean(address),
    isConnecting,
    chainId,
    walletClient,
    connect,
    disconnect,
  };

  return <ChainWalletContext.Provider value={value}>{children}</ChainWalletContext.Provider>;
}

export function useChainWallet() {
  const ctx = useContext(ChainWalletContext);
  if (!ctx) throw new Error("useChainWallet must be used within Web3Provider");
  return ctx;
}

export type { Hash, WalletClient };
