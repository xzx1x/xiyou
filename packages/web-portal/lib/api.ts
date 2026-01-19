const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001").replace(/\/$/, "");

export type UserRole = "USER" | "COUNSELOR" | "ADMIN";

export interface User {
  id: string;
  email: string;
  identityCode: string;
  nickname?: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  identityCode: string;
  nickname?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterResponse {
  user: User;
}

interface LoginResponse {
  token: string;
  user: User;
}

/**
 * 统一封装 fetch，自动拼接 BASE_URL、设置 JSON Header，并在失败时抛出错误。
 */
async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
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
 * 登录 API：返回 Token + 用户信息，前端可保存 Token 以调用受保护接口。
 */
export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  return request<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
