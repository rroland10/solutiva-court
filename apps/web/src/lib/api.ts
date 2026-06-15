export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    let message = `API error: ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string | { formErrors?: string[] } };
      if (typeof body.error === "string") {
        message = body.error;
      }
    } catch {
      // use default message
    }
    throw new ApiError(res.status, message);
  }

  return res.json() as Promise<T>;
}

export async function toggleJuryMembership(userId: string): Promise<User> {
  return apiFetch<User>(`/api/users/${userId}/jury`, { method: "PATCH" });
}

export async function updateUserProfile(
  userId: string,
  data: { name: string; email: string }
): Promise<User> {
  return apiFetch<User>(`/api/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export type DisputeStatus = "ACTIVE" | "RESOLVED" | "CANCELLED" | "PENDING";

export async function updateDisputeStatus(
  disputeId: string,
  status: DisputeStatus,
  userId: string
): Promise<Dispute> {
  return apiFetch<Dispute>(`/api/disputes/${disputeId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, userId }),
  });
}

export interface CreateDisputeInput {
  title: string;
  description: string;
  category: string;
  collateral: number;
  defendantAddress: string;
  plaintiffId?: string;
  status?: "ACTIVE" | "PENDING";
  disputeKey?: string;
  escrowTxHash?: string;
}

export async function createDispute(data: CreateDisputeInput): Promise<Dispute> {
  return apiFetch<Dispute>("/api/disputes", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function submitVote(
  disputeId: string,
  userId: string,
  choice: "plaintiff" | "defendant"
): Promise<{ vote: { id: string; choice: string }; rewarded: boolean }> {
  return apiFetch(`/api/disputes/${disputeId}/vote`, {
    method: "POST",
    body: JSON.stringify({ userId, choice }),
  });
}

export interface HealthStatus {
  status: "ok" | "degraded";
  service: string;
  database: string;
  redis?: string;
  chain?: "connected" | "disabled" | "error" | "misconfigured";
  chainEnabled?: boolean;
}

export type DisputeCounts = Record<"ALL" | "ACTIVE" | "PENDING" | "RESOLVED" | "CANCELLED", number> & {
  byCategory?: Partial<Record<"CONTRACT" | "PAYMENT" | "SERVICE" | "INTELLECTUAL" | "EMPLOYMENT", number>>;
};

export async function fetchDisputeCounts(plaintiffId?: string): Promise<DisputeCounts> {
  const query = plaintiffId ? `?plaintiffId=${encodeURIComponent(plaintiffId)}` : "";
  return apiFetch<DisputeCounts>(`/api/disputes/counts${query}`);
}

export function exportDisputesCsv(disputes: Dispute[]): void {
  const headers = ["Case Number", "Title", "Status", "Outcome", "Category", "Collateral", "Votes", "Filed", "Plaintiff"];
  const rows = disputes.map((d) => [
    d.caseNumber,
    d.title,
    d.status,
    d.resolutionOutcome ?? "",
    d.category,
    d.collateral,
    d.voteCount ?? 0,
    d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "",
    d.plaintiff?.name ?? "",
  ]);

  const escape = (value: string | number) =>
    `"${String(value).replace(/"/g, '""')}"`;

  const csv = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `solutiva-disputes-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export interface PlatformStats {
  activeDisputes: number;
  juryMembers: number;
  resolutionRate: number;
  totalStaked: number;
}

export interface UserStats {
  casesParticipated: number;
  votesCast: number;
  disputesFiled: number;
}

export interface User {
  id: string;
  walletAddress: string;
  name: string | null;
  email: string | null;
  trustScore: number;
  avfBalance: number;
  isJuryMember: boolean;
}

export interface Dispute {
  id: string;
  caseNumber: number;
  title: string;
  description: string;
  category: string;
  status: string;
  collateral: number;
  jurySize: number;
  deadline: string | null;
  aiSummary: string | null;
  defendantAddress: string;
  plaintiffId?: string;
  createdAt?: string;
  voteCount?: number;
  voteTally?: {
    plaintiff: number;
    defendant: number;
    plaintiffPct: number;
    defendantPct: number;
  } | null;
  resolutionOutcome?: string | null;
  disputeKey?: string | null;
  escrowTxHash?: string | null;
  outcomeHash?: string | null;
  outcomeTxHash?: string | null;
  chainId?: number | null;
  userVote?: string | null;
  plaintiff?: {
    name: string | null;
    walletAddress: string;
  };
}

export interface DisputeDetail extends Dispute {
  userVote?: string | null;
  votes?: {
    id: string;
    choice: string;
    userId: string;
    user: { name: string | null; walletAddress: string };
  }[];
}

export function formatAvf(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  return value.toLocaleString();
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatWallet(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatCountdown(deadline: string | Date | null): string {
  if (!deadline) return "--:--:--";
  const diff = Math.max(0, new Date(deadline).getTime() - Date.now());
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, "0")).join(":");
}

export interface VotingDispute {
  id: string;
  caseNumber: number;
  title: string;
  description: string;
  deadline: string | null;
  tally: { plaintiff: number; defendant: number };
  userVote?: string | null;
}

export function timeAgo(date: string | Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function formatCaseDate(date: string | Date): string {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  createdAt: string;
  metadata?: {
    disputeId?: string;
    caseNumber?: number;
    resolutionOutcome?: string | null;
    choice?: string;
  } | null;
}

export interface UserHistory {
  disputes: {
    id: string;
    caseNumber: number;
    title: string;
    status: string;
    resolutionOutcome?: string | null;
    createdAt: string;
  }[];
  votes: {
    id: string;
    choice: string;
    createdAt: string;
    caseNumber: number;
    title: string;
    disputeId: string;
    disputeStatus: string;
    resolutionOutcome?: string | null;
  }[];
}
