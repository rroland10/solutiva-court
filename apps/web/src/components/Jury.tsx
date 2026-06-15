"use client";

import { useEffect, useState } from "react";
import { useToast } from "./Toast";
import { PageHeader } from "./PageHeader";
import { Icon } from "./icons";
import { StatsGridSkeleton } from "./LoadingSkeleton";
import { EmptyState } from "./EmptyState";
import { useUser } from "@/context/UserContext";
import { usePlatform } from "@/context/PlatformContext";
import { useActiveVoting } from "@/context/ActiveVotingContext";
import { usePendingCases } from "@/context/PendingCasesContext";
import { useUserStats } from "@/context/UserStatsContext";
import {
  formatCountdown,
  formatAvf,
  getApiErrorMessage,
  submitVote,
  toggleJuryMembership,
} from "@/lib/api";
import type { Page } from "@/lib/routing";
import { navigateToActiveDisputes } from "@/lib/routing";
import { RefreshButton } from "./RefreshButton";
import { VoteTallyBar } from "./VoteTallyBar";
import { RewardsInfoCard } from "./RewardsInfoCard";
import { PendingCasesBanner } from "./PendingCasesBanner";
import { JuryVoteBanner } from "./JuryVoteBanner";

interface JuryProps {
  onNavigate: (page: Page, subPath?: string) => void;
}

