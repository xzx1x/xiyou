"use client";

import { useEffect, useMemo, useState } from "react";
import {
  TARGET_CHAIN,
  connectWallet,
  getEthereumProvider,
  readWalletState,
  selectWalletAccount,
  type WalletState,
  switchToTargetChain,
} from "./wallet";

type UseWalletStateResult = WalletState & {
  busy: boolean;
  message: string | null;
  isCorrectChain: boolean;
  reload: () => Promise<void>;
  connect: () => Promise<void>;
  switchAccount: () => Promise<void>;
  switchChain: () => Promise<void>;
  clearMessage: () => void;
};

const EMPTY_WALLET_STATE: WalletState = {
  available: false,
  connected: false,
  address: null,
  chainId: null,
};

export function useWalletState(): UseWalletStateResult {
  const [walletState, setWalletState] = useState<WalletState>(EMPTY_WALLET_STATE);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const reload = async () => {
    try {
      const nextState = await readWalletState();
      setWalletState(nextState);
      if (nextState.available) {
        setMessage(null);
      }
    } catch {
      setWalletState((current) => ({
        ...current,
        available: Boolean(getEthereumProvider()),
      }));
    }
  };

  useEffect(() => {
    const provider = getEthereumProvider();

    const handleAccountsChanged = (accounts: unknown) => {
      const address =
        Array.isArray(accounts) && typeof accounts[0] === "string" ? accounts[0] : null;
      setWalletState((current) => ({
        ...current,
        connected: Boolean(address),
        address,
      }));
    };

    const handleChainChanged = (nextChainId: unknown) => {
      setWalletState((current) => ({
        ...current,
        chainId:
          typeof nextChainId === "string" ? Number.parseInt(nextChainId, 16) : current.chainId,
      }));
    };

    const handleFocus = () => {
      void reload();
    };

    void reload();
    provider?.on?.("accountsChanged", handleAccountsChanged);
    provider?.on?.("chainChanged", handleChainChanged);
    window.addEventListener("focus", handleFocus);

    return () => {
      provider?.removeListener?.("accountsChanged", handleAccountsChanged);
      provider?.removeListener?.("chainChanged", handleChainChanged);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const connect = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const result = await connectWallet();
      setWalletState({
        available: true,
        connected: Boolean(result.address),
        address: result.address,
        chainId: result.chainId,
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "钱包连接失败");
    } finally {
      setBusy(false);
    }
  };

  const switchChain = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await switchToTargetChain();
      await reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "切换网络失败");
    } finally {
      setBusy(false);
    }
  };

  const switchAccount = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const result = await selectWalletAccount();
      setWalletState({
        available: true,
        connected: Boolean(result.address),
        address: result.address,
        chainId: result.chainId,
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "切换账户失败");
    } finally {
      setBusy(false);
    }
  };

  const isCorrectChain = useMemo(
    () => walletState.chainId === TARGET_CHAIN.chainId,
    [walletState.chainId],
  );

  return {
    ...walletState,
    busy,
    message,
    isCorrectChain,
    reload,
    connect,
    switchAccount,
    switchChain,
    clearMessage: () => setMessage(null),
  };
}
