"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "../../components/layouts/AppShell";
import { CenterToast } from "../../components/ui/CenterToast";
import {
  applyCounselor,
  createAppointment,
  createReport,
  getCounselorDetail,
  getMyCounselorApplication,
  getProfile,
  listAvailableSchedules,
  listCounselors,
  listFriends,
  requestFriend,
  resolveAvatarUrl,
  type CounselorApplication,
  type CounselorListItem,
  type CounselorSchedule,
  type FriendRecord,
  type PublicUserProfile,
  type User,
} from "../../lib/api";

// 心理师申请附件允许类型（PDF/DOCX）。
const APPLICATION_ATTACHMENT_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
// 心理师申请附件最大大小（5MB）。
const MAX_APPLICATION_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const REPORT_ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);
const MAX_REPORT_BYTES = 2 * 1024 * 1024;

// 读取附件为 Data URL，便于后端保存。
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
 * 用户端心理咨询师列表与预约页面。
 */
export default function CounselorsPage() {
  const router = useRouter();
  // 心理师列表数据。
  const [counselors, setCounselors] = useState<CounselorListItem[]>([]);
  // 搜索关键字。
  const [searchKeyword, setSearchKeyword] = useState("");
  // 当前选中的心理师编号。
  const [activeCounselorId, setActiveCounselorId] = useState<string | null>(null);
  // 当前选中心理师的可预约档期。
  const [schedules, setSchedules] = useState<CounselorSchedule[]>([]);
  // 预约备注。
  const [userNote, setUserNote] = useState("");
  // 心理师申请记录。
  const [application, setApplication] = useState<CounselorApplication | null>(null);
  // 申请表单输入。
  const [applyForm, setApplyForm] = useState({
    whyCounselor: "",
    scenarioHandling: "",
  });
  // 申请附件缓存。
  const [applicationAttachment, setApplicationAttachment] = useState<{
    name: string;
    dataUrl: string;
  } | null>(null);
  const [viewMode, setViewMode] = useState<"BOOK" | "APPLY">("BOOK");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [friends, setFriends] = useState<FriendRecord[]>([]);
  const [requestedFriendIds, setRequestedFriendIds] = useState<string[]>([]);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [activeProfile, setActiveProfile] = useState<PublicUserProfile | null>(null);
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
  const [friendLoading, setFriendLoading] = useState(false);
  // 页面加载状态。
  const [loading, setLoading] = useState(true);
  // 操作反馈信息。
  const [message, setMessage] = useState<string | null>(null);
  // 错误提示信息。
  const [error, setError] = useState<string | null>(null);

  /**
   * 初始化加载心理师列表与申请信息。
   */
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [counselorList, applicationData, friendList, profile] = await Promise.all([
          listCounselors(),
          getMyCounselorApplication(),
          listFriends(),
          getProfile(),
        ]);
        setCounselors(counselorList);
        setApplication(applicationData.application ?? null);
        setFriends(friendList);
        setCurrentUser(profile);
        if (counselorList.length > 0) {
          setActiveCounselorId(counselorList[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载心理师失败");
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

  const normalizedKeyword = searchKeyword.trim().toLowerCase();
  const filteredCounselors = useMemo(() => {
    if (!normalizedKeyword) {
      return counselors;
    }
    return counselors.filter((counselor) => {
      const haystack = [
        counselor.nickname,
        counselor.email,
        counselor.specialties,
        counselor.bio,
        counselor.officeLocation,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedKeyword);
    });
  }, [counselors, normalizedKeyword]);

  useEffect(() => {
    if (filteredCounselors.length === 0) {
      if (activeCounselorId !== null) {
        setActiveCounselorId(null);
      }
      return;
    }
    if (!activeCounselorId) {
      setActiveCounselorId(filteredCounselors[0].id);
      return;
    }
    if (!filteredCounselors.some((item) => item.id === activeCounselorId)) {
      setActiveCounselorId(filteredCounselors[0].id);
    }
  }, [filteredCounselors, activeCounselorId]);

  /**
   * 选中心理师后加载档期列表。
   */
  useEffect(() => {
    async function loadSchedules() {
      if (!activeCounselorId) {
        return;
      }
      try {
        const list = await listAvailableSchedules(activeCounselorId);
        setSchedules(list);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载档期失败");
      }
    }
    loadSchedules();
  }, [activeCounselorId]);

  const weekLabels = ["", "一", "二", "三", "四", "五", "六", "日"];
  // 当前选中的心理师对象，便于渲染详情。
  const activeCounselor = useMemo(
    () => counselors.find((item) => item.id === activeCounselorId) ?? null,
    [counselors, activeCounselorId],
  );
  const currentUserId = currentUser?.id ?? "";
  const isSelf = !!activeProfile && activeProfile.id === currentUserId;
  const isFriend =
    !!activeProfile && friends.some((friend) => friend.friendId === activeProfile.id);
  const hasRequested =
    !!activeProfile && requestedFriendIds.includes(activeProfile.id);
  const friendLabel = isFriend ? "已是好友" : hasRequested ? "已发送申请" : "➕ 添加好友";

  const formatRole = (role: PublicUserProfile["role"]) => {
    if (role === "ADMIN") {
      return "管理员";
    }
    if (role === "COUNSELOR") {
      return "心理咨询师";
    }
    return "学生";
  };

  const scheduleGroups = useMemo(() => {
    const groups = new Map<
      string,
      {
        key: string;
        mode: string;
        locationLabel: string;
        startTimeLabel: string;
        endTimeLabel: string;
        weekdays: Set<number>;
        items: CounselorSchedule[];
        earliest: number;
      }
    >();
    const formatTime = (value: Date) =>
      value.toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    schedules.forEach((schedule) => {
      const start = new Date(schedule.startTime);
      const end = new Date(schedule.endTime);
      const startTimeLabel = formatTime(start);
      const endTimeLabel = formatTime(end);
      const locationLabel = schedule.location ?? "线上";
      const key = `${schedule.mode}|${locationLabel}|${startTimeLabel}|${endTimeLabel}`;
      const weekDay = start.getDay() === 0 ? 7 : start.getDay();
      const earliest = start.getTime();
      const existing = groups.get(key);
      if (existing) {
        existing.items.push(schedule);
        existing.weekdays.add(weekDay);
        if (earliest < existing.earliest) {
          existing.earliest = earliest;
        }
      } else {
        groups.set(key, {
          key,
          mode: schedule.mode,
          locationLabel,
          startTimeLabel,
          endTimeLabel,
          weekdays: new Set([weekDay]),
          items: [schedule],
          earliest,
        });
      }
    });
    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        items: group.items.sort(
          (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
        ),
      }))
      .sort((a, b) => a.earliest - b.earliest);
  }, [schedules]);

  const formatScheduleDate = (value: string) =>
    new Date(value).toLocaleDateString("zh-CN");
  const formatScheduleTime = (value: string) =>
    new Date(value).toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  /**
   * 预约指定档期。
   */
  const handleBook = async (scheduleId: string) => {
    if (!activeCounselorId) {
      return;
    }
    setMessage(null);
    setError(null);
    try {
      const result = await createAppointment({
        counselorId: activeCounselorId,
        scheduleId,
        userNote: userNote || undefined,
      });
      setMessage("预约成功，已存证");
    } catch (err) {
      setError(err instanceof Error ? err.message : "预约失败");
    }
  };

  /**
   * 提交心理师申请。
   */
  const handleApply = async () => {
    const whyCounselor = applyForm.whyCounselor.trim();
    const scenarioHandling = applyForm.scenarioHandling.trim();
    if (!whyCounselor || !scenarioHandling) {
      setError("请完整回答问题");
      return;
    }
    setMessage(null);
    setError(null);
    try {
      const result = await applyCounselor({
        qualifications: whyCounselor,
        motivation: scenarioHandling,
        attachmentDataUrl: applicationAttachment?.dataUrl ?? undefined,
      });
      setApplication(result.application ?? null);
      setMessage("申请已提交，已存证");
      setApplyForm({ whyCounselor: "", scenarioHandling: "" });
      setApplicationAttachment(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "申请失败");
    }
  };

  /**
   * 上传心理师申请附件（PDF/DOCX）。
   */
  const handleAttachmentChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setApplicationAttachment(null);
      return;
    }
    if (!APPLICATION_ATTACHMENT_TYPES.has(file.type)) {
      const actualType = file.type || "未知类型";
      setError(`仅支持 PDF/DOCX 文件\n当前文件类型：${actualType}`);
      event.target.value = "";
      return;
    }
    if (file.size > MAX_APPLICATION_ATTACHMENT_BYTES) {
      setError("附件大小不能超过 5MB");
      event.target.value = "";
      return;
    }
    setError(null);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setApplicationAttachment({ name: file.name, dataUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : "读取文件失败");
      event.target.value = "";
    }
  };

  const openProfileModal = async (counselor: CounselorListItem) => {
    const fallbackProfile: PublicUserProfile = {
      id: counselor.id,
      nickname: counselor.nickname ?? counselor.email,
      gender: null,
      major: null,
      grade: null,
      avatarUrl: counselor.avatarUrl,
      role: counselor.role,
    };
    setActiveProfile(fallbackProfile);
    setProfileModalOpen(true);
    try {
      const detail = await getCounselorDetail(counselor.id);
      const user = detail.profile.user;
      setActiveProfile({
        id: user.id,
        nickname: user.nickname ?? user.email,
        gender: user.gender,
        major: user.major,
        grade: user.grade,
        avatarUrl: user.avatarUrl,
        role: user.role,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载用户信息失败");
    }
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

  if (loading) {
    return (
      <AppShell title="心理咨询师">
        <div>加载中...</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="心理咨询师">
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
      <div className="button-row">
        <button
          className={`btn ${viewMode === "BOOK" ? "btn-primary" : "btn-secondary"} small`}
          type="button"
          onClick={() => setViewMode("BOOK")}
        >
          预约心理咨询师
        </button>
        <button
          className={`btn ${viewMode === "APPLY" ? "btn-primary" : "btn-secondary"} small`}
          type="button"
          onClick={() => setViewMode("APPLY")}
        >
          申请心理咨询师
        </button>
      </div>
      {viewMode === "BOOK" && (
        <div className="split-grid">
          <div className="card-block">
            <div className="list-header">
              <h3>心理师列表</h3>
              <div className="search-pill list-search">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(event) => setSearchKeyword(event.target.value)}
                  placeholder="搜索姓名/邮箱/特长"
                />
                <span>搜索</span>
              </div>
            </div>
            {filteredCounselors.length === 0 ? (
              <p className="muted">未找到匹配的心理师。</p>
            ) : (
              <ul className="list counselor-list">
                {filteredCounselors.map((counselor) => {
                  const displayName = counselor.nickname ?? counselor.email;
                  const avatarUrl =
                    resolveAvatarUrl(counselor.avatarUrl) || "/default-avatar.svg";
                  return (
                    <li key={counselor.id}>
                      <div className="counselor-item">
                        <button
                          type="button"
                          className="avatar-button counselor-avatar"
                          onClick={() => openProfileModal(counselor)}
                          aria-label={`查看${displayName}资料`}
                        >
                          <img
                            src={avatarUrl}
                            alt={`${displayName}头像`}
                            onError={(event) => {
                              const target = event.currentTarget;
                              if (!target.src.endsWith("/default-avatar.svg")) {
                                target.src = "/default-avatar.svg";
                              }
                            }}
                          />
                        </button>
                        <div className="counselor-meta">
                          <button
                            type="button"
                            className={activeCounselorId === counselor.id ? "pill active" : "pill"}
                            onClick={() => setActiveCounselorId(counselor.id)}
                          >
                            {displayName}
                          </button>
                          <div className="muted">{counselor.specialties ?? "暂无特长描述"}</div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="card-block">
            <h3>预约档期</h3>
            {activeCounselor ? (
              <>
                <p className="muted">
                  当前心理师：{activeCounselor.nickname ?? activeCounselor.email}
                </p>
                <label className="inline-field">
                  <span>预约备注</span>
                  <input
                    value={userNote}
                    onChange={(event) => setUserNote(event.target.value)}
                    placeholder="简要描述需求（可选）"
                  />
                </label>
                {schedules.length === 0 ? (
                  <p className="muted">暂无可预约档期。</p>
                ) : (
                  <div className="schedule-group-list">
                    {scheduleGroups.map((group) => {
                      const weekdayText = Array.from(group.weekdays)
                        .sort((a, b) => a - b)
                        .map((day) => `周${weekLabels[day]}`)
                        .join(" ");
                      const summaryTitle = `${weekdayText} ${group.startTimeLabel}-${group.endTimeLabel}`;
                      if (group.items.length <= 1) {
                        const schedule = group.items[0]!;
                        return (
                          <ul key={group.key} className="list">
                            <li>
                              <div>
                                <strong>
                                  {new Date(schedule.startTime).toLocaleString("zh-CN")} -{" "}
                                  {new Date(schedule.endTime).toLocaleTimeString("zh-CN")}
                                </strong>
                                <div className="muted">
                                  {schedule.mode} · {schedule.location ?? "线上"}
                                </div>
                              </div>
                              <button
                                className="btn btn-secondary"
                                onClick={() => handleBook(schedule.id)}
                              >
                                预约
                              </button>
                            </li>
                          </ul>
                        );
                      }
                      return (
                        <details key={group.key} className="schedule-group">
                          <summary>
                            <div>
                              <strong>{summaryTitle}</strong>
                              <div className="muted">
                                {group.mode} · {group.locationLabel}
                              </div>
                            </div>
                            <span className="schedule-group-count">{group.items.length} 条</span>
                          </summary>
                          <ul className="list schedule-sublist">
                            {group.items.map((schedule) => (
                              <li key={schedule.id}>
                                <div>
                                  <strong>{formatScheduleDate(schedule.startTime)}</strong>
                                  <div className="muted">
                                    {formatScheduleTime(schedule.startTime)} -{" "}
                                    {formatScheduleTime(schedule.endTime)}
                                  </div>
                                </div>
                                <button
                                  className="btn btn-secondary"
                                  onClick={() => handleBook(schedule.id)}
                                >
                                  预约
                                </button>
                              </li>
                            ))}
                          </ul>
                        </details>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <p className="muted">请选择心理师查看档期。</p>
            )}
          </div>
        </div>
      )}
      {viewMode === "APPLY" && (
        <div className="card-block">
          <h3>心理师申请</h3>
          <p className="muted">
            当前申请状态：{application?.status ?? "未申请"}
          </p>
          {application?.status === "APPROVED" ? (
            <p>你已通过审核，可以前往心理师端管理档期。</p>
          ) : (
            <div className="form-stack">
              <label className="inline-field">
                <span>为什么要当心理师</span>
                <textarea
                  value={applyForm.whyCounselor}
                  onChange={(event) =>
                    setApplyForm((prev) => ({ ...prev, whyCounselor: event.target.value }))
                  }
                />
              </label>
              <label className="inline-field">
                <span>遇到危机情况应该怎么做</span>
                <textarea
                  value={applyForm.scenarioHandling}
                  onChange={(event) =>
                    setApplyForm((prev) => ({ ...prev, scenarioHandling: event.target.value }))
                  }
                />
              </label>
              <label className="inline-field">
                <span>资质附件（PDF/DOCX）</span>
                <input
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleAttachmentChange}
                />
              </label>
              {applicationAttachment ? (
                <span className="muted">已选择：{applicationAttachment.name}</span>
              ) : (
                <span className="muted">请上传 PDF 或 DOCX 文件</span>
              )}
              <button className="btn btn-primary" type="button" onClick={handleApply}>
                提交申请
              </button>
            </div>
          )}
        </div>
      )}
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
