"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "../../components/layouts/AppShell";

/**
 * 聊天入口已统一到消息中心，保留该路由用于跳转。
 */
export default function ChatPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/notifications");
  }, [router]);

  return (
    <AppShell title="消息" withPanel={false}>
      <div>正在跳转消息中心...</div>
    </AppShell>
  );
}
