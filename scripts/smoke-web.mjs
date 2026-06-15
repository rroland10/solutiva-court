#!/usr/bin/env node

const WEB_URL = process.env.WEB_URL ?? "http://localhost:3000";
const API_URL = process.env.API_URL ?? "http://localhost:4000";

const routes = [
  "/",
  "/disputes",
  "/disputes?status=PENDING",
  "/disputes?status=ACTIVE",
  "/disputes?q=contract",
  "/disputes?category=CONTRACT",
  "/disputes?mine=1",
  "/disputes?status=PENDING&mine=1",
  "/jury",
  "/profile",
  "/dashboard",
  "/sitemap.xml",
  "/robots.txt",
];

async function check(path) {
  const res = await fetch(`${WEB_URL}${path}`);
  if (!res.ok) {
    throw new Error(`${path} returned ${res.status}`);
  }
  const body = await res.text();
  if (path.endsWith(".xml")) {
    if (!body.includes("<urlset") && !body.includes("<sitemapindex")) {
      throw new Error(`${path} missing sitemap XML`);
    }
    return res.status;
  }
  if (path.endsWith(".txt")) {
    if (!body.includes("User-agent") && !body.toLowerCase().includes("disallow")) {
      throw new Error(`${path} missing robots.txt content`);
    }
    return res.status;
  }
  if (!body.includes("Solutiva Court")) {
    throw new Error(`${path} missing expected page content`);
  }
  return res.status;
}

async function main() {
  console.log(`Smoke testing web app at ${WEB_URL}\n`);

  for (const path of routes) {
    const status = await check(path);
    console.log(`✓ ${path} (${status})`);
  }

  const disputesRes = await fetch(`${API_URL}/api/disputes`);
  if (disputesRes.ok) {
    const disputes = await disputesRes.json();
    const id = Array.isArray(disputes) ? disputes[0]?.id : null;
    if (id) {
      const path = `/disputes/${id}`;
      const status = await check(path);
      console.log(`✓ ${path} (${status})`);
    }
  }

  console.log("\nAll web smoke checks passed.");
}

main().catch((err) => {
  console.error("\nWeb smoke test failed:", err.message);
  process.exit(1);
});
