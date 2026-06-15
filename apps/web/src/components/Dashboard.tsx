"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "./Toast";
import { PageHeader } from "./PageHeader";
import { Icon, IconBadge } from "./icons";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { theme } from "@/lib/theme";
import { navigateToActivity, navigateToActiveDisputes, navigateToMyDisputes, navigateToFirstPendingCase, type Page } from "@/lib/routing";
import { onAppShortcut } from "@/lib/shortcuts";
import { usePendingCases } from "@/context/PendingCasesContext";
import { formatOutcome, statusAccentClass } from "@/lib/dispute-utils";
import { useUser } from "@/context/UserContext";
import { usePlatform } from "@/context/PlatformContext";
import {
  apiFetch,
  formatCaseDate,
  formatAvf,
  formatPercent,
  timeAgo,
  toggleJuryMembership,
  type Dispute,
} from "@/lib/api";
import { useUserStats } from "@/context/UserStatsContext";
import { useActiveVoting } from "@/context/ActiveVotingContext";
import { RefreshButton } from "./RefreshButton";
import { CreateDisputeModal } from "./CreateDisputeModal";
import { SystemStatusCard } from "./SystemStatusCard";
import { JuryVoteBanner } from "./JuryVoteBanner";
import { PendingCasesBanner } from "./PendingCasesBanner";
import { StatusWithOutcome } from "./StatusWithOutcome";
import { VoteResultBadge } from "./VoteResultBadge";
import { VoteTallyBar } from "./VoteTallyBar";

