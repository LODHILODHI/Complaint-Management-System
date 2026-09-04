"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  apiFetch,
  clearSession,
  getStoredUser,
  getToken,
  setSession,
} from "@/lib/api-client";
import type { AuthUser } from "@/lib/types";
import { roleHome } from "@/lib/ui";

type SignupInput = {
  name: string;
  email: string;
  password: string;
  departmentId?: string;
  otherDepartment?: boolean;
  otherDepartmentNote?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  signup: (input: SignupInput) => Promise<string>;
  logout: () => void;
  refreshMe: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    const stored = getStoredUser<AuthUser>();
    if (token && stored) {
      setUser(stored);
      apiFetch<AuthUser>("/api/users/me")
        .then((me) => {
          setUser(me);
          setSession(token, me);
        })
        .catch(() => {
          clearSession();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiFetch<{ token: string; user: AuthUser }>(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
    );
    setSession(data.token, data.user);
    setUser(data.user);
    return data.user;
  }, []);

  const signup = useCallback(async (input: SignupInput) => {
    const data = await apiFetch<{
      user: AuthUser;
      message: string;
    }>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return data.message;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    router.replace("/login");
  }, [router]);

  const refreshMe = useCallback(async () => {
    const me = await apiFetch<AuthUser>("/api/users/me");
    const token = getToken();
    if (token) setSession(token, me);
    setUser(me);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, signup, logout, refreshMe, setUser }),
    [user, loading, login, signup, logout, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useRequireAuth(roles?: AuthUser["role"][]) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (roles && !roles.includes(user.role)) {
      router.replace(roleHome(user.role));
    }
  }, [user, loading, roles, router]);

  return { user, loading };
}