export function Jury({ onNavigate }: JuryProps) {
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { stats, statsLoading, refreshPlatform } = usePlatform();
  const { stats: userStats, refresh: refreshUserStats } = useUserStats();
  const { user, setUser, refreshUser } = useUser();
  const { activeCase, refresh: refreshActiveCase } = useActiveVoting();
  const { refresh: refreshPendingCases } = usePendingCases();
  const [countdown, setCountdown] = useState("--:--:--");
  const { showToast } = useToast();

  useEffect(() => {
    if (activeCase?.userVote) {
      setSelectedVote(activeCase.userVote);
    }
  }, [activeCase?.userVote]);

  useEffect(() => {
    if (!activeCase?.deadline) return;
    const tick = () => setCountdown(formatCountdown(activeCase.deadline));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeCase?.deadline]);

  async function handleJoinJury() {
    if (!user) return;
    setJoining(true);
    try {
      const updated = await toggleJuryMembership(user.id);
      setUser(updated);
      showToast("Successfully joined jury pool!", "success");
      await refreshPlatform();
      await refreshActiveCase();
    } catch (err) {
      showToast(getApiErrorMessage(err, "Could not join jury pool"), "error");
    } finally {
      setJoining(false);
    }
  }

  async function handleLeaveJury() {
    if (!user) return;
    setJoining(true);
    try {
      const updated = await toggleJuryMembership(user.id);
      setUser(updated);
      showToast("Left jury pool", "info");
      await refreshPlatform();
      await refreshActiveCase();
    } catch (err) {
      showToast(getApiErrorMessage(err, "Could not leave jury pool"), "error");
    } finally {
      setJoining(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await Promise.all([
      refreshPlatform(),
      refreshActiveCase(),
      refreshUserStats(),
      refreshPendingCases(),
    ]);
    setRefreshing(false);
  }

  async function handleSubmitVote() {
    if (!selectedVote) {
      showToast("Please select a voting option", "warning");
      return;
    }

    if (!activeCase || !user) {
      showToast("No active case or user session available", "error");
      return;
    }

    setLoading(true);
    try {
      const result = await submitVote(activeCase.id, user.id, selectedVote as "plaintiff" | "defendant");
      showToast(
        hasVoted || !result.rewarded
          ? hasVoted
            ? "Vote updated"
            : "Vote submitted!"
          : "Vote submitted! +10 AVF and +1 trust earned.",
        "success"
      );
      await refreshActiveCase();
      await refreshUser().catch(() => {});
      await refreshUserStats();
      await refreshPlatform();
      await refreshActiveCase();
    } catch (err) {
      showToast(getApiErrorMessage(err, "Could not submit vote"), "error");
    } finally {
      setLoading(false);
    }
  }

  const juryMembers = stats.juryMembers;
  const totalStaked = stats.totalStaked;
  const resolutionRate = stats.resolutionRate;
  const hasVoted = Boolean(activeCase?.userVote);

  return (
    <>
      <PageHeader
        title="Jury Pool"
        description="Participate in dispute resolution and earn rewards"
        icon="jury"
        action={<RefreshButton onClick={handleRefresh} loading={refreshing} variant="header-light" />}
      />

      <PendingCasesBanner onNavigate={onNavigate} />
      <JuryVoteBanner onNavigate={onNavigate} />

      <div className="page-body">
      {!user?.isJuryMember && (
        <div className="banner-primary mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary shrink-0">
                <Icon name="jury" size="sm" />
              </span>
              <div>
                <p className="action-banner-title">Join the jury pool</p>
                <p className="action-banner-subtitle">
                  Vote on active cases, earn AVF rewards, and help resolve disputes fairly.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="btn-primary inline-flex items-center gap-2 shrink-0"
              onClick={handleJoinJury}
              disabled={joining}
            >
              <Icon name="jury" size="sm" className="text-white" />
              {joining ? "Joining..." : "Join Jury Pool"}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="card">
            <div className="card-header">
              <Icon name="users" size="sm" className="text-primary" />
              <h3>Pool Statistics</h3>
            </div>
            <div className="card-body">
            {statsLoading ? (
              <StatsGridSkeleton count={3} />
            ) : (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="stat-tile">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary mb-2 ring-1 ring-primary/10">
                    <Icon name="jury" size="sm" />
                  </div>
                  <div className="stat-value">{juryMembers.toLocaleString()}</div>
                  <div className="text-sm text-gray-800 font-semibold">Active Members</div>
                </div>
                <div className="stat-tile">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-warning/10 text-warning mb-2 ring-1 ring-warning/10">
                    <Icon name="coins" size="sm" />
                  </div>
                  <div className="stat-value">{formatAvf(totalStaked)}</div>
                  <div className="text-sm text-gray-800 font-semibold">Total Staked</div>
                </div>
                <div className="stat-tile">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-success/10 text-success mb-2 ring-1 ring-success/10">
                    <Icon name="scale" size="sm" />
                  </div>
                  <div className="stat-value">{resolutionRate.toFixed(1)}%</div>
                  <div className="text-sm text-gray-800 font-semibold">Resolution Rate</div>
                </div>
              </div>
            )}
            </div>
          </div>

          <div className="card-featured">
            <div className="card-header">
              <Icon name="shield" size="sm" className="text-primary" />
              <h3>Your Participation</h3>
            </div>
            <div className="card-body space-y-4">
              <dl className="metric-row">
                <dt>Jury Status</dt>
                <dd className={user?.isJuryMember ? "text-emerald-700" : ""}>
                  {user?.isJuryMember ? "Active Member" : "Not enrolled"}
                </dd>
              </dl>
              <dl className="metric-row">
                <dt>Votes Cast</dt>
                <dd>{userStats?.votesCast ?? "—"}</dd>
              </dl>
              <div>
                <label className="text-label mb-1.5 block">Trust Score</label>
                <div className="progress-track mb-1.5">
                  <div
                    className="progress-fill"
                    style={{ width: `${user?.trustScore ?? 0}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-900">{user?.trustScore ?? 0}%</span>
              </div>
              <dl className="metric-row">
                <dt>Total Rewards</dt>
                <dd className="inline-flex items-center gap-1">
                  <Icon name="coins" size="sm" className="text-warning" />
                  {formatAvf(user?.avfBalance ?? 0)} AVF
                </dd>
              </dl>
              {!user?.isJuryMember ? (
                <button
                  type="button"
                  className="btn-primary w-full mt-2 inline-flex items-center justify-center gap-2"
                  onClick={handleJoinJury}
                  disabled={joining}
                >
                  <Icon name="jury" size="sm" className="text-white" />
                  {joining ? "Joining..." : "Join Jury Pool"}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-outline w-full mt-2 inline-flex items-center justify-center gap-2 text-red-700 border-red-200 hover:bg-red-50"
                  onClick={handleLeaveJury}
                  disabled={joining}
                >
                  <Icon name="jury" size="sm" />
                  {joining ? "Processing..." : "Leave Jury Pool"}
                </button>
              )}
            </div>
          </div>
          <RewardsInfoCard />
        </div>

        <div className={`${activeCase ? "card-featured" : "card"} ${activeCase ? "card-accent-active" : ""}`}>
          <div className="card-header justify-between">
            <div className="flex items-center gap-2.5">
              <Icon name="vote" size="sm" className="text-primary" />
              <h3>Active Voting</h3>
            </div>
            {activeCase && (
              <span className="badge-pill bg-emerald-100 text-emerald-900">
                <Icon name="clock" size="xs" />
                {countdown}
              </span>
            )}
          </div>
          <div className="card-body">
          {activeCase ? (
            <div className="panel-inset">
              <div className="flex justify-between items-start mb-3 gap-2">
                <h4 className="section-title text-base min-w-0">
                  <Icon name="gavel" size="sm" className="text-primary shrink-0" />
                  <span className="truncate">
                    Case #{activeCase.caseNumber} — {activeCase.title}
                  </span>
                </h4>
              </div>
              <div className="flex flex-wrap gap-2 text-sm mb-3">
                <span className="info-chip">
                  <Icon name="document" size="sm" />
                  Case #{activeCase.caseNumber}
                </span>
                {activeCase.deadline && (
                  <span className="info-chip">
                    <Icon name="clock" size="sm" />
                    {countdown} remaining
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-800 font-semibold leading-relaxed mb-4">{activeCase.description}</p>
              <div className="mb-4">
                <VoteTallyBar
                  plaintiffPct={activeCase.tally.plaintiff}
                  defendantPct={activeCase.tally.defendant}
                />
              </div>
              {hasVoted && (
                <div className="mb-4 callout-success">
                  <Icon name="success" size="sm" />
                  You voted: {activeCase.userVote === "plaintiff" ? "Rule for Plaintiff" : "Rule for Defendant"}
                </div>
              )}
              <div className="space-y-2 mb-4">
                {[
                  { id: "plaintiff", label: "Rule for Plaintiff", pct: `${activeCase.tally.plaintiff}%` },
                  { id: "defendant", label: "Rule for Defendant", pct: `${activeCase.tally.defendant}%` },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedVote(option.id)}
                    disabled={!user?.isJuryMember}
                    className={`w-full flex justify-between items-center p-3 rounded-xl border-2 transition-all ${
                      selectedVote === option.id
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-primary/50"
                    } ${!user?.isJuryMember ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <span className="font-semibold text-gray-900 inline-flex items-center gap-2">
                      <Icon
                        name="scale"
                        size="sm"
                        className={selectedVote === option.id ? "text-primary" : "text-gray-800"}
                      />
                      {option.label}
                    </span>
                    <span className="text-gray-800 font-semibold">{option.pct}</span>
                  </button>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  className="btn-outline flex-1 inline-flex items-center justify-center gap-2"
                  onClick={() => onNavigate("disputes", activeCase.id)}
                >
                  <Icon name="document" size="sm" />
                  View Case Details
                </button>
                <button
                  className="btn-primary flex-1 inline-flex items-center justify-center gap-2"
                  onClick={handleSubmitVote}
                  disabled={loading || !user?.isJuryMember}
                >
                  <Icon name="vote" size="sm" className="text-white" />
                  {loading
                    ? "Submitting..."
                    : !user?.isJuryMember
                      ? "Join jury pool to vote"
                      : hasVoted
                        ? "Update Vote"
                        : "Submit Vote"}
                </button>
              </div>
            </div>
          ) : (
            <EmptyState
              featured
              icon="vote"
              title="No active voting"
              description="There are no disputes open for jury voting right now. Browse cases or check back when a new case goes active."
              action={{
                label: stats.activeDisputes > 0 ? "View Active Cases" : "Browse Cases",
                onClick: () =>
                  stats.activeDisputes > 0
                    ? navigateToActiveDisputes(onNavigate)
                    : onNavigate("disputes"),
              }}
            />
          )}
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
