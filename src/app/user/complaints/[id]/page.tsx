"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { DashboardGate } from "@/components/layout/dashboard-gate";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingBlock } from "@/components/ui/loading-block";
import { StatusBadge } from "@/components/ui/status-badge";
import { ApiError, apiFetch } from "@/lib/api-client";
import type { Complaint } from "@/lib/types";
import { formatDate } from "@/lib/ui";

function ComplaintDetail() {
  const params = useParams<{ id: string }>();
  const { user: me } = useAuth();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Complaint>(`/api/complaints/${params.id}`)
      .then(setComplaint)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Failed to load"),
      )
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <LoadingBlock />;
  if (error || !complaint) {
    return <EmptyState title="Complaint not found" description={error || undefined} />;
  }

  const filerName = complaint.user?.name ?? me?.name ?? "You";
  const filerEmail = complaint.user?.email ?? me?.email ?? "—";
  const deptName = complaint.department?.name ?? "—";

  return (
    <div className="user-shell">
      <div className="user-hero" style={{ alignItems: "flex-start" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.45rem", flexWrap: "wrap" }}>
            <StatusBadge status={complaint.status} />
            <span style={{ fontSize: "0.72rem", opacity: 0.85 }}>
              Filed {formatDate(complaint.createdAt)}
            </span>
          </div>
          <h2 style={{ maxWidth: 720, wordBreak: "break-word" }}>{complaint.title}</h2>
          <div className="detail-meta">
            <div className="detail-meta-item">
              <span>Filed by</span>
              <strong>{filerName}</strong>
            </div>
            <div className="detail-meta-item">
              <span>Email</span>
              <strong>{filerEmail}</strong>
            </div>
            <div className="detail-meta-item">
              <span>Department</span>
              <strong>{deptName}</strong>
            </div>
            <div className="detail-meta-item">
              <span>Status</span>
              <strong>{complaint.status.replace("_", " ")}</strong>
            </div>
          </div>
        </div>
        <Link
          className="btn"
          href="/user/complaints"
          style={{
            background: "white",
            color: "var(--mnfsr-green)",
            fontWeight: 700,
            flexShrink: 0,
            position: "relative",
            zIndex: 1,
          }}
        >
          Back to list
        </Link>
      </div>

      <div className="user-form-grid">
        <section className="user-form-card">
          <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.95rem" }}>Complaint details</h3>

          <div className="detail-info-grid" style={{ marginBottom: "1rem" }}>
            <div className="detail-info-tile">
              <span>Citizen name</span>
              <strong>{filerName}</strong>
            </div>
            <div className="detail-info-tile">
              <span>Department</span>
              <strong>{deptName}</strong>
            </div>
            <div className="detail-info-tile">
              <span>Filed on</span>
              <strong>{formatDate(complaint.createdAt)}</strong>
            </div>
            <div className="detail-info-tile">
              <span>Last updated</span>
              <strong>{formatDate(complaint.updatedAt)}</strong>
            </div>
          </div>

          <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.92rem" }}>Description</h3>
          <p style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.65, fontSize: "0.92rem" }}>
            {complaint.description}
          </p>

          {complaint.attachments && complaint.attachments.length > 0 ? (
            <div style={{ marginTop: "1.1rem" }}>
              <h3 style={{ margin: "0 0 0.45rem", fontSize: "0.92rem" }}>Attachments</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {complaint.attachments.map((a, i) => (
                  <a
                    key={a.id}
                    href={a.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary"
                    style={{ padding: "0.35rem 0.7rem", fontSize: "0.75rem" }}
                  >
                    {a.fileType?.includes("pdf") ? "PDF" : "Image"} {i + 1}
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <aside className="user-side-card">
          <h3>Resolution</h3>
          {complaint.status === "RESOLVED" && complaint.finalResolution ? (
            <>
              <p style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.55, fontSize: "0.84rem" }}>
                {complaint.finalResolution.comment}
              </p>
              <p className="muted" style={{ margin: "0.65rem 0 0", fontSize: "0.75rem" }}>
                Resolved {formatDate(complaint.finalResolution.createdAt)}
              </p>
            </>
          ) : (
            <p className="muted" style={{ margin: 0, fontSize: "0.8rem", lineHeight: 1.45 }}>
              No final resolution yet. When the department closes this case, the official
              comment will appear here.
            </p>
          )}

          <div
            style={{
              marginTop: "0.95rem",
              paddingTop: "0.85rem",
              borderTop: "1px solid var(--mnfsr-border)",
              display: "grid",
              gap: "0.55rem",
            }}
          >
            <div>
              <div className="muted" style={{ fontSize: "0.68rem", fontWeight: 700 }}>
                STATUS
              </div>
              <div style={{ marginTop: 4 }}>
                <StatusBadge status={complaint.status} />
              </div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: "0.68rem", fontWeight: 700 }}>
                DEPARTMENT
              </div>
              <div style={{ marginTop: 4, fontWeight: 700, fontSize: "0.88rem" }}>{deptName}</div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: "0.68rem", fontWeight: 700 }}>
                FILED BY
              </div>
              <div style={{ marginTop: 4, fontWeight: 700, fontSize: "0.88rem" }}>{filerName}</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function UserComplaintDetailPage() {
  return (
    <DashboardGate roles={["USER"]} title="Complaint Detail">
      <ComplaintDetail />
    </DashboardGate>
  );
}