interface DashboardProps {
  onNavigate: (page: Page, subPath?: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const { stats, statsLoading, activities, refreshPlatform } = usePlatform();
  const [recentDisputes, setRecentDisputes] = useState<Dispute[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { refresh: refreshPendingCases, pendingCount, pendingCases } = usePendingCases();
  const { refresh: refreshActiveCase, needsVote } = useActiveVoting();
  const { stats: userStats, refresh: refreshUserStats } = useUserStats();
  const { user, setUser, refreshUser } = useUser();
  const { showToast } = useToast();

  const reloadRecentDisputes = useCallback(() => {
    const query = user?.id ? `?userId=${encodeURIComponent(user.id)}` : "";
    apiFetch<Dispute[]>(`/api/disputes${query}`)
      .then((data) => setRecentDisputes(data.slice(0, 5)))
      .catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    reloadRecentDisputes();
  }, [reloadRecentDisputes]);

  useEffect(() => {
    return onAppShortcut("create-dispute", () => setShowDisputeModal(true));
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await refreshPlatform();
    reloadRecentDisputes();
    await refreshUserStats();
    await refreshUser().catch(() => {});
    await refreshPendingCases();
    await refreshActiveCase();
    setRefreshing(false);
  }

  async function handleJuryToggle() {
    if (!user) {
      showToast("User session unavailable", "error");
      return;
    }

    setLoading(true);
    try {
      const updated = await toggleJuryMembership(user.id);
      setUser(updated);
      showToast(
        updated.isJuryMember ? "Successfully joined jury pool!" : "Left jury pool",
        updated.isJuryMember ? "success" : "info"
      );
      await refreshPlatform();
      await refreshActiveCase();
    } catch {
      showToast("Could not update jury status", "error");
    } finally {
      setLoading(false);
    }
  }

  const firstName = user?.name?.split(" ")[0];

  const statCards = [
    {
      value: stats.activeDisputes.toLocaleString(),
      label: "Active Disputes",
      icon: "disputes" as const,
      onClick: stats.activeDisputes > 0 ? () => navigateToActiveDisputes(onNavigate) : undefined,
    },
    {
      value: stats.juryMembers.toLocaleString(),
      label: "Jury Members",
      icon: "jury" as const,
      onClick: () => onNavigate("jury"),
    },
    { value: formatPercent(stats.resolutionRate), label: "Resolution Rate", icon: "scale" as const },
    { value: formatAvf(stats.totalStaked), label: "AVF Staked", icon: "coins" as const },
  ];

  const hasPendingBanner = pendingCount > 0;
  const hasVoteBanner = needsVote;

  const quickActions = [
    {
      key: "my-cases",
      label: "My cases",
      icon: "document" as const,
      onClick: () => navigateToMyDisputes(onNavigate),
    },
    ...(stats.activeDisputes > 0
      ? [
          {
            key: "active",
            label: "Active disputes",
            icon: "disputes" as const,
            onClick: () => navigateToActiveDisputes(onNavigate),
          },
        ]
      : []),
    ...(pendingCount > 0 && !hasPendingBanner
      ? [
          {
            key: "pending",
            label: "Pending review",
            icon: "clock" as const,
            onClick: () => navigateToFirstPendingCase(pendingCases, onNavigate),
            accent: "amber" as const,
          },
        ]
      : []),
    ...(needsVote && !hasVoteBanner
      ? [
          {
            key: "vote",
            label: "Vote now",
            icon: "vote" as const,
            onClick: () => onNavigate("jury"),
            accent: "primary" as const,
          },
        ]
      : []),
    {
      key: "jury",
      label: user?.isJuryMember ? "Jury pool" : "Join jury",
      icon: "jury" as const,
      onClick: () => onNavigate("jury"),
    },
  ];

  const showSummaryChips =
    (needsVote && !hasVoteBanner) ||
    (pendingCount > 0 && !hasPendingBanner) ||
    stats.activeDisputes > 0 ||
    user?.isJuryMember;

  return (
    <>
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : "Welcome to Solutiva Court"}
        description="Decentralized dispute resolution powered by community jury voting"
        icon="scale"
        action={<RefreshButton onClick={handleRefresh} loading={refreshing} variant="header-light" />}
      />

      <PendingCasesBanner onNavigate={onNavigate} />
      <JuryVoteBanner onNavigate={onNavigate} />

      <div className="page-body">
      {showSummaryChips && (
        <div className="page-summary-chips">
          {needsVote && !hasVoteBanner && (
            <button
              type="button"
              className="quick-stat-chip-interactive"
              onClick={() => onNavigate("jury")}
            >
              <Icon name="vote" size="sm" />
              Vote needed
            </button>
          )}
          {pendingCount > 0 && !hasPendingBanner && (
            <button
              type="button"
              className="quick-stat-chip-interactive"
              onClick={() => navigateToFirstPendingCase(pendingCases, onNavigate)}
            >
              <Icon name="clock" size="sm" />
              {pendingCount} pending
            </button>
          )}
          {stats.activeDisputes > 0 && (
            <button
              type="button"
              className="quick-stat-chip-interactive"
              onClick={() => navigateToActiveDisputes(onNavigate)}
            >
              <Icon name="disputes" size="sm" />
              {stats.activeDisputes} active
            </button>
          )}
          {user?.isJuryMember && (
            <span className="quick-stat-chip">
              <Icon name="jury" size="sm" />
              Juror
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          className={`card-featured ${
            needsVote ? "card-accent-active" : pendingCount > 0 ? "card-accent-pending" : ""
          }`}
        >
          <div className="card-header">
            <Icon name="plus" size="sm" className="text-primary" />
            <h3>Quick Actions</h3>
          </div>
          <div className="card-body space-y-4">
            <button
              className="btn-primary w-full h-11 inline-flex items-center justify-center gap-2"
              onClick={() => setShowDisputeModal(true)}
            >
              <Icon name="document" size="sm" className="text-white" />
              Create new dispute
            </button>

            <div className="action-grid">
              {quickActions.map((action) => (
                <button
                  key={action.key}
                  type="button"
                  className={`action-tile ${
                    action.accent === "amber"
                      ? "bg-amber-50 ring-amber-200/80 text-amber-950 hover:bg-amber-100"
                      : action.accent === "primary"
                        ? "bg-primary/5 ring-primary/20 text-primary-dark hover:bg-primary/10"
                        : ""
                  }`}
                  onClick={action.onClick}
                >
                  <Icon name={action.icon} size="sm" className="shrink-0" />
                  <span className="truncate">{action.label}</span>
                </button>
              ))}
            </div>

            <div className="card-footer-hint">
              <span>
                Press <kbd className="kbd text-xs px-1.5 py-0.5">n</kbd> to create
              </span>
              <button
                type="button"
                className={user?.isJuryMember ? "btn-danger-soft" : "btn-success-soft"}
                onClick={handleJuryToggle}
                disabled={loading}
              >
                <Icon name="jury" size="sm" />
                {loading
                  ? "Processing…"
                  : user?.isJuryMember
                    ? "Leave pool"
                    : "Join pool"}
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <Icon name="dashboard" size="sm" className="text-primary" />
            <h3>Platform Statistics</h3>
          </div>
          <div className="card-body stat-grid">
            {statsLoading ? (
              <div className="col-span-2">
                <LoadingSkeleton lines={4} />
              </div>
            ) : (
              statCards.map((stat) => {
                const content = (
                  <>
                    <span className="stat-grid-icon">
                      <Icon name={stat.icon} size="sm" />
                    </span>
                    <span className="min-w-0">
                      <div className="stat-value">{stat.value}</div>
                      <div className="stat-label">{stat.label}</div>
                    </span>
                  </>
                );

                if (stat.onClick) {
                  return (
                    <button
                      key={stat.label}
                      type="button"
                      onClick={stat.onClick}
                      className="stat-grid-tile-interactive"
                      title={`View ${stat.label.toLowerCase()}`}
                    >
                      {content}
                    </button>
                  );
                }

                return (
                  <div key={stat.label} className="stat-grid-tile">
                    {content}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="card flex flex-col">
          <div className="card-header justify-between">
            <div className="flex items-center gap-2.5">
              <Icon name="clock" size="sm" className="text-primary" />
              <h3>Recent Activity</h3>
            </div>
            {activities.length > 0 && (
              <button type="button" className="link-accent text-sm" onClick={() => onNavigate("disputes")}>
                Browse cases
              </button>
            )}
          </div>
          <div className="card-body flex-1">
            {activities.length === 0 ? (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary mb-2">
                  <Icon name="clock" size="sm" />
                </div>
                <p className="text-sm text-gray-800 font-semibold">No recent activity yet</p>
                <p className="text-xs text-gray-600 mt-1">Votes and resolutions will appear here</p>
              </div>
            ) : (
              <div className="activity-feed">
                {activities.slice(0, 5).map((activity) => {
                  const activityType = activity.type as keyof typeof theme.activity;
                  const config = theme.activity[activityType] ?? theme.activity.resolved;
                  const voteChoice = activity.metadata?.choice;
                  const showVoteDetail =
                    activity.type === "vote" &&
                    voteChoice &&
                    !activity.title.toLowerCase().includes(String(voteChoice).toLowerCase());

                  return (
                    <button
                      key={activity.id}
                      type="button"
                      onClick={() => navigateToActivity(activity, onNavigate)}
                      className="activity-feed-item"
                    >
                      <IconBadge name={config.icon} variant={config.variant} size="sm" />
                      <div className="activity-feed-body">
                        <div className="activity-feed-title">{activity.title}</div>
                        {activity.type === "resolved" && activity.metadata?.resolutionOutcome && (
                          <div className="activity-feed-detail text-blue-600">
                            {formatOutcome(activity.metadata.resolutionOutcome)}
                          </div>
                        )}
                        {showVoteDetail && (
                          <div className="activity-feed-detail">Voted: {voteChoice}</div>
                        )}
                      </div>
                      <span className="activity-feed-time">{timeAgo(activity.createdAt)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="card flex flex-col">
          <div className="card-header">
            <Icon name="shield" size="sm" className="text-primary" />
            <h3>Your Performance</h3>
          </div>
          <div className="card-body space-y-4 flex-1">
            <div className="trust-meter">
              <div className="trust-meter-header">
                <span className="text-label mb-0">Trust score</span>
                <span className="trust-meter-value">{user?.trustScore ?? 0}%</span>
              </div>
              <div className="progress-track h-2.5">
                <div
                  className="progress-fill"
                  style={{ width: `${user?.trustScore ?? 0}%` }}
                />
              </div>
            </div>

            <div className="metric-panel">
              <div className="metric-panel-row">
                <span className="metric-panel-label">Disputes filed</span>
                <button
                  type="button"
                  className="metric-panel-value text-primary hover:text-primary-dark transition-colors"
                  onClick={() =>
                    userStats?.disputesFiled
                      ? navigateToMyDisputes(onNavigate)
                      : setShowDisputeModal(true)
                  }
                >
                  {userStats?.disputesFiled ?? 0}
                </button>
              </div>
              <div className="metric-panel-row">
                <span className="metric-panel-label">Votes cast</span>
                <span className="metric-panel-value">{userStats?.votesCast ?? "—"}</span>
              </div>
              <div className="metric-panel-row">
                <span className="metric-panel-label">Cases participated</span>
                <span className="metric-panel-value">{userStats?.casesParticipated ?? "—"}</span>
              </div>
              <div className="metric-panel-row">
                <span className="metric-panel-label">Total rewards</span>
                <span className="metric-panel-value inline-flex items-center gap-1.5">
                  <Icon name="coins" size="sm" className="text-warning" />
                  {formatAvf(user?.avfBalance ?? 0)}
                  <span className="text-xs font-semibold text-gray-600">AVF</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="card">
          <div className="card-header justify-between">
            <div className="flex items-center gap-2.5">
              <Icon name="gavel" size="sm" className="text-primary" />
              <h3>Recent Cases</h3>
            </div>
            <button
              type="button"
              className="link-accent"
              onClick={() =>
                userStats?.disputesFiled
                  ? navigateToMyDisputes(onNavigate)
                  : onNavigate("disputes")
              }
            >
              View all
            </button>
          </div>
          <div className="card-body space-y-3">
            {recentDisputes.length === 0 ? (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-3">
                  <Icon name="disputes" size="md" />
                </div>
                <p className="font-display font-semibold text-gray-900 mb-1">No cases yet</p>
                <p className="text-sm text-gray-800 font-medium mb-4">
                  Create a dispute to start the resolution process.
                </p>
                <button
                  type="button"
                  className="btn-primary inline-flex items-center gap-2"
                  onClick={() => setShowDisputeModal(true)}
                >
                  <Icon name="plus" size="sm" className="text-white" />
                  Create Dispute
                </button>
              </div>
            ) : (
              recentDisputes.map((dispute) => (
                <button
                  key={dispute.id}
                  type="button"
                  onClick={() => onNavigate("disputes", dispute.id)}
                  className={`list-row -mx-1 ${statusAccentClass(dispute.status)}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 pr-3">
                      <div className="font-semibold text-sm text-gray-900 truncate flex flex-wrap items-center gap-2">
                        <span>
                          #{dispute.caseNumber} {dispute.title}
                        </span>
                        {user?.id === dispute.plaintiffId && (
                          <span className="badge-pill bg-primary/10 text-primary-dark shrink-0">
                            Your case
                          </span>
                        )}
                        {dispute.userVote && dispute.status === "ACTIVE" && (
                          <span className="badge-pill bg-emerald-100 text-emerald-900 shrink-0">
                            Voted
                          </span>
                        )}
                        {dispute.userVote && dispute.status === "RESOLVED" && (
                          <VoteResultBadge
                            choice={dispute.userVote}
                            disputeStatus={dispute.status}
                            resolutionOutcome={dispute.resolutionOutcome}
                            className="text-xs"
                          />
                        )}
                      </div>
                      <div className="text-sm text-gray-800 font-semibold">
                        {theme.category[dispute.category as keyof typeof theme.category] ?? dispute.category}
                        {dispute.createdAt && ` · ${formatCaseDate(dispute.createdAt)}`}
                      </div>
                    </div>
                    <StatusWithOutcome
                      status={dispute.status}
                      resolutionOutcome={dispute.resolutionOutcome}
                    />
                  </div>
                  {dispute.status === "ACTIVE" && dispute.voteTally && (
                    <div className="mt-2 pr-2">
                      <VoteTallyBar
                        plaintiffPct={dispute.voteTally.plaintiffPct}
                        defendantPct={dispute.voteTally.defendantPct}
                        showLabels={false}
                        variant="compact"
                      />
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        <SystemStatusCard />
      </div>
      </div>

      {showDisputeModal && (
        <CreateDisputeModal
          userId={user?.id}
          onClose={() => setShowDisputeModal(false)}
          onNavigate={onNavigate}
          onCreated={() => {
            refreshUser();
            refreshUserStats();
            refreshPlatform();
            reloadRecentDisputes();
            refreshPendingCases();
            refreshActiveCase();
          }}
        />
      )}
    </>
  );
}
