import { theme } from "@/lib/theme";
import { OutcomeBadge } from "./OutcomeBadge";

interface StatusWithOutcomeProps {
  status: string;
  resolutionOutcome?: string | null;
  size?: "sm" | "md";
  className?: string;
}

export function StatusWithOutcome({
  status,
  resolutionOutcome,
  size = "sm",
  className = "",
}: StatusWithOutcomeProps) {
  const padding = size === "md" ? "px-3 py-1" : "px-2 py-0.5";
  const label = status.charAt(0) + status.slice(1).toLowerCase();

  return (
    <div className={`flex items-center gap-1.5 shrink-0 ${className}`}>
      {status === "RESOLVED" && <OutcomeBadge outcome={resolutionOutcome} />}
      <span
        className={`${padding} rounded-full text-sm ${
          theme.status[status as keyof typeof theme.status] ?? theme.status.CANCELLED
        }`}
      >
        {label}
      </span>
    </div>
  );
}
