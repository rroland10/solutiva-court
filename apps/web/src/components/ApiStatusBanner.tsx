"use client";

import { Icon } from "@/components/icons";
import { useApiHealth } from "@/hooks/useApiHealth";

export function ApiStatusBanner() {
  const { health, reachable, degraded } = useApiHealth();

  if (!degraded) return null;

  const message = !reachable
    ? "API server unreachable. Start it with npm run dev:api."
    : health?.database !== "connected"
      ? "Database disconnected. Run npm run docker:up && npm run db:push."
      : health?.redis === "error"
        ? "Redis disconnected. Background jobs may be unavailable — run npm run docker:up."
        : "API is running in degraded mode.";

  return (
    <div
      role="status"
      className="bg-amber-50 border-b border-amber-200 text-amber-950 text-sm font-semibold px-4 py-2.5 backdrop-blur-sm"
    >
      <div className="container mx-auto max-w-6xl flex items-center gap-2">
        <Icon name="warning" size="sm" className="shrink-0" />
        <span>{message}</span>
      </div>
    </div>
  );
}
