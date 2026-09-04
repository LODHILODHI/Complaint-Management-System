"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardGate } from "@/components/layout/dashboard-gate";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingBlock } from "@/components/ui/loading-block";
import { StatusBadge } from "@/components/ui/status-badge";
import { ApiError, apiFetch } from "@/lib/api-client";
import type { Complaint } from "@/lib/types";
import { formatDate } from "@/lib/ui";

function DeptHeadDetail() {
  const params = useParams<{ id: string }>();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [comment, setComment] = useState("");
  const [resolution, setResolution] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const data = await apiFetch<Complaint>(`/api/depthead/complaints/${params.id}`);
    setComplaint(data);
  }

  useEffect(() => {
    load()
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Failed to load"),
      )
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function addComment(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setActionError("");
    try {
      await apiFetch(`/api/depthead/complaints/${params.id}/comments`, {
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

  async function resolve(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setActionError("");
    try {
      const updated = await apiFetch<Complaint>(
        `/api/depthead/complaints/${params.id}/resolve`,
        {
          method: "PUT",
          body: JSON.stringify({ comment: resolution }),
        },
      );
      setComplaint(updated);
      setResolution("");
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Resolve failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingBlock />;
  if (error || !complaint) {
    return <EmptyState title="Complaint not found" description={error || undefined} />;
  }

  return (
    <>
      <div className="hero-banner hod-hero" style={{ marginBottom: "0.75rem", alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.4rem", flexWrap: "wrap" }}>
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
          href="/depthead/complaints"
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

      <div className="detail-grid" style={{ display: "grid", gap: "1rem", gridTemplateColumns: "1.4fr 1fr" }}>
        <div style={{ display: "grid", gap: "1rem" }}>
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
                <span>Department</span>
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
            <h3 style={{ marginTop: 0 }}>Internal discussion</h3>
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
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
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
            </div>

            {complaint.status !== "RESOLVED" ? (
              <form onSubmit={addComment} style={{ display: "grid", gap: "0.75rem" }}>
                <div className="field">
                  <label>Internal comment</label>
                  <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} required />
                </div>
                <button className="btn btn-secondary" disabled={busy}>
                  Add comment
                </button>
              </form>
            ) : null}
          </div>
        </div>

        <div style={{ display: "grid", gap: "1rem", alignContent: "start" }}>
          <div className="panel">
            <h3 style={{ marginTop: 0 }}>Resolve complaint</h3>
            <p className="muted" style={{ fontSize: "0.85rem" }}>
              The final resolution comment is the only staff message the citizen will see.
            </p>
            {complaint.status === "RESOLVED" ? (
              <p style={{ margin: 0, color: "#15803d", fontWeight: 700 }}>Already resolved.</p>
            ) : (
              <form onSubmit={resolve} style={{ display: "grid", gap: "0.75rem" }}>
                <div className="field">
                  <label>Final resolution comment</label>
                  <textarea
                    rows={5}
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    required
                  />
                </div>
                <button className="btn btn-primary" disabled={busy}>
                  Mark resolved
                </button>
              </form>
            )}
          </div>
          {actionError ? (
            <div className="panel" style={{ color: "#b91c1c" }}>
              {actionError}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

export default function DeptHeadComplaintDetailPage() {
  return (
    <DashboardGate roles={["DEPARTMENT_HEAD"]} title="Complaint Detail">
      <DeptHeadDetail />
    </DashboardGate>
  );
}
