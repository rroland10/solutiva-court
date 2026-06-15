"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  API_URL,
  apiFetch,
  type ActivityItem,
  type PlatformStats,
} from "@/lib/api";

const emptyStats: PlatformStats = {
  activeDisputes: 0,
  juryMembers: 0,
  resolutionRate: 0,
  totalStaked: 0,
};

interface PlatformContextValue {
  stats: PlatformStats;
  statsLoading: boolean;
  activities: ActivityItem[];
  refreshStats: () => Promise<void>;
  refreshActivities: () => Promise<void>;
  refreshPlatform: () => Promise<void>;
}

const PlatformContext = createContext<PlatformContextValue | null>(null);

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<PlatformStats>(emptyStats);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  const refreshStats = useCallback(async () => {
    try {
      const data = await apiFetch<PlatformStats>("/api/stats");
      setStats(data);
    } catch {
      // keep last known stats
    }
  }, []);

  const refreshActivities = useCallback(async () => {
    try {
      const data = await apiFetch<ActivityItem[]>("/api/stats/activities");
      setActivities(data);
    } catch {
      // keep last known activities
    }
  }, []);

  const refreshPlatform = useCallback(async () => {
    await Promise.all([refreshStats(), refreshActivities()]);
  }, [refreshStats, refreshActivities]);

  useEffect(() => {
    setStatsLoading(true);
    refreshPlatform().finally(() => setStatsLoading(false));
  }, [refreshPlatform]);

  useEffect(() => {
    const id = setInterval(refreshStats, 30_000);
    return () => clearInterval(id);
  }, [refreshStats]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof EventSource === "undefined") {
      const pollId = setInterval(refreshActivities, 15_000);
      return () => clearInterval(pollId);
    }

    let pollId: ReturnType<typeof setInterval> | null = null;
    const source = new EventSource(`${API_URL}/api/stats/activities/stream`);

    source.onmessage = (event) => {
      try {
        setActivities(JSON.parse(event.data) as ActivityItem[]);
      } catch {
        // ignore malformed payloads
      }
    };

    source.onerror = () => {
      source.close();
      if (!pollId) {
        pollId = setInterval(refreshActivities, 15_000);
      }
    };

    return () => {
      source.close();
      if (pollId) clearInterval(pollId);
    };
  }, [refreshActivities]);

  return (
    <PlatformContext.Provider
      value={{
        stats,
        statsLoading,
        activities,
        refreshStats,
        refreshActivities,
        refreshPlatform,
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error("usePlatform must be used within PlatformProvider");
  return ctx;
}
