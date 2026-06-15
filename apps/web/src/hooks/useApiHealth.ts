"use client";

import { useCallback, useEffect, useState } from "react";
import type { HealthStatus } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function useApiHealth(intervalMs = 30_000) {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [reachable, setReachable] = useState(true);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => {
    setTick((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch(`${API_URL}/health`, { cache: "no-store" });
        if (!res.ok) throw new Error("unhealthy");
        const data = (await res.json()) as HealthStatus;
        if (!cancelled) {
          setHealth(data);
          setReachable(true);
        }
      } catch {
        if (!cancelled) {
          setHealth(null);
          setReachable(false);
        }
      }
    }

    check();
    const id = setInterval(check, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs, tick]);

  const degraded = !reachable || health?.status === "degraded" || health?.database !== "connected";

  return { health, reachable, degraded, refresh };
}