"use client";

import { Icon } from "./icons";
import { useTheme } from "@/context/ThemeContext";
import type { ThemePreference } from "@/lib/theme-preference";

interface ThemeToggleProps {
  variant?: "header" | "settings";
}

const OPTIONS: { id: ThemePreference; label: string; icon: "sun" | "moon" | "monitor" }[] = [
  { id: "light", label: "Light", icon: "sun" },
  { id: "dark", label: "Dark", icon: "moon" },
  { id: "system", label: "System", icon: "monitor" },
];

export function ThemeToggle({ variant = "header" }: ThemeToggleProps) {
  const { preference, isDark, setPreference, toggleDark } = useTheme();

  if (variant === "header") {
    return (
      <button
        type="button"
        className="header-icon-btn"
        onClick={toggleDark}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        title={isDark ? "Light mode" : "Dark mode"}
      >
        <Icon name={isDark ? "sun" : "moon"} size="sm" />
      </button>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((option) => {
        const active = preference === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => setPreference(option.id)}
            className={
              active
                ? "filter-chip-active inline-flex items-center gap-2"
                : "filter-chip-inactive inline-flex items-center gap-2"
            }
            aria-pressed={active}
          >
            <Icon name={option.icon} size="sm" className={active ? "text-white" : undefined} />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
