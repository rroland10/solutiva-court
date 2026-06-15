import { formatOutcome } from "@/lib/dispute-utils";

interface OutcomeBadgeProps {
  outcome?: string | null;
  className?: string;
}

export function OutcomeBadge({ outcome, className = "" }: OutcomeBadgeProps) {
  const label = formatOutcome(outcome);
  if (!label) return null;

  return (
    <span
      className={`px-2 py-0.5 rounded-full text-sm font-semibold bg-blue-50 text-blue-800 ring-1 ring-blue-200 shrink-0 ${className}`}
    >
      {label}
    </span>
  );
}
