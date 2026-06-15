import type { DisputeStatus } from "@prisma/client";

const allowedTransitions: Record<DisputeStatus, DisputeStatus[]> = {
  PENDING: ["ACTIVE", "CANCELLED"],
  ACTIVE: ["RESOLVED", "CANCELLED"],
  RESOLVED: [],
  CANCELLED: [],
};

export function isValidStatusTransition(
  from: DisputeStatus,
  to: DisputeStatus
): boolean {
  if (from === to) return true;
  return allowedTransitions[from].includes(to);
}

export function statusTransitionError(
  from: DisputeStatus,
  to: DisputeStatus
): string {
  return `Cannot change dispute status from ${from} to ${to}`;
}
