"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useChainWallet } from "@/context/Web3Provider";
import { apiFetch, type User } from "@/lib/api";
import { getChainConfig, isChainConfigured } from "@/lib/chain/config";

interface UserContextValue {
  user: User | null;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
  loading: boolean;
  walletMode: "demo" | "base";
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { address, isConnected } = useChainWallet();
  const chainConfig = getChainConfig();
  const walletMode =
    chainConfig.enabled && isChainConfigured() && isConnected && address ? "base" : "demo";

  const refreshUser = useCallback(async () => {
    try {
      if (walletMode === "base" && address) {
        const data = await apiFetch<User>(`/api/users/wallet/${address}`);
        setUser(data);
      } else {
        const data = await apiFetch<User>("/api/users/demo");
        setUser(data);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [address, walletMode]);

  useEffect(() => {
    setLoading(true);
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const id = setInterval(() => {
      refreshUser().catch(() => {});
    }, 60_000);
    return () => clearInterval(id);
  }, [refreshUser]);

  return (
    <UserContext.Provider value={{ user, setUser, refreshUser, loading, walletMode }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
