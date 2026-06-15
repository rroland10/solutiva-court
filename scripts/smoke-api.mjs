#!/usr/bin/env node

const API_URL = process.env.API_URL ?? "http://localhost:4000";

const checks = [
  { path: "/health", label: "health" },
  { path: "/api/stats", label: "platform stats" },
  { path: "/api/stats/activities", label: "activities" },
  { path: "/api/stats/queues", label: "queue stats" },
  { path: "/api/disputes", label: "disputes list" },
  { path: "/api/disputes/counts", label: "dispute counts" },
  { path: "/api/users/demo", label: "demo user" },
];

async function check({ path, label }) {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) {
    throw new Error(`${label} (${path}) returned ${res.status}`);
  }
  return res.json();
}

async function main() {
  console.log(`Smoke testing API at ${API_URL}\n`);

  for (const item of checks) {
    const data = await check(item);
    const preview =
      Array.isArray(data) ? `${data.length} items` : JSON.stringify(data).slice(0, 80);
    console.log(`✓ ${item.label}: ${preview}`);
  }

  const user = await check({ path: "/api/users/demo", label: "demo user" });
  if (user?.id) {
    await check({ path: `/api/users/${user.id}/stats`, label: "user stats" });
    console.log("✓ user stats: ok");

    const history = await check({ path: `/api/users/${user.id}/history`, label: "user history" });
    const resolvedInHistory = history.disputes?.find((d) => d.status === "RESOLVED");
    if (resolvedInHistory && !resolvedInHistory.resolutionOutcome) {
      throw new Error("user history missing resolutionOutcome on resolved dispute");
    }
    console.log("✓ user history: ok");
  }

  const disputes = await check({ path: "/api/disputes", label: "disputes list" });

  const notFound = await fetch(`${API_URL}/api/disputes/nonexistent-dispute-id`);
  if (notFound.status !== 404) {
    throw new Error(`expected 404 for missing dispute, got ${notFound.status}`);
  }
  console.log("✓ dispute detail: 404 for missing case");

  const contractCases = await check({
    path: "/api/disputes?category=CONTRACT",
    label: "contract disputes",
  });
  if (Array.isArray(contractCases)) {
    console.log(`✓ category filter: ${contractCases.length} contract case(s)`);
  }

  const searchCases = await check({
    path: "/api/disputes?q=contract",
    label: "search disputes",
  });
  if (Array.isArray(searchCases) && searchCases.length === 0) {
    throw new Error("expected search to match at least one contract case");
  }
  console.log(`✓ search filter: ${searchCases.length} case(s) for "contract"`);

  if (user?.id) {
    const withVotes = await check({
      path: `/api/disputes?userId=${user.id}`,
      label: "disputes with user votes",
    });
    if (!Array.isArray(withVotes) || !withVotes.every((d) => "userVote" in d)) {
      throw new Error("expected userVote on disputes when userId is provided");
    }
    const voted = withVotes.filter((d) => d.userVote);
    console.log(`✓ user vote on list: ${voted.length} case(s) with votes`);
  }

  if (user?.id) {
    const myCases = await check({
      path: `/api/disputes?plaintiffId=${user.id}`,
      label: "plaintiff disputes",
    });
    if (Array.isArray(myCases)) {
      console.log(`✓ plaintiff filter: ${myCases.length} case(s) filed by demo user`);
    }

    const myCounts = await check({
      path: `/api/disputes/counts?plaintiffId=${user.id}`,
      label: "plaintiff dispute counts",
    });
    if (myCounts?.ALL !== myCases.length) {
      throw new Error("plaintiff counts mismatch list filter length");
    }
    console.log(`✓ plaintiff counts: ${myCounts.ALL} total, ${myCounts.PENDING} pending`);
  }

  const resolved = Array.isArray(disputes)
    ? disputes.find((d) => d.status === "RESOLVED")
    : null;

  if (resolved?.id) {
    const detail = await check({
      path: `/api/disputes/${resolved.id}`,
      label: "resolved dispute detail",
    });
    if (!detail.resolutionOutcome) {
      throw new Error("resolved dispute missing resolutionOutcome");
    }
    console.log(`✓ resolved dispute outcome: ${detail.resolutionOutcome}`);
  }

  const active = Array.isArray(disputes)
    ? disputes.find((d) => d.status === "ACTIVE" && d.voteCount > 0)
    : null;
  const pending = Array.isArray(disputes)
    ? disputes.find((d) => d.status === "PENDING")
    : null;

  if (pending?.id && user?.id) {
    const pendingFilter = await check({
      path: `/api/disputes?status=PENDING&plaintiffId=${user.id}`,
      label: "pending plaintiff disputes",
    });
    if (!Array.isArray(pendingFilter) || pendingFilter.length === 0) {
      throw new Error("expected pending plaintiff disputes from combined filter");
    }
    console.log(`✓ pending plaintiff filter: ${pendingFilter.length} case(s)`);

    const skipResolve = await fetch(`${API_URL}/api/disputes/${pending.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "RESOLVED", userId: user.id }),
    });
    if (skipResolve.status !== 400) {
      throw new Error(`expected 400 resolving pending case, got ${skipResolve.status}`);
    }
    console.log("✓ status transition: blocked PENDING → RESOLVED");
  }

  if (active?.voteTally) {
    console.log(
      `✓ active dispute tally: ${active.voteTally.plaintiffPct}% / ${active.voteTally.defendantPct}%`
    );

    const suggestionRes = await fetch(
      `${API_URL}/api/disputes/${active.id}/suggest-resolution`,
      { method: "POST" }
    );
    if (!suggestionRes.ok) {
      throw new Error(`expected suggest-resolution on active case, got ${suggestionRes.status}`);
    }
    const suggestionBody = await suggestionRes.json();
    if (typeof suggestionBody.recommendation !== "string" || !suggestionBody.recommendation) {
      throw new Error("expected recommendation string from suggest-resolution");
    }
    console.log("✓ suggest-resolution: ok");
  }

  const counts = await check({ path: "/api/disputes/counts", label: "dispute counts" });
  if (counts?.byCategory?.CONTRACT !== undefined) {
    console.log(`✓ category counts: ${counts.byCategory.CONTRACT} contract case(s)`);
  }

  if (active?.id) {
    const voting = await check({
      path: `/api/disputes/active/voting?userId=${user?.id ?? ""}`,
      label: "active voting",
    });
    if (voting && typeof voting.caseNumber === "number") {
      console.log(`✓ active voting case: #${voting.caseNumber}`);
    }

    const forbidden = await fetch(`${API_URL}/api/disputes/${active.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "RESOLVED", userId: "unauthorized-user" }),
    });
    if (forbidden.status !== 403) {
      throw new Error(`expected 403 for non-plaintiff status update, got ${forbidden.status}`);
    }
    console.log("✓ status update authorization: 403 for non-plaintiff");

    const missingUser = await fetch(`${API_URL}/api/disputes/${active.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "RESOLVED" }),
    });
    if (missingUser.status !== 400) {
      throw new Error(`expected 400 for missing userId, got ${missingUser.status}`);
    }
    console.log("✓ status update validation: 400 without userId");

    if (user?.isJuryMember) {
      const voteRes = await fetch(`${API_URL}/api/disputes/${active.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, choice: "plaintiff" }),
      });
      if (!voteRes.ok) {
        throw new Error(`expected vote on active case, got ${voteRes.status}`);
      }
      const voteBody = await voteRes.json();
      if (!voteBody.vote?.id || typeof voteBody.rewarded !== "boolean") {
        throw new Error("expected vote response with vote.id and rewarded flag");
      }
      if (voteBody.rewarded) {
        console.log("✓ vote response: rewarded on first vote");
      } else {
        console.log("✓ vote response: no reward when vote already exists");
      }

      const revoteRes = await fetch(`${API_URL}/api/disputes/${active.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, choice: "defendant" }),
      });
      if (!revoteRes.ok) {
        throw new Error(`expected vote update, got ${revoteRes.status}`);
      }
      const revoteBody = await revoteRes.json();
      if (revoteBody.rewarded !== false) {
        throw new Error("expected rewarded: false on vote update");
      }
      console.log("✓ vote response: no reward on re-vote");
    }
  }

  const chainConfig = await check({ path: "/api/chain/config", label: "chain config" });
  if (typeof chainConfig.enabled !== "boolean" || !chainConfig.avfToken?.address) {
    throw new Error("chain config missing enabled flag or AVF token address");
  }
  console.log(
    `✓ chain config: ${chainConfig.network} · enabled=${chainConfig.enabled} · escrowReady=${chainConfig.escrowReady}`
  );

  const chainHealth = await check({ path: "/api/chain/health", label: "chain health" });
  if (!chainHealth.status) {
    throw new Error("chain health missing status");
  }
  console.log(`✓ chain health: ${chainHealth.status}`);

  if (user?.walletAddress) {
    const balance = await check({
      path: `/api/chain/balance/${user.walletAddress}`,
      label: "chain balance",
    });
    if (typeof balance.avfBalance !== "number") {
      throw new Error("chain balance missing avfBalance");
    }
    console.log(`✓ chain balance: ${balance.avfBalance} AVF (${balance.source})`);
  }

  if (resolved?.id && user?.id) {
    const voteBlocked = await fetch(`${API_URL}/api/disputes/${resolved.id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, choice: "plaintiff" }),
    });
    if (voteBlocked.status !== 400) {
      throw new Error(`expected 400 voting on resolved case, got ${voteBlocked.status}`);
    }
    console.log("✓ vote validation: blocked on resolved case");

    const reopenBlocked = await fetch(`${API_URL}/api/disputes/${resolved.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ACTIVE", userId: user.id }),
    });
    if (reopenBlocked.status !== 400) {
      throw new Error(`expected 400 reopening resolved case, got ${reopenBlocked.status}`);
    }
    console.log("✓ status transition: blocked RESOLVED → ACTIVE");
  }

  console.log("\nAll smoke checks passed.");
}

main().catch((err) => {
  console.error("\nSmoke test failed:", err.message);
  process.exit(1);
});
