import { BrowserProvider, Contract } from "ethers";
import { getRequiredEthereumProvider, TARGET_CHAIN } from "./wallet";

const ASSESSMENT_EVIDENCE_ABI = [
  "function recordAssessmentWithSignature(bytes32 assessmentKey,uint8 assessmentType,bytes32 recordHash,bytes ownerSignature) returns (uint256 revision)",
] as const;

export async function submitAssessmentEvidenceWithWallet(input: {
  assessmentKey: string;
  assessmentTypeCode: number;
  recordHash: string;
  contractAddress: string;
  authorizationSignature: string;
}) {
  const provider = await getRequiredEthereumProvider();

  const browserProvider = new BrowserProvider(provider);
  const network = await browserProvider.getNetwork();
  if (Number(network.chainId) !== TARGET_CHAIN.chainId) {
    throw new Error(`请先切换到 ${TARGET_CHAIN.chainName} 后再提交。`);
  }

  const signer = await browserProvider.getSigner();
  const contract = new Contract(input.contractAddress, ASSESSMENT_EVIDENCE_ABI, signer);

  const tx = await contract.recordAssessmentWithSignature(
    input.assessmentKey,
    input.assessmentTypeCode,
    input.recordHash,
    input.authorizationSignature,
  );
  const receipt = await tx.wait();

  return {
    txHash: tx.hash as string,
    blockNumber:
      receipt?.blockNumber === null || receipt?.blockNumber === undefined
        ? null
        : Number(receipt.blockNumber),
  };
}
