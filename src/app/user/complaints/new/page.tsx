"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { DashboardGate } from "@/components/layout/dashboard-gate";
import { PageHeader } from "@/components/ui/page-header";
import { ApiError, apiForm } from "@/lib/api-client";
import { isCitizenProfileComplete } from "@/lib/profile";
import type { Complaint } from "@/lib/types";

function NewComplaintForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const homeId = user?.homeDepartmentId ?? user?.homeDepartment?.id ?? "";
  const homeName = user?.homeDepartment?.name ?? "";
  const profileReady = user ? isCitizenProfileComplete(user) : false;
  const canFile = Boolean(homeId && profileReady);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canFile) return;
    setSubmitting(true);
    setError("");
    try {
      const fd = new FormData();
      fd.set("title", title.trim());
      fd.set("description", description.trim());
      fd.set("departmentId", homeId);
      if (files) {
        Array.from(files).forEach((file) => fd.append("attachments", file));
      }
      const created = await apiForm<Complaint>("/api/complaints", fd);
      router.replace(`/user/complaints/${created.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to file complaint");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="user-shell">
      <PageHeader
        title="File a complaint"
        description="Describe the issue clearly. Attach images or PDFs if they help (max 5MB each)."
        actions={
          <Link className="btn btn-secondary" href="/user/complaints">
            Back
          </Link>
        }
      />

      {!profileReady ? (
        <div className="alert alert-error" style={{ marginBottom: "0.85rem" }}>
          Complete your profile before filing a complaint.{" "}
          <Link href="/user/profile" style={{ fontWeight: 700, color: "inherit" }}>
            Go to profile →
          </Link>
        </div>
      ) : null}

      {!homeId ? (
        <div className="alert alert-error" style={{ marginBottom: "0.85rem" }}>
          You are not assigned to a department yet. Contact an admin before filing a
          complaint.
        </div>
      ) : null}

      <div className="user-form-grid">
        <form onSubmit={onSubmit} className="user-form-card">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
            }}
            className="form-2col"
          >
            <div className="field">
              <label htmlFor="department">Department</label>
              <input
                id="department"
                value={homeName || "Not assigned"}
                readOnly
                disabled
                title="Your assigned department cannot be changed"
              />
              <p className="muted" style={{ margin: "0.3rem 0 0", fontSize: "0.72rem" }}>
                Locked to your assigned department
              </p>
            </div>
            <div className="field">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Short summary of the issue"
                required
                disabled={!canFile}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              rows={7}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What happened, where, and what outcome you need…"
              required
              disabled={!canFile}
            />
          </div>

          <div className="field">
            <label htmlFor="attachments">Attachments (optional)</label>
            <input
              id="attachments"
              type="file"
              accept="image/*,application/pdf"
              multiple
              onChange={(e) => setFiles(e.target.files)}
              disabled={!canFile}
            />
            <p className="muted" style={{ margin: "0.35rem 0 0", fontSize: "0.72rem" }}>
              Images or PDF · max 5MB each
              {files?.length ? ` · ${files.length} selected` : ""}
            </p>
          </div>

          {error ? (
            <div className="alert alert-error" style={{ marginBottom: "0.75rem" }}>
              {error}
            </div>
          ) : null}

          <div className="user-form-actions">
            <Link className="btn btn-secondary" href="/user/complaints">
              Cancel
            </Link>
            <button className="btn btn-primary" disabled={submitting || !canFile}>
              {submitting ? "Submitting..." : "Submit complaint"}
            </button>
          </div>
        </form>

        <aside className="user-side-card">
          <h3>Filing tips</h3>
          <ul className="user-side-list">
            <li>
              <span className="step">✓</span>
              <span>Use a clear title — avoid long number strings or codes alone.</span>
            </li>
            <li>
              <span className="step">✓</span>
              <span>Include location, dates, and what you already tried.</span>
            </li>
            <li>
              <span className="step">✓</span>
              <span>Photos or PDFs help the department verify faster.</span>
            </li>
          </ul>
          {homeName ? (
            <div
              style={{
                marginTop: "0.9rem",
                padding: "0.7rem 0.75rem",
                borderRadius: 12,
                background: "#f3f8f5",
                border: "1px solid #d7e5dc",
                fontSize: "0.78rem",
              }}
            >
              <div className="muted" style={{ fontSize: "0.68rem", fontWeight: 700 }}>
                YOUR HOME DEPARTMENT
              </div>
              <div style={{ fontWeight: 700, marginTop: 2 }}>{homeName}</div>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

export default function NewComplaintPage() {
  return (
    <DashboardGate roles={["USER"]} title="File Complaint">
      <NewComplaintForm />
    </DashboardGate>
  );
}
