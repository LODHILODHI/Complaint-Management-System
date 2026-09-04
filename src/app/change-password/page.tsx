"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { SiteFooter } from "@/components/ui/site-footer";
import { ApiError, apiFetch } from "@/lib/api-client";

export default function ChangePasswordPage() {
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }
    setSubmitting(true);
    try {
      const data = await apiFetch<{ message: string }>("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          oldPassword,
          newPassword,
          confirmPassword,
        }),
      });
      setSuccess(data.message);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update password");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div
        className="auth-split"
        style={{
          minHeight: 0,
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1.05fr 1fr",
        }}
      >
      <section
        style={{
          background: "linear-gradient(165deg, #1a472a 0%, #12331e 70%)",
          color: "white",
          padding: "2.5rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
          <p style={{ margin: 0, letterSpacing: "0.08em", fontSize: "0.78rem", fontWeight: 600 }}>
            MINISTRY OF NATIONAL FOOD SECURITY & RESEARCH
          </p>
          <h1 style={{ margin: "1rem 0 0.75rem", fontSize: "clamp(2rem, 4vw, 2.6rem)" }}>
            Change password
          </h1>
          <p style={{ margin: 0, maxWidth: 420, opacity: 0.9, lineHeight: 1.55 }}>
            Enter your email, current password, then choose a new password.
          </p>
        </div>
        <div style={{ display: "grid", placeItems: "center", flex: 1, padding: "1.5rem 0" }}>
          <Image
            src="/mnfsr-logo.jpg"
            alt="MNFSR"
            width={300}
            height={300}
            priority
            className="auth-brand-logo"
          />
        </div>
        <p style={{ margin: 0, fontSize: "0.8rem", opacity: 0.75 }}>
          © {new Date().getFullYear()} Ministry of National Food Security & Research
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
          <h2 style={{ margin: 0 }}>Update password</h2>
          <p className="muted" style={{ margin: "0.4rem 0 1.25rem" }}>
            Simple reset using your current password.
          </p>

          <div className="field" style={{ marginBottom: "0.85rem" }}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field" style={{ marginBottom: "0.85rem" }}>
            <label htmlFor="oldPassword">Current password</label>
            <input
              id="oldPassword"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
          </div>
          <div className="field" style={{ marginBottom: "0.85rem" }}>
            <label htmlFor="newPassword">New password</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          <div className="field" style={{ marginBottom: "1.1rem" }}>
            <label htmlFor="confirmPassword">Confirm new password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          {error ? <div className="alert alert-error">{error}</div> : null}
          {success ? <div className="alert alert-success">{success}</div> : null}

          <button className="btn btn-primary" style={{ width: "100%" }} disabled={submitting}>
            {submitting ? "Updating..." : "Update password"}
          </button>

          <p style={{ margin: "1.1rem 0 0", textAlign: "center" }}>
            <Link href="/login" style={{ color: "var(--mnfsr-green)", fontWeight: 700 }}>
              Back to sign in
            </Link>
          </p>
        </form>
      </section>
      </div>
      <SiteFooter light />
    </div>
  );
}
