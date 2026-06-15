"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { apiFetch, type Dispute } from "@/lib/api";
import { useUser } from "./UserContext";
import { usePlatform } from "./PlatformContext";

interface PendingCasesContextValue {
  pendingCases: Dispute[];
  pendingCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
}

const PendingCasesContext = createContext<PendingCasesContextValue | null>(null);

export function PendingCasesProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const { activities } = usePlatform();
  const [pendingCases, setPendingCases] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(false);
  const activitySig = activities.map((a) => a.id).join(",");

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setPendingCases([]);
      return;
    }

    setLoading(true);
    try {
      const disputes = await apiFetch<Dispute[]>(
        `/api/disputes?status=PENDING&plaintiffId=${encodeURIComponent(user.id)}`
      );
      setPendingCases(disputes);
    } catch {
      setPendingCases([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    if (!activitySig) return;
    refresh();
  }, [activitySig, refresh]);

  return (
    <PendingCasesContext.Provider
      value={{
        pendingCases,
        pendingCount: pendingCases.length,
        loading,
        refresh,
      }}
    >
      {children}
    </PendingCasesContext.Provider>
  );
}

export function usePendingCases() {
  const ctx = useContext(PendingCasesContext);
  if (!ctx) {
    throw new Error("usePendingCases must be used within PendingCasesProvider");
  }
  return ctx;
}
