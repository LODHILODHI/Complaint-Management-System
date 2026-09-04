import type { ApiResult } from "./types";

const TOKEN_KEY = "cms_token";
const USER_KEY = "cms_user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setSession(token: string, user: unknown) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser<T>(): T | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

async function parseJson<T>(res: Response): Promise<ApiResult<T>> {
  try {
    return (await res.json()) as ApiResult<T>;
  } catch {
    return { success: false, message: "Invalid server response" };
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(path, { ...options, headers });
  const json = await parseJson<T>(res);

  if (!json.success) {
    throw new ApiError(json.message || "Request failed", res.status);
  }

  return json.data;
}

export async function apiForm<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken();
  const headers = new Headers();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(path, {
    method: "POST",
    headers,
    body: formData,
  });
  const json = await parseJson<T>(res);

  if (!json.success) {
    throw new ApiError(json.message || "Request failed", res.status);
  }

  return json.data;
}
