"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { useToast } from "./Toast";
import { PageHeader } from "./PageHeader";
import { Icon } from "./icons";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { RefreshButton } from "./RefreshButton";
import { ThemeToggle } from "./ThemeToggle";
import { RewardsInfoCard } from "./RewardsInfoCard";
import { HybridArchitectureCard } from "./HybridArchitectureCard";
import { PendingCasesBanner } from "./PendingCasesBanner";
import { JuryVoteBanner } from "./JuryVoteBanner";
import { StatusWithOutcome } from "./StatusWithOutcome";
import { VoteResultBadge } from "./VoteResultBadge";
import { useUser } from "@/context/UserContext";
import { usePlatform } from "@/context/PlatformContext";
import { useActiveVoting } from "@/context/ActiveVotingContext";
import { usePendingCases } from "@/context/PendingCasesContext";
import { useUserStats } from "@/context/UserStatsContext";
import { useUserHistory } from "@/hooks/useUserHistory";
import { statusAccentClass } from "@/lib/dispute-utils";
import { formatWallet, formatAvf, getApiErrorMessage, timeAgo, toggleJuryMembership, updateUserProfile } from "@/lib/api";
import { type Page, navigateToMyDisputes, navigateToMyPendingDisputes, navigateToActiveDisputes } from "@/lib/routing";

const privacySettings = [
  { label: "Enable zkSNARK evidence protection", icon: "lock" as const, defaultChecked: true },
  { label: "Anonymous jury participation", icon: "shield" as const, defaultChecked: true },
  { label: "Public case history", icon: "document" as const, defaultChecked: false },
];

const notificationSettings = [
  { label: "New dispute notifications", icon: "disputes" as const },
  { label: "Voting reminders", icon: "vote" as const },
  { label: "Reward notifications", icon: "coins" as const },
];

