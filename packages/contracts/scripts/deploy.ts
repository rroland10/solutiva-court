import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import hre from "hardhat";

const OFFICIAL_AVF_SEPOLIA = "0x45D39B5C90685AF368EecbacB6EB7bbA6f9B1936";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const externalAvf = process.env.EXTERNAL_AVF_TOKEN ?? process.env.AVF_TOKEN_ADDRESS;
  let avfAddress: string;

  if (externalAvf?.startsWith("0x")) {
    avfAddress = externalAvf;
    console.log("Using existing AVF_Token:", avfAddress);
  } else {
    const AVF = await hre.ethers.getContractFactory("AVF");
    const avf = await AVF.deploy(deployer.address);
    await avf.waitForDeployment();
    avfAddress = await avf.getAddress();
    console.log("Deployed local AVF:", avfAddress);
  }

  const DisputeEscrow = await hre.ethers.getContractFactory("DisputeEscrow");
  const escrow = await DisputeEscrow.deploy(avfAddress, deployer.address);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("DisputeEscrow:", escrowAddress);

  const OutcomeRegistry = await hre.ethers.getContractFactory("OutcomeRegistry");
  const registry = await OutcomeRegistry.deploy(deployer.address);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("OutcomeRegistry:", registryAddress);

  if (!externalAvf?.startsWith("0x")) {
    const avf = await hre.ethers.getContractAt("AVF", avfAddress);
    await avf.setMinter(escrowAddress, true);
    await avf.setMinter(deployer.address, true);
  }

  const chainId = (await hre.ethers.provider.getNetwork()).chainId.toString();
  const deployment = {
    chainId,
    avf: avfAddress,
    avfSource:
      avfAddress.toLowerCase() === OFFICIAL_AVF_SEPOLIA.toLowerCase()
        ? "https://github.com/EthereumCommonwealth/AVF_Token"
        : "local",
    disputeEscrow: escrowAddress,
    outcomeRegistry: registryAddress,
    deployedAt: new Date().toISOString(),
  };

  const outDir = join(__dirname, "..", "deployments");
  mkdirSync(outDir, { recursive: true });
  const file = join(outDir, `${deployment.chainId}.json`);
  writeFileSync(file, JSON.stringify(deployment, null, 2));
  console.log("Wrote", file);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
