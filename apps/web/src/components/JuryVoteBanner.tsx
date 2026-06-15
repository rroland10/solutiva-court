"use client";

import { Icon } from "./icons";
import { VoteTallyBar } from "./VoteTallyBar";
import { useUser } from "@/context/UserContext";
import { useActiveVoting } from "@/context/ActiveVotingContext";
import type { Page } from "@/lib/routing";

interface JuryVoteBannerProps {
  onNavigate: (page: Page, subPath?: string) => void;
  hideForDisputeId?: string;
}

export function JuryVoteBanner({ onNavigate, hideForDisputeId }: JuryVoteBannerProps) {
  const { user } = useUser();
  const { activeCase } = useActiveVoting();

  if (
    !user?.isJuryMember ||
    !activeCase ||
    activeCase.userVote ||
    (hideForDisputeId && activeCase.id === hideForDisputeId)
  ) {
    return null;
  }

  return (
    <div className="banner-primary">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <span className="action-banner-icon-vote">
            <Icon name="vote" size="md" />
          </span>
          <div className="min-w-0">
            <p className="action-banner-title">Your vote is needed</p>
            <p className="action-banner-subtitle truncate">
              Case #{activeCase.caseNumber} · {activeCase.title}
            </p>
            <div className="mt-2.5 max-w-xs">
              <VoteTallyBar
                plaintiffPct={activeCase.tally.plaintiff}
                defendantPct={activeCase.tally.defendant}
                variant="compact"
                tone="dark"
              />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0 sm:pl-2">
          <button
            type="button"
            className="btn-action-secondary"
            onClick={() => onNavigate("disputes", activeCase.id)}
          >
            <Icon name="document" size="sm" />
            View case
          </button>
          <button type="button" className="btn-action" onClick={() => onNavigate("jury")}>
            <Icon name="vote" size="sm" className="text-white" />
            Vote now
          </button>
        </div>
      </div>
    </div>
  );
}
