import { theme, type IconVariant } from "@/lib/theme";
import { Icon, type IconName } from "./Icon";

interface IconBadgeProps {
  name: IconName;
  variant?: IconVariant;
  size?: "sm" | "md";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
};

const iconSizes = {
  sm: "sm" as const,
  md: "md" as const,
};

export function IconBadge({
  name,
  variant = "primary",
  size = "md",
  className = "",
}: IconBadgeProps) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl ring-1 ring-black/5 shadow-sm ${sizeClasses[size]} ${theme.badge[variant]} ${className}`}
    >
      <Icon name={name} size={iconSizes[size]} />
    </span>
  );
}
