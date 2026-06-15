export type Page = "dashboard" | "disputes" | "jury" | "profile";

export const PAGES: Page[] = ["dashboard", "disputes", "jury", "profile"];

export function pathnameFor(page: Page, subPath?: string): string {
  if (page === "dashboard") return "/";
  if (page === "disputes" && subPath) {
    return `/disputes/${encodeURIComponent(subPath)}`;
  }
  return `/${page}`;
}

export function parseRoute(): { page: Page; disputeId?: string } {
  if (typeof window === "undefined") {
    return { page: "dashboard" };
  }

  const segments = window.location.pathname.split("/").filter(Boolean);

  if (segments[0] === "disputes") {
    return {
      page: "disputes",
      disputeId: segments[1] ? decodeURIComponent(segments[1]) : undefined,
    };
  }

  if (segments[0] && PAGES.includes(segments[0] as Page)) {
    return { page: segments[0] as Page };
  }

  return { page: "dashboard" };
}

export function setRoute(page: Page, subPath?: string) {
  if (typeof window === "undefined") return;

  const path = pathnameFor(page, subPath);

  if (window.location.pathname !== path) {
    window.history.pushState(null, "", path);
  }
}

export type DisputeStatusFilter = "ALL" | "ACTIVE" | "PENDING" | "RESOLVED" | "CANCELLED";

export type DisputeCategoryFilter =
  | "ALL"
  | "CONTRACT"
  | "PAYMENT"
  | "SERVICE"
  | "INTELLECTUAL"
  | "EMPLOYMENT";

export function readDisputeListParams(): {
  status?: DisputeStatusFilter;
  q?: string;
  category?: DisputeCategoryFilter;
  mine?: boolean;
} {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  const status = params.get("status");
  const category = params.get("category");
  const validStatuses: DisputeStatusFilter[] = [
    "ALL",
    "ACTIVE",
    "PENDING",
    "RESOLVED",
    "CANCELLED",
  ];
  const validCategories: DisputeCategoryFilter[] = [
    "ALL",
    "CONTRACT",
    "PAYMENT",
    "SERVICE",
    "INTELLECTUAL",
    "EMPLOYMENT",
  ];

  return {
    status:
      status && validStatuses.includes(status as DisputeStatusFilter)
        ? (status as DisputeStatusFilter)
        : undefined,
    q: params.get("q") ?? undefined,
    category:
      category && validCategories.includes(category as DisputeCategoryFilter)
        ? (category as DisputeCategoryFilter)
        : undefined,
    mine: params.get("mine") === "1",
  };
}

export function writeDisputeListParams(
  status: DisputeStatusFilter,
  q: string,
  category: DisputeCategoryFilter = "ALL",
  mine = false
) {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);

  if (status !== "ALL") url.searchParams.set("status", status);
  else url.searchParams.delete("status");

  const trimmed = q.trim();
  if (trimmed) url.searchParams.set("q", trimmed);
  else url.searchParams.delete("q");

  if (category !== "ALL") url.searchParams.set("category", category);
  else url.searchParams.delete("category");

  if (mine) url.searchParams.set("mine", "1");
  else url.searchParams.delete("mine");

  const next = `${url.pathname}${url.search}`;
  if (`${window.location.pathname}${window.location.search}` !== next) {
    window.history.replaceState(null, "", next);
  }
}

export function disputeShareUrl(disputeId: string): string {
  if (typeof window === "undefined") {
    return `/disputes/${encodeURIComponent(disputeId)}`;
  }
  return `${window.location.origin}/disputes/${encodeURIComponent(disputeId)}`;
}

export function pageForActivity(type: string): Page {
  if (type === "jury") return "jury";
  if (type === "dispute" || type === "resolved" || type === "vote") return "disputes";
  return "dashboard";
}

export function navigateToActivity(
  activity: { type: string; metadata?: { disputeId?: string } | null },
  onNavigate: (page: Page, subPath?: string) => void
) {
  if (activity.metadata?.disputeId) {
    onNavigate("disputes", activity.metadata.disputeId);
    return;
  }
  if (activity.type === "vote") {
    onNavigate("jury");
    return;
  }
  onNavigate(pageForActivity(activity.type));
}

export function navigateToDisputesList(
  params: { status?: DisputeStatusFilter; mine?: boolean },
  onNavigate: (page: Page, subPath?: string) => void
) {
  if (typeof window !== "undefined") {
    const url = new URL(`${window.location.origin}/disputes`);
    if (params.status && params.status !== "ALL") {
      url.searchParams.set("status", params.status);
    }
    if (params.mine) url.searchParams.set("mine", "1");
    window.history.pushState(null, "", `${url.pathname}${url.search}`);
  }
  onNavigate("disputes");
}

export function navigateToMyDisputes(onNavigate: (page: Page, subPath?: string) => void) {
  navigateToDisputesList({ mine: true }, onNavigate);
}

export function navigateToMyPendingDisputes(
  onNavigate: (page: Page, subPath?: string) => void
) {
  navigateToDisputesList({ status: "PENDING", mine: true }, onNavigate);
}

export function navigateToActiveDisputes(onNavigate: (page: Page, subPath?: string) => void) {
  navigateToDisputesList({ status: "ACTIVE" }, onNavigate);
}

export function navigateToFirstPendingCase(
  pendingCases: { id: string }[],
  onNavigate: (page: Page, subPath?: string) => void
) {
  if (pendingCases[0]?.id) {
    onNavigate("disputes", pendingCases[0].id);
    return;
  }
  onNavigate("disputes");
}
