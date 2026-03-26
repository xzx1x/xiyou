import { config as loadEnv } from "dotenv";
import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

loadEnv();

const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;
const sepoliaRpcUrl =
  process.env.SEPOLIA_RPC_URL ??
  process.env.CAMPUS_CHAIN_RPC_URL ??
  "http://127.0.0.1:8545";
const defaultLocalChainId = 31337;
const sepoliaChainId = process.env.SEPOLIA_CHAIN_ID
  ? Number(process.env.SEPOLIA_CHAIN_ID)
  : process.env.CAMPUS_CHAIN_ID
    ? Number(process.env.CAMPUS_CHAIN_ID)
    : sepoliaRpcUrl.includes("127.0.0.1") || sepoliaRpcUrl.includes("localhost")
      ? defaultLocalChainId
    : 11155111;
const defaultLocalPrivateKey =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const sepoliaAccounts =
  deployerPrivateKey ??
  (sepoliaRpcUrl.includes("127.0.0.1") || sepoliaRpcUrl.includes("localhost")
    ? defaultLocalPrivateKey
    : undefined);

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {},
    sepolia: {
      url: sepoliaRpcUrl,
      chainId: sepoliaChainId,
      accounts: sepoliaAccounts ? [sepoliaAccounts] : [],
    },
    campusChain: {
      url: sepoliaRpcUrl,
      chainId: sepoliaChainId,
      accounts: sepoliaAccounts ? [sepoliaAccounts] : [],
    },
  },
};

export default config;
