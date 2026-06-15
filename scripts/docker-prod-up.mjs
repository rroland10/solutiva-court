#!/usr/bin/env node

import { execSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORTS = [3000, 4000];

function stackAlreadyRunning() {
  try {
    const out = execSync(
      'docker ps --filter "name=solutiva-web-prod" --filter "name=solutiva-api-prod" --format "{{.Names}}"',
      { encoding: "utf8", cwd: root }
    );
    return out.includes("solutiva-web-prod") && out.includes("solutiva-api-prod");
  } catch {
    return false;
  }
}

function portsInUse() {
  const blocked = [];
  for (const port of PORTS) {
    try {
      const out = execSync(`lsof -ti :${port} 2>/dev/null || true`, {
        encoding: "utf8",
        cwd: root,
      }).trim();
      if (out) {
        blocked.push({ port, pids: out.split("\n").filter(Boolean) });
      }
    } catch {
      /* ignore */
    }
  }
  return blocked;
}

function main() {
  if (stackAlreadyRunning()) {
    console.log("Docker production stack is already running.");
    console.log("  Web  → http://localhost:3000");
    console.log("  API  → http://localhost:4000/health");
    console.log("\nStop with: npm run docker:prod:down");
    process.exit(0);
  }

  const blocked = portsInUse();

  if (blocked.length > 0) {
    console.error("Cannot start Docker production stack — ports already in use:\n");
    for (const { port, pids } of blocked) {
      console.error(`  • :${port} → PID(s) ${pids.join(", ")}`);
    }
    console.error("\nStop host servers first, then retry:");
    console.error("  lsof -ti :3000,:4000 | xargs kill -9 2>/dev/null");
    console.error("  npm run docker:prod:up\n");
    console.error("Or use host production instead: npm run start:prod");
    process.exit(1);
  }

  const result = spawnSync(
    "docker",
    ["compose", "-f", "docker-compose.prod.yml", "up", "--build", "-d"],
    { cwd: root, stdio: "inherit" }
  );

  process.exit(result.status ?? 1);
}

main();
