"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, type UserHistory } from "@/lib/api";
import { useUser } from "@/context/UserContext";
import { usePlatform } from "@/context/PlatformContext";

export function useUserHistory() {
  const { user } = useUser();
  const { activities } = usePlatform();
  const [history, setHistory] = useState<UserHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const activitySig = activities.map((activity) => activity.id).join(",");

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setHistory(null);
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<UserHistory>(`/api/users/${user.id}/history`);
      setHistory(data);
    } catch {
      setHistory(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refresh();
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

  return { history, loading, refresh };
}
