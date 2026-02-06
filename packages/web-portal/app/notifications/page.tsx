"use client";

import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent,
} from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "../../components/layouts/AppShell";
import { CenterToast } from "../../components/ui/CenterToast";
import {
  createChatThread,
  createReport,
  deleteChatMessage,
  getProfile,
  getChatUnreadCount,
  listChatMessages,
  listFriendRequests,
  listFriends,
  listNotifications,
  markAllNotificationsRead,
  markChatRead,
  markNotificationRead,
  requestFriend,
  revokeChatMessage,
  respondFriendRequest,
  searchFriendCandidates,
  resolveAvatarUrl,
  sendChatMessage,
  type ChatMessage,
  type FriendRecord,
  type FriendRequest,
  type NotificationRecord,
  type PublicUserProfile,
  type User,
} from "../../lib/api";

type MessageTab = "system" | "chat" | "add-friend";

const REPORT_ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_REPORT_BYTES = 2 * 1024 * 1024;

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("读取文件失败"));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => reject(new Error("读取文件失败"));
    reader.readAsDataURL(file);
  });
const CHAT_PAGE_SIZE = 20;

/**
 * 消息页面：系统消息、好友聊天、添加好友。
 */
export default function NotificationsPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<MessageTab>("system");
  // 通知列表数据。
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  // 好友列表数据。
  const [friends, setFriends] = useState<FriendRecord[]>([]);
  // 好友申请列表。
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  // 用户信息弹窗。
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [activeProfile, setActiveProfile] = useState<PublicUserProfile | null>(null);
  const [friendLoading, setFriendLoading] = useState(false);
  const [friendMessage, setFriendMessage] = useState<string | null>(null);
  const [friendError, setFriendError] = useState<string | null>(null);
  // 举报弹窗。
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    type: "USER" | "COUNSELOR";
    id: string;
    label: string;
    displayName: string;
  } | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportAttachment, setReportAttachment] = useState<{
    name: string;
    dataUrl: string;
  } | null>(null);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [queryHandled, setQueryHandled] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  // 当前登录用户。
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  // 页面加载状态。
  const [loading, setLoading] = useState(true);
  // 聊天加载状态。
  const [chatLoading, setChatLoading] = useState(false);
  // 操作反馈提示。
  const [message, setMessage] = useState<string | null>(null);
  // 错误提示信息。
  const [error, setError] = useState<string | null>(null);
  // 当前选中的通知。
  const [activeId, setActiveId] = useState<string | null>(null);
  // 当前选中的好友。
  const [activeFriendId, setActiveFriendId] = useState<string | null>(null);
  // 当前聊天线程编号。
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  // 新消息输入内容。
  const [messageInput, setMessageInput] = useState("");
  const chatInputRef = useRef<HTMLTextAreaElement | null>(null);
  const chatBodyRef = useRef<HTMLDivElement | null>(null);
  const shouldScrollToBottomRef = useRef(false);
  const scrollAdjustRef = useRef<number | null>(null);
  // 首次进入聊天时强制滚动到底部。
  const initialScrollRef = useRef(false);
  // 添加好友搜索关键词。
  const [friendKeyword, setFriendKeyword] = useState("");
  // 搜索结果列表。
  const [friendCandidates, setFriendCandidates] = useState<PublicUserProfile[]>([]);
  // 搜索状态。
  const [friendSearchLoading, setFriendSearchLoading] = useState(false);
  // 已发起申请的好友编号。
  const [requestedFriendIds, setRequestedFriendIds] = useState<string[]>([]);
  // 未读聊天数量。
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  // 可见聊天消息。
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  // 预加载聊天消息。
  const [chatBuffer, setChatBuffer] = useState<ChatMessage[]>([]);
  // 是否还有更早消息。
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  // 加载历史消息状态。
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  // 预加载状态。
  const [preloadingMessages, setPreloadingMessages] = useState(false);
  // 聊天消息快捷操作菜单。
  const [chatMenu, setChatMenu] = useState<{ messageId: string; x: number; y: number } | null>(
    null,
  );
  const reportErrorTimerRef = useRef<number | null>(null);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);

  const scrollChatToBottom = () => {
    const container = chatBodyRef.current;
    if (!container) {
      return;
    }
    const scroll = () => {
      container.scrollTop = container.scrollHeight;
    };
    scroll();
    window.requestAnimationFrame(scroll);
  };

  /**
   * 初始化加载通知、好友、好友申请与用户信息。
   */
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [profile, notificationList, friendList, requestList, unreadCount] = await Promise.all([
          getProfile(),
          listNotifications(),
          listFriends(),
          listFriendRequests(),
          getChatUnreadCount(),
        ]);
        setCurrentUser(profile);
        setNotifications(notificationList);
        setFriends(friendList);
        setFriendRequests(requestList);
        setChatUnreadCount(unreadCount);
        if (notificationList.length > 0) {
          setActiveId(notificationList[0].id);
        }
        if (friendList.length > 0) {
          setActiveFriendId(friendList[0].friendId);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载消息失败");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (queryHandled) {
      return;
    }
    const tab = searchParams.get("tab");
    const friendId = searchParams.get("friendId");
    if (tab === "chat") {
      setActiveTab("chat");
      if (friendId) {
        setActiveFriendId(friendId);
      }
    } else if (tab === "system" || tab === "add-friend") {
      setActiveTab(tab);
    }
    setQueryHandled(true);
  }, [queryHandled, searchParams]);

  useEffect(() => {
    if (!message) {
      return;
    }
    const timer = window.setTimeout(() => setMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (!chatInputRef.current) {
      return;
    }
    const target = chatInputRef.current;
    const container =
      target.closest(".message-panel") ?? target.closest(".card-block");
    const containerHeight = container?.clientHeight ?? 0;
    const hasManualLineBreak = messageInput.includes("\n");
    const maxHeight =
      containerHeight > 0 ? (hasManualLineBreak ? containerHeight : containerHeight * 0.6) : 0;
    const defaultHeight = 37;
    target.style.height = "auto";
    const baseHeight = Math.max(target.scrollHeight, defaultHeight);
    if (maxHeight > 0 && baseHeight > maxHeight) {
      target.style.height = `${maxHeight}px`;
      target.style.overflowY = "auto";
      return;
    }
    target.style.height = `${baseHeight}px`;
    target.style.overflowY = "hidden";
  }, [messageInput]);

  /**
   * 切换到聊天页时，标记需要滚动到底部。
   */
  useEffect(() => {
    if (activeTab !== "chat") {
      return;
    }
    shouldScrollToBottomRef.current = true;
  }, [activeTab]);

  /**
   * 聊天消息更新时自动滚动到最新位置。
   */
  useEffect(() => {
    if (activeTab !== "chat") {
      return;
    }
    if (!shouldScrollToBottomRef.current) {
      return;
    }
    if (chatLoading) {
      return;
    }
    const container = chatBodyRef.current;
    if (!container) {
      return;
    }
    shouldScrollToBottomRef.current = false;
    scrollChatToBottom();
  }, [activeTab, chatLoading, chatMessages]);

  useEffect(() => {
    if (scrollAdjustRef.current === null) {
      return;
    }
    if (initialScrollRef.current) {
      scrollAdjustRef.current = null;
      return;
    }
    const container = chatBodyRef.current;
    if (!container) {
      return;
    }
    const previousHeight = scrollAdjustRef.current;
    scrollAdjustRef.current = null;
    container.scrollTop = container.scrollHeight - previousHeight;
  }, [chatMessages]);

  /**
   * 初次进入聊天时确保视图在最新消息。
   */
  useEffect(() => {
    if (activeTab !== "chat") {
      return;
    }
    if (!initialScrollRef.current) {
      return;
    }
    if (chatLoading || loadingOlderMessages || preloadingMessages) {
      return;
    }
    const container = chatBodyRef.current;
    if (!container) {
      return;
    }
    if (container.scrollHeight <= container.clientHeight + 4 && hasMoreMessages) {
      return;
    }
    scrollChatToBottom();
    initialScrollRef.current = false;
  }, [
    activeTab,
    chatLoading,
    chatMessages,
    hasMoreMessages,
    loadingOlderMessages,
    preloadingMessages,
  ]);

  useEffect(() => {
    if (activeTab !== "chat") {
      return;
    }
    const container = chatBodyRef.current;
    if (!container || chatLoading || loadingOlderMessages || preloadingMessages) {
      return;
    }
    if (!hasMoreMessages) {
      return;
    }
    if (container.scrollHeight > container.clientHeight + 4) {
      return;
    }
    if (chatBuffer.length > 0) {
      const buffer = chatBuffer;
      setChatBuffer([]);
      prependMessages(buffer);
      if (activeThreadId) {
        void prefetchOlderMessages(activeThreadId, buffer[0].createdAt);
      }
      return;
    }
    void loadOlderMessages();
  }, [
    activeTab,
    activeThreadId,
    chatBuffer,
    chatLoading,
    chatMessages,
    hasMoreMessages,
    loadingOlderMessages,
    preloadingMessages,
  ]);

  useEffect(() => {
    if (!error) {
      return;
    }
    const timer = window.setTimeout(() => setError(null), 3000);
    return () => window.clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    if (!friendMessage) {
      return;
    }
    const timer = window.setTimeout(() => setFriendMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [friendMessage]);

  useEffect(() => {
    if (!friendError) {
      return;
    }
    const timer = window.setTimeout(() => setFriendError(null), 3000);
    return () => window.clearTimeout(timer);
  }, [friendError]);

  useEffect(() => {
    return () => {
      if (reportErrorTimerRef.current !== null) {
        window.clearTimeout(reportErrorTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!chatMenu) {
      return;
    }
    const handleClose = () => setChatMenu(null);
    window.addEventListener("click", handleClose);
    return () => window.removeEventListener("click", handleClose);
  }, [chatMenu]);

  useEffect(() => {
    if (notifications.length === 0) {
      setActiveId(null);
      return;
    }
    if (!activeId || !notifications.some((notice) => notice.id === activeId)) {
      setActiveId(notifications[0].id);
    }
  }, [activeId, notifications]);

  useEffect(() => {
    if (friends.length === 0) {
      setActiveFriendId(null);
      setActiveThreadId(null);
      setChatMessages([]);
      setChatBuffer([]);
      setHasMoreMessages(false);
      return;
    }
    if (!activeFriendId || !friends.some((friend) => friend.friendId === activeFriendId)) {
      setActiveFriendId(friends[0].friendId);
    }
  }, [activeFriendId, friends]);

  useEffect(() => {
    if (activeTab !== "add-friend") {
      return;
    }
    const keyword = friendKeyword.trim();
    if (!keyword) {
      setFriendCandidates([]);
      setFriendSearchLoading(false);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setFriendSearchLoading(true);
      setError(null);
      searchFriendCandidates(keyword)
        .then((list) => {
          if (!cancelled) {
            setFriendCandidates(list);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : "搜索用户失败");
          }
        })
        .finally(() => {
          if (!cancelled) {
            setFriendSearchLoading(false);
          }
        });
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [activeTab, friendKeyword]);

  /**
   * 加载当前选中好友的聊天内容。
   */
  useEffect(() => {
    async function loadChat() {
      if (!activeFriendId || activeTab !== "chat") {
        return;
      }
      initialScrollRef.current = true;
      setChatLoading(true);
      setError(null);
      try {
        const thread = await createChatThread({ peerId: activeFriendId });
        setActiveThreadId(thread.id);
        setPreloadingMessages(false);
        setLoadingOlderMessages(false);
        const list = await listChatMessages(thread.id, { limit: CHAT_PAGE_SIZE });
        const hasMore = list.length === CHAT_PAGE_SIZE;
        setChatMessages(list);
        setChatBuffer([]);
        setHasMoreMessages(hasMore);
        setChatMenu(null);
        setSelectedMessageIds([]);
        setMultiSelectMode(false);
        shouldScrollToBottomRef.current = true;
        if (hasMore && list.length > 0) {
          await prefetchOlderMessages(thread.id, list[0].createdAt);
        }
        await markChatRead(thread.id);
        const unreadCount = await getChatUnreadCount();
        setChatUnreadCount(unreadCount);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载聊天失败");
      } finally {
        setChatLoading(false);
      }
    }
    loadChat();
  }, [activeFriendId, activeTab]);

  /**
   * 标记通知已读。
   */
  const handleRead = async (notificationId: string) => {
    setMessage(null);
    setError(null);
    try {
      const result = await markNotificationRead(notificationId);
      setMessage(result);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notificationId ? { ...item, readAt: new Date().toISOString() } : item,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "标记失败");
    }
  };

  /**
   * 标记全部通知已读。
   */
  const handleReadAll = async () => {
    setMessage(null);
    setError(null);
    try {
      const result = await markAllNotificationsRead();
      const readAt = new Date().toISOString();
      setMessage(result);
      setNotifications((prev) =>
        prev.map((item) => (item.readAt ? item : { ...item, readAt })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "标记失败");
    }
  };

  /**
   * 发送聊天消息。
   */
  const handleSendMessage = async () => {
    if (!activeThreadId || !activeFriendId) {
      setError("请先选择好友");
      return;
    }
    if (!messageInput.trim()) {
      setError("请输入消息内容");
      return;
    }
    setError(null);
    try {
      const record = await sendChatMessage(activeThreadId, {
        content: messageInput.trim(),
        receiverId: activeFriendId,
      });
      setChatMessages((prev) => [...prev, record]);
      setMessageInput("");
      shouldScrollToBottomRef.current = true;
      await markChatRead(activeThreadId);
      const unreadCount = await getChatUnreadCount();
      setChatUnreadCount(unreadCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "发送失败");
    }
  };

  const prefetchOlderMessages = async (threadId: string, before: string) => {
    if (!before || chatBuffer.length > 0 || preloadingMessages) {
      return;
    }
    setPreloadingMessages(true);
    setError(null);
    try {
      const list = await listChatMessages(threadId, { before, limit: CHAT_PAGE_SIZE });
      if (list.length === 0) {
        setHasMoreMessages(false);
        return;
      }
      setChatBuffer(list);
      if (list.length < CHAT_PAGE_SIZE) {
        setHasMoreMessages(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载历史消息失败");
    } finally {
      setPreloadingMessages(false);
    }
  };

  const prependMessages = (messages: ChatMessage[]) => {
    if (messages.length === 0) {
      return;
    }
    const container = chatBodyRef.current;
    if (container) {
      scrollAdjustRef.current = container.scrollHeight;
    }
    setChatMessages((prev) => [...messages, ...prev]);
  };

  const loadOlderMessages = async () => {
    if (!activeThreadId || loadingOlderMessages || !hasMoreMessages) {
      return;
    }
    const oldest = chatMessages[0];
    if (!oldest) {
      return;
    }
    setLoadingOlderMessages(true);
    setError(null);
    try {
      const list = await listChatMessages(activeThreadId, {
        before: oldest.createdAt,
        limit: CHAT_PAGE_SIZE,
      });
      if (list.length === 0) {
        setHasMoreMessages(false);
        return;
      }
      prependMessages(list);
      if (list.length < CHAT_PAGE_SIZE) {
        setHasMoreMessages(false);
      } else {
        await prefetchOlderMessages(activeThreadId, list[0].createdAt);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载历史消息失败");
    } finally {
      setLoadingOlderMessages(false);
    }
  };

  const handleChatScroll = () => {
    const container = chatBodyRef.current;
    if (!container || chatLoading) {
      return;
    }
    if (chatMenu) {
      setChatMenu(null);
    }
    if (container.scrollTop > 12) {
      return;
    }
    if (chatBuffer.length > 0) {
      const buffer = chatBuffer;
      setChatBuffer([]);
      prependMessages(buffer);
      if (hasMoreMessages && activeThreadId) {
        void prefetchOlderMessages(activeThreadId, buffer[0].createdAt);
      }
      return;
    }
    if (hasMoreMessages) {
      void loadOlderMessages();
    }
  };

  /**
   * 打开聊天消息快捷操作菜单。
   */
  const handleOpenChatMenu = (
    event: MouseEvent<HTMLDivElement>,
    messageId: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setChatMenu({ messageId, x: event.clientX, y: event.clientY });
  };

  /**
   * 删除聊天消息。
   */
  const handleDeleteChatMessage = async () => {
    if (!chatMenu) {
      return;
    }
    setError(null);
    try {
      await deleteChatMessage(chatMenu.messageId);
      setChatMessages((prev) => prev.filter((item) => item.id !== chatMenu.messageId));
      setChatBuffer((prev) => prev.filter((item) => item.id !== chatMenu.messageId));
      setSelectedMessageIds((prev) => prev.filter((id) => id !== chatMenu.messageId));
      setChatMenu(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    }
  };

  /**
   * 撤回聊天消息。
   */
  const handleRevokeChatMessage = async () => {
    if (!chatMenu) {
      return;
    }
    setError(null);
    try {
      const updated = await revokeChatMessage(chatMenu.messageId);
      setChatMessages((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
      setChatBuffer((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
      setChatMenu(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "撤回失败");
    }
  };

  const handleToggleMultiSelect = () => {
    setMultiSelectMode((prev) => !prev);
    setSelectedMessageIds([]);
    setChatMenu(null);
  };

  const toggleMessageSelection = (messageId: string) => {
    setSelectedMessageIds((prev) =>
      prev.includes(messageId) ? prev.filter((id) => id !== messageId) : [...prev, messageId],
    );
  };

  const handleBulkDeleteMessages = async () => {
    if (selectedMessageIds.length === 0) {
      return;
    }
    setError(null);
    try {
      await Promise.all(selectedMessageIds.map((messageId) => deleteChatMessage(messageId)));
      setChatMessages((prev) => prev.filter((item) => !selectedMessageIds.includes(item.id)));
      setChatBuffer((prev) => prev.filter((item) => !selectedMessageIds.includes(item.id)));
      setSelectedMessageIds([]);
      setMultiSelectMode(false);
      setChatMenu(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    }
  };

  /**
   * 处理好友申请。
   */
  const handleRespond = async (requestId: string, accept: boolean) => {
    setError(null);
    try {
      await respondFriendRequest(requestId, { accept });
      setFriendRequests((prev) =>
        prev.map((item) =>
          item.id === requestId
            ? { ...item, status: accept ? "ACCEPTED" : "REJECTED" }
            : item,
        ),
      );
      if (accept) {
        const friendList = await listFriends();
        setFriends(friendList);
      }
      setMessage(accept ? "已接受好友申请" : "已拒绝好友申请");
    } catch (err) {
      setError(err instanceof Error ? err.message : "处理失败");
    }
  };

  const clearReportError = () => {
    setReportError(null);
    if (reportErrorTimerRef.current !== null) {
      window.clearTimeout(reportErrorTimerRef.current);
      reportErrorTimerRef.current = null;
    }
  };

  const showReportError = (text: string) => {
    setReportError(text);
    if (reportErrorTimerRef.current !== null) {
      window.clearTimeout(reportErrorTimerRef.current);
    }
    reportErrorTimerRef.current = window.setTimeout(() => {
      setReportError(null);
      reportErrorTimerRef.current = null;
    }, 3000);
  };

  const openProfileModal = (profile: PublicUserProfile | null | undefined) => {
    if (!profile) {
      return;
    }
    setActiveProfile(profile);
    setFriendMessage(null);
    setFriendError(null);
    setProfileModalOpen(true);
  };

  const openReportModal = (profile: PublicUserProfile) => {
    const targetType = profile.role === "COUNSELOR" ? "COUNSELOR" : "USER";
    const displayName = profile.nickname || "用户";
    setReportTarget({
      type: targetType,
      id: profile.id,
      label: "用户",
      displayName,
    });
    setReportReason("");
    setReportAttachment(null);
    clearReportError();
    setReportModalOpen(true);
  };

  const closeProfileModal = () => {
    setProfileModalOpen(false);
    setActiveProfile(null);
    setFriendMessage(null);
    setFriendError(null);
  };

  const closeReportModal = () => {
    setReportModalOpen(false);
    setReportTarget(null);
    setReportReason("");
    setReportAttachment(null);
    clearReportError();
  };

  const handleProfileModalOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      closeProfileModal();
    }
  };

  const handleReportModalOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      closeReportModal();
    }
  };

  const handleReportAttachmentChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      setReportAttachment(null);
      return;
    }
    clearReportError();
    if (!REPORT_ALLOWED_TYPES.has(file.type)) {
      showReportError("仅支持 PNG/JPEG/WEBP 图片");
      return;
    }
    if (file.size > MAX_REPORT_BYTES) {
      showReportError("图片大小不能超过 2MB");
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setReportAttachment({ name: file.name, dataUrl });
    } catch (err) {
      showReportError(err instanceof Error ? err.message : "读取图片失败");
    }
  };

  const handleReportSubmit = async () => {
    if (!reportTarget) {
      showReportError("未找到举报对象");
      return;
    }
    if (!reportReason.trim()) {
      showReportError("请输入文字说明");
      return;
    }
    clearReportError();
    setReportSubmitting(true);
    try {
      const result = await createReport({
        targetType: reportTarget.type,
        targetId: reportTarget.id,
        reason: reportReason,
        attachmentDataUrl: reportAttachment?.dataUrl,
      });
      setMessage("举报已提交，等待管理员审核");
      closeReportModal();
    } catch (err) {
      showReportError(err instanceof Error ? err.message : "举报提交失败");
    } finally {
      setReportSubmitting(false);
    }
  };

  /**
   * 点击头像发起好友申请。
   */
  const handleFriendRequest = async (targetId: string) => {
    if (!targetId) {
      setFriendError("未找到目标用户");
      return;
    }
    setFriendLoading(true);
    setFriendMessage(null);
    setFriendError(null);
    try {
      await requestFriend({ targetId });
      setRequestedFriendIds((prev) =>
        prev.includes(targetId) ? prev : [...prev, targetId],
      );
      setFriendMessage("好友申请已发送");
    } catch (err) {
      setFriendError(err instanceof Error ? err.message : "发送好友申请失败");
    } finally {
      setFriendLoading(false);
    }
  };

  const handleRequestFriendFromProfile = async () => {
    if (!activeProfile) {
      return;
    }
    if (friends.some((friend) => friend.friendId === activeProfile.id)) {
      return;
    }
    await handleFriendRequest(activeProfile.id);
  };

  const handleReportFromProfile = () => {
    if (!activeProfile) {
      return;
    }
    closeProfileModal();
    openReportModal(activeProfile);
  };

  const handleStartChatFromProfile = () => {
    if (!activeProfile) {
      return;
    }
    if (!friends.some((friend) => friend.friendId === activeProfile.id)) {
      return;
    }
    closeProfileModal();
    setActiveTab("chat");
    setActiveFriendId(activeProfile.id);
  };

  const activeNotice = useMemo(
    () => notifications.find((notice) => notice.id === activeId) ?? null,
    [activeId, notifications],
  );

  const activeFriend = useMemo(
    () => friends.find((friend) => friend.friendId === activeFriendId) ?? null,
    [activeFriendId, friends],
  );

  const menuMessage = useMemo(
    () => (chatMenu ? chatMessages.find((item) => item.id === chatMenu.messageId) ?? null : null),
    [chatMenu, chatMessages],
  );

  const pendingRequests = useMemo(
    () => friendRequests.filter((request) => request.status === "PENDING"),
    [friendRequests],
  );

  const systemUnreadCount = useMemo(
    () => notifications.filter((notice) => !notice.readAt).length,
    [notifications],
  );

  const formatRole = (role: PublicUserProfile["role"]) => {
    if (role === "ADMIN") {
      return "管理员";
    }
    if (role === "COUNSELOR") {
      return "心理咨询师";
    }
    return "学生";
  };

  const TIME_GAP_MS = 5 * 60 * 1000;
  const formatChatTime = (value: string) => new Date(value).toLocaleString("zh-CN");

  const formatBadgeCount = (count: number) => (count > 99 ? "99+" : `${count}`);

  const currentUserId = currentUser?.id ?? "";
  const canRevokeMenuMessage = menuMessage?.senderId === currentUserId;
  const hasSelectedMessages = selectedMessageIds.length > 0;
  const currentUserProfile = currentUser
    ? {
        id: currentUser.id,
        nickname: currentUser.nickname,
        gender: currentUser.gender,
        major: currentUser.major,
        grade: currentUser.grade,
        avatarUrl: currentUser.avatarUrl,
        role: currentUser.role,
      }
    : null;
  const isSelf = !!activeProfile && activeProfile.id === currentUserId;
  const isFriend =
    !!activeProfile && friends.some((friend) => friend.friendId === activeProfile.id);
  const toast = reportError
    ? { type: "error" as const, message: reportError, onClose: () => setReportError(null) }
    : friendError
      ? { type: "error" as const, message: friendError, onClose: () => setFriendError(null) }
      : error
        ? { type: "error" as const, message: error, onClose: () => setError(null) }
        : friendMessage
          ? { type: "success" as const, message: friendMessage, onClose: () => setFriendMessage(null) }
          : message
            ? { type: "success" as const, message, onClose: () => setMessage(null) }
            : null;

  const getRevokeLabel = (revokedBy?: string | null) => {
    if (!revokedBy) {
      return "对方";
    }
    if (revokedBy === currentUserId) {
      return "你";
    }
    if (revokedBy === activeFriend?.friendId) {
      return activeFriend.profile?.nickname ?? activeFriend.friendId;
    }
    return revokedBy;
  };

  if (loading) {
    return (
      <AppShell title="消息" withPanel={false}>
        <div>加载中...</div>
      </AppShell>
    );
  }

  const tabButtons = (
    <div className="message-tab-list">
      <button
        type="button"
        className={`btn btn-secondary small message-tab-btn${activeTab === "system" ? " active" : ""}`}
        onClick={() => setActiveTab("system")}
        aria-label="系统消息"
        title="系统消息"
      >
        <span className="message-tab-icon" aria-hidden="true">
          🔔
        </span>
        {systemUnreadCount > 0 && (
          <span className="message-tab-badge">{formatBadgeCount(systemUnreadCount)}</span>
        )}
      </button>
      <button
        type="button"
        className={`btn btn-secondary small message-tab-btn${activeTab === "chat" ? " active" : ""}`}
        onClick={() => setActiveTab("chat")}
        aria-label="好友聊天"
        title="好友聊天"
      >
        <span className="message-tab-icon" aria-hidden="true">
          💬
        </span>
        {chatUnreadCount > 0 && (
          <span className="message-tab-badge">{formatBadgeCount(chatUnreadCount)}</span>
        )}
      </button>
      <button
        type="button"
        className={`btn btn-secondary small message-tab-btn${activeTab === "add-friend" ? " active" : ""}`}
        onClick={() => setActiveTab("add-friend")}
        aria-label="添加好友"
        title="添加好友"
      >
        <span className="message-tab-icon" aria-hidden="true">
          👤
        </span>
        {pendingRequests.length > 0 && (
          <span className="message-tab-badge">{formatBadgeCount(pendingRequests.length)}</span>
        )}
      </button>
    </div>
  );

  return (
    <AppShell title="消息" withPanel={false}>
      {toast && <CenterToast type={toast.type} message={toast.message} onClose={toast.onClose} />}

      {activeTab === "system" ? (
        <div className="message-center">
          <div className="card-block message-sidebar">
            {tabButtons}
            <h3>系统消息</h3>
            {notifications.length === 0 ? (
              <p className="muted">暂无系统消息。</p>
            ) : (
              <div className="message-list">
                {notifications.map((notice) => {
                  const isActive = notice.id === activeId;
                  return (
                    <button
                      key={notice.id}
                      type="button"
                      className={`message-list-item${isActive ? " active" : ""}`}
                      onClick={() => setActiveId(notice.id)}
                    >
                      <div className="message-list-title">
                        <strong>{notice.title}</strong>
                        {!notice.readAt && <span className="message-unread-dot" aria-label="未读" />}
                      </div>
                      <span className="muted">
                        {new Date(notice.createdAt).toLocaleString("zh-CN")}
                      </span>
                      <p className="message-list-preview">{notice.message}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="card-block message-panel">
            {activeNotice ? (
              <>
                <div className="message-panel-header">
                  <div>
                    <h3>{activeNotice.title}</h3>
                    <span className="muted">
                      {new Date(activeNotice.createdAt).toLocaleString("zh-CN")}
                    </span>
                  </div>
                  <div className="message-panel-actions">
                    {activeNotice.readAt ? (
                      <span className="tag">已读</span>
                    ) : (
                      <button
                        className="btn btn-secondary small"
                        onClick={() => handleRead(activeNotice.id)}
                      >
                        标记已读
                      </button>
                    )}
                    {systemUnreadCount > 0 ? (
                      <button className="btn btn-secondary small" onClick={handleReadAll}>
                        全部已读
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="message-panel-body">
                  <div className="message-bubble">{activeNotice.message}</div>
                </div>
              </>
            ) : notifications.length === 0 ? (
              <p className="muted">暂无系统消息。</p>
            ) : (
              <p className="muted">请选择一条消息查看详情。</p>
            )}
          </div>
        </div>
      ) : null}

      {activeTab === "chat" ? (
        <div className="message-center">
          <div className="card-block message-sidebar">
            {tabButtons}
            <h3>好友列表</h3>
            {friends.length === 0 ? (
              <p className="muted">暂无好友，先添加好友再聊天。</p>
            ) : (
              <div className="message-list">
                {friends.map((friend) => {
                  const isActive = friend.friendId === activeFriendId;
                  const avatar =
                    resolveAvatarUrl(friend.profile?.avatarUrl) || "/default-avatar.svg";
                  const displayName = friend.profile?.nickname || "未设置昵称";
                  return (
                    <button
                      key={friend.friendId}
                      type="button"
                      className={`message-list-item friend${isActive ? " active" : ""}`}
                      onClick={() => setActiveFriendId(friend.friendId)}
                    >
                      <img
                        className="message-avatar"
                        src={avatar}
                        alt={`${displayName}头像`}
                        onClick={() => openProfileModal(friend.profile ?? null)}
                        onError={(event) => {
                          const target = event.currentTarget;
                          if (!target.src.endsWith("/default-avatar.svg")) {
                            target.src = "/default-avatar.svg";
                          }
                        }}
                      />
                      <div className="message-list-meta">
                        <strong>{displayName}</strong>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="card-block message-panel">
            {activeFriend ? (
              <>
                <div className="message-panel-header chat-header">
                  <div>
                    <h3>{activeFriend.profile?.nickname ?? "未设置昵称"}</h3>
                  </div>
                </div>
                <div className="message-panel-body chat-body" ref={chatBodyRef} onScroll={handleChatScroll}>
                  {chatLoading ? (
                    <p className="muted">加载聊天记录中...</p>
                  ) : chatMessages.length === 0 ? null : (
                    chatMessages.map((item, index) => {
                      const previous = chatMessages[index - 1];
                      const showTimeDivider =
                        index === 0 ||
                        (previous &&
                          new Date(item.createdAt).getTime() -
                            new Date(previous.createdAt).getTime() >
                            TIME_GAP_MS);
                      if (item.revokedAt) {
                        return (
                          <Fragment key={item.id}>
                            {showTimeDivider && (
                              <div className="chat-time-divider">
                                {formatChatTime(item.createdAt)}
                              </div>
                            )}
                            <div className="chat-revoke-tip">
                              {`${getRevokeLabel(item.revokedBy)}撤回一条消息`}
                            </div>
                          </Fragment>
                        );
                      }
                      const isSelf = item.senderId === currentUserId;
                      const bubbleClass = `chat-bubble${isSelf ? " self" : ""}`;
                      const peerAvatar =
                        resolveAvatarUrl(activeFriend.profile?.avatarUrl) || "/default-avatar.svg";
                      const selfAvatar =
                        resolveAvatarUrl(currentUser?.avatarUrl) || "/default-avatar.svg";
                      const profile = isSelf ? currentUserProfile : activeFriend.profile ?? null;
                      const isSelected = selectedMessageIds.includes(item.id);
                      return (
                        <Fragment key={item.id}>
                          {showTimeDivider && (
                            <div className="chat-time-divider">
                              {formatChatTime(item.createdAt)}
                            </div>
                          )}
                          <div className={`chat-row${isSelf ? " self" : ""}`}>
                            <img
                              className="chat-avatar"
                              src={isSelf ? selfAvatar : peerAvatar}
                              alt="头像"
                              onClick={() => openProfileModal(profile)}
                              onError={(event) => {
                                const target = event.currentTarget;
                                if (!target.src.endsWith("/default-avatar.svg")) {
                                  target.src = "/default-avatar.svg";
                                }
                              }}
                            />
                            <div className="chat-bubble-group">
                              <div className="chat-bubble-row">
                                {multiSelectMode ? (
                                  <button
                                    type="button"
                                    className={`chat-select-toggle${isSelected ? " selected" : ""}`}
                                    onClick={() => toggleMessageSelection(item.id)}
                                    aria-pressed={isSelected}
                                    aria-label={isSelected ? "取消选择消息" : "选择消息"}
                                  />
                                ) : null}
                                <div
                                  className={bubbleClass}
                                  onDoubleClick={(event) => handleOpenChatMenu(event, item.id)}
                                >
                                  {item.content}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Fragment>
                      );
                    })
                  )}
                </div>
                {chatMenu && menuMessage ? (
                  <div
                    className="chat-menu"
                    style={{ top: chatMenu.y, left: chatMenu.x }}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <button type="button" onClick={handleDeleteChatMessage}>
                      删除
                    </button>
                    {canRevokeMenuMessage ? (
                      <button type="button" onClick={handleRevokeChatMessage}>
                        撤回
                      </button>
                    ) : null}
                    <button type="button" onClick={handleToggleMultiSelect}>
                      {multiSelectMode ? "取消多选" : "多选"}
                    </button>
                  </div>
                ) : null}
                <div className="chat-panel-footer">
                  <textarea
                    className="chat-input"
                    ref={chatInputRef}
                    value={messageInput}
                    onChange={(event) => setMessageInput(event.target.value)}
                  />
                  <button
                    className="btn btn-primary small chat-action-btn"
                    type="button"
                    onClick={handleSendMessage}
                    aria-label="发送消息"
                    title="发送消息"
                  >
                    ➤
                  </button>
                  {multiSelectMode && hasSelectedMessages ? (
                    <div className="chat-bulk-actions">
                      <button
                        className="btn btn-secondary small chat-action-btn"
                        type="button"
                        onClick={handleBulkDeleteMessages}
                        aria-label="全部删除"
                        title="全部删除"
                      >
                        🗑️
                      </button>
                    </div>
                  ) : null}
                </div>
              </>
            ) : friends.length === 0 ? (
              <p className="muted">暂无好友，先添加好友再聊天。</p>
            ) : (
              <p className="muted">请选择好友开始聊天。</p>
            )}
          </div>
        </div>
      ) : null}

      {activeTab === "add-friend" ? (
        <div className="message-center">
          <div className="card-block message-sidebar">
            {tabButtons}
            <h3>添加好友</h3>
            <div className="form-stack">
              <label className="inline-field">
                <span>好友姓名</span>
                <input
                  value={friendKeyword}
                  onChange={(event) => setFriendKeyword(event.target.value)}
                  placeholder="输入名字搜索好友"
                />
              </label>
            </div>
            <div className="friend-search-block">
              {friendKeyword.trim() ? (
                friendSearchLoading ? (
                  <p className="muted">搜索中...</p>
                ) : friendCandidates.length === 0 ? (
                  <p className="muted">未找到匹配的用户。</p>
                ) : (
                  <div className="friend-candidate-grid">
                    {friendCandidates.map((candidate) => {
                      const avatar =
                        resolveAvatarUrl(candidate.avatarUrl) || "/default-avatar.svg";
                      const displayName = candidate.nickname || "未设置昵称";
                      const isRequested = requestedFriendIds.includes(candidate.id);
                      return (
                        <button
                          key={candidate.id}
                          type="button"
                          className="friend-candidate"
                          onClick={() => openProfileModal(candidate)}
                        >
                          <img
                            className="friend-candidate-avatar"
                            src={avatar}
                            alt={`${displayName}头像`}
                            onError={(event) => {
                              const target = event.currentTarget;
                              if (!target.src.endsWith("/default-avatar.svg")) {
                                target.src = "/default-avatar.svg";
                              }
                            }}
                          />
                          <span className="friend-candidate-name">{displayName}</span>
                          {isRequested && <span className="friend-candidate-tip">已申请</span>}
                        </button>
                      );
                    })}
                  </div>
                )
              ) : (
                <p className="muted">输入名字后显示头像，点击头像即可添加好友。</p>
              )}
            </div>
          </div>
          <div className="card-block message-panel">
            <div className="message-panel-header">
              <h3>好友申请</h3>
            </div>
            <div className="message-panel-body">
              {friendRequests.length === 0 ? null : (
                <ul className="list">
                  {friendRequests.map((request) => {
                    const requesterProfile = request.requesterProfile ?? null;
                    const displayName = requesterProfile?.nickname || "未设置昵称";
                    const avatarUrl = resolveAvatarUrl(requesterProfile?.avatarUrl) || "/default-avatar.svg";
                    const isPending = request.status === "PENDING";
                    const statusLabel =
                      request.status === "ACCEPTED"
                        ? "已同意"
                        : request.status === "REJECTED"
                          ? "已拒绝"
                          : "";
                    return (
                      <li key={request.id}>
                        <div className="friend-request-info">
                          <img
                            className="friend-request-avatar"
                            src={avatarUrl}
                            alt={`${displayName}头像`}
                            onClick={() => openProfileModal(requesterProfile)}
                            onError={(event) => {
                              const target = event.currentTarget;
                              if (!target.src.endsWith("/default-avatar.svg")) {
                                target.src = "/default-avatar.svg";
                              }
                            }}
                          />
                          <div className="friend-request-meta">
                            <strong>{displayName}</strong>
                          </div>
                        </div>
                        {isPending ? (
                          <div className="button-row">
                            <button
                              className="btn btn-secondary small"
                              onClick={() => handleRespond(request.id, true)}
                            >
                              接受
                            </button>
                            <button
                              className="btn btn-secondary small"
                              onClick={() => handleRespond(request.id, false)}
                            >
                              拒绝
                            </button>
                          </div>
                        ) : (
                          <div className="button-row">
                            <button className="btn btn-secondary small" type="button" disabled>
                              {statusLabel}
                            </button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}
      {profileModalOpen && activeProfile && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-modal-title"
          onClick={handleProfileModalOverlayClick}
        >
          <div className="modal-card">
            <div className="modal-header">
              <h3 id="profile-modal-title">用户信息</h3>
              <button className="btn btn-secondary" type="button" onClick={closeProfileModal}>
                关闭
              </button>
            </div>
            <div className="author-summary">
              <div className="author-avatar">
                <img
                  src={resolveAvatarUrl(activeProfile.avatarUrl) || "/default-avatar.svg"}
                  alt={`${activeProfile.nickname ?? "用户"}头像`}
                  onError={(event) => {
                    const target = event.currentTarget;
                    if (!target.src.endsWith("/default-avatar.svg")) {
                      target.src = "/default-avatar.svg";
                    }
                  }}
                />
              </div>
              <div className="author-summary-meta">
                <strong>{activeProfile.nickname ?? "未设置昵称"}</strong>
                <span className="muted">{formatRole(activeProfile.role)}</span>
              </div>
            </div>
            <div className="account-meta">
              <div>
                <span>性别</span>
                <strong>{activeProfile.gender ?? "未填写"}</strong>
              </div>
              <div>
                <span>专业</span>
                <strong>{activeProfile.major ?? "未填写"}</strong>
              </div>
              <div>
                <span>年级</span>
                <strong>{activeProfile.grade ?? "未填写"}</strong>
              </div>
              <div>
                <span>身份</span>
                <strong>{formatRole(activeProfile.role)}</strong>
              </div>
            </div>
            {!isSelf && (
              <div className="button-row profile-actions">
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={handleRequestFriendFromProfile}
                  disabled={friendLoading || isFriend}
                >
                  {isFriend ? "已是好友" : "➕ 添加好友"}
                </button>
                {isFriend && (
                  <button className="btn btn-secondary" type="button" onClick={handleStartChatFromProfile}>
                    💬 开始聊天
                  </button>
                )}
                <button className="btn btn-secondary" type="button" onClick={handleReportFromProfile}>
                  🚩 举报
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {reportModalOpen && reportTarget && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-modal-title"
          onClick={handleReportModalOverlayClick}
        >
          <div className="modal-card">
            <div className="modal-header">
              <h3 id="report-modal-title">提交举报</h3>
              <button className="btn btn-secondary" type="button" onClick={closeReportModal}>
                关闭
              </button>
            </div>
            <div className="form-stack">
              <div className="report-target">
                <span>举报对象</span>
                <strong>{reportTarget.label}</strong>
                <span className="muted">{reportTarget.displayName}</span>
              </div>
              <label className="inline-field">
                <span>提交图片（可选）</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleReportAttachmentChange}
                />
              </label>
              <span className="muted report-modal-note">可选，仅支持 PNG/JPEG/WEBP，且大小不超过 2MB。</span>
              {reportAttachment && (
                <div className="report-attachment-preview">
                  <img src={reportAttachment.dataUrl} alt="举报图片预览" />
                  <span className="muted">{reportAttachment.name}</span>
                </div>
              )}
              <label className="inline-field">
                <span>文字说明</span>
                <textarea
                  value={reportReason}
                  onChange={(event) => setReportReason(event.target.value)}
                  placeholder="请描述举报原因"
                />
              </label>
              <div className="button-row">
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={handleReportSubmit}
                  disabled={reportSubmitting}
                >
                  {reportSubmitting ? "提交中..." : "提交举报"}
                </button>
                <button className="btn btn-secondary" type="button" onClick={closeReportModal}>
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
