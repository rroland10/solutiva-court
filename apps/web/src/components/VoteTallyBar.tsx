interface VoteTallyBarProps {
  plaintiffPct: number;
  defendantPct: number;
  plaintiffCount?: number;
  defendantCount?: number;
  showLabels?: boolean;
  variant?: "default" | "compact";
  tone?: "light" | "dark";
}

export function VoteTallyBar({
  plaintiffPct,
  defendantPct,
  plaintiffCount,
  defendantCount,
  showLabels = true,
  variant = "default",
  tone = "light",
}: VoteTallyBarProps) {
  const onDark = tone === "dark";
  const bar = (
    <>
      {variant === "default" && (
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">Jury lean</p>
      )}
      <div
        className={`flex rounded-full overflow-hidden ring-1 ${
          onDark ? "bg-white/15 ring-white/20" : "bg-gray-100 dark:bg-gray-800 ring-gray-200/80 dark:ring-gray-600/80"
        } ${variant === "default" ? "h-5 shadow-inner" : "h-3.5"}`}
      >
        <div
          className="bg-gradient-to-r from-primary to-primary-dark transition-all"
          style={{ width: `${plaintiffPct}%` }}
        />
        <div
          className="bg-gradient-to-r from-slate-400 to-slate-500 transition-all"
          style={{ width: `${defendantPct}%` }}
        />
      </div>
      {showLabels && (
        <div className={`flex justify-between text-xs font-semibold gap-4 ${variant === "default" ? "mt-2.5" : "mt-1.5"}`}>
          <span className={onDark ? "text-white/90" : variant === "default" ? "text-primary-dark dark:text-primary-light" : "text-gray-800 dark:text-gray-200"}>
            Plaintiff {plaintiffPct}%
            {plaintiffCount !== undefined ? ` (${plaintiffCount})` : ""}
          </span>
          <span className={onDark ? "text-white/75" : variant === "default" ? "text-slate-600 dark:text-gray-400" : "text-gray-800 dark:text-gray-200"}>
            Defendant {defendantPct}%
            {defendantCount !== undefined ? ` (${defendantCount})` : ""}
          </span>
        </div>
      )}
    </>
  );

  if (variant === "compact") {
    return <div>{bar}</div>;
  }

  return (
    <div className="panel-inset bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/80 dark:to-gray-900 py-3 px-4">
      {bar}
    </div>
  );
}
