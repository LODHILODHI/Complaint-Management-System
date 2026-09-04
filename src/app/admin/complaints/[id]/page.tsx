"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardGate } from "@/components/layout/dashboard-gate";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingBlock } from "@/components/ui/loading-block";
import { StatusBadge } from "@/components/ui/status-badge";
import { ApiError, apiFetch } from "@/lib/api-client";
import type { Complaint, DepartmentHead } from "@/lib/types";
import { formatDate } from "@/lib/ui";

function AdminComplaintDetail() {
  const params = useParams<{ id: string }>();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [heads, setHeads] = useState<DepartmentHead[]>([]);
  const [headId, setHeadId] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const [c, h] = await Promise.all([
      apiFetch<Complaint>(`/api/admin/complaints/${params.id}`),
      apiFetch<DepartmentHead[]>("/api/admin/department-heads"),
    ]);
    setComplaint(c);
    const matching = h.filter((x) =>
      (x.managedDepartments ?? []).some((d) => d.id === c.departmentId),
    );
    setHeads(matching);
    const preferred =
      (c.assignedDeptHeadId &&
      matching.some((m) => m.id === c.assignedDeptHeadId)
        ? c.assignedDeptHeadId
        : matching[0]?.id) ?? "";
    setHeadId(preferred);
  }

  useEffect(() => {
    load()
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Failed to load"),
      )
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function forward(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setActionError("");
    try {
      const updated = await apiFetch<Complaint>(
        `/api/admin/complaints/${params.id}/forward`,
        {
          method: "PUT",
          body: JSON.stringify({ assignedDeptHeadId: headId }),
        },
      );
      setComplaint(updated);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Forward failed");
    } finally {
      setBusy(false);
    }
  }

  async function addComment(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setActionError("");
    try {
      await apiFetch(`/api/admin/complaints/${params.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ comment }),
      });
      setComment("");
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Comment failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingBlock />;
  if (error || !complaint) {
    return <EmptyState title="Complaint not found" description={error || undefined} />;
  }

  return (
    <div className="dash-stack">
      <div className="hero-banner" style={{ alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              alignItems: "center",
              marginBottom: "0.4rem",
              flexWrap: "wrap",
            }}
          >
            <StatusBadge status={complaint.status} />
            <span style={{ fontSize: "0.72rem", opacity: 0.85 }}>
              Filed {formatDate(complaint.createdAt)}
            </span>
          </div>
          <h2 style={{ wordBreak: "break-word" }}>{complaint.title}</h2>
          <div className="detail-meta">
            <div className="detail-meta-item">
              <span>Filed by</span>
              <strong>{complaint.user?.name ?? "Citizen"}</strong>
            </div>
            <div className="detail-meta-item">
              <span>Email</span>
              <strong>{complaint.user?.email ?? "—"}</strong>
            </div>
            <div className="detail-meta-item">
              <span>Department</span>
              <strong>{complaint.department?.name ?? "—"}</strong>
            </div>
            <div className="detail-meta-item">
              <span>Phone</span>
              <strong>{complaint.user?.phone ?? "—"}</strong>
            </div>
          </div>
        </div>
        <Link
          className="btn"
          href="/admin/complaints"
          style={{
            background: "white",
            color: "var(--mnfsr-green)",
            fontWeight: 700,
            flexShrink: 0,
            position: "relative",
            zIndex: 1,
          }}
        >
          Back
        </Link>
      </div>

      <section className="forward-bar">
        <div className="forward-bar-info">
          <div className="muted" style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.04em" }}>
            FORWARD / ASSIGN
          </div>
          <div style={{ fontSize: "0.84rem", marginTop: 2 }}>
            Dept: <strong>{complaint.department?.name ?? "—"}</strong>
            {complaint.assignedDeptHead ? (
              <>
                {" · "}Assigned: <strong>{complaint.assignedDeptHead.name}</strong>
              </>
            ) : (
              <span className="muted"> · Not assigned yet</span>
            )}
          </div>
        </div>

        {!heads.length ? (
          <div className="forward-bar-actions">
            <span className="muted" style={{ fontSize: "0.8rem" }}>
              No HOD for this department
            </span>
            <Link
              className="btn btn-primary"
              href={`/admin/users?tab=heads&departmentId=${complaint.departmentId}`}
              style={{ fontSize: "0.8rem" }}
            >
              Create HOD
            </Link>
          </div>
        ) : (
          <form onSubmit={forward} className="forward-bar-actions">
            <select
              id="headId"
              value={headId}
              onChange={(e) => setHeadId(e.target.value)}
              required
              disabled={complaint.status === "RESOLVED"}
              style={{ minWidth: 220, flex: 1 }}
            >
              <option value="" disabled>
                Choose department head…
              </option>
              {heads.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} — {h.email}
                </option>
              ))}
            </select>
            <button
              className="btn btn-primary"
              disabled={busy || !headId || complaint.status === "RESOLVED"}
            >
              {busy ? "Assigning..." : "Forward / assign"}
            </button>
          </form>
        )}
      </section>

      {actionError ? <div className="alert alert-error">{actionError}</div> : null}

      <div className="detail-grid" style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "1fr 1fr" }}>
        <div className="panel">
          <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.95rem" }}>Complaint details</h3>
          <div className="detail-info-grid" style={{ marginBottom: "1rem" }}>
            <div className="detail-info-tile">
              <span>Citizen name</span>
              <strong>{complaint.user?.name ?? "—"}</strong>
            </div>
            <div className="detail-info-tile">
              <span>Citizen email</span>
              <strong>{complaint.user?.email ?? "—"}</strong>
            </div>
            <div className="detail-info-tile">
              <span>Target department</span>
              <strong>{complaint.department?.name ?? "—"}</strong>
            </div>
            <div className="detail-info-tile">
              <span>Home department</span>
              <strong>{complaint.user?.homeDepartment?.name ?? "—"}</strong>
            </div>
          </div>
          <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.92rem" }}>Description</h3>
          <p style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{complaint.description}</p>
          {complaint.attachments?.length ? (
            <div style={{ marginTop: "1rem" }}>
              <strong>Attachments</strong>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.45rem" }}>
                {complaint.attachments.map((a, i) => (
                  <a
                    key={a.id}
                    href={a.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary"
                    style={{ padding: "0.35rem 0.7rem", fontSize: "0.75rem" }}
                  >
                    {a.fileType?.includes("pdf") ? "PDF" : "File"} {i + 1}
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Internal comments</h3>
          <p className="muted" style={{ fontSize: "0.85rem" }}>
            Visible only to Admin and Department Head — never to the citizen.
          </p>
          <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1rem" }}>
            {(complaint.comments ?? []).map((c) => (
              <div
                key={c.id}
                style={{
                  background: c.isFinalResolution ? "#ecfdf5" : "var(--mnfsr-mint)",
                  borderRadius: 12,
                  padding: "0.85rem 1rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "0.5rem",
                    marginBottom: "0.35rem",
                  }}
                >
                  <strong>
                    {c.author?.name ?? "Staff"}
                    {c.isFinalResolution ? " · Final resolution" : ""}
                  </strong>
                  <span className="muted" style={{ fontSize: "0.8rem" }}>
                    {formatDate(c.createdAt)}
                  </span>
                </div>
                <div style={{ whiteSpace: "pre-wrap" }}>{c.comment}</div>
              </div>
            ))}
            {!complaint.comments?.length ? (
              <p className="muted">No internal comments yet.</p>
            ) : null}
          </div>
          <form onSubmit={addComment} style={{ display: "grid", gap: "0.75rem" }}>
            <div className="field">
              <label htmlFor="comment">Add internal comment</label>
              <textarea
                id="comment"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary" disabled={busy}>
              Post comment
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AdminComplaintDetailPage() {
  return (
    <DashboardGate roles={["ADMIN"]} title="Complaint Review">
      <AdminComplaintDetail />
    </DashboardGate>
  );
}
