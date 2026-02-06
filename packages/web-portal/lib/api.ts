// API 根地址，统一去除末尾的 /，便于拼接路径。
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001"
).replace(/\/$/, "");

/**
 * 将头像路径转换为可访问的完整 URL。
 */
export function resolveAvatarUrl(avatarUrl?: string | null) {
  if (!avatarUrl) {
    return "";
  }
  if (/^https?:\/\//i.test(avatarUrl)) {
    return avatarUrl;
  }
  return `${API_BASE_URL}${avatarUrl.startsWith("/") ? "" : "/"}${avatarUrl}`;
}

export type UserRole = "USER" | "COUNSELOR" | "ADMIN";

export interface User {
  id: string;
  email: string;
  identityCode: string;
  nickname?: string | null;
  gender?: string | null;
  major?: string | null;
  grade?: string | null;
  avatarUrl?: string | null;
  isDisabled?: boolean;
  disabledReason?: string | null;
  lastLoginAt?: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface PublicUserProfile {
  id: string;
  nickname?: string | null;
  gender?: string | null;
  major?: string | null;
  grade?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
}

export interface RegisterPayload {
  email: string;
  password: string;
  verificationCode: string;
  identityCode: string;
  nickname?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

/**
 * 修改密码请求体，使用验证码确认身份。
 */
export interface PasswordChangePayload {
  newPassword: string;
  verificationCode: string;
}

/**
 * 个人资料更新载荷，字段可选便于部分提交。
 */
export type ProfileInput = {
  nickname?: string;
  gender?: string;
  major?: string;
  grade?: string;
  avatarUrl?: string;
};

// 心理师申请记录结构。
export interface CounselorApplication {
  id: string;
  userId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  qualifications?: string | null;
  motivation?: string | null;
  attachmentUrls?: string | null;
  applicantProfile?: PublicUserProfile | null;
  reviewReason?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// 心理师档案结构。
export interface CounselorProfile {
  userId: string;
  bio?: string | null;
  specialties?: string | null;
  serviceMode: "ONLINE" | "OFFLINE" | "BOTH";
  officeLocation?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 心理师列表项结构（用户端浏览）。
export interface CounselorListItem {
  id: string;
  email: string;
  nickname?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  bio?: string | null;
  specialties?: string | null;
  serviceMode: "ONLINE" | "OFFLINE" | "BOTH";
  officeLocation?: string | null;
  isActive: boolean;
}

// 心理师档期结构。
export interface CounselorSchedule {
  id: string;
  counselorId: string;
  startTime: string;
  endTime: string;
  mode: "ONLINE" | "OFFLINE";
  location?: string | null;
  status: "AVAILABLE" | "BOOKED" | "CANCELLED";
  cancelReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

// 预约记录结构。
export interface Appointment {
  id: string;
  userId: string;
  counselorId: string;
  scheduleId: string;
  status: "BOOKED" | "CANCELLED_BY_USER" | "CANCELLED_BY_COUNSELOR" | "COMPLETED";
  userNote?: string | null;
  counselorNote?: string | null;
  cancelReason?: string | null;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string | null;
  completedAt?: string | null;
  userProfile?: PublicUserProfile | null;
  counselorProfile?: PublicUserProfile | null;
  schedule?: {
    id: string;
    startTime: string;
    endTime: string;
    mode: "ONLINE" | "OFFLINE";
    location?: string | null;
  } | null;
}

// 咨询记录结构。
export interface ConsultationRecord {
  id: string;
  appointmentId: string;
  userId: string;
  counselorId: string;
  summary?: string | null;
  counselorFeedback?: string | null;
  homework?: string | null;
  followUpPlan?: string | null;
  assessmentSummary?: string | null;
  issueCategory?: string | null;
  isCrisis: boolean;
  createdAt: string;
  updatedAt: string;
}

// 测评模板题目结构。
export interface AssessmentQuestion {
  id: number;
  text: string;
}

// 测评模板结构。
export interface AssessmentTemplate {
  type: "MOOD" | "ANXIETY" | "STRESS" | "SLEEP" | "SOCIAL";
  title: string;
  description: string;
  questions: AssessmentQuestion[];
}

// 测评结果记录结构。
export interface AssessmentResult {
  id: string;
  userId: string;
  type: "MOOD" | "ANXIETY" | "STRESS" | "SLEEP" | "SOCIAL";
  score: number;
  level: string;
  answers: string;
  createdAt: string;
}

// 咨询反馈结构。
export interface FeedbackRecord {
  id: string;
  appointmentId: string;
  userId: string;
  counselorId: string;
  rating: number;
  comment?: string | null;
  liked: boolean;
  createdAt: string;
}

// 聊天线程结构。
export interface ChatThread {
  id: string;
  type: "DIRECT";
  createdAt: string;
  lastMessageAt?: string | null;
}

// 聊天消息结构。
export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt?: string | null;
  revokedAt?: string | null;
  revokedBy?: string | null;
}

// 好友申请记录结构。
export interface FriendRequest {
  id: string;
  requesterId: string;
  targetId: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
  requesterProfile?: PublicUserProfile | null;
}

// 好友关系记录结构。
export interface FriendRecord {
  userId: string;
  friendId: string;
  createdAt: string;
  profile?: PublicUserProfile | null;
}

// 论坛帖子结构。
export interface ForumPost {
  id: string;
  authorId?: string | null;
  author?: PublicUserProfile | null;
  title: string;
  content: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  isAnonymous: boolean;
  reviewReason?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  likeCount?: number;
  liked?: boolean;
}

// 论坛评论结构。
export interface ForumComment {
  id: string;
  postId: string;
  authorId?: string | null;
  parentId?: string | null;
  author?: PublicUserProfile | null;
  content: string;
  createdAt: string;
}

// 举报记录结构。
export interface ReportRecord {
  id: string;
  reporterId: string;
  targetType: "POST" | "COMMENT" | "USER" | "COUNSELOR";
  targetId: string;
  reason: string;
  attachmentUrl?: string | null;
  status: "PENDING" | "RESOLVED";
  actionTaken?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
}

// 通知记录结构。
export interface NotificationRecord {
  id: string;
  userId: string;
  channel: "IN_APP" | "EMAIL";
  title: string;
  message: string;
  link?: string | null;
  readAt?: string | null;
  createdAt: string;
}

// 存证占位记录结构。
export interface EvidenceRecord {
  id: string;
  targetType:
    | "APPOINTMENT"
    | "CONSULTATION"
    | "ASSESSMENT"
    | "FEEDBACK"
    | "FORUM_POST"
    | "REPORT"
    | "CONTENT"
    | "COUNSELOR_APPLICATION";
  targetId: string;
  summary?: string | null;
  status: "PENDING" | "RECORDED";
  createdAt: string;
}

// 心理师统计数据结构。
export interface CounselorStats {
  appointments: {
    total: number;
    completed: number;
    cancelled: number;
  };
  feedback: {
    averageRating: number | null;
    total: number;
  };
  issueCategories: Array<{ category: string; total: number }>;
  crisisCount: number;
}

// 管理员统计数据结构。
export interface AdminStats {
  appointments: {
    total: number;
    completed: number;
    cancelled: number;
    completionRate: number;
  };
  feedback: {
    averageRating: number | null;
    total: number;
  };
  issueCategories: Array<{ category: string; total: number }>;
  assessmentDistribution: Array<{ type: string; level: string; total: number }>;
  crisisCount: number;
}

interface RegisterResponse {
  user: User;
}

interface LoginResponse {
  token: string;
  user: User;
}

interface ProfileResponse {
  profile: User;
}

interface PasswordChangeResponse {
  message: string;
}

interface PasswordResetRequestResponse {
  message: string;
  resetToken?: string;
}

interface PasswordResetConfirmResponse {
  message: string;
}

interface RegisterVerificationResponse {
  message: string;
  verificationCode?: string;
}

interface PasswordChangeVerificationResponse {
  message: string;
  verificationCode?: string;
}

interface CounselorApplicationResponse {
  application: CounselorApplication | null;
  evidence?: EvidenceRecord;
}

interface CounselorListResponse {
  counselors: CounselorListItem[];
}

interface CounselorProfileResponse {
  profile: {
    user: User;
    counselor: CounselorProfile | null;
  };
}

interface CounselorScheduleListResponse {
  schedules: CounselorSchedule[];
}

interface AppointmentCreateResponse {
  appointment: Appointment;
  evidence: EvidenceRecord;
}

interface AppointmentListResponse {
  appointments: Appointment[];
}

interface AppointmentDetailResponse {
  appointment: Appointment;
}

interface ConsultationCreateResponse {
  record: ConsultationRecord;
  evidence: EvidenceRecord;
}

interface ConsultationListResponse {
  records: ConsultationRecord[];
}

interface AssessmentTemplateResponse {
  templates: AssessmentTemplate[];
}

interface AssessmentSubmitResponse {
  record: AssessmentResult;
  evidence: EvidenceRecord;
}

interface AssessmentHistoryResponse {
  records: AssessmentResult[];
}

interface FeedbackSubmitResponse {
  feedback: FeedbackRecord;
  evidence: EvidenceRecord;
}

interface FeedbackListResponse {
  feedback: FeedbackRecord[];
}

interface ChatThreadListResponse {
  threads: ChatThread[];
}

interface ChatThreadResponse {
  thread: ChatThread;
}

interface ChatMessageListResponse {
  messages: ChatMessage[];
}

interface ChatMessageResponse {
  message: ChatMessage;
}

interface ChatUnreadCountResponse {
  count: number;
}

interface FriendRequestListResponse {
  requests: FriendRequest[];
}

interface FriendListResponse {
  friends: FriendRecord[];
}

interface FriendSearchResponse {
  users: PublicUserProfile[];
}

interface ForumPostCreateResponse {
  post: ForumPost;
  evidence: EvidenceRecord;
}

interface ForumPostListResponse {
  posts: ForumPost[];
}

interface ForumPostDetailResponse {
  post: ForumPost;
}

interface ForumCommentListResponse {
  comments: ForumComment[];
}

interface ForumCommentResponse {
  comment: ForumComment;
}

interface ReportCreateResponse {
  report: ReportRecord;
  evidence: EvidenceRecord;
}

interface ReportListResponse {
  reports: ReportRecord[];
}

interface NotificationListResponse {
  notifications: NotificationRecord[];
}

interface EvidenceDetailResponse {
  evidence: EvidenceRecord | null;
}

interface AdminUsersResponse {
  users: User[];
}

interface StatsCounselorResponse {
  stats: CounselorStats;
}

interface StatsAdminResponse {
  stats: AdminStats;
}

interface LogRecord {
  id: string;
  userId?: string | null;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  ip?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

interface LogListResponse {
  logs: LogRecord[];
}

type RequestOptions = RequestInit & {
  auth?: boolean;
};

function getAuthToken() {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem("campus_auth_token");
}

function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  if (!token) {
    return {};
  }
  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * 统一封装 fetch，自动拼接 BASE_URL、设置 JSON Header，并在失败时抛出错误。
 */
async function request<T>(path: string, init: RequestOptions): Promise<T> {
  const { auth, ...rest } = init;
  const authHeaders = auth ? getAuthHeaders() : {};
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...rest.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof data.message === "string" ? data.message : "请求失败，请稍后重试";
    throw new Error(message);
  }
  return data as T;
}

/**
 * 注册 API：返回后端脱敏后的用户对象。
 */
export async function registerUser(payload: RegisterPayload): Promise<User> {
  const { user } = await request<RegisterResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return user;
}

/**
 * 发送注册验证码。
 */
export async function requestRegisterVerification(
  email: string,
  smtpAuthCode: string,
): Promise<RegisterVerificationResponse> {
  return request<RegisterVerificationResponse>("/api/auth/register/request", {
    method: "POST",
    body: JSON.stringify({ email, smtpAuthCode }),
  });
}

/**
 * 登录 API：返回 Token + 用户信息，前端可保存 Token 以调用受保护接口。
 */
export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  return request<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * 获取当前用户的资料信息（需 Authorization Header）。
 */
export async function getProfile(): Promise<User> {
  const { profile } = await request<ProfileResponse>("/api/account/profile", {
    method: "GET",
    auth: true,
  });
  return profile;
}

/**
 * 修改当前用户资料，支持部分字段提交。
 */
export async function updateProfile(payload: ProfileInput): Promise<User> {
  const { profile } = await request<ProfileResponse>("/api/account/profile", {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(payload),
  });
  return profile;
}

/**
 * 修改密码（需要登录态）。
 */
export async function updatePassword(
  payload: PasswordChangePayload,
): Promise<string> {
  const { message } = await request<PasswordChangeResponse>(
    "/api/account/password",
    {
      method: "PATCH",
      auth: true,
      body: JSON.stringify(payload),
    },
  );
  return message;
}

/**
 * 发送修改密码验证码。
 */
export async function requestPasswordChangeVerification(
  smtpAuthCode: string,
): Promise<PasswordChangeVerificationResponse> {
  return request<PasswordChangeVerificationResponse>(
    "/api/account/password/verification",
    {
      method: "POST",
      auth: true,
      body: JSON.stringify({ smtpAuthCode }),
    },
  );
}

/**
 * 上传头像（Base64 Data URL），返回更新后的用户资料。
 */
export async function uploadAvatar(dataUrl: string): Promise<User> {
  const { profile } = await request<ProfileResponse>("/api/account/avatar", {
    method: "POST",
    auth: true,
    body: JSON.stringify({ dataUrl }),
  });
  return profile;
}

/**
 * 发起密码重置申请。
 */
export async function requestPasswordReset(payload: {
  email: string;
  smtpAuthCode: string;
}): Promise<PasswordResetRequestResponse> {
  return request<PasswordResetRequestResponse>("/api/auth/password/reset/request", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * 确认密码重置。
 */
export async function confirmPasswordReset(payload: {
  token: string;
  newPassword: string;
}): Promise<PasswordResetConfirmResponse> {
  return request<PasswordResetConfirmResponse>("/api/auth/password/reset/confirm", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * 提交心理师申请。
 */
export async function applyCounselor(payload: {
  qualifications?: string;
  motivation?: string;
  attachmentUrls?: string;
  attachmentDataUrl?: string;
}): Promise<CounselorApplicationResponse> {
  return request<CounselorApplicationResponse>("/api/counselors/apply", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
}

/**
 * 获取当前用户的心理师申请记录。
 */
export async function getMyCounselorApplication(): Promise<CounselorApplicationResponse> {
  return request<CounselorApplicationResponse>("/api/counselors/apply", {
    method: "GET",
    auth: true,
  });
}

/**
 * 获取心理师列表。
 */
export async function listCounselors(): Promise<CounselorListItem[]> {
  const { counselors } = await request<CounselorListResponse>("/api/counselors", {
    method: "GET",
    auth: true,
  });
  return counselors;
}

/**
 * 获取心理师详情。
 */
export async function getCounselorDetail(
  counselorId: string,
): Promise<CounselorProfileResponse> {
  return request<CounselorProfileResponse>(`/api/counselors/${counselorId}`, {
    method: "GET",
    auth: true,
  });
}

/**
 * 更新心理师档案。
 */
export async function updateCounselorProfile(payload: {
  bio?: string;
  specialties?: string;
  serviceMode?: "ONLINE" | "OFFLINE" | "BOTH";
  officeLocation?: string;
  isActive?: boolean;
}): Promise<CounselorProfile> {
  const { profile } = await request<{ profile: CounselorProfile }>("/api/counselors/profile", {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(payload),
  });
  return profile;
}

/**
 * 创建心理师档期。
 */
export async function createCounselorSchedule(payload: {
  type?: "SHORT" | "LONG";
  date?: string;
  startTime: string;
  endTime: string;
  repeat?: "ALL" | "WEEKDAY" | "CUSTOM";
  daysOfWeek?: number[];
  mode: "ONLINE" | "OFFLINE";
  location?: string;
}): Promise<CounselorSchedule[]> {
  const { schedules } = await request<{ schedules: CounselorSchedule[] }>(
    "/api/counselors/schedules",
    {
      method: "POST",
      auth: true,
      body: JSON.stringify(payload),
    },
  );
  return schedules;
}

/**
 * 获取心理师自身档期列表。
 */
export async function listCounselorSchedules(status?: "AVAILABLE" | "BOOKED" | "CANCELLED"): Promise<CounselorSchedule[]> {
  const query = status ? `?status=${status}` : "";
  const { schedules } = await request<CounselorScheduleListResponse>(`/api/counselors/schedules${query}`, {
    method: "GET",
    auth: true,
  });
  return schedules;
}

/**
 * 用户侧获取心理师可预约档期。
 */
export async function listAvailableSchedules(counselorId: string): Promise<CounselorSchedule[]> {
  const { schedules } = await request<CounselorScheduleListResponse>(`/api/counselors/${counselorId}/schedules`, {
    method: "GET",
    auth: true,
  });
  return schedules;
}

/**
 * 取消心理师档期。
 */
export async function cancelCounselorSchedule(scheduleId: string, reason?: string): Promise<string> {
  const { message } = await request<{ message: string }>(`/api/counselors/schedules/${scheduleId}/cancel`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify({ reason }),
  });
  return message;
}

/**
 * 管理员查询心理师申请列表。
 */
export async function listCounselorApplications(status?: "PENDING" | "APPROVED" | "REJECTED"): Promise<CounselorApplication[]> {
  const query = status ? `?status=${status}` : "";
  const { applications } = await request<{ applications: CounselorApplication[] }>(`/api/counselors/applications${query}`, {
    method: "GET",
    auth: true,
  });
  return applications;
}

/**
 * 管理员审核心理师申请。
 */
export async function reviewCounselorApplication(
  applicationId: string,
  payload: { status: "PENDING" | "APPROVED" | "REJECTED"; reviewReason?: string },
): Promise<string> {
  const { message } = await request<{ message: string }>(`/api/counselors/applications/${applicationId}/review`, {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
  return message;
}

/**
 * 提交预约申请。
 */
export async function createAppointment(payload: {
  counselorId: string;
  scheduleId: string;
  userNote?: string;
}): Promise<AppointmentCreateResponse> {
  return request<AppointmentCreateResponse>("/api/appointments", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
}

/**
 * 获取预约列表。
 */
export async function listAppointments(): Promise<Appointment[]> {
  const { appointments } = await request<AppointmentListResponse>("/api/appointments", {
    method: "GET",
    auth: true,
  });
  return appointments;
}

/**
 * 获取预约详情。
 */
export async function getAppointmentDetail(appointmentId: string): Promise<Appointment> {
  const { appointment } = await request<AppointmentDetailResponse>(`/api/appointments/${appointmentId}`, {
    method: "GET",
    auth: true,
  });
  return appointment;
}

/**
 * 取消预约。
 */
export async function cancelAppointment(appointmentId: string, reason?: string): Promise<string> {
  const { message } = await request<{ message: string }>(`/api/appointments/${appointmentId}/cancel`, {
    method: "POST",
    auth: true,
    body: JSON.stringify({ reason }),
  });
  return message;
}

/**
 * 心理师更新预约备注。
 */
export async function updateAppointmentNote(appointmentId: string, note?: string): Promise<string> {
  const { message } = await request<{ message: string }>(`/api/appointments/${appointmentId}/note`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify({ note }),
  });
  return message;
}

/**
 * 心理师标记预约完成。
 */
export async function completeAppointment(appointmentId: string): Promise<string> {
  const { message } = await request<{ message: string }>(`/api/appointments/${appointmentId}/complete`, {
    method: "POST",
    auth: true,
  });
  return message;
}

/**
 * 创建咨询记录。
 */
export async function createConsultation(payload: {
  appointmentId: string;
  summary?: string;
  counselorFeedback?: string;
  homework?: string;
  followUpPlan?: string;
  assessmentSummary?: string;
  issueCategory?: string;
  isCrisis?: boolean;
}): Promise<ConsultationCreateResponse> {
  return request<ConsultationCreateResponse>("/api/consultations", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
}

/**
 * 更新咨询记录。
 */
export async function updateConsultation(
  recordId: string,
  payload: Partial<Omit<ConsultationRecord, "id" | "appointmentId" | "userId" | "counselorId" | "createdAt" | "updatedAt">>,
): Promise<ConsultationRecord> {
  const { record } = await request<{ record: ConsultationRecord }>(`/api/consultations/${recordId}`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(payload),
  });
  return record;
}

/**
 * 获取咨询记录列表。
 */
export async function listConsultations(): Promise<ConsultationRecord[]> {
  const { records } = await request<ConsultationListResponse>("/api/consultations", {
    method: "GET",
    auth: true,
  });
  return records;
}

/**
 * 获取咨询记录详情。
 */
export async function getConsultationDetail(recordId: string): Promise<ConsultationRecord> {
  const { record } = await request<{ record: ConsultationRecord }>(`/api/consultations/${recordId}`, {
    method: "GET",
    auth: true,
  });
  return record;
}

/**
 * 获取测评模板列表。
 */
export async function listAssessmentTemplates(): Promise<AssessmentTemplate[]> {
  const { templates } = await request<AssessmentTemplateResponse>("/api/assessments/templates", {
    method: "GET",
    auth: true,
  });
  return templates;
}

/**
 * 提交测评。
 */
export async function submitAssessmentResult(payload: {
  type: "MOOD" | "ANXIETY" | "STRESS" | "SLEEP" | "SOCIAL";
  answers: number[];
}): Promise<AssessmentSubmitResponse> {
  return request<AssessmentSubmitResponse>("/api/assessments", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
}

/**
 * 获取测评历史。
 */
export async function listAssessmentHistory(): Promise<AssessmentResult[]> {
  const { records } = await request<AssessmentHistoryResponse>("/api/assessments", {
    method: "GET",
    auth: true,
  });
  return records;
}

/**
 * 提交咨询反馈。
 */
export async function submitFeedback(payload: {
  appointmentId: string;
  rating: number;
  comment?: string;
  liked?: boolean;
}): Promise<FeedbackSubmitResponse> {
  return request<FeedbackSubmitResponse>("/api/feedback", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
}

/**
 * 获取反馈列表。
 */
export async function listFeedback(): Promise<FeedbackRecord[]> {
  const { feedback } = await request<FeedbackListResponse>("/api/feedback", {
    method: "GET",
    auth: true,
  });
  return feedback;
}

/**
 * 获取聊天线程列表。
 */
export async function listChatThreads(): Promise<ChatThread[]> {
  const { threads } = await request<ChatThreadListResponse>("/api/chat/threads", {
    method: "GET",
    auth: true,
  });
  return threads;
}

/**
 * 获取未读聊天数量。
 */
export async function getChatUnreadCount(): Promise<number> {
  const { count } = await request<ChatUnreadCountResponse>("/api/chat/unread-count", {
    method: "GET",
    auth: true,
  });
  return count;
}

/**
 * 创建或获取聊天线程。
 */
export async function createChatThread(payload: { peerId: string }): Promise<ChatThread> {
  const { thread } = await request<ChatThreadResponse>("/api/chat/threads", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
  return thread;
}

/**
 * 获取线程消息列表。
 */
export async function listChatMessages(
  threadId: string,
  options?: { before?: string; limit?: number },
): Promise<ChatMessage[]> {
  const query = new URLSearchParams();
  if (options?.before) {
    query.set("before", options.before);
  }
  if (options?.limit) {
    query.set("limit", String(options.limit));
  }
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const { messages } = await request<ChatMessageListResponse>(
    `/api/chat/threads/${threadId}/messages${suffix}`,
    {
      method: "GET",
      auth: true,
    },
  );
  return messages;
}

/**
 * 发送聊天消息。
 */
export async function sendChatMessage(
  threadId: string,
  payload: { content: string; receiverId: string },
): Promise<ChatMessage> {
  const { message } = await request<ChatMessageResponse>(`/api/chat/threads/${threadId}/messages`, {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
  return message;
}

/**
 * 删除聊天消息（仅自己不可见）。
 */
export async function deleteChatMessage(messageId: string): Promise<string> {
  const { message } = await request<{ message: string }>(`/api/chat/messages/${messageId}/delete`, {
    method: "POST",
    auth: true,
  });
  return message;
}

/**
 * 撤回聊天消息（双方不可见）。
 */
export async function revokeChatMessage(messageId: string): Promise<ChatMessage> {
  const { message } = await request<ChatMessageResponse>(`/api/chat/messages/${messageId}/revoke`, {
    method: "POST",
    auth: true,
  });
  return message;
}

/**
 * 标记聊天消息已读。
 */
export async function markChatRead(threadId: string): Promise<string> {
  const { message } = await request<{ message: string }>(`/api/chat/threads/${threadId}/read`, {
    method: "POST",
    auth: true,
  });
  return message;
}

/**
 * 发起好友申请。
 */
export async function requestFriend(payload: { targetId: string }): Promise<FriendRequest> {
  const { request: requestRecord } = await request<{ request: FriendRequest }>("/api/friends/requests", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
  return requestRecord;
}

/**
 * 查询好友申请列表。
 */
export async function listFriendRequests(): Promise<FriendRequest[]> {
  const { requests } = await request<FriendRequestListResponse>("/api/friends/requests", {
    method: "GET",
    auth: true,
  });
  return requests;
}

/**
 * 处理好友申请。
 */
export async function respondFriendRequest(
  requestId: string,
  payload: { accept: boolean },
): Promise<string> {
  const { message } = await request<{ message: string }>(`/api/friends/requests/${requestId}/respond`, {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
  return message;
}

/**
 * 查询好友列表。
 */
export async function listFriends(): Promise<FriendRecord[]> {
  const { friends } = await request<FriendListResponse>("/api/friends", {
    method: "GET",
    auth: true,
  });
  return friends;
}

/**
 * 根据昵称关键词搜索好友候选人。
 */
export async function searchFriendCandidates(keyword: string): Promise<PublicUserProfile[]> {
  const query = keyword ? `?keyword=${encodeURIComponent(keyword)}` : "";
  const { users } = await request<FriendSearchResponse>(`/api/friends/search${query}`, {
    method: "GET",
    auth: true,
  });
  return users;
}

/**
 * 创建论坛帖子。
 */
export async function createForumPost(payload: {
  title: string;
  content: string;
}): Promise<ForumPostCreateResponse> {
  return request<ForumPostCreateResponse>("/api/forum/posts", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
}

/**
 * 获取论坛帖子列表。
 */
export async function listForumPosts(status?: "PENDING" | "APPROVED" | "REJECTED"): Promise<ForumPost[]> {
  const query = status ? `?status=${status}` : "";
  const { posts } = await request<ForumPostListResponse>(`/api/forum/posts${query}`, {
    method: "GET",
    auth: true,
  });
  return posts;
}

/**
 * 获取论坛帖子详情。
 */
export async function getForumPostDetail(postId: string): Promise<ForumPost> {
  const { post } = await request<ForumPostDetailResponse>(`/api/forum/posts/${postId}`, {
    method: "GET",
    auth: true,
  });
  return post;
}

/**
 * 管理员审核论坛帖子。
 */
export async function reviewForumPost(
  postId: string,
  payload: { status: "PENDING" | "APPROVED" | "REJECTED"; reviewReason?: string },
): Promise<string> {
  const { message } = await request<{ message: string }>(`/api/forum/posts/${postId}/review`, {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
  return message;
}

/**
 * 发布论坛评论。
 */
export async function createForumComment(payload: {
  postId: string;
  content: string;
  parentId?: string;
}): Promise<ForumComment> {
  const { comment } = await request<ForumCommentResponse>("/api/forum/comments", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
  return comment;
}

/**
 * 获取论坛评论列表。
 */
export async function listForumComments(postId: string): Promise<ForumComment[]> {
  const { comments } = await request<ForumCommentListResponse>(`/api/forum/posts/${postId}/comments`, {
    method: "GET",
    auth: true,
  });
  return comments;
}

/**
 * 点赞论坛帖子。
 */
export async function likePost(postId: string): Promise<string> {
  const { message } = await request<{ message: string }>(`/api/forum/posts/${postId}/like`, {
    method: "POST",
    auth: true,
  });
  return message;
}

/**
 * 取消点赞论坛帖子。
 */
export async function unlikePost(postId: string): Promise<string> {
  const { message } = await request<{ message: string }>(`/api/forum/posts/${postId}/unlike`, {
    method: "POST",
    auth: true,
  });
  return message;
}

/**
 * 提交举报。
 */
export async function createReport(payload: {
  targetType: "POST" | "COMMENT" | "USER" | "COUNSELOR";
  targetId: string;
  reason: string;
  attachmentDataUrl?: string | null;
}): Promise<ReportCreateResponse> {
  return request<ReportCreateResponse>("/api/reports", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
}

/**
 * 管理员查询举报列表。
 */
export async function listReports(status?: "PENDING" | "RESOLVED"): Promise<ReportRecord[]> {
  const query = status ? `?status=${status}` : "";
  const { reports } = await request<ReportListResponse>(`/api/reports${query}`, {
    method: "GET",
    auth: true,
  });
  return reports;
}

/**
 * 管理员处理举报。
 */
export async function resolveReport(
  reportId: string,
  payload: { actionTaken?: string; disableTarget?: boolean },
): Promise<string> {
  const { message } = await request<{ message: string }>(`/api/reports/${reportId}/resolve`, {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
  return message;
}

/**
 * 获取通知列表。
 */
export async function listNotifications(): Promise<NotificationRecord[]> {
  const { notifications } = await request<NotificationListResponse>("/api/notifications", {
    method: "GET",
    auth: true,
  });
  return notifications;
}

/**
 * 标记通知已读。
 */
export async function markNotificationRead(notificationId: string): Promise<string> {
  const { message } = await request<{ message: string }>(`/api/notifications/${notificationId}/read`, {
    method: "PATCH",
    auth: true,
  });
  return message;
}

/**
 * 标记所有通知为已读。
 */
export async function markAllNotificationsRead(): Promise<string> {
  const { message } = await request<{ message: string }>("/api/notifications/read-all", {
    method: "PATCH",
    auth: true,
  });
  return message;
}

/**
 * 查询存证记录（按业务对象）。
 */
export async function getEvidenceByTarget(
  payload: { targetType: EvidenceRecord["targetType"]; targetId: string },
): Promise<EvidenceRecord | null> {
  const { evidence } = await request<EvidenceDetailResponse>(`/api/evidence?targetType=${payload.targetType}&targetId=${payload.targetId}`, {
    method: "GET",
    auth: true,
  });
  return evidence;
}

/**
 * 根据存证编号查询记录。
 */
export async function getEvidenceDetail(evidenceId: string): Promise<EvidenceRecord> {
  const { evidence } = await request<EvidenceDetailResponse>(`/api/evidence/${evidenceId}`, {
    method: "GET",
    auth: true,
  });
  if (!evidence) {
    throw new Error("存证记录不存在");
  }
  return evidence;
}

type AdminAnnouncementResponse = {
  message: string;
  sent: number;
};

/**
 * 管理员查询用户列表。
 */
export async function listUsers(keyword?: string): Promise<User[]> {
  const query = keyword ? `?keyword=${encodeURIComponent(keyword)}` : "";
  const { users } = await request<AdminUsersResponse>(`/api/admin/users${query}`, {
    method: "GET",
    auth: true,
  });
  return users;
}

/**
 * 管理员更新用户角色。
 */
export async function updateUserRole(userId: string, role: UserRole): Promise<string> {
  const { message } = await request<{ message: string }>(`/api/admin/users/${userId}/role`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify({ role }),
  });
  return message;
}

/**
 * 管理员更新用户状态。
 */
export async function updateUserStatus(
  userId: string,
  payload: { isDisabled: boolean; reason?: string },
): Promise<string> {
  const { message } = await request<{ message: string }>(`/api/admin/users/${userId}/status`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify(payload),
  });
  return message;
}

/**
 * 管理员重置用户密码。
 */
export async function resetUserPassword(userId: string, newPassword: string): Promise<string> {
  const { message } = await request<{ message: string }>(`/api/admin/users/${userId}/reset-password`, {
    method: "POST",
    auth: true,
    body: JSON.stringify({ newPassword }),
  });
  return message;
}

/**
 * 管理员发布公告。
 */
export async function publishAnnouncement(payload: {
  title: string;
  message: string;
}): Promise<AdminAnnouncementResponse> {
  const { message, sent } = await request<AdminAnnouncementResponse>("/api/admin/announcements", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
  return { message, sent };
}

/**
 * 获取心理师统计数据。
 */
export async function getCounselorStats(): Promise<CounselorStats> {
  const { stats } = await request<StatsCounselorResponse>("/api/stats/counselor", {
    method: "GET",
    auth: true,
  });
  return stats;
}

/**
 * 获取管理员统计数据。
 */
export async function getAdminStats(): Promise<AdminStats> {
  const { stats } = await request<StatsAdminResponse>("/api/stats/admin", {
    method: "GET",
    auth: true,
  });
  return stats;
}

/**
 * 获取访问日志列表。
 */
export async function listRequestLogs(limit?: number): Promise<LogRecord[]> {
  const query = limit ? `?limit=${limit}` : "";
  const { logs } = await request<LogListResponse>(`/api/admin/logs${query}`, {
    method: "GET",
    auth: true,
  });
  return logs;
}
