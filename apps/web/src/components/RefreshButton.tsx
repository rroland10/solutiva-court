import { Icon } from "./icons";

interface RefreshButtonProps {
  onClick: () => void;
  loading?: boolean;
  label?: string;
  variant?: "glass" | "outline" | "toolbar" | "header-light";
}

export function RefreshButton({
  onClick,
  loading,
  label = "Refresh",
  variant = "glass",
}: RefreshButtonProps) {
  const className =
    variant === "outline"
      ? "btn-outline btn-sm inline-flex items-center gap-2 shrink-0"
      : variant === "toolbar"
        ? "btn-toolbar btn-sm inline-flex items-center gap-2 shrink-0"
        : variant === "header-light"
          ? "btn-header-light inline-flex items-center gap-2 shrink-0"
          : "btn-glass btn-sm inline-flex items-center gap-2 shrink-0";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`${className} disabled:opacity-60`}
      aria-label={label}
    >
      <Icon name="refresh" size="sm" className={loading ? "animate-spin" : ""} />
      {label}
    </button>
  );
}
