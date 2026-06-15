"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  apiFetch,
  exportDisputesCsv,
  fetchDisputeCounts,
  formatCountdown,
  formatCaseDate,
  formatWallet,
  getApiErrorMessage,
  toggleJuryMembership,
  updateDisputeStatus,
  type Dispute,
  type DisputeCounts,
  type DisputeDetail,
} from "@/lib/api";
import { disputeShareUrl, readDisputeListParams, writeDisputeListParams, type DisputeCategoryFilter } from "@/lib/routing";
import { voteTally, formatOutcome, predictOutcome, statusAccentClass } from "@/lib/dispute-utils";
import { useUser } from "@/context/UserContext";
import { useUserStats } from "@/context/UserStatsContext";
import { usePlatform } from "@/context/PlatformContext";
import { useActiveVoting } from "@/context/ActiveVotingContext";
import { usePendingCases } from "@/context/PendingCasesContext";
import { theme } from "@/lib/theme";
import { Modal } from "./Modal";
import { PageHeader } from "./PageHeader";
import { Icon } from "./icons";
import { CardSkeleton, LoadingSkeleton } from "./LoadingSkeleton";
import { EmptyState } from "./EmptyState";
import { RefreshButton } from "./RefreshButton";
import { CreateDisputeModal } from "./CreateDisputeModal";
import { ConfirmModal } from "./ConfirmModal";
import { StatusWithOutcome } from "./StatusWithOutcome";
import { VoteTallyBar } from "./VoteTallyBar";
import { VoteResultBadge } from "./VoteResultBadge";
import { JuryVoteBanner } from "./JuryVoteBanner";
import { PendingCasesBanner } from "./PendingCasesBanner";
import { InlineJuryVote } from "./InlineJuryVote";
import { useToast } from "./Toast";
import { OnChainRecord } from "./OnChainRecord";
import { onAppShortcut } from "@/lib/shortcuts";

const PREFS_KEY = "solutiva-disputes-prefs";

function loadPrefs(): {
  statusFilter: StatusFilter;
  sortBy: SortOption;
  search: string;
  categoryFilter: DisputeCategoryFilter;
  myCasesOnly: boolean;
} {
  if (typeof window === "undefined") {
    return {
      statusFilter: "ALL",
      sortBy: "newest",
      search: "",
      categoryFilter: "ALL",
      myCasesOnly: false,
    };
  }

  const urlParams = readDisputeListParams();

  try {
    const raw = localStorage.getItem(PREFS_KEY);
    const stored = raw
      ? (JSON.parse(raw) as {
          statusFilter: StatusFilter;
          sortBy: SortOption;
          categoryFilter?: DisputeCategoryFilter;
          myCasesOnly?: boolean;
        })
      : { statusFilter: "ALL" as StatusFilter, sortBy: "newest" as SortOption };

    return {
      statusFilter: urlParams.status ?? stored.statusFilter,
      sortBy: stored.sortBy,
      search: urlParams.q ?? "",
      categoryFilter: urlParams.category ?? stored.categoryFilter ?? "ALL",
      myCasesOnly: urlParams.mine ?? stored.myCasesOnly ?? false,
    };
  } catch {
    return {
      statusFilter: urlParams.status ?? "ALL",
      sortBy: "newest",
      search: urlParams.q ?? "",
      categoryFilter: urlParams.category ?? "ALL",
      myCasesOnly: urlParams.mine ?? false,
    };
  }
}

type Page = "dashboard" | "disputes" | "jury" | "profile";
type StatusFilter = "ALL" | "ACTIVE" | "PENDING" | "RESOLVED" | "CANCELLED";
type SortOption = "newest" | "oldest" | "collateral-high" | "collateral-low";

const filters: { id: StatusFilter; label: string }[] = [
  { id: "ALL", label: "All Cases" },
  { id: "ACTIVE", label: "Active" },
  { id: "PENDING", label: "Pending" },
  { id: "RESOLVED", label: "Resolved" },
  { id: "CANCELLED", label: "Cancelled" },
];

const sortOptions: { id: SortOption; label: string }[] = [
  { id: "newest", label: "Newest first" },
  { id: "oldest", label: "Oldest first" },
  { id: "collateral-high", label: "Highest collateral" },
  { id: "collateral-low", label: "Lowest collateral" },
];

const categoryOptions: { id: DisputeCategoryFilter; label: string }[] = [
  { id: "ALL", label: "All categories" },
  { id: "CONTRACT", label: "Contract Breach" },
  { id: "PAYMENT", label: "Payment Dispute" },
  { id: "SERVICE", label: "Service Quality" },
  { id: "INTELLECTUAL", label: "IP Violation" },
  { id: "EMPLOYMENT", label: "Employment Issue" },
];

interface DisputesProps {
  onNavigate: (page: Page, subPath?: string) => void;
  initialDisputeId?: string;
}

