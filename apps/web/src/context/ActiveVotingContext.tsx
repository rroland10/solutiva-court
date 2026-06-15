"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { apiFetch, type VotingDispute } from "@/lib/api";
import { useUser } from "./UserContext";
import { usePlatform } from "./PlatformContext";

interface ActiveVotingContextValue {
  activeCase: VotingDispute | null;
  loading: boolean;
  needsVote: boolean;
  refresh: () => Promise<void>;
}

const ActiveVotingContext = createContext<ActiveVotingContextValue | null>(null);

export function ActiveVotingProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const { activities } = usePlatform();
  const [activeCase, setActiveCase] = useState<VotingDispute | null>(null);
  const [loading, setLoading] = useState(false);
  const votingActivitySig = activities
    .filter((a) => a.type === "vote" || a.type === "resolved" || a.type === "dispute")
    .map((a) => a.id)
    .join(",");

  const refresh = useCallback(async () => {
    if (!user?.id || !user.isJuryMember) {
      setActiveCase(null);
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<VotingDispute | null>(
        `/api/disputes/active/voting?userId=${user.id}`
      );
      setActiveCase(data);
    } catch {
      setActiveCase(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.isJuryMember]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 15_000);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    if (!votingActivitySig) return;
    refresh();
  }, [votingActivitySig, refresh]);

  const needsVote = Boolean(user?.isJuryMember && activeCase && !activeCase.userVote);

  return (
    <ActiveVotingContext.Provider value={{ activeCase, loading, needsVote, refresh }}>
      {children}
    </ActiveVotingContext.Provider>
  );
}

export function useActiveVoting() {
  const ctx = useContext(ActiveVotingContext);
  if (!ctx) {
    throw new Error("useActiveVoting must be used within ActiveVotingProvider");
  }
  return ctx;
}
