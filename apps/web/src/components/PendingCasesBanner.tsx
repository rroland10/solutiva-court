"use client";

import { Icon } from "./icons";
import { usePendingCases } from "@/context/PendingCasesContext";
import { navigateToMyPendingDisputes, type Page } from "@/lib/routing";

interface PendingCasesBannerProps {
  onNavigate: (page: Page, subPath?: string) => void;
  hideForDisputeId?: string;
}

export function PendingCasesBanner({ onNavigate, hideForDisputeId }: PendingCasesBannerProps) {
  const { pendingCases } = usePendingCases();

  if (pendingCases.length === 0) {
    return null;
  }

  const visibleCases = hideForDisputeId
    ? pendingCases.filter((dispute) => dispute.id !== hideForDisputeId)
    : pendingCases;

  if (visibleCases.length === 0) {
    return null;
  }

  const primary = visibleCases[0];

  return (
    <div className="banner-warning">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <span className="action-banner-icon-pending">
            <Icon name="clock" size="md" />
          </span>
          <div className="min-w-0">
            <p className="action-banner-title">
              {visibleCases.length === 1
                ? "Case awaiting activation"
                : `${visibleCases.length} cases awaiting activation`}
            </p>
            <p className="action-banner-subtitle truncate">
              Case #{primary.caseNumber} · {primary.title}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0 sm:pl-2">
          <button
            type="button"
            className="btn-action"
            onClick={() => onNavigate("disputes", primary.id)}
          >
            <Icon name="document" size="sm" className="text-white" />
            Review & Activate
          </button>
          {visibleCases.length > 1 && (
            <button
              type="button"
              className="btn-action-secondary"
              onClick={() => navigateToMyPendingDisputes(onNavigate)}
            >
              View all
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