export function Disputes({ onNavigate, initialDisputeId }: DisputesProps) {
  const initialPrefs = loadPrefs();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DisputeDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailLoadError, setDetailLoadError] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialPrefs.statusFilter);
  const [sortBy, setSortBy] = useState<SortOption>(initialPrefs.sortBy);
  const [search, setSearch] = useState(initialPrefs.search);
  const [searchDebounced, setSearchDebounced] = useState(initialPrefs.search.trim());
  const [categoryFilter, setCategoryFilter] = useState<DisputeCategoryFilter>(
    initialPrefs.categoryFilter
  );
  const [myCasesOnly, setMyCasesOnly] = useState(initialPrefs.myCasesOnly);
  const [counts, setCounts] = useState<DisputeCounts | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { refresh: refreshPendingCases } = usePendingCases();
  const [activating, setActivating] = useState(false);
  const [activateTarget, setActivateTarget] = useState<{ id: string; caseNumber: number } | null>(
    null
  );
  const [cancelTarget, setCancelTarget] = useState<{ id: string; caseNumber: number } | null>(
    null
  );
  const [resolveTarget, setResolveTarget] = useState<{
    id: string;
    caseNumber: number;
    voteTally?: Dispute["voteTally"];
  } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { user, setUser, refreshUser } = useUser();
  const { stats: userStats, refresh: refreshUserStats } = useUserStats();
  const { refreshPlatform } = usePlatform();
  const { refresh: refreshActiveCase } = useActiveVoting();
  const { showToast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const clearFilters = useCallback(() => {
    setStatusFilter("ALL");
    setCategoryFilter("ALL");
    setMyCasesOnly(false);
    setSearch("");
    setSearchDebounced("");
  }, []);

  const applyActiveFilter = useCallback(() => {
    setStatusFilter("ACTIVE");
  }, []);

  const applyMyPendingFilter = useCallback(() => {
    setStatusFilter("PENDING");
    setMyCasesOnly(true);
  }, []);

  useEffect(() => {
    return onAppShortcut("create-dispute", () => setShowCreateModal(true));
  }, []);

  useEffect(() => {
    return onAppShortcut("focus-search", () => searchInputRef.current?.focus());
  }, []);

  useEffect(() => {
    return onAppShortcut("toggle-my-cases", () => setMyCasesOnly((value) => !value));
  }, []);

  useEffect(() => {
    return onAppShortcut("clear-filters", clearFilters);
  }, [clearFilters]);

  useEffect(() => {
    return onAppShortcut("filter-active", applyActiveFilter);
  }, [applyActiveFilter]);

  useEffect(() => {
    return onAppShortcut("filter-my-pending", applyMyPendingFilter);
  }, [applyMyPendingFilter]);

  useEffect(() => {
    function syncFiltersFromUrl() {
      const params = readDisputeListParams();
      setStatusFilter(params.status ?? "ALL");
      setCategoryFilter(params.category ?? "ALL");
      setMyCasesOnly(Boolean(params.mine));
      const q = params.q ?? "";
      setSearch(q);
      setSearchDebounced(q.trim());
    }

    window.addEventListener("popstate", syncFiltersFromUrl);
    return () => window.removeEventListener("popstate", syncFiltersFromUrl);
  }, []);

  const loadDisputes = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (searchDebounced) params.set("q", searchDebounced);
      if (categoryFilter !== "ALL") params.set("category", categoryFilter);
      if (myCasesOnly && user?.id) params.set("plaintiffId", user.id);
      if (user?.id) params.set("userId", user.id);
      const query = params.toString() ? `?${params.toString()}` : "";
      const [data, countData] = await Promise.all([
        apiFetch<Dispute[]>(`/api/disputes${query}`),
        fetchDisputeCounts(myCasesOnly && user?.id ? user.id : undefined),
      ]);
      setDisputes(data);
      setCounts(countData);
    } catch {
      showToast("Could not load disputes", "warning");
    } finally {
      setLoading(false);
    }
  }, [searchDebounced, showToast, statusFilter, categoryFilter, myCasesOnly, user?.id]);

  useEffect(() => {
    localStorage.setItem(
      PREFS_KEY,
      JSON.stringify({ statusFilter, sortBy, categoryFilter, myCasesOnly })
    );
    writeDisputeListParams(statusFilter, searchDebounced, categoryFilter, myCasesOnly);
  }, [statusFilter, sortBy, searchDebounced, categoryFilter, myCasesOnly]);

  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    loadDisputes();
  }, [loadDisputes]);

  useEffect(() => {
    if (!initialDisputeId) return;

    let cancelled = false;
    setSelectedId(initialDisputeId);
    setDetailLoading(true);
    setDetailLoadError(false);

    const query = user?.id ? `?userId=${encodeURIComponent(user.id)}` : "";
    apiFetch<DisputeDetail>(`/api/disputes/${initialDisputeId}${query}`)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch(() => {
        if (!cancelled) {
          setDetail(null);
          setDetailLoadError(true);
          showToast("Could not load dispute details", "error");
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [initialDisputeId, showToast, user?.id, onNavigate]);

  useEffect(() => {
    if (!detail) return;
    document.title = `Case #${detail.caseNumber} — ${detail.title} | Solutiva Court`;
  }, [detail]);

  async function fetchDetailById(id: string): Promise<DisputeDetail | null> {
    const query = user?.id ? `?userId=${encodeURIComponent(user.id)}` : "";
    try {
      return await apiFetch<DisputeDetail>(`/api/disputes/${id}${query}`);
    } catch {
      return null;
    }
  }

  async function openDetail(id: string) {
    setSelectedId(id);
    setSuggestion(null);
    setDetailLoadError(false);
    onNavigate("disputes", id);
    setDetailLoading(true);
    try {
      const data = await fetchDetailById(id);
      if (data) {
        setDetail(data);
      } else {
        setDetail(null);
        setDetailLoadError(true);
        showToast("Could not load dispute details", "error");
      }
    } catch {
      setDetail(null);
      setDetailLoadError(true);
      showToast("Could not load dispute details", "error");
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetail() {
    setSelectedId(null);
    setDetail(null);
    setSuggestion(null);
    setDetailLoadError(false);
    onNavigate("disputes");
  }

  async function handleJoinJury() {
    if (!user) return;

    if (user.isJuryMember) {
      onNavigate("jury");
      return;
    }

    try {
      const updated = await toggleJuryMembership(user.id);
      setUser(updated);
      showToast("Joined jury pool! Head to Jury Pool to vote.", "success");
      onNavigate("jury");
    } catch {
      showToast("Could not join jury pool", "error");
    }
  }

  async function requestAnalysis() {
    if (!detail) return;
    setAnalyzing(true);
    try {
      const result = await apiFetch<{ summary: string; dispute: DisputeDetail }>(
        `/api/disputes/${detail.id}/analyze`,
        { method: "POST" }
      );
      setDetail({ ...detail, ...result.dispute, aiSummary: result.summary });
      showToast("AI analysis complete", "success");
      await loadDisputes();
    } catch {
      showToast("AI analysis failed", "error");
    } finally {
      setAnalyzing(false);
    }
  }

  async function resolveDispute() {
    if (!resolveTarget || !user?.id) return;
    setResolving(true);
    try {
      const updated = await updateDisputeStatus(resolveTarget.id, "RESOLVED", user.id);
      if (detail?.id === resolveTarget.id) {
        const refetched = await fetchDetailById(resolveTarget.id);
        setDetail(refetched ?? { ...detail, ...updated });
      }
      const outcomeMsg = updated.resolutionOutcome
        ? formatOutcome(updated.resolutionOutcome)
        : "resolved";
      showToast(`Case ${outcomeMsg}. Juror rewards distributed (+25 AVF each).`, "success");
      setResolveTarget(null);
      await refreshUser().catch(() => {});
      await refreshUserStats();
      await refreshPlatform();
      await refreshActiveCase();
      await refreshPendingCases();
      await loadDisputes();
    } catch (err) {
      showToast(getApiErrorMessage(err, "Could not resolve case"), "error");
    } finally {
      setResolving(false);
    }
  }

  async function cancelDispute() {
    if (!cancelTarget || !user?.id) return;
    setCancelling(true);
    try {
      const updated = await updateDisputeStatus(cancelTarget.id, "CANCELLED", user.id);
      if (detail?.id === cancelTarget.id) {
        const refetched = await fetchDetailById(cancelTarget.id);
        setDetail(refetched ?? { ...detail, ...updated });
      }
      showToast("Case cancelled", "info");
      setCancelTarget(null);
      await refreshUserStats();
      await refreshPlatform();
      await refreshActiveCase();
      await refreshPendingCases();
      await loadDisputes();
    } catch (err) {
      showToast(getApiErrorMessage(err, "Could not cancel case"), "error");
    } finally {
      setCancelling(false);
    }
  }

  async function requestSuggestion() {
    if (!detail) return;
    setSuggesting(true);
    try {
      const result = await apiFetch<{ recommendation: string }>(
        `/api/disputes/${detail.id}/suggest-resolution`,
        { method: "POST" }
      );
      setSuggestion(result.recommendation);
      showToast("AI resolution suggestion ready", "success");
    } catch {
      showToast("Could not generate suggestion", "error");
    } finally {
      setSuggesting(false);
    }
  }

  async function activateDispute() {
    if (!activateTarget || !user?.id) return;
    setActivating(true);
    try {
      const updated = await updateDisputeStatus(activateTarget.id, "ACTIVE", user.id);
      if (detail?.id === activateTarget.id) {
        const refetched = await fetchDetailById(activateTarget.id);
        setDetail(refetched ?? { ...detail, ...updated });
      }
      showToast("Case activated — open for jury voting", "success");
      setActivateTarget(null);
      await refreshUserStats();
      await refreshPlatform();
      await refreshActiveCase();
      await refreshPendingCases();
      await loadDisputes();
    } catch (err) {
      showToast(getApiErrorMessage(err, "Could not activate case"), "error");
    } finally {
      setActivating(false);
    }
  }

  async function copyShareLink() {
    if (!detail) return;
    try {
      await navigator.clipboard.writeText(disputeShareUrl(detail.id));
      showToast("Case link copied to clipboard", "success");
    } catch {
      showToast("Could not copy link", "error");
    }
  }

  async function copyDisputeLink(id: string) {
    try {
      await navigator.clipboard.writeText(disputeShareUrl(id));
      showToast("Case link copied to clipboard", "success");
    } catch {
      showToast("Could not copy link", "error");
    }
  }

  async function handleDetailVoted(updated: DisputeDetail) {
    setDetail(updated);
    await loadDisputes();
    await refreshPlatform();
    await refreshActiveCase();
    await refreshPendingCases();
    await refreshUserStats();
    await refreshUser().catch(() => {});
  }

  const hasActiveFilters =
    statusFilter !== "ALL" ||
    Boolean(searchDebounced) ||
    categoryFilter !== "ALL" ||
    myCasesOnly;

  const pageTitle = myCasesOnly
    ? "My Disputes"
    : statusFilter === "ALL"
      ? "All Disputes"
      : `${statusFilter.charAt(0) + statusFilter.slice(1).toLowerCase()} Disputes`;

  const filteredDisputes = [...disputes].sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return (a.createdAt ?? "").localeCompare(b.createdAt ?? "") || a.caseNumber - b.caseNumber;
        case "collateral-high":
          return b.collateral - a.collateral;
        case "collateral-low":
          return a.collateral - b.collateral;
        default:
          return (b.createdAt ?? "").localeCompare(a.createdAt ?? "") || b.caseNumber - a.caseNumber;
      }
    });

  async function handleRefresh() {
    setRefreshing(true);
    setLoading(true);
    await loadDisputes();
    await Promise.all([
      refreshPendingCases(),
      refreshPlatform(),
      refreshActiveCase(),
      refreshUserStats(),
      refreshUser().catch(() => {}),
    ]);
    setRefreshing(false);
  }

  return (
    <>
      <PageHeader
        title={pageTitle}
        description={
          hasActiveFilters
            ? `Showing ${filteredDisputes.length} result${filteredDisputes.length === 1 ? "" : "s"}${searchDebounced ? ` for "${searchDebounced}"` : ""}`
            : "Browse and participate in ongoing dispute resolution cases"
        }
        icon="disputes"
        action={
          <div className="flex flex-wrap gap-2 justify-end">
            <button
              type="button"
              className="btn-primary btn-sm inline-flex items-center gap-2"
              onClick={() => setShowCreateModal(true)}
            >
              <Icon name="plus" size="sm" className="text-white" />
              Create
            </button>
            <RefreshButton onClick={handleRefresh} loading={refreshing} variant="header-light" />
          </div>
        }
      />

      <JuryVoteBanner onNavigate={onNavigate} hideForDisputeId={selectedId ?? undefined} />
      <PendingCasesBanner
        onNavigate={onNavigate}
        hideForDisputeId={selectedId ?? undefined}
      />

      <div className="page-body">
      {hasActiveFilters && (
        <div className="toolbar-panel mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="toolbar-label">Active filters</span>
          {statusFilter !== "ALL" && (
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className="filter-tag bg-primary/10 text-primary-dark ring-primary/20 hover:ring-primary/40"
              title="Remove status filter"
            >
              {filters.find((f) => f.id === statusFilter)?.label ?? statusFilter}
              <Icon name="close" size="xs" />
            </button>
          )}
          {categoryFilter !== "ALL" && (
            <button
              type="button"
              onClick={() => setCategoryFilter("ALL")}
              className="filter-tag bg-primary/10 text-primary-dark ring-primary/20 hover:ring-primary/40"
              title="Remove category filter"
            >
              {categoryOptions.find((c) => c.id === categoryFilter)?.label ?? categoryFilter}
              <Icon name="close" size="xs" />
            </button>
          )}
          {searchDebounced && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSearchDebounced("");
              }}
              className="filter-tag"
              title="Clear search"
            >
              Search: {searchDebounced}
              <Icon name="close" size="xs" />
            </button>
          )}
          {myCasesOnly && (
            <button
              type="button"
              onClick={() => setMyCasesOnly(false)}
              className="filter-tag bg-primary/10 text-primary-dark ring-primary/20 hover:ring-primary/40"
              title="Show all cases"
            >
              My cases
              <Icon name="close" size="xs" />
            </button>
          )}
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm text-white/95 font-semibold hover:text-white transition-colors underline"
          >
            Clear all
          </button>
        </div>
        </div>
      )}

      <div className="toolbar-panel mb-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setStatusFilter(filter.id)}
              className={
                statusFilter === filter.id ? "filter-chip-active" : "filter-chip-inactive"
              }
            >
              {filter.label}
              {counts && counts[filter.id] > 0 && (
                <span className="ml-1.5 opacity-80">({counts[filter.id]})</span>
              )}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setMyCasesOnly((value) => !value)}
            className={myCasesOnly ? "filter-chip-active" : "filter-chip-inactive"}
            title="Show only cases you filed (m)"
          >
            My Cases
            {(myCasesOnly && counts?.ALL) || userStats?.disputesFiled ? (
              <span className="ml-1 opacity-80">
                ({myCasesOnly && counts ? counts.ALL : userStats?.disputesFiled})
              </span>
            ) : null}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto] gap-3 items-center">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Icon
              name="search"
              size="sm"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10"
            />
            <input
              ref={searchInputRef}
              type="search"
              placeholder="Search cases... (press /)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-toolbar w-full pl-10"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as DisputeCategoryFilter)}
            className="input-toolbar min-w-[10rem]"
            aria-label="Filter by category"
          >
            {categoryOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
                {option.id !== "ALL" && counts?.byCategory?.[option.id as keyof NonNullable<DisputeCounts["byCategory"]>]
                  ? ` (${counts.byCategory[option.id as keyof NonNullable<DisputeCounts["byCategory"]>]})`
                  : ""}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="input-toolbar min-w-[9rem]"
            aria-label="Sort disputes"
          >
            {sortOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn-toolbar btn-sm inline-flex items-center gap-2 disabled:opacity-50"
            onClick={() => {
              exportDisputesCsv(filteredDisputes);
              showToast("Exported disputes to CSV", "success");
            }}
            disabled={filteredDisputes.length === 0}
          >
            <Icon name="download" size="sm" />
            Export
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              className="btn-toolbar btn-sm inline-flex items-center gap-2"
              onClick={clearFilters}
            >
              <Icon name="close" size="sm" />
              Clear
            </button>
          )}
        </div>
      </div>

      {!loading && filteredDisputes.length > 0 && (
        <p className="results-line">
          Showing {filteredDisputes.length} of {counts?.ALL ?? disputes.length} case
          {(counts?.ALL ?? disputes.length) === 1 ? "" : "s"}
          {hasActiveFilters ? " (filtered)" : ""}
        </p>
      )}

      {loading && (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      {!loading && disputes.length === 0 && statusFilter === "ALL" && !searchDebounced && categoryFilter === "ALL" && (
        <EmptyState
          featured
          icon="disputes"
          title="No disputes yet"
          description="File your first case to start the decentralized resolution process. AI analysis and jury voting begin once a case is active."
          action={{ label: "Create Dispute", onClick: () => setShowCreateModal(true) }}
        />
      )}

      {!loading && filteredDisputes.length === 0 && (statusFilter !== "ALL" || searchDebounced || categoryFilter !== "ALL" || myCasesOnly) && (
        <EmptyState
          icon="search"
          title="No matching cases"
          description={
            myCasesOnly && !searchDebounced && statusFilter === "ALL" && categoryFilter === "ALL"
              ? "You have not filed any cases yet."
              : searchDebounced
                ? `No cases match "${searchDebounced}".`
                : categoryFilter !== "ALL"
                  ? `No ${theme.category[categoryFilter as keyof typeof theme.category]?.toLowerCase() ?? categoryFilter.toLowerCase()} cases found.`
                  : `No ${statusFilter.toLowerCase()} disputes found.`
          }
          action={{ label: "Clear filters", onClick: clearFilters }}
        />
      )}

      <div className="space-y-4">
        {filteredDisputes.map((dispute) => (
          <div
            key={dispute.id}
            className={`card ${statusAccentClass(dispute.status)} ${
              selectedId === dispute.id ? "card-selected" : ""
            }`}
          >
            <div className="card-body">
            <button
              type="button"
              onClick={() => openDetail(dispute.id)}
              className="flex items-start justify-between mb-3 gap-4 w-full text-left rounded-xl -mx-2 px-2 py-2 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary shrink-0 ring-1 ring-primary/15 shadow-sm">
                  <Icon name="gavel" size="md" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display font-semibold text-lg text-gray-900">{dispute.title}</h3>
                    {user?.id === dispute.plaintiffId && (
                      <span className="badge-pill bg-primary/10 text-primary-dark">
                        <Icon name="profile" size="xs" />
                        Your case
                      </span>
                    )}
                    {user?.id === dispute.plaintiffId && dispute.status === "PENDING" && (
                      <span className="badge-pill bg-amber-100 text-amber-900">
                        <Icon name="clock" size="xs" />
                        Awaiting activation
                      </span>
                    )}
                    {dispute.userVote && dispute.status === "ACTIVE" && (
                      <span className="badge-pill bg-emerald-100 text-emerald-900">
                        <Icon name="vote" size="xs" />
                        You voted: {dispute.userVote === "plaintiff" ? "Plaintiff" : "Defendant"}
                      </span>
                    )}
                    {dispute.userVote && dispute.status === "RESOLVED" && (
                      <VoteResultBadge
                        choice={dispute.userVote}
                        disputeStatus={dispute.status}
                        resolutionOutcome={dispute.resolutionOutcome}
                      />
                    )}
                  </div>
                  <p className="text-sm text-gray-700 font-semibold mt-1">
                    <span className="text-gray-900">#{dispute.caseNumber}</span>
                    {" · "}
                    {theme.category[dispute.category as keyof typeof theme.category] ?? dispute.category}
                    {dispute.plaintiff?.name && ` · ${dispute.plaintiff.name}`}
                  </p>
                </div>
              </div>
              <StatusWithOutcome
                status={dispute.status}
                resolutionOutcome={dispute.resolutionOutcome}
                size="md"
              />
            </button>
            <div className="case-card-body">
            <button
              type="button"
              onClick={() => openDetail(dispute.id)}
              className="text-left text-gray-800 font-semibold leading-relaxed hover:text-primary transition-colors line-clamp-3 w-full"
            >
              {dispute.description}
            </button>
            {dispute.status === "ACTIVE" && dispute.voteTally && (
              <VoteTallyBar
                plaintiffPct={dispute.voteTally.plaintiffPct}
                defendantPct={dispute.voteTally.defendantPct}
                plaintiffCount={dispute.voteTally.plaintiff}
                defendantCount={dispute.voteTally.defendant}
              />
            )}
            {dispute.aiSummary && (
              <div className="callout-primary text-sm flex gap-2">
                <Icon name="sparkles" size="sm" className="text-primary shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-semibold text-primary">AI Analysis: </span>
                  {dispute.aiSummary}
                </div>
              </div>
            )}
            <div className="case-meta-grid">
              <span className="info-chip">
                <Icon name="coins" size="sm" className="text-warning" />
                {dispute.collateral} AVF
              </span>
              <span className="info-chip">
                <Icon name="jury" size="sm" className="text-primary" />
                {dispute.jurySize} jurors
              </span>
              <span className="info-chip">
                <Icon name="document" size="sm" />
                #{dispute.caseNumber}
                {dispute.createdAt && ` · ${formatCaseDate(dispute.createdAt)}`}
              </span>
              {dispute.deadline && dispute.status === "ACTIVE" && (
                <span className="info-chip">
                  <Icon name="clock" size="sm" className="text-amber-600" />
                  {formatCountdown(dispute.deadline)} left
                </span>
              )}
              {(dispute.voteCount ?? 0) > 0 && (
                <span className="info-chip">
                  <Icon name="vote" size="sm" className="text-primary" />
                  {dispute.voteCount} vote{dispute.voteCount === 1 ? "" : "s"}
                </span>
              )}
            </div>
            </div>
            <div className="card-actions">
              <div className="card-actions-primary">
                <button
                  type="button"
                  className="btn-primary inline-flex items-center gap-2"
                  onClick={() => openDetail(dispute.id)}
                >
                  <Icon name="document" size="sm" className="text-white" />
                  View Details
                </button>
                {user?.isJuryMember &&
                  dispute.status === "ACTIVE" &&
                  !dispute.userVote && (
                    <button
                      type="button"
                      className="btn-primary inline-flex items-center gap-2"
                      onClick={() => openDetail(dispute.id)}
                    >
                      <Icon name="vote" size="sm" className="text-white" />
                      Cast Vote
                    </button>
                  )}
                {user?.isJuryMember &&
                  dispute.status === "ACTIVE" &&
                  dispute.userVote && (
                    <button
                      type="button"
                      className="btn-outline inline-flex items-center gap-2"
                      onClick={() => onNavigate("jury")}
                    >
                      <Icon name="vote" size="sm" />
                      Update Vote
                    </button>
                  )}
              </div>
              {user?.id === dispute.plaintiffId &&
                (dispute.status === "PENDING" || dispute.status === "ACTIVE") && (
                <div>
                  <p className="subheading">Plaintiff actions</p>
                  <div className="card-actions-group">
                    {dispute.status === "PENDING" && (
                      <button
                        type="button"
                        className="btn-amber-soft"
                        onClick={() =>
                          setActivateTarget({ id: dispute.id, caseNumber: dispute.caseNumber })
                        }
                        disabled={activating}
                      >
                        <Icon name="vote" size="sm" />
                        {activating && activateTarget?.id === dispute.id ? "Activating..." : "Activate"}
                      </button>
                    )}
                    {dispute.status === "ACTIVE" && (
                      <button
                        type="button"
                        className="btn-success-soft"
                        onClick={() =>
                          setResolveTarget({
                            id: dispute.id,
                            caseNumber: dispute.caseNumber,
                            voteTally: dispute.voteTally,
                          })
                        }
                        disabled={resolving}
                      >
                        <Icon name="gavel" size="sm" />
                        {resolving && resolveTarget?.id === dispute.id ? "Resolving..." : "Resolve"}
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-danger-soft"
                      onClick={() =>
                        setCancelTarget({ id: dispute.id, caseNumber: dispute.caseNumber })
                      }
                      disabled={cancelling}
                    >
                      <Icon name="close" size="sm" />
                      {cancelling && cancelTarget?.id === dispute.id ? "Cancelling..." : "Cancel"}
                    </button>
                  </div>
                </div>
              )}
              <div className="card-actions-group">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => copyDisputeLink(dispute.id)}
                >
                  <Icon name="link" size="sm" />
                  Share
                </button>
                {dispute.status === "ACTIVE" &&
                  !user?.isJuryMember && (
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={handleJoinJury}
                    >
                      <Icon name="jury" size="sm" />
                      Join Jury
                    </button>
                  )}
                {dispute.status === "ACTIVE" &&
                  user?.isJuryMember &&
                  !dispute.userVote && (
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => onNavigate("jury")}
                    >
                      <Icon name="vote" size="sm" />
                      Jury Pool
                    </button>
                  )}
              </div>
            </div>
            </div>
          </div>
        ))}
      </div>
      </div>

      {selectedId && (
        <Modal
          title={
            detailLoadError
              ? "Case Not Found"
              : detailLoading
                ? "Case Details"
                : `Case #${detail?.caseNumber ?? ""}`
          }
          onClose={closeDetail}
          size="large"
        >
          {detailLoading ? (
            <LoadingSkeleton lines={6} />
          ) : detailLoadError ? (
            <EmptyState
              icon="disputes"
              title="Case not found"
              description="This dispute may have been removed or the link is invalid."
              action={{ label: "Back to Disputes", onClick: closeDetail }}
            />
          ) : detail ? (
            <div className="space-y-4">
              <button
                type="button"
                onClick={closeDetail}
                className="link-accent inline-flex items-center gap-1"
              >
                ← Back to Disputes
              </button>
              {user?.id === detail.plaintiffId && (
                <div className="badge-pill bg-primary/10 text-primary-dark">
                  <Icon name="profile" size="sm" />
                  You filed this case
                </div>
              )}
              <div>
                <h3 className="font-display font-semibold text-xl text-gray-900">{detail.title}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <StatusWithOutcome
                    status={detail.status}
                    resolutionOutcome={detail.resolutionOutcome}
                    size="md"
                  />
                  <button
                    type="button"
                    className="btn-outline text-xs px-2 py-1 inline-flex items-center gap-1"
                    onClick={copyShareLink}
                  >
                    <Icon name="link" size="sm" />
                    Copy Link
                  </button>
                </div>
              </div>

              {detail.status === "RESOLVED" && detail.resolutionOutcome && (
                <div className="callout-info text-sm flex gap-2">
                  <Icon name="gavel" size="sm" className="text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-blue-800">Final Ruling: </span>
                    {formatOutcome(detail.resolutionOutcome)}
                  </div>
                </div>
              )}

              <p className="text-gray-800 font-semibold leading-relaxed">{detail.description}</p>

              {detail.userVote && detail.status === "RESOLVED" ? (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-800 font-semibold">Your vote:</span>
                  <VoteResultBadge
                    choice={detail.userVote}
                    disputeStatus={detail.status}
                    resolutionOutcome={detail.resolutionOutcome}
                  />
                  <span className="text-gray-800 capitalize">
                    ({detail.userVote === "plaintiff" ? "Plaintiff" : "Defendant"})
                  </span>
                </div>
              ) : detail.userVote ? (
                <div className="callout-success">
                  <Icon name="success" size="sm" />
                  Your vote: {detail.userVote === "plaintiff" ? "Rule for Plaintiff" : "Rule for Defendant"}
                </div>
              ) : null}

              <InlineJuryVote detail={detail} onVoted={handleDetailVoted} />

              {detail.status === "ACTIVE" && detail.votes && detail.votes.length > 0 && (() => {
                const lean = formatOutcome(predictOutcome(voteTally(detail)));
                return lean ? (
                  <div className="callout-warning text-sm flex gap-2">
                    <Icon name="scale" size="sm" className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-amber-800">Current jury lean: </span>
                      {lean}
                    </div>
                  </div>
                ) : null;
              })()}

              {detail.aiSummary ? (
                <div className="callout-primary text-sm flex gap-2">
                  <Icon name="sparkles" size="sm" className="text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-primary">AI Analysis: </span>
                    {detail.aiSummary}
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-outline inline-flex items-center gap-2"
                  onClick={requestAnalysis}
                  disabled={analyzing}
                >
                  <Icon name="sparkles" size="sm" />
                  {analyzing ? "Analyzing..." : "Run AI Analysis"}
                </button>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div className="meta-tile">
                  <span className="meta-label">Case Number</span>
                  <span className="font-semibold text-gray-900">#{detail.caseNumber}</span>
                </div>
                <div className="meta-tile">
                  <span className="meta-label">Filed</span>
                  <span className="font-semibold text-gray-900">
                    {detail.createdAt ? formatCaseDate(detail.createdAt) : "—"}
                  </span>
                </div>
                <div className="meta-tile">
                  <span className="meta-label">Category</span>
                  <span className="font-semibold text-gray-900">
                    {theme.category[detail.category as keyof typeof theme.category] ??
                      detail.category}
                  </span>
                </div>
                <div className="meta-tile">
                  <span className="meta-label">Plaintiff</span>
                  <span className="font-semibold text-gray-900">{detail.plaintiff?.name ?? "Unknown"}</span>
                  {detail.plaintiff && (
                    <span className="block text-xs text-gray-800 font-mono mt-1">
                      {formatWallet(detail.plaintiff.walletAddress)}
                    </span>
                  )}
                </div>
                <div className="meta-tile">
                  <span className="meta-label">Defendant</span>
                  <span className="font-semibold text-gray-900 font-mono text-xs">
                    {formatWallet(detail.defendantAddress)}
                  </span>
                </div>
                <div className="meta-tile">
                  <span className="meta-label">Collateral</span>
                  <span className="font-semibold text-gray-900">{detail.collateral} AVF</span>
                </div>
                <div className="meta-tile">
                  <span className="meta-label">Deadline</span>
                  <span className="font-semibold text-gray-900 font-mono">
                    {formatCountdown(detail.deadline)}
                  </span>
                </div>
              </div>

              <OnChainRecord
                chainId={detail.chainId}
                disputeKey={detail.disputeKey}
                escrowTxHash={detail.escrowTxHash}
                outcomeHash={detail.outcomeHash}
                outcomeTxHash={detail.outcomeTxHash}
              />

              {detail.votes && detail.votes.length > 0 && (() => {
                const tally = voteTally(detail);
                return (
                <div>
                  <h4 className="section-title text-base mb-3">
                    <Icon name="vote" size="sm" className="text-primary" />
                    Jury Votes ({detail.votes.length})
                  </h4>
                  <div className="mb-3">
                    <VoteTallyBar
                      plaintiffPct={tally.plaintiffPct}
                      defendantPct={tally.defendantPct}
                      plaintiffCount={tally.plaintiff}
                      defendantCount={tally.defendant}
                    />
                  </div>
                  <ul className="space-y-2 text-sm">
                    {detail.votes.map((vote) => {
                      const isYou = vote.userId === user?.id;
                      return (
                      <li
                        key={vote.id}
                        className={`flex justify-between rounded-xl px-3 py-2.5 ${
                          isYou ? "bg-primary/10 ring-1 ring-primary/20" : "meta-tile py-2.5"
                        }`}
                      >
                        <span className="inline-flex items-center gap-1.5 font-semibold text-gray-900">
                          {vote.user.name ?? formatWallet(vote.user.walletAddress)}
                          {isYou && (
                            <span className="text-xs text-primary-dark font-semibold">(you)</span>
                          )}
                        </span>
                        <span className="capitalize text-gray-800 font-semibold">{vote.choice}</span>
                      </li>
                      );
                    })}
                  </ul>
                  {!suggestion ? (
                    <button
                      type="button"
                      className="btn-outline inline-flex items-center gap-2 mt-3"
                      onClick={requestSuggestion}
                      disabled={suggesting}
                    >
                      <Icon name="sparkles" size="sm" />
                      {suggesting ? "Generating..." : "AI Resolution Suggestion"}
                    </button>
                  ) : (
                    <div className="mt-3 callout-warning text-sm flex gap-2">
                      <Icon name="sparkles" size="sm" className="text-warning shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-amber-800">AI Recommendation: </span>
                        {suggestion}
                      </div>
                    </div>
                  )}
                </div>
                );
              })()}

              {(detail.status === "ACTIVE" || detail.status === "PENDING") &&
                user?.id === detail.plaintiffId && (
                <div className="pt-2">
                  <h4 className="section-title mb-3">Plaintiff actions</h4>
                  <div className="action-row">
                  {detail.status === "PENDING" && (
                    <button
                      type="button"
                      className="btn-primary inline-flex items-center gap-2"
                      onClick={() =>
                        setActivateTarget({ id: detail.id, caseNumber: detail.caseNumber })
                      }
                      disabled={activating}
                    >
                      <Icon name="vote" size="sm" className="text-white" />
                      {activating ? "Activating..." : "Activate for Voting"}
                    </button>
                  )}
                  {detail.status === "ACTIVE" && !user?.isJuryMember && (
                    <button
                      type="button"
                      className="btn-outline inline-flex items-center gap-2"
                      onClick={() => onNavigate("jury")}
                    >
                      <Icon name="jury" size="sm" />
                      Join Jury to Vote
                    </button>
                  )}
                  {detail.status === "ACTIVE" && (
                    <button
                      type="button"
                      className="btn-outline inline-flex items-center gap-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                      onClick={() =>
                        setResolveTarget({
                          id: detail.id,
                          caseNumber: detail.caseNumber,
                          voteTally: voteTally(detail),
                        })
                      }
                      disabled={resolving}
                    >
                      <Icon name="gavel" size="sm" />
                      {resolving ? "Resolving..." : "Mark as Resolved"}
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-outline inline-flex items-center gap-2 text-red-700 border-red-200 hover:bg-red-50"
                    onClick={() =>
                      setCancelTarget({ id: detail.id, caseNumber: detail.caseNumber })
                    }
                    disabled={cancelling}
                  >
                    <Icon name="close" size="sm" />
                    Cancel Case
                  </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </Modal>
      )}

      {showCreateModal && (
        <CreateDisputeModal
          userId={user?.id}
          onClose={() => setShowCreateModal(false)}
          onNavigate={onNavigate}
          onCreated={async () => {
            await loadDisputes();
            await refreshPlatform();
            await refreshPendingCases();
            await refreshActiveCase();
          }}
        />
      )}

      {activateTarget && (
        <ConfirmModal
          title="Activate Case"
          message={`Open Case #${activateTarget.caseNumber} for jury voting? Jurors will be able to cast votes once activated.`}
          confirmLabel="Activate Case"
          loading={activating}
          onConfirm={activateDispute}
          onClose={() => setActivateTarget(null)}
        />
      )}

      {resolveTarget && (() => {
        const tally = resolveTarget.voteTally;
        const total = tally ? tally.plaintiff + tally.defendant : 0;
        const lean =
          tally && total > 0 ? formatOutcome(predictOutcome(tally)) : null;
        return (
        <ConfirmModal
          title="Resolve Case"
          message={`Mark Case #${resolveTarget.caseNumber} as resolved? ${
            lean ? `Jury lean: ${lean}. ` : "No votes recorded yet. "
          }All voters receive 25 AVF; majority-side voters earn +5 bonus.`}
          confirmLabel="Mark as Resolved"
          variant="primary"
          loading={resolving}
          onConfirm={resolveDispute}
          onClose={() => setResolveTarget(null)}
        />
        );
      })()}

      {cancelTarget && (
        <ConfirmModal
          title="Cancel Case"
          message={`Are you sure you want to cancel Case #${cancelTarget.caseNumber}? This action cannot be undone.`}
          confirmLabel="Cancel Case"
          variant="danger"
          loading={cancelling}
          onConfirm={cancelDispute}
          onClose={() => setCancelTarget(null)}
        />
      )}
    </>
  );
}
