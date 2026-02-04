'use client';

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  loginUser,
  registerUser,
  type LoginPayload,
  type RegisterPayload,
} from "../../lib/api";
import { CenterToast } from "../ui/CenterToast";

interface Props {
  mode: "login" | "register";
}

export function AuthForm({ mode }: Props) {
  type FormState = {
    email: string;
    password: string;
    identityCode: string;
    nickname: string;
  };

  const [formData, setFormData] = useState<FormState>({
    email: "",
    password: "",
    identityCode: "",
    nickname: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const toast = errorMessage
    ? { type: "error" as const, message: errorMessage, onClose: () => setErrorMessage(null) }
    : successMessage
      ? { type: "success" as const, message: successMessage, onClose: () => setSuccessMessage(null) }
      : null;

  /**
   * 统一处理输入变更，确保 state 与 UI 同步。
   */
  const handleChange = (
    field: keyof FormState,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const router = useRouter();

  /**
   * 提交事件：根据 mode 调用登录或注册 API，并展示结果消息。
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      if (mode === "register") {
        const payload: RegisterPayload = {
          email: formData.email,
          password: formData.password,
          identityCode: formData.identityCode,
          nickname: formData.nickname ? formData.nickname : undefined,
        };
        await registerUser(payload);
        setSuccessMessage("注册成功");
        setTimeout(() => {
          router.push("/login");
        }, 200);
      } else {
        const payload: LoginPayload = {
          email: formData.email,
          password: formData.password,
        };
        const response = await loginUser(payload);
        localStorage.setItem("campus_auth_token", response.token);
        setSuccessMessage("登录成功");
        setTimeout(() => {
          router.push("/");
        }, 200);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "请求失败，请稍后再试",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label>
        QQ 邮箱
        <input
          name="email"
          type="email"
          required
          placeholder="example@qq.com"
          value={formData.email}
          onChange={(event) => handleChange("email", event.target.value)}
        />
      </label>
      <label>
        密码
        <input
          name="password"
          type="password"
          minLength={8}
          required
          placeholder="至少 8 位字母与数字组合"
          value={formData.password}
          onChange={(event) => handleChange("password", event.target.value)}
        />
      </label>

      {mode === "register" && (
        <>
          <label>
            学号 / 工号
            <input
              name="identityCode"
              required
              placeholder="普通用户示例：20250001；管理员示例：ADM-0001"
              value={formData.identityCode}
              onChange={(event) => handleChange("identityCode", event.target.value)}
            />
          </label>
          <label>
            昵称（可选）
            <input
              name="nickname"
              placeholder="用于展示的昵称"
              value={formData.nickname}
              onChange={(event) => handleChange("nickname", event.target.value)}
            />
          </label>
          <p className="hint">
            系统会根据后台白名单自动识别身份；未在白名单内的编号会被拒绝注册。
          </p>
        </>
      )}

      <button className="btn btn-primary" disabled={isSubmitting} type="submit">
        {isSubmitting ? "提交中..." : mode === "register" ? "注册" : "登录"}
      </button>

      {toast && <CenterToast type={toast.type} message={toast.message} onClose={toast.onClose} />}
    </form>
  );
}
