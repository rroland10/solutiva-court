"use client";

import { Icon, type IconName } from "./icons";
import { usePlatform } from "@/context/PlatformContext";
import { useActiveVoting } from "@/context/ActiveVotingContext";
import { usePendingCases } from "@/context/PendingCasesContext";
import {
  navigateToActiveDisputes,
  navigateToFirstPendingCase,
  type Page,
} from "@/lib/routing";

const tabs: { id: Page; label: string; icon: IconName }[] = [
  { id: "dashboard", label: "Home", icon: "dashboard" },
  { id: "disputes", label: "Cases", icon: "disputes" },
  { id: "jury", label: "Jury", icon: "jury" },
  { id: "profile", label: "Profile", icon: "profile" },
];

interface MobileBottomNavProps {
  currentPage: Page;
  onNavigate: (page: Page, subPath?: string) => void;
}

export function MobileBottomNav({ currentPage, onNavigate }: MobileBottomNavProps) {
  const { stats } = usePlatform();
  const { needsVote } = useActiveVoting();
  const { pendingCount, pendingCases } = usePendingCases();
  const activeDisputes = stats.activeDisputes;

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 glass border-t border-white/25 shadow-[0_-8px_32px_rgba(0,0,0,0.2)] safe-area-pb"
      aria-label="Mobile navigation"
    >
      <div className="flex items-stretch justify-around px-2 py-2">
        {tabs.map((tab) => {
          const active = currentPage === tab.id;
          return (
            <div key={tab.id} className="relative flex flex-1">
              <button
                type="button"
                onClick={() => onNavigate(tab.id)}
                className={`flex w-full flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-white/15 text-white ring-1 ring-gold/40"
                    : "text-white/85 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon name={tab.icon} size="sm" />
                <span>{tab.label}</span>
              </button>
              {tab.id === "disputes" && activeDisputes > 0 && (
                <button
                  type="button"
                  onClick={() => navigateToActiveDisputes(onNavigate)}
                  className={`absolute top-0.5 min-w-4 h-4 px-1 rounded-full bg-white/25 text-white text-xs flex items-center justify-center font-semibold hover:bg-white/35 transition-colors ${
                    pendingCount > 0 ? "right-7" : "right-2"
                  }`}
                  title="View active disputes"
                >
                  {activeDisputes > 9 ? "9+" : activeDisputes}
                </button>
              )}
              {tab.id === "disputes" && pendingCount > 0 && (
                <button
                  type="button"
                  onClick={() => navigateToFirstPendingCase(pendingCases, onNavigate)}
                  className="absolute top-0.5 right-2 min-w-4 h-4 px-1 rounded-full bg-amber-300 text-amber-950 text-xs flex items-center justify-center font-semibold hover:bg-amber-200 transition-colors"
                  title="Review pending case"
                >
                  {pendingCount > 9 ? "9+" : pendingCount}
                </button>
              )}
              {tab.id === "jury" && needsVote && (
                <button
                  type="button"
                  onClick={() => onNavigate("jury")}
                  className="absolute top-0.5 right-2 min-w-4 h-4 px-1 rounded-full bg-danger text-white text-xs flex items-center justify-center font-semibold hover:bg-red-600 transition-colors"
                  title="Vote now on active case"
                >
                  !
                </button>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
