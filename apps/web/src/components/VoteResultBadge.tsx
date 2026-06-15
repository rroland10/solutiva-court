import { voteResult, voteResultLabel, type VoteResult } from "@/lib/dispute-utils";

interface VoteResultBadgeProps {
  choice: string;
  disputeStatus: string;
  resolutionOutcome?: string | null;
  className?: string;
}

const resultStyles: Record<Exclude<VoteResult, "pending">, string> = {
  won: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  lost: "bg-gray-50 text-gray-800 ring-gray-200",
  tie: "bg-amber-50 text-amber-800 ring-amber-200",
};

export function VoteResultBadge({
  choice,
  disputeStatus,
  resolutionOutcome,
  className = "",
}: VoteResultBadgeProps) {
  const result = voteResult(choice, disputeStatus, resolutionOutcome);
  if (result === "pending") return null;

  return (
    <span
      className={`px-2 py-0.5 rounded-full text-sm font-semibold ring-1 shrink-0 ${resultStyles[result]} ${className}`}
    >
      {voteResultLabel(result)}
    </span>
  );
}
