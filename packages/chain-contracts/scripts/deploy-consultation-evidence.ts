import { ethers } from "hardhat";

async function main() {
  const registry = await ethers.deployContract("ConsultationEvidenceRegistry");
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  const network = await ethers.provider.getNetwork();

  console.log("ConsultationEvidenceRegistry deployed");
  console.log(`network chainId: ${network.chainId.toString()}`);
  console.log(`contract address: ${address}`);
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