export function Profile({ onNavigate }: { onNavigate?: (page: Page, subPath?: string) => void }) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [juryLoading, setJuryLoading] = useState(false);
  const { user, setUser, refreshUser } = useUser();
  const { refreshPlatform, stats: platformStats } = usePlatform();
  const { refresh: refreshActiveCase, needsVote } = useActiveVoting();
  const { refresh: refreshPendingCases, pendingCount } = usePendingCases();
  const { stats, loading: statsLoading, refresh: refreshUserStats } = useUserStats();
  const { history, loading: historyLoading, refresh: refreshHistory } = useUserHistory();
  const { showToast } = useToast();

  const loading = statsLoading || historyLoading;

  async function handleRefresh() {
    setRefreshing(true);
    await Promise.all([
      refreshUserStats(),
      refreshHistory(),
      refreshPlatform(),
      refreshActiveCase(),
      refreshPendingCases(),
      refreshUser().catch(() => {}),
    ]);
    setRefreshing(false);
  }

  async function handleJuryToggle() {
    if (!user) return;
    setJuryLoading(true);
    try {
      const updated = await toggleJuryMembership(user.id);
      setUser(updated);
      showToast(
        updated.isJuryMember ? "Joined jury pool" : "Left jury pool",
        updated.isJuryMember ? "success" : "info"
      );
      await refreshPlatform();
      await refreshActiveCase();
      await refreshPendingCases();
    } catch (err) {
      showToast(getApiErrorMessage(err, "Could not update jury status"), "error");
    } finally {
      setJuryLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title={user?.name ? `${user.name}'s Profile` : "Profile Settings"}
        description="Manage your account, case history, and preferences"
        icon="profile"
        action={<RefreshButton onClick={handleRefresh} loading={refreshing} variant="header-light" />}
      />

      {onNavigate && (
        <>
          <PendingCasesBanner onNavigate={onNavigate} />
          <JuryVoteBanner onNavigate={onNavigate} />
        </>
      )}

      <div className="page-body">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className={`card-featured ${
            needsVote ? "card-accent-active" : pendingCount > 0 ? "card-accent-pending" : user?.isJuryMember ? "card-accent-active" : ""
          }`}
        >
          <div className="card-header">
            <Icon name="profile" size="sm" className="text-primary" />
            <h3>Account</h3>
          </div>
          <div className="card-body">
          <div className="flex items-center gap-4 mb-5">
            <div className="profile-avatar">
              <Icon name="profile" size="xl" />
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold">{user?.name ?? "Anonymous"}</h3>
              <p className="text-gray-800 text-sm font-mono">
                {user ? formatWallet(user.walletAddress) : "..."}
              </p>
              <span className="badge-pill bg-primary/10 text-primary-dark mt-2 inline-flex">
                <Icon name="shield" size="xs" />
                {user?.trustScore ?? 0}% trust
              </span>
              <span className="badge-pill bg-amber-100 text-amber-900 mt-1 ml-1">
                <Icon name="coins" size="xs" />
                {formatAvf(user?.avfBalance ?? 0)} AVF
              </span>
              {user?.isJuryMember ? (
                <span className="badge-pill bg-emerald-100 text-emerald-900 mt-1 ml-1">
                  <Icon name="jury" size="xs" />
                  Jury Member
                </span>
              ) : null}
            </div>
          </div>
          <div className="mb-5">
            <label className="text-label mb-1.5 block">Trust Score</label>
            <div className="progress-track mb-1.5">
              <div
                className="progress-fill"
                style={{ width: `${user?.trustScore ?? 0}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-gray-900">{user?.trustScore ?? 0}%</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-outline inline-flex items-center gap-2" onClick={() => setShowEditModal(true)}>
              <Icon name="profile" size="sm" />
              Edit Profile
            </button>
            {onNavigate ? (
              <>
                <button
                  type="button"
                  className="btn-outline inline-flex items-center gap-2"
                  onClick={() => navigateToMyDisputes(onNavigate)}
                >
                  <Icon name="document" size="sm" />
                  View My Cases
                </button>
                {pendingCount > 0 ? (
                  <button
                    type="button"
                    className="btn-outline inline-flex items-center gap-2 border-amber-300 text-amber-900 hover:bg-amber-50"
                    onClick={() => navigateToMyPendingDisputes(onNavigate)}
                  >
                    <Icon name="clock" size="sm" />
                    Review Pending ({pendingCount})
                  </button>
                ) : null}
                {needsVote ? (
                  <button
                    type="button"
                    className="btn-primary inline-flex items-center gap-2"
                    onClick={() => onNavigate("jury")}
                  >
                    <Icon name="vote" size="sm" className="text-white" />
                    Vote Now
                  </button>
                ) : null}
                {platformStats.activeDisputes > 0 ? (
                  <button
                    type="button"
                    className="btn-outline inline-flex items-center gap-2"
                    onClick={() => navigateToActiveDisputes(onNavigate)}
                  >
                    <Icon name="disputes" size="sm" />
                    View Active Disputes
                  </button>
                ) : null}
              </>
            ) : null}
            <button
              type="button"
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all ${
                user?.isJuryMember
                  ? "bg-danger text-white hover:bg-red-600 shadow-md"
                  : "btn-outline"
              }`}
              onClick={handleJuryToggle}
              disabled={juryLoading}
            >
              <Icon name="jury" size="sm" />
              {juryLoading ? "Processing..." : user?.isJuryMember ? "Leave Jury Pool" : "Join Jury Pool"}
            </button>
          </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header justify-between">
            <div className="flex items-center gap-2.5">
              <Icon name="scale" size="sm" className="text-primary" />
              <h3>Case History</h3>
            </div>
            {onNavigate && (stats?.disputesFiled || stats?.votesCast) ? (
              <button type="button" className="link-accent" onClick={() => onNavigate("disputes")}>
                View all cases
              </button>
            ) : null}
          </div>
          <div className="card-body">
          {loading ? (
            <LoadingSkeleton lines={4} />
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <button
                  type="button"
                  onClick={() => onNavigate && stats?.disputesFiled && navigateToMyDisputes(onNavigate)}
                  disabled={!onNavigate || !stats?.disputesFiled}
                  className="meta-tile hover:bg-gray-100 transition-colors disabled:cursor-default disabled:hover:bg-gray-50"
                  title={stats?.disputesFiled ? "View your cases" : undefined}
                >
                  <div className="stat-value text-2xl">{stats?.disputesFiled ?? 0}</div>
                  <div className="text-xs text-gray-800 font-semibold">Filed</div>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate?.("disputes")}
                  disabled={!onNavigate || !stats?.votesCast}
                  className="meta-tile hover:bg-gray-100 transition-colors disabled:cursor-default disabled:hover:bg-gray-50"
                  title={stats?.votesCast ? "Browse cases" : undefined}
                >
                  <div className="stat-value text-2xl">{stats?.votesCast ?? 0}</div>
                  <div className="text-xs text-gray-800 font-semibold">Votes</div>
                </button>
                <div className="meta-tile">
                  <div className="stat-value text-2xl">{stats?.casesParticipated ?? 0}</div>
                  <div className="text-xs text-gray-800 font-semibold">Total</div>
                </div>
              </div>
              {history?.disputes.length ? (
                <div>
                  <h4 className="subheading">Recent Disputes</h4>
                  <ul className="space-y-2">
                    {history.disputes.map((dispute) => (
                      <li key={dispute.id}>
                        <button
                          type="button"
                          onClick={() => onNavigate?.("disputes", dispute.id)}
                          className={`list-row flex items-center justify-between text-sm -mx-1 ${statusAccentClass(dispute.status)}`}
                        >
                          <span className="text-gray-800 font-semibold truncate pr-2 text-left">
                            #{dispute.caseNumber} {dispute.title}
                          </span>
                          <StatusWithOutcome
                            status={dispute.status}
                            resolutionOutcome={dispute.resolutionOutcome}
                          />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary mb-2">
                    <Icon name="document" size="sm" />
                  </div>
                  <p className="text-sm text-gray-800 font-semibold">No disputes filed yet.</p>
                  {onNavigate && (
                    <button
                      type="button"
                      className="link-accent mt-2"
                      onClick={() => onNavigate("dashboard")}
                    >
                      Create your first case
                    </button>
                  )}
                </div>
              )}
              {history?.votes.length ? (
                <div>
                  <h4 className="subheading">Recent Votes</h4>
                  <ul className="space-y-2">
                    {history.votes.map((vote) => (
                      <li key={vote.id}>
                        <button
                          type="button"
                          onClick={() => onNavigate?.("disputes", vote.disputeId)}
                          className={`list-row flex items-center justify-between text-sm text-gray-800 -mx-1 ${statusAccentClass(vote.disputeStatus)}`}
                        >
                          <span className="font-semibold truncate pr-2 text-left">
                            #{vote.caseNumber} — {vote.choice === "plaintiff" ? "Plaintiff" : "Defendant"}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <VoteResultBadge
                              choice={vote.choice}
                              disputeStatus={vote.disputeStatus}
                              resolutionOutcome={vote.resolutionOutcome}
                            />
                            <span className="text-xs text-gray-800 font-semibold">{timeAgo(vote.createdAt)}</span>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : !loading ? (
                <div className="text-center py-3">
                  <p className="text-sm text-gray-800 font-semibold">No votes cast yet.</p>
                  <p className="text-xs text-gray-600 mt-1">Join the jury pool to start earning AVF rewards.</p>
                </div>
              ) : null}
            </div>
          )}
          </div>
        </div>

        <RewardsInfoCard />
        <HybridArchitectureCard />

        <div className="card lg:col-span-2">
          <div className="card-header">
            <Icon name="lock" size="sm" className="text-primary" />
            <h3>Account Settings</h3>
          </div>
          <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="settings-panel">
              <h4 className="section-title text-base mb-3">Appearance</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Choose light, dark, or match your system preference.
              </p>
              <ThemeToggle variant="settings" />
            </div>
            <div className="settings-panel">
              <h4 className="section-title text-base mb-3">Privacy</h4>
              <div className="space-y-2">
                {privacySettings.map((setting) => (
                  <label key={setting.label} className="checkbox-row">
                    <input type="checkbox" defaultChecked={setting.defaultChecked} className="rounded text-primary" />
                    <Icon name={setting.icon} size="sm" className="text-primary" />
                    {setting.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="settings-panel">
              <h4 className="section-title text-base mb-3">Notifications</h4>
              <div className="space-y-2">
                {notificationSettings.map((setting) => (
                  <label key={setting.label} className="checkbox-row">
                    <input type="checkbox" defaultChecked className="rounded text-primary" />
                    <Icon name={setting.icon} size="sm" className="text-primary" />
                    {setting.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      {showEditModal && user && (
        <ProfileEditModal user={user} onClose={() => setShowEditModal(false)} />
      )}
    </>
  );
}

function ProfileEditModal({ user, onClose }: { user: NonNullable<ReturnType<typeof useUser>["user"]>; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const { setUser } = useUser();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const name = form.get("name") as string;
    const email = form.get("email") as string;

    try {
      const updated = await updateUserProfile(user.id, { name, email });
      setUser(updated);
      showToast("Profile updated successfully!", "success");
      onClose();
    } catch (err) {
      showToast(getApiErrorMessage(err, "Could not save profile"), "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Profile Settings" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-label block mb-1.5">Full Name</label>
          <input
            name="name"
            defaultValue={user.name ?? ""}
            required
            className="input-luxury"
          />
        </div>
        <div>
          <label className="text-label block mb-1.5">Email</label>
          <input
            type="email"
            name="email"
            defaultValue={user.email ?? ""}
            required
            className="input-luxury"
          />
        </div>
        <div className="space-y-2">
          <h4 className="section-title text-base mb-3">Privacy Settings</h4>
          {privacySettings.map((setting) => (
            <label key={setting.label} className="checkbox-row">
              <input type="checkbox" defaultChecked={setting.defaultChecked} className="rounded text-primary" />
              <Icon name={setting.icon} size="sm" className="text-primary" />
              {setting.label}
            </label>
          ))}
        </div>
        <div className="flex gap-3 justify-end">
          <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary inline-flex items-center gap-2" disabled={loading}>
            <Icon name="success" size="sm" className="text-white" />
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
