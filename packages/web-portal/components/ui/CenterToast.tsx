"use client";

import { useEffect } from "react";

export type ToastType = "success" | "error";

type CenterToastProps = {
  message: string;
  type?: ToastType;
  onClose: () => void;
  autoCloseMs?: number;
};

export function CenterToast({
  message,
  type = "success",
  onClose,
  autoCloseMs = 3000,
}: CenterToastProps) {
  useEffect(() => {
    if (!autoCloseMs) {
      return;
    }
    const timer = window.setTimeout(onClose, autoCloseMs);
    return () => window.clearTimeout(timer);
  }, [autoCloseMs, onClose]);

  return (
    <div className="toast-modal" role={type === "error" ? "alert" : "status"} aria-live="polite">
      <div className={`toast-modal-card ${type}`}>
        <span className="toast-modal-icon" aria-hidden="true">
          {type === "error" ? "!" : "OK"}
        </span>
        <span className="toast-modal-text">{message}</span>
        <button className="toast-modal-close" type="button" onClick={onClose}>
          关闭
        </button>
      </div>
    </div>
  );
}
