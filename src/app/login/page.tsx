"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { SiteFooter } from "@/components/ui/site-footer";
import { ApiError } from "@/lib/api-client";
import { postLoginPath } from "@/lib/ui";

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("admin@cms.local");
  const [password, setPassword] = useState("Pass@12345");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace(postLoginPath(user));
    }
  }, [user, loading, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const loggedIn = await login(email.trim(), password);
      router.replace(postLoginPath(loggedIn));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div
        style={{
          minHeight: 0,
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1.05fr 1fr",
        }}
        className="auth-split"
      >
      <section
        style={{
          background: "linear-gradient(165deg, #1a472a 0%, #12331e 70%)",
          color: "white",
          padding: "2.5rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              letterSpacing: "0.08em",
              fontSize: "0.78rem",
              fontWeight: 600,
              opacity: 0.9,
            }}
          >
            MINISTRY OF NATIONAL FOOD SECURITY & RESEARCH
          </p>
          <h1 style={{ margin: "1rem 0 0.75rem", fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.1 }}>
            MNFSR Complaints Portal
          </h1>
          <p style={{ margin: 0, maxWidth: 420, opacity: 0.9, lineHeight: 1.55 }}>
            File, track, and resolve citizen complaints across departments —
            from intake to final resolution.
          </p>
        </div>

        <div style={{ display: "grid", placeItems: "center", flex: 1, padding: "1.5rem 0" }}>
          <Image
            src="/mnfsr-logo.jpg"
            alt="Ministry of National Food Security and Research"
            width={300}
            height={300}
            priority
            className="auth-brand-logo"
          />
        </div>

        <p style={{ margin: 0, fontSize: "0.8rem", opacity: 0.75 }}>
          © {new Date().getFullYear()} Ministry of National Food Security & Research, Government of Pakistan
        </p>
      </section>

      <section
        style={{
          background: "#e8f5e9",
          display: "grid",
          placeItems: "center",
          padding: "2rem",
        }}
      >
        <form
          onSubmit={onSubmit}
          className="card"
          style={{ width: "100%", maxWidth: 420, padding: "2rem" }}
        >
          <h2 style={{ margin: 0, fontSize: "1.75rem" }}>Sign in</h2>
          <p className="muted" style={{ margin: "0.4rem 0 1.5rem" }}>
            MNFSR Complaints — Admin, Department Head, User
          </p>

          <div className="field" style={{ marginBottom: "1rem" }}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="field" style={{ marginBottom: "1.25rem" }}>
            <label htmlFor="password">Password</label>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingRight: "3rem" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  color: "var(--mnfsr-muted)",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                }}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error ? (
            <p style={{ color: "#b91c1c", margin: "0 0 1rem", fontSize: "0.9rem" }}>{error}</p>
          ) : null}

          <button className="btn btn-primary" style={{ width: "100%" }} disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in"}
          </button>

          <p style={{ margin: "1.1rem 0 0", textAlign: "center" }}>
            New user?{" "}
            <Link href="/signup" style={{ color: "var(--mnfsr-green)", fontWeight: 700 }}>
              Sign up
            </Link>
          </p>
          <p style={{ margin: "0.65rem 0 0", textAlign: "center" }}>
            <Link href="/change-password" style={{ color: "var(--mnfsr-green)", fontWeight: 700 }}>
              Change password
            </Link>
          </p>
        </form>
      </section>
      </div>
      <SiteFooter light />
    </div>
  );
}
