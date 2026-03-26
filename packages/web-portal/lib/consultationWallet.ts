import { BrowserProvider, Contract } from "ethers";
import { getRequiredEthereumProvider, TARGET_CHAIN } from "./wallet";

const CONSULTATION_EVIDENCE_ABI = [
  "function recordConsultationWithSignature(string consultationId,string appointmentId,bytes32 recordHash,bytes ownerSignature) returns (uint256 revision)",
] as const;

export async function submitConsultationEvidenceWithWallet(input: {
  consultationId: string;
  appointmentId: string;
  recordHash: string;
  contractAddress: string;
  authorizationSignature: string;
}) {
  const provider = await getRequiredEthereumProvider();

  const browserProvider = new BrowserProvider(provider);
  const network = await browserProvider.getNetwork();
  if (Number(network.chainId) !== TARGET_CHAIN.chainId) {
    throw new Error(`Please switch to ${TARGET_CHAIN.chainName} before submitting.`);
  }

  const signer = await browserProvider.getSigner();
  const contract = new Contract(input.contractAddress, CONSULTATION_EVIDENCE_ABI, signer);

  const tx = await contract.recordConsultationWithSignature(
    input.consultationId,
    input.appointmentId,
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
