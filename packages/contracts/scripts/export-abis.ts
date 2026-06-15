import { copyFileSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";
import hre from "hardhat";

const CONTRACTS = ["AVF", "DisputeEscrow", "OutcomeRegistry"];

async function main() {
  await hre.run("compile");

  const artifactDir = join(__dirname, "..", "artifacts", "contracts");
  const targets = [
    join(__dirname, "..", "..", "..", "apps", "api", "src", "abi"),
    join(__dirname, "..", "..", "..", "apps", "web", "src", "abi"),
  ];

  for (const target of targets) {
    mkdirSync(target, { recursive: true });
  }

  for (const name of CONTRACTS) {
    const source = join(artifactDir, `${name}.sol`, `${name}.json`);
    for (const target of targets) {
      copyFileSync(source, join(target, `${name}.json`));
    }
    console.log(`Exported ${name}.json`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
