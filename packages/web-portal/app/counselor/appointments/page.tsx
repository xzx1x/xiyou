"use client";

import { useEffect, useState, type ChangeEvent, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "../../../components/layouts/AppShell";
import { CenterToast } from "../../../components/ui/CenterToast";
import {
  cancelAppointment,
  completeAppointment,
  createReport,
  getProfile,
  listAppointments,
  listFriends,
  requestFriend,
  resolveAvatarUrl,
  updateAppointmentNote,
  type Appointment,
  type FriendRecord,
  type PublicUserProfile,
} from "../../../lib/api";

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

/**
 * 心理师预约管理页面。
 */
export default function CounselorAppointmentsPage() {
  const router = useRouter();
  // 预约列表数据。
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  // 好友列表数据。
  const [friends, setFriends] = useState<FriendRecord[]>([]);
  const [requestedFriendIds, setRequestedFriendIds] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [activeProfile, setActiveProfile] = useState<PublicUserProfile | null>(null);
  const [friendLoading, setFriendLoading] = useState(false);
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
  // 预约备注输入缓存。
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});
  // 页面加载状态。
  const [loading, setLoading] = useState(true);
  // 操作反馈提示。
  const [message, setMessage] = useState<string | null>(null);
  // 错误提示信息。
  const [error, setError] = useState<string | null>(null);

  /**
   * 加载预约列表。
   */
  useEffect(() => {
    async function loadAppointments() {
      setLoading(true);
      setError(null);
      try {
        const [list, friendList, profile] = await Promise.all([
          listAppointments(),
          listFriends(),
          getProfile(),
        ]);
        setAppointments(list);
        setFriends(friendList);
        setCurrentUserId(profile.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载预约失败");
      } finally {
        setLoading(false);
      }
    }
    loadAppointments();
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
   * 更新预约备注。
   */
  const handleNoteUpdate = async (appointmentId: string) => {
    setMessage(null);
    setError(null);
    try {
      const note = noteMap[appointmentId] ?? "";
      const result = await updateAppointmentNote(appointmentId, note);
      setMessage(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失败");
    }
  };

  /**
   * 标记预约完成。
   */
  const handleComplete = async (appointmentId: string) => {
    setMessage(null);
    setError(null);
    try {
      const result = await completeAppointment(appointmentId);
      setMessage(result);
      setAppointments((prev) =>
        prev.map((item) =>
          item.id === appointmentId ? { ...item, status: "COMPLETED" } : item,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
    }
  };

  /**
   * 心理师请假取消预约。
   */
  const handleCancel = async (appointmentId: string) => {
    setMessage(null);
    setError(null);
    try {
      const result = await cancelAppointment(appointmentId, "心理师请假取消");
      setMessage(result);
      setAppointments((prev) =>
        prev.map((item) =>
          item.id === appointmentId
            ? { ...item, status: "CANCELLED_BY_COUNSELOR" }
            : item,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "取消失败");
    }
  };

  const openProfileModal = (profile?: PublicUserProfile | null) => {
    if (!profile) {
      setError("未找到用户信息");
      return;
    }
    setActiveProfile(profile);
    setProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    setProfileModalOpen(false);
    setActiveProfile(null);
  };

  const handleProfileModalOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      closeProfileModal();
    }
  };

  const openReportModal = (profile: PublicUserProfile) => {
    const displayName = profile.nickname || "用户";
    const label = profile.role === "COUNSELOR" ? "心理咨询师" : "用户";
    setReportTarget({
      type: profile.role === "COUNSELOR" ? "COUNSELOR" : "USER",
      id: profile.id,
      label,
      displayName,
    });
    setReportReason("");
    setReportAttachment(null);
    setReportModalOpen(true);
  };

  const closeReportModal = () => {
    setReportModalOpen(false);
    setReportTarget(null);
    setReportReason("");
    setReportAttachment(null);
  };

  const handleReportModalOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      closeReportModal();
    }
  };

  const handleReportAttachmentChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setReportAttachment(null);
      return;
    }
    if (!REPORT_ALLOWED_TYPES.has(file.type)) {
      setError("仅支持 PNG/JPEG/WEBP 图片");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_REPORT_BYTES) {
      setError("图片大小不能超过 2MB");
      event.target.value = "";
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setReportAttachment({ name: file.name, dataUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : "读取图片失败");
      event.target.value = "";
    }
  };

  const handleReportSubmit = async () => {
    if (!reportTarget) {
      setError("未找到举报对象");
      return;
    }
    if (!reportReason.trim()) {
      setError("请输入文字说明");
      return;
    }
    setReportSubmitting(true);
    try {
      await createReport({
        targetType: reportTarget.type,
        targetId: reportTarget.id,
        reason: reportReason,
        attachmentDataUrl: reportAttachment?.dataUrl,
      });
      setMessage("举报已提交，等待管理员审核");
      closeReportModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "举报提交失败");
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleFriendRequest = async (targetId: string) => {
    if (!targetId) {
      setError("未找到目标用户");
      return;
    }
    setFriendLoading(true);
    try {
      await requestFriend({ targetId });
      setRequestedFriendIds((prev) => (prev.includes(targetId) ? prev : [...prev, targetId]));
      setMessage("好友申请已发送");
    } catch (err) {
      setError(err instanceof Error ? err.message : "发送好友申请失败");
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
    router.push(`/notifications?tab=chat&friendId=${encodeURIComponent(activeProfile.id)}`);
  };

  const formatRole = (role: PublicUserProfile["role"]) => {
    if (role === "ADMIN") {
      return "管理员";
    }
    if (role === "COUNSELOR") {
      return "心理咨询师";
    }
    return "学生";
  };

  const formatAppointmentStatus = (status: Appointment["status"]) => {
    switch (status) {
      case "BOOKED":
        return "已预约";
      case "CANCELLED_BY_USER":
        return "已取消（用户）";
      case "CANCELLED_BY_COUNSELOR":
        return "已取消（心理师）";
      case "COMPLETED":
        return "已完成";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <AppShell title="预约查看" requiredRoles={["COUNSELOR"]}>
        <div>加载中...</div>
      </AppShell>
    );
  }

  const isSelf = !!activeProfile && activeProfile.id === currentUserId;
  const isFriend =
    !!activeProfile && friends.some((friend) => friend.friendId === activeProfile.id);
  const hasRequested =
    !!activeProfile && requestedFriendIds.includes(activeProfile.id);
  const friendLabel = isFriend ? "已是好友" : hasRequested ? "已发送申请" : "➕ 添加好友";

  return (
    <AppShell title="预约查看" requiredRoles={["COUNSELOR"]}>
      {(error || message) && (
        <CenterToast
          type={error ? "error" : "success"}
          message={error ?? message ?? ""}
          onClose={() => {
            setError(null);
            setMessage(null);
          }}
        />
      )}
      <div className="card-block">
        <h3>预约列表</h3>
        {appointments.length === 0 ? (
          <p className="muted">暂无预约。</p>
        ) : (
          <ul className="list">
            {appointments.map((appointment) => {
              const userProfile = appointment.userProfile;
              const avatarUrl =
                resolveAvatarUrl(userProfile?.avatarUrl) || "/default-avatar.svg";
              const name = userProfile?.nickname ?? "用户";
              const modeLabel =
                appointment.schedule?.mode === "ONLINE"
                  ? "线上"
                  : appointment.schedule?.mode === "OFFLINE"
                    ? "线下"
                    : "未知";
              const timeLabel = appointment.schedule
                ? `${new Date(appointment.schedule.startTime).toLocaleString("zh-CN")} - ${new Date(
                    appointment.schedule.endTime,
                  ).toLocaleTimeString("zh-CN")}`
                : new Date(appointment.createdAt).toLocaleString("zh-CN");
              return (
                <li key={appointment.id}>
                  <div className="appointment-summary">
                    <button
                      className="avatar-button appointment-avatar"
                      type="button"
                      onClick={() => openProfileModal(userProfile)}
                      disabled={!userProfile}
                    >
                      <img
                        src={avatarUrl}
                        alt={`${name}头像`}
                        onError={(event) => {
                          const target = event.currentTarget;
                          if (!target.src.endsWith("/default-avatar.svg")) {
                            target.src = "/default-avatar.svg";
                          }
                        }}
                      />
                    </button>
                    <div className="appointment-summary-meta">
                      <strong>对方：{name}</strong>
                      <span className="muted">咨询方式：{modeLabel}</span>
                      <span className="muted">预约时间：{timeLabel}</span>
                    </div>
                  </div>
                  <div className="muted">状态：{formatAppointmentStatus(appointment.status)}</div>
                <div className="form-stack">
                  <label className="inline-field">
                    <span>准备备注</span>
                    <input
                      value={noteMap[appointment.id] ?? appointment.counselorNote ?? ""}
                      onChange={(event) =>
                        setNoteMap((prev) => ({ ...prev, [appointment.id]: event.target.value }))
                      }
                    />
                  </label>
                  <div className="button-row note-actions">
                    {appointment.status === "BOOKED" && (
                      <>
                        <button className="btn btn-secondary" onClick={() => handleComplete(appointment.id)}>
                          标记完成
                        </button>
                        <button className="btn btn-secondary" onClick={() => handleCancel(appointment.id)}>
                          请假取消
                        </button>
                      </>
                    )}
                    <button
                      className="btn btn-secondary note-save"
                      onClick={() => handleNoteUpdate(appointment.id)}
                    >
                      保存备注
                    </button>
                  </div>
                </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
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
                  disabled={friendLoading || isFriend || hasRequested}
                >
                  {friendLabel}
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
