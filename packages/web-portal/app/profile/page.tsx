"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type FormEvent,
  type MouseEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getProfile,
  requestPasswordChangeVerification,
  resolveAvatarUrl,
  updatePassword,
  updateProfile,
  uploadAvatar,
  type PasswordChangePayload,
  type ProfileInput,
  type User,
} from "../../lib/api";
import { CenterToast } from "../../components/ui/CenterToast";

// 资料表单的初始值，确保表单可控。
const DEFAULT_PROFILE_FORM: ProfileInput = {
  nickname: "",
  gender: "",
  major: "",
  grade: "",
};

type PasswordFormState = {
  newPassword: string;
  confirmPassword: string;
  verificationCode: string;
  smtpAuthCode: string;
};

// 密码表单初始值，用于重置安全设置表单。
const DEFAULT_PASSWORD_FORM: PasswordFormState = {
  newPassword: "",
  confirmPassword: "",
  verificationCode: "",
  smtpAuthCode: "",
};

// 头像文件大小上限（字节）。
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
// 允许上传的头像 MIME 类型。
const ALLOWED_AVATAR_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
// 角色显示文案，便于前端统一展示。
const ROLE_LABELS: Record<User["role"], string> = {
  USER: "普通用户",
  COUNSELOR: "心理咨询师",
  ADMIN: "管理员",
};

/**
 * 格式化时间字符串，便于展示用户账号概览信息。
 */
function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("zh-CN");
}

