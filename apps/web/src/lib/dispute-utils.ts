import type { DisputeDetail } from "./api";
import { theme, type StatusKey } from "./theme";

export function statusAccentClass(status: string): string {
  return theme.statusCardAccent[status as StatusKey] ?? "";
}

export function voteTally(detail: DisputeDetail) {
  const counts = { plaintiff: 0, defendant: 0 };
  detail.votes?.forEach((vote) => {
    if (vote.choice === "plaintiff") counts.plaintiff++;
    else if (vote.choice === "defendant") counts.defendant++;
  });
  const total = counts.plaintiff + counts.defendant;
  return {
    ...counts,
    plaintiffPct: total > 0 ? Math.round((counts.plaintiff / total) * 100) : 50,
    defendantPct: total > 0 ? Math.round((counts.defendant / total) * 100) : 50,
    total,
  };
}

export function predictOutcome(tally: { plaintiff: number; defendant: number }) {
  if (tally.plaintiff > tally.defendant) return "plaintiff";
  if (tally.defendant > tally.plaintiff) return "defendant";
  return "tie";
}

export function formatOutcome(outcome?: string | null): string {
  if (outcome === "plaintiff") return "Plaintiff wins";
  if (outcome === "defendant") return "Defendant wins";
  if (outcome === "tie") return "Split jury (tie)";
  return "";
}

export type VoteResult = "won" | "lost" | "tie" | "pending";

export function voteResult(
  choice: string,
  status: string,
  resolutionOutcome?: string | null
): VoteResult {
  if (status !== "RESOLVED") return "pending";
  if (resolutionOutcome === "tie") return "tie";
  if (choice === resolutionOutcome) return "won";
  return "lost";
}

export function voteResultLabel(result: VoteResult): string {
  if (result === "won") return "Majority (+30 AVF)";
  if (result === "lost") return "Minority (+25 AVF)";
  if (result === "tie") return "Split jury (+25 AVF)";
  return "";
}
