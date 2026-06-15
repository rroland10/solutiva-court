"use client";

import { theme } from "@/lib/theme";

export type IconName =
  | "dashboard"
  | "disputes"
  | "jury"
  | "profile"
  | "bell"
  | "gavel"
  | "users-plus"
  | "coins"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "close"
  | "plus"
  | "shield"
  | "sparkles"
  | "vote"
  | "clock"
  | "scale"
  | "lock"
  | "document"
  | "search"
  | "link"
  | "download"
  | "refresh"
  | "users"
  | "sun"
  | "moon"
  | "monitor";

interface IconProps {
  name: IconName;
  size?: keyof typeof theme.icon.sizes;
  className?: string;
  strokeWidth?: number;
}

const stroke = theme.icon.strokeWidth;

function IconPaths({ name }: { name: IconName }) {
  switch (name) {
    case "dashboard":
      return (
        <>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </>
      );
    case "disputes":
    case "scale":
      return (
        <>
          <path d="M12 3v18" />
          <path d="M5 7h14" />
          <path d="M5 7l-3 6h6L5 7z" />
          <path d="M19 7l-3 6h6l-3-6z" />
          <path d="M8 21h8" />
        </>
      );
    case "jury":
    case "users":
      return (
        <>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M15 20c0-2.5 1.5-4.5 4-4.5" />
        </>
      );
    case "users-plus":
      return (
        <>
          <circle cx="8" cy="8" r="3" />
          <path d="M2 20c0-3.3 2.7-6 6-6" />
          <path d="M16 11v6" />
          <path d="M13 14h6" />
        </>
      );
    case "profile":
      return (
        <>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
        </>
      );
    case "bell":
      return (
        <>
          <path d="M12 4a4 4 0 0 0-4 4v2.5c0 .8-.3 1.6-.9 2.2L5 15h14l-2.1-2.3c-.6-.6-.9-1.4-.9-2.2V8a4 4 0 0 0-4-4z" />
          <path d="M10 18a2 2 0 0 0 4 0" />
        </>
      );
    case "gavel":
      return (
        <>
          <path d="m14 5 5 5" />
          <path d="m8 11 6 6" />
          <path d="M4 20h4l8-8" />
          <rect x="13" y="3" width="6" height="3" rx="1" transform="rotate(45 16 4.5)" />
        </>
      );
    case "coins":
      return (
        <>
          <ellipse cx="9" cy="9" rx="5" ry="2.5" />
          <path d="M4 9v4c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V9" />
          <path d="M4 13v4c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-4" />
          <path d="M16 6.5c1.7.4 3 1.3 3 2.5s-1.3 2.1-3 2.5" />
        </>
      );
    case "success":
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12 3 3 5-6" />
        </>
      );
    case "error":
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M15 9l-6 6" />
          <path d="M9 9l6 6" />
        </>
      );
    case "warning":
      return (
        <>
          <path d="M12 4 3 20h18L12 4z" />
          <path d="M12 10v4" />
          <circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="none" />
        </>
      );
    case "info":
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5" />
          <circle cx="12" cy="8" r="0.5" fill="currentColor" stroke="none" />
        </>
      );
    case "close":
      return (
        <>
          <path d="M6 6l12 12" />
          <path d="M18 6 6 18" />
        </>
      );
    case "plus":
      return (
        <>
          <path d="M12 6v12" />
          <path d="M6 12h12" />
        </>
      );
    case "shield":
      return (
        <>
          <path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3z" />
          <path d="m9 12 2 2 4-4" />
        </>
      );
    case "sparkles":
      return (
        <>
          <path d="M12 3l1.2 4.2L17 8l-3.8 1.2L12 14l-1.2-4.8L7 8l3.8-0.8L12 3z" />
          <path d="M5 5l.6 2.1L7.5 8l-1.9.6L5 11l-.6-2.4L2.5 8l1.9-.5L5 5z" />
          <path d="M18 14l.6 2.1L20.5 17l-1.9.6L18 20l-.6-2.4L15.5 17l1.9-.5L18 14z" />
        </>
      );
    case "vote":
      return (
        <>
          <rect x="5" y="4" width="14" height="16" rx="2" />
          <path d="M9 9h6" />
          <path d="M9 13h4" />
          <path d="m9 17 2 2 4-4" />
        </>
      );
    case "clock":
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </>
      );
    case "lock":
      return (
        <>
          <rect x="6" y="11" width="12" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </>
      );
    case "search":
      return (
        <>
          <circle cx="11" cy="11" r="6" />
          <path d="M16 16l4 4" />
        </>
      );
    case "link":
      return (
        <>
          <path d="M10 14a4 4 0 0 1 0-5.7l1.3-1.3a4 4 0 0 1 5.7 5.7l-1 1" />
          <path d="M14 10a4 4 0 0 1 0 5.7l-1.3 1.3a4 4 0 0 1-5.7-5.7l1-1" />
        </>
      );
    case "download":
      return (
        <>
          <path d="M12 4v10" />
          <path d="M8 10l4 4 4-4" />
          <path d="M5 20h14" />
        </>
      );
    case "refresh":
      return (
        <>
          <path d="M4 4v5h5" />
          <path d="M20 20v-5h-5" />
          <path d="M20 9A8 8 0 0 0 7 6.3L4 9" />
          <path d="M4 15a8 8 0 0 0 13 2.7l3-2.7" />
        </>
      );
    case "document":
      return (
        <>
          <path d="M8 4h6l4 4v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
          <path d="M14 4v4h4" />
          <path d="M10 13h8" />
          <path d="M10 17h6" />
        </>
      );
    case "sun":
      return (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="M4.93 4.93l1.41 1.41" />
          <path d="M17.66 17.66l1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="M4.93 19.07l1.41-1.41" />
          <path d="M17.66 6.34l1.41-1.41" />
        </>
      );
    case "moon":
      return <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 7 7 0 1 0 20 14.5z" />;
    case "monitor":
      return (
        <>
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M8 20h8" />
          <path d="M12 16v4" />
        </>
      );
    default:
      return null;
  }
}

export function Icon({
  name,
  size = "md",
  className = "",
  strokeWidth = stroke,
}: IconProps) {
  const px = theme.icon.sizes[size];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden
    >
      <IconPaths name={name} />
    </svg>
  );
}