/**
 * 将头像文件读取为 Base64 Data URL，便于上传到后端。
 */
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(String(reader.result ?? ""));
    };
    reader.onerror = () => {
      reject(new Error("读取头像失败，请重试。"));
    };
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<User | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileInput>(
    DEFAULT_PROFILE_FORM,
  );
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>(
    DEFAULT_PASSWORD_FORM,
  );
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordCodeSending, setPasswordCodeSending] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  /**
   * 加载个人资料并填充页面展示与表单初始值。
   */
  useEffect(() => {
    async function loadProfile() {
      setLoadingProfile(true);
      setLoadError(null);
      try {
        const data = await getProfile();
        setProfile(data);
        setProfileForm({
          nickname: data.nickname ?? "",
          gender: data.gender ?? "",
          major: data.major ?? "",
          grade: data.grade ?? "",
        });
      } catch (err) {
        setLoadError(
          err instanceof Error ? err.message : "加载个人资料失败，请稍后重试。",
        );
      } finally {
        setLoadingProfile(false);
      }
    }
    loadProfile();
  }, []);

  const avatarUrl = useMemo(() => {
    if (avatarPreview) {
      return avatarPreview;
    }
    return resolveAvatarUrl(profile?.avatarUrl);
  }, [avatarPreview, profile?.avatarUrl]);

  const toast = loadError
    ? { type: "error" as const, message: loadError, onClose: () => setLoadError(null) }
    : profileError
      ? { type: "error" as const, message: profileError, onClose: () => setProfileError(null) }
      : avatarError
        ? { type: "error" as const, message: avatarError, onClose: () => setAvatarError(null) }
        : passwordError
          ? { type: "error" as const, message: passwordError, onClose: () => setPasswordError(null) }
          : profileMessage
            ? { type: "success" as const, message: profileMessage, onClose: () => setProfileMessage(null) }
            : avatarMessage
              ? { type: "success" as const, message: avatarMessage, onClose: () => setAvatarMessage(null) }
              : passwordMessage
                ? {
                    type: "success" as const,
                    message: passwordMessage,
                    onClose: () => setPasswordMessage(null),
                  }
                : null;

  /**
   * 更新资料表单状态。
   */
  const handleProfileChange = (field: keyof ProfileInput, value: string) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * 保存基础资料。
   */
  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileSaving(true);
    setProfileError(null);
    setProfileMessage(null);
    try {
      const updated = await updateProfile(profileForm);
      setProfile(updated);
      setProfileForm({
        nickname: updated.nickname ?? "",
        gender: updated.gender ?? "",
        major: updated.major ?? "",
        grade: updated.grade ?? "",
      });
      setProfileMessage("资料保存成功，已同步到链上存证记录。");
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : "保存资料失败，请稍后重试。",
      );
    } finally {
      setProfileSaving(false);
    }
  };

  /**
   * 选择头像文件并生成预览。
   */
  const handleAvatarSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    setAvatarError(null);
    setAvatarMessage(null);
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
      setAvatarError("仅支持 PNG/JPEG/WEBP 格式的头像。");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError("头像大小不能超过 2MB。");
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setAvatarDataUrl(dataUrl);
      setAvatarPreview(dataUrl);
    } catch (err) {
      setAvatarError(
        err instanceof Error ? err.message : "读取头像失败，请重试。",
      );
    }
  };

  /**
   * 上传头像并更新资料。
   */
  const handleAvatarUpload = async () => {
    if (!avatarDataUrl) {
      setAvatarError("请先选择头像文件。");
      return;
    }
    setAvatarUploading(true);
    setAvatarError(null);
    setAvatarMessage(null);
    try {
      const updated = await uploadAvatar(avatarDataUrl);
      setProfile(updated);
      setAvatarDataUrl(null);
      setAvatarPreview(null);
      setAvatarMessage("头像更新成功。");
    } catch (err) {
      setAvatarError(
        err instanceof Error ? err.message : "头像上传失败，请稍后重试。",
      );
    } finally {
      setAvatarUploading(false);
    }
  };

  /**
   * 更新密码表单状态。
   */
  const handlePasswordChange = (
    field: keyof PasswordFormState,
    value: string,
  ) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * 发送密码修改验证码。
   */
  const handlePasswordCodeSend = async () => {
    setPasswordError(null);
    setPasswordMessage(null);
    if (!passwordForm.smtpAuthCode.trim()) {
      setPasswordError("请先填写 QQ 邮箱授权码。");
      return;
    }
    setPasswordCodeSending(true);
    try {
      const result = await requestPasswordChangeVerification(
        passwordForm.smtpAuthCode,
      );
      setPasswordMessage(result.message);
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "发送验证码失败，请稍后重试。",
      );
    } finally {
      setPasswordCodeSending(false);
    }
  };

  /**
   * 打开密码修改弹窗。
   */
  const openPasswordModal = () => {
    setPasswordError(null);
    setPasswordMessage(null);
    setPasswordModalOpen(true);
  };

  /**
   * 关闭密码修改弹窗。
   */
  const closePasswordModal = () => {
    setPasswordModalOpen(false);
  };

  /**
   * 点击遮罩时关闭弹窗。
   */
  const handlePasswordModalOverlayClick = (
    event: MouseEvent<HTMLDivElement>,
  ) => {
    if (event.target === event.currentTarget) {
      closePasswordModal();
    }
  };

  /**
   * 提交密码修改请求。
   */
  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordSaving(true);
    setPasswordError(null);
    setPasswordMessage(null);
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("两次输入的新密码不一致。");
      setPasswordSaving(false);
      return;
    }
    const payload: PasswordChangePayload = {
      newPassword: passwordForm.newPassword,
      verificationCode: passwordForm.verificationCode,
    };
    try {
      await updatePassword(payload);
      setPasswordMessage("密码修改成功");
      setPasswordForm(DEFAULT_PASSWORD_FORM);
      localStorage.removeItem("campus_auth_token");
      router.push("/login");
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "修改密码失败，请稍后重试。",
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  /**
   * 退出登录并返回登录页。
   */
  const handleLogout = () => {
    localStorage.removeItem("campus_auth_token");
    router.push("/login");
  };

  return (
    <div className="profile-shell">
      {toast && <CenterToast type={toast.type} message={toast.message} onClose={toast.onClose} />}
      <header className="profile-header">
        <div>
          <p className="eyebrow">个人主页</p>
          <h1>完善资料与安全设置，守护你的咨询隐私</h1>
          <p className="profile-lead">
            你可以在这里更新头像、昵称与个人信息，或修改密码。所有操作会同步到后台存证记录。
          </p>
        </div>
        <div className="profile-actions">
          <button className="ghost-btn small" type="button" onClick={handleLogout}>
            退出登录
          </button>
          <Link href="/" className="ghost-btn small">
            返回首页
          </Link>
        </div>
      </header>

      {loadingProfile ? (
        <section className="profile-card">
          <p className="profile-hint">正在加载资料……</p>
        </section>
      ) : null}

      <section className="profile-card">
        <div className="panel-heading">
          <div>
            <h2>账号概览</h2>
            <p>查看你的身份信息与最近更新时间。</p>
          </div>
        </div>
        <div className="account-meta">
          <div>
            <span>账号邮箱</span>
            <strong>{profile?.email ?? "-"}</strong>
          </div>
          <div>
            <span>当前角色</span>
            <strong>{profile ? ROLE_LABELS[profile.role] : "-"}</strong>
          </div>
          <div>
            <span>创建时间</span>
            <strong>{formatDateTime(profile?.createdAt)}</strong>
          </div>
          <div>
            <span>最近更新</span>
            <strong>{formatDateTime(profile?.updatedAt)}</strong>
          </div>
        </div>
      </section>

      <section className="profile-card">
        <div className="panel-heading">
          <div>
            <h2>头像管理</h2>
            <p>上传清晰头像，便于心理师审核与资料展示。</p>
          </div>
        </div>
        <div className="avatar-card">
          <div className="avatar-preview">
            {avatarUrl ? (
              <img src={avatarUrl} alt="头像预览" />
            ) : (
              <span>暂无头像</span>
            )}
          </div>
          <div className="avatar-actions">
            <input type="file" accept="image/*" onChange={handleAvatarSelect} />
            <button
              className="btn btn-primary small"
              type="button"
              onClick={handleAvatarUpload}
              disabled={avatarUploading}
            >
              {avatarUploading ? "上传中..." : "上传头像"}
            </button>
            <p className="profile-hint">
              仅支持 PNG/JPEG/WEBP，大小不超过 2MB。
            </p>
          </div>
        </div>
      </section>

      <section className="profile-card">
        <div className="panel-heading">
          <div>
            <h2>个人资料</h2>
            <p>完善昵称、性别、专业和年级，帮助系统识别身份。</p>
          </div>
        </div>
        <form className="profile-form" onSubmit={handleProfileSubmit}>
          <label>
            昵称
            <input
              type="text"
              value={profileForm.nickname ?? ""}
              placeholder="例如：墨云 / 王敏"
              onChange={(event) => handleProfileChange("nickname", event.target.value)}
            />
          </label>
          <label>
            性别
            <select
              value={profileForm.gender ?? ""}
              onChange={(event) => handleProfileChange("gender", event.target.value)}
            >
              <option value="">不公开</option>
              <option value="female">女</option>
              <option value="male">男</option>
              <option value="other">其他</option>
            </select>
          </label>
          <label>
            专业
            <input
              type="text"
              value={profileForm.major ?? ""}
              placeholder="如：心理学/软件工程"
              onChange={(event) => handleProfileChange("major", event.target.value)}
            />
          </label>
          <label>
            年级
            <input
              type="text"
              value={profileForm.grade ?? ""}
              placeholder="例如：2025级"
              onChange={(event) => handleProfileChange("grade", event.target.value)}
            />
          </label>
          <div className="inline-actions">
            <button
              className="btn btn-primary small"
              disabled={profileSaving}
              type="submit"
            >
              {profileSaving ? "保存中..." : "保存资料"}
            </button>
            <button
              className="btn btn-secondary small"
              type="button"
              onClick={openPasswordModal}
            >
              修改密码
            </button>
          </div>
        </form>
      </section>

      {passwordModalOpen && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="password-modal-title"
          onClick={handlePasswordModalOverlayClick}
        >
          <div className="modal-card">
            <div className="modal-header">
              <h3 id="password-modal-title">修改密码</h3>
              <button className="ghost-btn small" type="button" onClick={closePasswordModal}>
                关闭
              </button>
            </div>
            <form className="security-form" onSubmit={handlePasswordSubmit}>
              <label>
                邮箱授权码
                <input
                  value={passwordForm.smtpAuthCode}
                  placeholder="QQ 邮箱 SMTP 授权码"
                  onChange={(event) =>
                    handlePasswordChange("smtpAuthCode", event.target.value)
                  }
                  required
                />
              </label>
              <label>
                验证码
                <div className="inline-actions">
                  <input
                    value={passwordForm.verificationCode}
                    placeholder="邮件中的 6 位验证码"
                    onChange={(event) =>
                      handlePasswordChange("verificationCode", event.target.value)
                    }
                    required
                  />
                  <button
                    className="btn btn-secondary small"
                    type="button"
                    disabled={passwordCodeSending}
                    onClick={handlePasswordCodeSend}
                  >
                    {passwordCodeSending ? "发送中..." : "发送验证码"}
                  </button>
                </div>
              </label>
              <p className="hint">
                验证码由 QQ 邮箱发送，需开启 SMTP 并使用授权码。
              </p>
              <label>
                新密码
                <input
                  type="password"
                  minLength={8}
                  value={passwordForm.newPassword}
                  placeholder="至少 8 位字符"
                  onChange={(event) =>
                    handlePasswordChange("newPassword", event.target.value)
                  }
                />
              </label>
              <label>
                确认新密码
                <input
                  type="password"
                  minLength={8}
                  value={passwordForm.confirmPassword}
                  placeholder="再次输入新密码"
                  onChange={(event) =>
                    handlePasswordChange("confirmPassword", event.target.value)
                  }
                />
              </label>
              <div className="inline-actions">
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={passwordSaving}
                >
                  {passwordSaving ? "修改中..." : "修改密码"}
                </button>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={closePasswordModal}
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
