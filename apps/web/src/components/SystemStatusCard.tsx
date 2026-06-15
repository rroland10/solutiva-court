"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "./icons";
import { RefreshButton } from "./RefreshButton";
import { useApiHealth } from "@/hooks/useApiHealth";
import { apiFetch } from "@/lib/api";

interface QueueCounts {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

interface QueueStats {
  disputeProcessing: QueueCounts;
  seoIndexing: QueueCounts;
}

export function SystemStatusCard() {
  const { health, reachable, degraded, refresh: refreshHealth } = useApiHealth();
  const [queues, setQueues] = useState<QueueStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadQueues = useCallback(async () => {
    try {
      const data = await apiFetch<QueueStats>("/api/stats/queues");
      setQueues(data);
    } catch {
      setQueues(null);
    }
  }, []);

  useEffect(() => {
    loadQueues();
    const id = setInterval(loadQueues, 30_000);
    return () => clearInterval(id);
  }, [loadQueues]);

  async function handleRefresh() {
    setRefreshing(true);
    await Promise.all([refreshHealth(), loadQueues()]);
    setRefreshing(false);
  }

  const items = [
    {
      label: "API",
      ok: reachable && health?.status === "ok",
      detail: reachable ? health?.status ?? "unknown" : "offline",
    },
    {
      label: "Database",
      ok: health?.database === "connected",
      detail: health?.database ?? "unknown",
    },
    {
      label: "Redis",
      ok: health?.redis === "connected",
      detail: health?.redis ?? "unknown",
    },
    {
      label: "Base L2",
      ok: health?.chain === "connected" || health?.chain === "disabled",
      detail: health?.chain ?? "unknown",
    },
  ];

  return (
    <div className={`card ${degraded ? "card-accent-pending" : ""}`}>
      <div className="card-header justify-between">
        <div className="flex items-center gap-2.5">
          <Icon name="shield" size="sm" className="text-primary" />
          <h3>System Status</h3>
        </div>
        <RefreshButton onClick={handleRefresh} loading={refreshing} variant="outline" />
      </div>
      <div className="card-body space-y-3">
        {items.map((item) => (
          <dl key={item.label} className="metric-row">
            <dt>{item.label}</dt>
            <dd
              className={`inline-flex items-center gap-1.5 ${
                item.ok ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              <Icon name={item.ok ? "success" : "warning"} size="sm" />
              {item.detail}
            </dd>
          </dl>
        ))}
        {queues && (
          <>
            <div className="border-t border-gray-100 pt-4 mt-2">
              <p className="section-title text-sm mb-3">Background Jobs</p>
            </div>
            <dl className="metric-row">
              <dt>AI Analysis Queue</dt>
              <dd>
                {queues.disputeProcessing.waiting} waiting · {queues.disputeProcessing.active} active
              </dd>
            </dl>
            <dl className="metric-row">
              <dt>SEO Indexing Queue</dt>
              <dd>
                {queues.seoIndexing.waiting} waiting · {queues.seoIndexing.active} active
              </dd>
            </dl>
            {(queues.disputeProcessing.failed > 0 || queues.seoIndexing.failed > 0) && (
              <p className="text-sm text-amber-800 font-semibold">
                {queues.disputeProcessing.failed + queues.seoIndexing.failed} failed job(s) in queues
              </p>
            )}
          </>
        )}
        <p
          className={`text-sm pt-2 font-semibold ${
            degraded ? "text-amber-800" : "text-emerald-800"
          }`}
        >
          {degraded
            ? "Some services are degraded. Check the banner above for guidance."
            : "All core services are operational."}
        </p>
      </div>
    </div>
  );
}
