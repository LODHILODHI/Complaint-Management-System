"use client";

import { FormEvent, useState } from "react";
import { DashboardGate } from "@/components/layout/dashboard-gate";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/components/auth/auth-provider";
import { ApiError, apiFetch } from "@/lib/api-client";

function ChangePasswordForm() {
  const { user } = useAuth();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }
    setBusy(true);
    try {
      const data = await apiFetch<{ message: string }>("/api/users/me/password", {
        method: "POST",
        body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
      });
      setSuccess(data.message);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <PageHeader
        title="Change password"
        description={`Update the password for ${user?.email ?? "your account"}.`}
      />
      <form
        onSubmit={onSubmit}
        className="card"
        style={{ padding: "1.1rem", display: "grid", gap: "0.75rem" }}
      >
        <div className="field">
          <label>Current password</label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>New password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>
        <div className="field">
          <label>Confirm new password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>
        {error ? <div className="alert alert-error">{error}</div> : null}
        {success ? <div className="alert alert-success">{success}</div> : null}
        <button className="btn btn-primary" disabled={busy}>
          {busy ? "Updating..." : "Update password"}
        </button>
      </form>
    </div>
  );
}

export default function AccountChangePasswordPage() {
  return (
    <DashboardGate roles={["USER", "ADMIN", "DEPARTMENT_HEAD"]} title="Change password">
      <ChangePasswordForm />
    </DashboardGate>
  );
}
