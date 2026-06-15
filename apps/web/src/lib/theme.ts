export const theme = {
  colors: {
    primary: "#5B52E8",
    primaryDark: "#4338CA",
    primaryLight: "#8B85F0",
    gold: "#C9A962",
    secondary: "#764ba2",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    info: "#3b82f6",
  },
  icon: {
    strokeWidth: 1.75,
    sizes: {
      xs: 14,
      sm: 16,
      md: 20,
      lg: 24,
      xl: 32,
    },
  },
  badge: {
    primary: "bg-primary/10 text-primary-dark font-semibold",
    success: "bg-emerald-50 text-emerald-800 font-semibold",
    warning: "bg-amber-50 text-amber-800 font-semibold",
    danger: "bg-red-50 text-red-800 font-semibold",
    info: "bg-blue-50 text-blue-800 font-semibold",
    neutral: "bg-gray-100 text-gray-800 font-semibold",
  },
  status: {
    ACTIVE: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 font-semibold",
    PENDING: "bg-amber-50 text-amber-800 ring-1 ring-amber-200 font-semibold",
    RESOLVED: "bg-blue-50 text-blue-800 ring-1 ring-blue-200 font-semibold",
    CANCELLED: "bg-gray-100 text-gray-800 ring-1 ring-gray-200 font-semibold",
  },
  statusCardAccent: {
    ACTIVE: "card-accent-active",
    PENDING: "card-accent-pending",
    RESOLVED: "card-accent-resolved",
    CANCELLED: "card-accent-cancelled",
  },
  category: {
    CONTRACT: "Contract Breach",
    PAYMENT: "Payment Dispute",
    SERVICE: "Service Quality",
    INTELLECTUAL: "IP Violation",
    EMPLOYMENT: "Employment Issue",
  },
  activity: {
    resolved: { icon: "gavel" as const, variant: "primary" as const },
    jury: { icon: "users-plus" as const, variant: "success" as const },
    "jury-join": { icon: "users-plus" as const, variant: "success" as const },
    dispute: { icon: "disputes" as const, variant: "info" as const },
    vote: { icon: "vote" as const, variant: "primary" as const },
    reward: { icon: "coins" as const, variant: "warning" as const },
  },
} as const;

export type IconVariant = keyof typeof theme.badge;
export type StatusKey = keyof typeof theme.status;
