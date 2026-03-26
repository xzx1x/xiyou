"use client";

import { useMemo } from "react";
import { TARGET_CHAIN, getEthereumProvider, shortenAddress } from "../../lib/wallet";
import { useWalletState } from "../../lib/useWalletState";

const METAMASK_DOWNLOAD_URL = "https://metamask.io/download/";

export function MetaMaskWallet() {
  const {
    available,
    address,
    chainId,
    busy,
    message,
    isCorrectChain,
    connect,
    reload,
    switchAccount,
    switchChain,
  } = useWalletState();

  const walletLabel = useMemo(() => {
    if (!available) {
      return "未安装 MetaMask";
    }
    if (!address) {
      return "未连接钱包";
    }
    return shortenAddress(address);
  }, [available, address]);

  const handleRedetect = async () => {
    await reload();
    if (!getEthereumProvider()) {
      return;
    }
  };

  const handleMetaMaskClick = async () => {
    if (!available) {
      await handleRedetect();
      if (!getEthereumProvider()) {
        window.open(METAMASK_DOWNLOAD_URL, "_blank", "noopener,noreferrer");
      }
      return;
    }

    if (!address) {
      await connect();
      return;
    }

    if (!isCorrectChain) {
      await switchChain();
      return;
    }

    await switchAccount();
  };

  return (
    <div className="wallet-box">
      <div className="wallet-meta">
        <strong>{walletLabel}</strong>
        <span>
          {address
            ? isCorrectChain
              ? `${TARGET_CHAIN.chainName} 已连接`
              : `当前链 ID: ${chainId ?? "-"}`
            : `目标网络: ${TARGET_CHAIN.chainName}`}
        </span>
      </div>

      <button
        className="ghost-btn small"
        type="button"
        onClick={handleMetaMaskClick}
        disabled={busy}
      >
        {busy ? "处理中..." : "MetaMask"}
      </button>

      {message && <span className="wallet-error">{message}</span>}
    </div>
  );
}
