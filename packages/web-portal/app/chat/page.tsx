"use client";

import { useEffect, useState } from "react";
import { AppShell } from "../../components/layouts/AppShell";
import {
  createChatThread,
  listChatMessages,
  listChatThreads,
  listFriendRequests,
  listFriends,
  markChatRead,
  requestFriend,
  respondFriendRequest,
  sendChatMessage,
  type ChatMessage,
  type ChatThread,
  type FriendRecord,
  type FriendRequest,
} from "../../lib/api";

/**
 * 聊天与好友页面。
 */
export default function ChatPage() {
  // 聊天线程列表。
  const [threads, setThreads] = useState<ChatThread[]>([]);
  // 当前选中的线程编号。
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  // 当前线程消息列表。
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // 消息输入框内容。
  const [messageInput, setMessageInput] = useState("");
  // 接收者编号输入。
  const [receiverId, setReceiverId] = useState("");
  // 添加好友的目标编号。
  const [friendTargetId, setFriendTargetId] = useState("");
  // 好友申请列表。
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  // 好友列表。
  const [friends, setFriends] = useState<FriendRecord[]>([]);
  // 页面加载状态。
  const [loading, setLoading] = useState(true);
  // 操作反馈提示。
  const [message, setMessage] = useState<string | null>(null);
  // 错误提示信息。
  const [error, setError] = useState<string | null>(null);

  /**
   * 初始化加载聊天与好友数据。
   */
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [threadList, requestList, friendList] = await Promise.all([
          listChatThreads(),
          listFriendRequests(),
          listFriends(),
        ]);
        setThreads(threadList);
        setFriendRequests(requestList);
        setFriends(friendList);
        if (threadList.length > 0) {
          setActiveThreadId(threadList[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载聊天失败");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!message) {
      return;
    }
    const timer = window.setTimeout(() => setMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (!error) {
      return;
    }
    const timer = window.setTimeout(() => setError(null), 3000);
    return () => window.clearTimeout(timer);
  }, [error]);

  /**
   * 加载当前线程消息。
   */
  useEffect(() => {
    async function loadMessages() {
      if (!activeThreadId) {
        return;
      }
      try {
        const list = await listChatMessages(activeThreadId);
        setMessages(list);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载消息失败");
      }
    }
    loadMessages();
  }, [activeThreadId]);

  /**
   * 创建新的聊天线程。
   */
  const handleCreateThread = async () => {
    if (!receiverId) {
      setError("请输入接收者编号");
      return;
    }
    setError(null);
    try {
      const thread = await createChatThread({ peerId: receiverId });
      setThreads((prev) => [thread, ...prev]);
      setActiveThreadId(thread.id);
      setMessage("已创建聊天线程");
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建线程失败");
    }
  };

  /**
   * 发送聊天消息。
   */
  const handleSendMessage = async () => {
    if (!activeThreadId) {
      setError("请先选择聊天线程");
      return;
    }
    if (!receiverId) {
      setError("请输入接收者编号");
      return;
    }
    if (!messageInput) {
      setError("请输入消息内容");
      return;
    }
    setError(null);
    try {
      const messageRecord = await sendChatMessage(activeThreadId, {
        content: messageInput,
        receiverId,
      });
      setMessages((prev) => [...prev, messageRecord]);
      setMessageInput("");
      await markChatRead(activeThreadId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "发送失败");
    }
  };

  /**
   * 处理好友申请。
   */
  const handleRespond = async (requestId: string, accept: boolean) => {
    setError(null);
    try {
      await respondFriendRequest(requestId, { accept });
      setFriendRequests((prev) => prev.filter((item) => item.id !== requestId));
      setMessage(accept ? "已接受好友申请" : "已拒绝好友申请");
    } catch (err) {
      setError(err instanceof Error ? err.message : "处理失败");
    }
  };

  /**
   * 发起好友申请。
   */
  const handleFriendRequest = async () => {
    if (!friendTargetId) {
      setError("请输入好友编号");
      return;
    }
    setError(null);
    try {
      await requestFriend({ targetId: friendTargetId });
      setMessage("好友申请已发送");
      setFriendTargetId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "发送好友申请失败");
    }
  };

  if (loading) {
    return (
      <AppShell title="聊天中心">
        <div>加载中...</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="聊天中心">
      {error && <div className="status error">{error}</div>}
      {message && <div className="status">{message}</div>}
      <div className="split-grid">
        <div className="card-block">
          <h3>好友申请</h3>
          <div className="form-stack">
            <label className="inline-field">
              <span>添加好友</span>
              <input
                value={friendTargetId}
                onChange={(event) => setFriendTargetId(event.target.value)}
                placeholder="输入好友编号"
              />
            </label>
            <button className="btn btn-secondary" type="button" onClick={handleFriendRequest}>
              发送申请
            </button>
          </div>
          {friendRequests.length === 0 ? (
            <p className="muted">暂无好友申请。</p>
          ) : (
            <ul className="list">
              {friendRequests.map((request) => (
                <li key={request.id}>
                  <span>{request.requesterId}</span>
                  <div className="button-row">
                    <button className="btn btn-secondary" onClick={() => handleRespond(request.id, true)}>
                      接受
                    </button>
                    <button className="btn btn-secondary" onClick={() => handleRespond(request.id, false)}>
                      拒绝
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <h3>好友列表</h3>
          {friends.length === 0 ? (
            <p className="muted">暂无好友。</p>
          ) : (
            <ul className="list">
              {friends.map((friend) => (
                <li key={friend.friendId}>{friend.friendId}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="card-block">
          <h3>聊天线程</h3>
          <div className="form-stack">
            <label className="inline-field">
              <span>对方编号</span>
              <input
                value={receiverId}
                onChange={(event) => setReceiverId(event.target.value)}
                placeholder="输入好友或心理师编号"
              />
            </label>
            <button className="btn btn-secondary" type="button" onClick={handleCreateThread}>
              创建/进入聊天
            </button>
          </div>
          <ul className="list">
            {threads.map((thread) => (
              <li key={thread.id}>
                <button
                  className={activeThreadId === thread.id ? "pill active" : "pill"}
                  onClick={() => setActiveThreadId(thread.id)}
                >
                  线程 {thread.id.slice(0, 6)}
                </button>
              </li>
            ))}
          </ul>
          <h3>聊天记录</h3>
          {messages.length === 0 ? (
            <p className="muted">暂无消息。</p>
          ) : (
            <ul className="list">
              {messages.map((item) => (
                <li key={item.id}>
                  <strong>{item.senderId}</strong>：{item.content}
                  <small>{new Date(item.createdAt).toLocaleString("zh-CN")}</small>
                </li>
              ))}
            </ul>
          )}
          <div className="form-stack">
            <textarea
              value={messageInput}
              onChange={(event) => setMessageInput(event.target.value)}
              placeholder="输入消息内容"
            />
            <button className="btn btn-primary" type="button" onClick={handleSendMessage}>
              发送消息
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
