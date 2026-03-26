export type WalletTargetChain = {
  chainId: number;
  chainIdHex: `0x${string}`;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
};

export type WalletState = {
  available: boolean;
  connected: boolean;
  address: string | null;
  chainId: number | null;
};

type ProviderRequestArgs = {
  method: string;
  params?: unknown[] | Record<string, unknown>;
};

export type EthereumProvider = {
  isMetaMask?: boolean;
  providers?: EthereumProvider[];
  request: <T = unknown>(args: ProviderRequestArgs) => Promise<T>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

const DEFAULT_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 11155111);
const DEFAULT_CHAIN_HEX = `0x${DEFAULT_CHAIN_ID.toString(16)}` as const;
const PROVIDER_WAIT_TIMEOUT_MS = 3000;
const PROVIDER_WAIT_INTERVAL_MS = 100;

export const TARGET_CHAIN: WalletTargetChain = {
  chainId: DEFAULT_CHAIN_ID,
  chainIdHex: DEFAULT_CHAIN_HEX,
  chainName: process.env.NEXT_PUBLIC_CHAIN_NAME ?? "Sepolia",
  nativeCurrency: {
    name: process.env.NEXT_PUBLIC_CHAIN_CURRENCY_NAME ?? "Ether",
    symbol: process.env.NEXT_PUBLIC_CHAIN_CURRENCY_SYMBOL ?? "ETH",
    decimals: 18,
  },
  rpcUrls: [process.env.NEXT_PUBLIC_CHAIN_RPC_URL ?? "https://rpc.sepolia.org"],
  blockExplorerUrls: [
    process.env.NEXT_PUBLIC_CHAIN_EXPLORER_URL ?? "https://sepolia.etherscan.io",
  ],
};

function listInjectedProviders() {
  if (typeof window === "undefined") {
    return [];
  }

  const provider = window.ethereum;
  if (!provider) {
    return [];
  }

  if (Array.isArray(provider.providers) && provider.providers.length > 0) {
    return provider.providers;
  }

  return [provider];
}

export function getEthereumProvider() {
  const providers = listInjectedProviders();
  if (providers.length === 0) {
    return null;
  }
  return providers.find((provider) => provider.isMetaMask) ?? providers[0] ?? null;
}

export async function waitForEthereumProvider(timeoutMs = PROVIDER_WAIT_TIMEOUT_MS) {
  const existing = getEthereumProvider();
  if (existing) {
    return existing;
  }

  if (typeof window === "undefined") {
    return null;
  }

  return new Promise<EthereumProvider | null>((resolve) => {
    let finished = false;

    const cleanup = () => {
      finished = true;
      window.removeEventListener("ethereum#initialized", handleInitialized as EventListener);
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };

    const complete = (provider: EthereumProvider | null) => {
      if (finished) {
        return;
      }
      cleanup();
      resolve(provider);
    };

    const tryResolve = () => {
      const provider = getEthereumProvider();
      if (provider) {
        complete(provider);
      }
    };

    const handleInitialized = () => {
      tryResolve();
    };

    const intervalId = window.setInterval(tryResolve, PROVIDER_WAIT_INTERVAL_MS);
    const timeoutId = window.setTimeout(() => complete(null), timeoutMs);

    window.addEventListener("ethereum#initialized", handleInitialized as EventListener, {
      once: true,
    });

    tryResolve();
  });
}

async function requireEthereumProvider() {
  const provider = await waitForEthereumProvider();
  if (!provider) {
    throw new Error("未检测到 MetaMask，请确认扩展已启用，并刷新页面后重试。");
  }
  return provider;
}

export async function readWalletState(): Promise<WalletState> {
  const provider = await waitForEthereumProvider();
  if (!provider) {
    return {
      available: false,
      connected: false,
      address: null,
      chainId: null,
    };
  }

  const [accounts, chainIdHex] = await Promise.all([
    provider.request<string[]>({ method: "eth_accounts" }),
    provider.request<string>({ method: "eth_chainId" }),
  ]);

  const address = accounts[0] ?? null;
  return {
    available: true,
    connected: Boolean(address),
    address,
    chainId: chainIdHex ? Number.parseInt(chainIdHex, 16) : null,
  };
}

export async function connectWallet() {
  const provider = await requireEthereumProvider();
  const accounts = await provider.request<string[]>({
    method: "eth_requestAccounts",
  });
  const address = accounts[0] ?? null;
  const chainIdHex = await provider.request<string>({ method: "eth_chainId" });
  return {
    address,
    chainId: chainIdHex ? Number.parseInt(chainIdHex, 16) : null,
  };
}

export async function selectWalletAccount() {
  const provider = await requireEthereumProvider();

  try {
    await provider.request({
      method: "wallet_requestPermissions",
      params: [{ eth_accounts: {} }],
    });
  } catch (error) {
    const code =
      typeof error === "object" && error && "code" in error
        ? Number((error as { code?: number }).code)
        : undefined;
    if (code === 4001) {
      throw error;
    }
  }

  const accounts = await provider.request<string[]>({
    method: "eth_requestAccounts",
  });
  const address = accounts[0] ?? null;
  const chainIdHex = await provider.request<string>({ method: "eth_chainId" });

  return {
    address,
    chainId: chainIdHex ? Number.parseInt(chainIdHex, 16) : null,
  };
}

export async function switchToTargetChain() {
  const provider = await requireEthereumProvider();

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: TARGET_CHAIN.chainIdHex }],
    });
    return;
  } catch (error) {
    const code =
      typeof error === "object" && error && "code" in error
        ? Number((error as { code?: number }).code)
        : undefined;
    if (code !== 4902) {
      throw error;
    }
  }

  await provider.request({
    method: "wallet_addEthereumChain",
    params: [
      {
        chainId: TARGET_CHAIN.chainIdHex,
        chainName: TARGET_CHAIN.chainName,
        nativeCurrency: TARGET_CHAIN.nativeCurrency,
        rpcUrls: TARGET_CHAIN.rpcUrls,
        blockExplorerUrls: TARGET_CHAIN.blockExplorerUrls,
      },
    ],
  });
}

export async function getRequiredEthereumProvider() {
  return requireEthereumProvider();
}

export function shortenAddress(address?: string | null) {
  if (!address) {
    return "";
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
