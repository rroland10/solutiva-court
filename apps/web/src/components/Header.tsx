"use client";

import { useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "./icons";
import { useUser } from "@/context/UserContext";
import { usePlatform } from "@/context/PlatformContext";
import { useActiveVoting } from "@/context/ActiveVotingContext";
import { usePendingCases } from "@/context/PendingCasesContext";
import { formatAvf, timeAgo } from "@/lib/api";
import { WalletConnectButton } from "./WalletConnectButton";
import {
  navigateToActiveDisputes,
  navigateToActivity,
  navigateToFirstPendingCase,
} from "@/lib/routing";
import { formatOutcome } from "@/lib/dispute-utils";
import { theme } from "@/lib/theme";
import { ThemeToggle } from "./ThemeToggle";

type Page = "dashboard" | "disputes" | "jury" | "profile";

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page, subPath?: string) => void;
}

const tabs: { id: Page; label: string; icon: IconName }[] = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "disputes", label: "Disputes", icon: "disputes" },
  { id: "jury", label: "Jury", icon: "jury" },
  { id: "profile", label: "Profile", icon: "profile" },
];

const READ_KEY = "solutiva-read-activities";

function loadReadIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(READ_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string>) {
  localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
}

export function Header({ currentPage, onNavigate }: HeaderProps) {
  const { user, loading } = useUser();
  const { stats, activities } = usePlatform();
  const { needsVote } = useActiveVoting();
  const { pendingCount, pendingCases } = usePendingCases();
  const [readIds, setReadIds] = useState<Set<string>>(() => loadReadIds());
  const [showNotifications, setShowNotifications] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = activities.filter((a) => !readIds.has(a.id)).length;
  const activeDisputes = stats.activeDisputes;

  function markAllRead() {
    const next = new Set(readIds);
    activities.forEach((a) => next.add(a.id));
    setReadIds(next);
    saveReadIds(next);
  }

  function markRead(id: string) {
    if (readIds.has(id)) return;
    const next = new Set(readIds);
    next.add(id);
    setReadIds(next);
    saveReadIds(next);
  }

  function toggleNotifications() {
    setShowNotifications((open) => {
      const next = !open;
      if (next) markAllRead();
      return next;
    });
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  function handleDisputesIndicator(e: React.MouseEvent) {
    e.stopPropagation();
    if (pendingCount > 0) {
      navigateToFirstPendingCase(pendingCases, onNavigate);
      return;
    }
    if (activeDisputes > 0) {
      navigateToActiveDisputes(onNavigate);
    }
  }

  return (
    <header className="glass sticky top-0 z-50 border-b border-white/20 shadow-[0_4px_24px_rgba(0,0,0,0.12)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-4 focus:z-[60] btn-glass btn-sm"
      >
        Skip to content
      </a>
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between h-16 gap-3 lg:gap-6">
          <button type="button" onClick={() => onNavigate("dashboard")} className="header-brand">
            <img
              src="/images/logo.svg"
              alt="Solutiva Court Logo"
              width={32}
              height={32}
              className="rounded-lg h-8 w-8 shrink-0"
            />
            <span className="hidden sm:inline">Solutiva Court</span>
          </button>

          <nav className="hidden lg:flex flex-1 justify-center min-w-0" aria-label="Main navigation">
            <div className="nav-rail">
              {tabs.map((tab) => {
                const isActive = currentPage === tab.id;
                const showDisputesIndicator =
                  tab.id === "disputes" && (pendingCount > 0 || activeDisputes > 0);
                const disputesIndicatorValue =
                  pendingCount > 0 ? pendingCount : activeDisputes;
                const disputesIndicatorClass =
                  pendingCount > 0 ? "nav-tab-indicator-pending" : "nav-tab-indicator-neutral";

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onNavigate(tab.id)}
                    aria-current={isActive ? "page" : undefined}
                    className={isActive ? "nav-tab-active" : "nav-tab"}
                  >
                    <Icon name={tab.icon} size="sm" className="shrink-0" />
                    <span>{tab.label}</span>
                    {showDisputesIndicator && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={handleDisputesIndicator}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleDisputesIndicator(
                              e as unknown as React.MouseEvent<HTMLSpanElement>
                            );
                          }
                        }}
                        className={disputesIndicatorClass}
                        title={
                          pendingCount > 0
                            ? `${pendingCount} pending case${pendingCount === 1 ? "" : "s"}`
                            : `${activeDisputes} active dispute${activeDisputes === 1 ? "" : "s"}`
                        }
                      >
                        {disputesIndicatorValue}
                      </span>
                    )}
                    {tab.id === "jury" && needsVote && (
                      <span className="nav-tab-indicator-urgent" title="Vote needed">
                        !
                      </span>
                    )}
                    {tab.id === "profile" && user?.isJuryMember && (
                      <span
                        className="w-2 h-2 rounded-full bg-emerald-300 ring-2 ring-emerald-300/30"
                        title="Jury pool member"
                        aria-label="Jury pool member"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <WalletConnectButton />
            <div className="header-stat-group" aria-label="User stats">
              <span className="header-stat-item">
                <Icon name="shield" size="sm" className="text-primary-light shrink-0" />
                {loading ? "…" : `${user?.trustScore ?? 0}%`}
              </span>
              <span className="header-stat-item">
                <Icon name="coins" size="sm" className="text-warning shrink-0" />
                {loading ? "…" : formatAvf(user?.avfBalance ?? 0)}
                <span className="text-white/70 text-xs font-medium">AVF</span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => onNavigate("profile")}
              className={`lg:hidden header-icon-btn ${
                currentPage === "profile" ? "bg-white/22 ring-white/30" : ""
              }`}
              aria-label="Profile"
            >
              <Icon name="profile" size="sm" />
            </button>

            <ThemeToggle variant="header" />

            <div className="relative" ref={panelRef}>
              <button
                type="button"
                className="header-icon-btn"
                aria-label="Notifications"
                aria-expanded={showNotifications}
                onClick={toggleNotifications}
              >
                <Icon name="bell" size="sm" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-danger text-white text-[10px] rounded-full min-w-[1.125rem] h-[1.125rem] px-1 flex items-center justify-center font-bold ring-2 ring-indigo-950/80">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-luxury-lg border border-gray-100 dark:border-gray-700 overflow-hidden z-50 ring-1 ring-black/5 dark:ring-white/10">
                  <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-700 font-display font-semibold text-gray-900 dark:text-gray-100 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
                    Notifications
                  </div>
                  <ul className="max-h-72 overflow-y-auto">
                    {activities.length === 0 ? (
                      <li className="px-4 py-6 text-sm text-gray-800 font-medium text-center">
                        No recent activity
                      </li>
                    ) : (
                      activities.map((activity) => {
                        const config =
                          theme.activity[activity.type as keyof typeof theme.activity] ??
                          theme.activity.resolved;
                        return (
                          <li key={activity.id}>
                            <button
                              type="button"
                              onClick={() => {
                                markRead(activity.id);
                                setShowNotifications(false);
                                navigateToActivity(activity, onNavigate);
                              }}
                              className={`w-full text-left px-4 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors ${
                                readIds.has(activity.id) ? "opacity-90" : ""
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <Icon
                                  name={config.icon}
                                  size="sm"
                                  className="text-primary mt-0.5 shrink-0"
                                />
                                <div>
                                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {activity.title}
                                  </p>
                                  {activity.type === "resolved" &&
                                    activity.metadata?.resolutionOutcome && (
                                      <p className="text-xs text-blue-600 mt-0.5">
                                        {formatOutcome(activity.metadata.resolutionOutcome)}
                                      </p>
                                    )}
                                  {activity.type === "vote" && activity.metadata?.choice && (
                                    <p className="text-xs text-gray-800 mt-0.5 capitalize">
                                      Voted: {activity.metadata.choice}
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-800 font-semibold mt-0.5">
                                    {timeAgo(activity.createdAt)}
                                  </p>
                                </div>
                              </div>
                            </button>
                          </li>
                        );
                      })
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
