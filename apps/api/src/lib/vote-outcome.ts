export type ResolutionOutcome = "plaintiff" | "defendant" | "tie";

export function computeResolutionOutcome(
  votes: { choice: string }[]
): ResolutionOutcome {
  let plaintiff = 0;
  let defendant = 0;

  for (const vote of votes) {
    if (vote.choice === "plaintiff") plaintiff++;
    else if (vote.choice === "defendant") defendant++;
  }

  if (plaintiff > defendant) return "plaintiff";
  if (defendant > plaintiff) return "defendant";
  return "tie";
}

export function outcomeLabel(outcome: string | null | undefined): string {
  if (outcome === "plaintiff") return "Plaintiff wins";
  if (outcome === "defendant") return "Defendant wins";
  if (outcome === "tie") return "Split jury (tie)";
  return "Outcome pending";
}
