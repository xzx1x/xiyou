import { ethers } from "hardhat";

async function main() {
  const registry = await ethers.deployContract("AssessmentEvidenceRegistry");
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  const network = await ethers.provider.getNetwork();

  console.log("AssessmentEvidenceRegistry deployed");
  console.log(`network chainId: ${network.chainId.toString()}`);
  console.log(`contract address: ${address}`);
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
