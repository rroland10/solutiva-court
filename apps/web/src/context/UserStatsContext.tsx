"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { apiFetch, type UserStats } from "@/lib/api";
import { useUser } from "./UserContext";
import { usePlatform } from "./PlatformContext";

interface UserStatsContextValue {
  stats: UserStats | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const UserStatsContext = createContext<UserStatsContextValue | null>(null);

export function UserStatsProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const { activities } = usePlatform();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const activitySig = activities.map((a) => a.id).join(",");

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setStats(null);
      return;
    }

    try {
      const data = await apiFetch<UserStats>(`/api/users/${user.id}/stats`);
      setStats(data);
    } catch {
      setStats(null);
    }
  }, [user?.id]);

  useEffect(() => {
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  useEffect(() => {
    if (!activitySig) return;
    refresh();
  }, [activitySig, refresh]);

  useEffect(() => {
    if (!user?.id) return;
    const id = setInterval(() => {
      refresh().catch(() => {});
    }, 60_000);
    return () => clearInterval(id);
  }, [user?.id, refresh]);

  return (
    <UserStatsContext.Provider value={{ stats, loading, refresh }}>
      {children}
    </UserStatsContext.Provider>
  );
}

export function useUserStats() {
  const ctx = useContext(UserStatsContext);
  if (!ctx) {
    throw new Error("useUserStats must be used within UserStatsProvider");
  }
  return ctx;
}
