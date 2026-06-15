#!/usr/bin/env node

import { execSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_URL = process.env.API_URL ?? "http://localhost:4000";
const VERIFY_WEB_PORT = Number(process.env.VERIFY_WEB_PORT ?? 3099);

async function isReachable(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function run(command, env = process.env) {
  execSync(command, { cwd: root, stdio: "inherit", env });
}

async function runWebSmokeOnProduction() {
  const webUrl = `http://localhost:${VERIFY_WEB_PORT}`;
  const proc = spawn(
    "npm",
    [
      "run",
      "start",
      "--workspace=apps/web",
      "--",
      "-p",
      String(VERIFY_WEB_PORT),
      "-H",
      "127.0.0.1",
    ],
    { cwd: root, stdio: "ignore", env: process.env }
  );

  let started = false;
  for (let i = 0; i < 120; i++) {
    if (await isReachable(webUrl)) {
      started = true;
      break;
    }
    await sleep(500);
  }

  if (!started) {
    proc.kill("SIGTERM");
    throw new Error(`Production web server did not start on ${webUrl}`);
  }

  try {
    run(`node scripts/smoke-web.mjs`, { ...process.env, WEB_URL: webUrl });
  } finally {
    proc.kill("SIGTERM");
  }
}

async function main() {
  if (process.env.VERIFY_SKIP_BUILD !== "1") {
    console.log("Verifying Solutiva Court build...\n");
    run("npm run build");
  } else {
    console.log("Skipping build (VERIFY_SKIP_BUILD=1)\n");
  }

  console.log("\nChecking runtime smoke tests...\n");

  if (await isReachable(`${API_URL}/health`)) {
    run("node scripts/smoke-api.mjs");
  } else {
    console.warn(`⚠ API not reachable at ${API_URL} — skipping smoke:api`);
  }

  console.log(`Starting production web server on ${VERIFY_WEB_PORT} for smoke:web...`);
  await runWebSmokeOnProduction();

  console.log("\nVerify complete.");
}

main().catch((err) => {
  console.error("\nVerify failed:", err.message);
  process.exit(1);
});
