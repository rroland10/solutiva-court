import type { Metadata } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function formatOutcome(outcome?: string | null): string {
  if (outcome === "plaintiff") return "Plaintiff wins";
  if (outcome === "defendant") return "Defendant wins";
  if (outcome === "tie") return "Split jury (tie)";
  return "";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const res = await fetch(`${apiUrl}/api/disputes/${encodeURIComponent(id)}`, {
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return { title: "Case Not Found" };
    }

    const dispute = (await res.json()) as {
      caseNumber: number;
      title: string;
      description?: string;
      status?: string;
      resolutionOutcome?: string | null;
    };

    const statusLabel = dispute.status
      ? dispute.status.charAt(0) + dispute.status.slice(1).toLowerCase()
      : "";
    const outcomeLabel = formatOutcome(dispute.resolutionOutcome);
    const metaParts = [
      dispute.description?.slice(0, 120),
      statusLabel && `Status: ${statusLabel}`,
      outcomeLabel && `Outcome: ${outcomeLabel}`,
    ].filter(Boolean);

    const description = metaParts.join(" · ");
    const pageTitle = `Case #${dispute.caseNumber} — ${dispute.title}`;

    return {
      title: pageTitle,
      description,
      openGraph: {
        title: pageTitle,
        description,
        type: "article",
      },
      twitter: {
        card: "summary",
        title: pageTitle,
        description,
      },
    };
  } catch {
    return { title: "Dispute Case" };
  }
}

export default function DisputeCaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
