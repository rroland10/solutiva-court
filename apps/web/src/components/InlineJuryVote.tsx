"use client";

import { useEffect, useState } from "react";
import { Icon } from "./icons";
import { VoteTallyBar } from "./VoteTallyBar";
import { useToast } from "./Toast";
import { useUser } from "@/context/UserContext";
import { submitVote, apiFetch, getApiErrorMessage, type DisputeDetail } from "@/lib/api";
import { voteTally } from "@/lib/dispute-utils";

interface InlineJuryVoteProps {
  detail: DisputeDetail;
  onVoted: (updated: DisputeDetail) => void;
}

export function InlineJuryVote({ detail, onVoted }: InlineJuryVoteProps) {
  const { user, refreshUser } = useUser();
  const { showToast } = useToast();
  const [choice, setChoice] = useState<string | null>(detail.userVote ?? null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setChoice(detail.userVote ?? null);
  }, [detail.userVote, detail.id]);

  if (!user?.isJuryMember || detail.status !== "ACTIVE") {
    return null;
  }

  const tally = voteTally(detail);
  const hasVoted = Boolean(detail.userVote);

  async function handleSubmit() {
    if (!choice || !user) {
      showToast("Select plaintiff or defendant", "warning");
      return;
    }

    setLoading(true);
    try {
      const result = await submitVote(detail.id, user.id, choice as "plaintiff" | "defendant");
      const query = `?userId=${encodeURIComponent(user.id)}`;
      const updated = await apiFetch<DisputeDetail>(`/api/disputes/${detail.id}${query}`);
      onVoted(updated);
      showToast(
        hasVoted || !result.rewarded
          ? hasVoted
            ? "Vote updated"
            : "Vote submitted!"
          : "Vote submitted! +10 AVF and +1 trust earned.",
        "success"
      );
      await refreshUser().catch(() => {});
    } catch (err) {
      showToast(getApiErrorMessage(err, "Could not submit vote"), "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel-inset bg-gradient-to-br from-primary/5 to-white border-primary/20">
      <h4 className="section-title text-lg mb-4">
        <Icon name="vote" size="sm" className="text-primary" />
        {hasVoted ? "Update Your Vote" : "Cast Your Vote"}
      </h4>
      {tally.total > 0 && (
        <div className="mb-4">
          <VoteTallyBar
            plaintiffPct={tally.plaintiffPct}
            defendantPct={tally.defendantPct}
            plaintiffCount={tally.plaintiff}
            defendantCount={tally.defendant}
          />
        </div>
      )}
      <div className="space-y-2 mb-4">
        {[
          { id: "plaintiff", label: "Rule for Plaintiff" },
          { id: "defendant", label: "Rule for Defendant" },
        ].map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setChoice(option.id)}
            className={`w-full flex justify-between items-center p-3.5 rounded-xl border-2 transition-all ${
              choice === option.id
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-gray-200 hover:border-primary/50 bg-white"
            }`}
          >
            <span className="font-semibold text-gray-900 inline-flex items-center gap-2">
              <Icon
                name="scale"
                size="sm"
                className={choice === option.id ? "text-primary" : "text-gray-800"}
              />
              {option.label}
            </span>
          </button>
        ))}
      </div>
      <button
        type="button"
        className="btn-primary w-full inline-flex items-center justify-center gap-2"
        onClick={handleSubmit}
        disabled={loading || !choice}
      >
        <Icon name="vote" size="sm" className="text-white" />
        {loading ? "Submitting..." : hasVoted ? "Update Vote" : "Submit Vote"}
      </button>
    </div>
  );
}
