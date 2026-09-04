"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { DashboardGate } from "@/components/layout/dashboard-gate";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingBlock } from "@/components/ui/loading-block";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ApiError, apiFetch } from "@/lib/api-client";
import type { Complaint } from "@/lib/types";
import { formatDate } from "@/lib/ui";

function AssignedDashboard() {
  const { user } = useAuth();
  const [items, setItems] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Complaint[]>("/api/depthead/complaints")
      .then(setItems)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Failed to load"),
      )
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const total = items.length;
    const open = items.filter((c) => c.status === "OPEN").length;
    const progress = items.filter((c) => c.status === "IN_PROGRESS").length;
    const resolved = items.filter((c) => c.status === "RESOLVED").length;
    return { total, open, progress, resolved };
  }, [items]);

  const depts = user?.managedDepartments ?? [];

  if (loading) return <LoadingBlock />;
  if (error) return <EmptyState title="Could not load complaints" description={error} />;

  return (
    <div className="dash-stack">
      <div className="hero-banner hod-hero">
        <div>
          <h2>Department workload</h2>
          <p className="hero-copy">
            Cases forwarded to you for action, comments, and final resolution.
          </p>
          <div className="hod-dept-block">
            <div className="hod-dept-label">Your departments</div>
            <div className="hod-dept-chips">
              {depts.length ? (
                depts.map((d) => (
                  <span key={d.id} className="hod-dept-chip">
                    {d.name}
                  </span>
                ))
              ) : (
                <span className="hod-dept-chip hod-dept-chip-muted">
                  No department assigned yet
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="hero-chip-row">
          <div className="hero-chip">
            <div style={{ fontSize: "0.62rem", opacity: 0.8 }}>Assigned</div>
            <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{stats.total}</div>
          </div>
          <div className="hero-chip">
            <div style={{ fontSize: "0.62rem", opacity: 0.8 }}>Active</div>
            <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>
              {stats.open + stats.progress}
            </div>
          </div>
          <div className="hero-chip">
            <div style={{ fontSize: "0.62rem", opacity: 0.8 }}>Resolved</div>
            <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{stats.resolved}</div>
          </div>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Assigned" value={stats.total} accent="#0f3d26" icon="total" />
        <StatCard label="Open" value={stats.open} accent="#d97706" icon="open" />
        <StatCard label="In progress" value={stats.progress} accent="#2563eb" icon="progress" />
        <StatCard label="Resolved" value={stats.resolved} accent="#16a34a" icon="resolved" />
      </div>

      <div className="panel">
        <div className="panel-head">
          <h3>Your queue</h3>
          <span className="muted" style={{ fontSize: "0.72rem" }}>
            {stats.total} case{stats.total === 1 ? "" : "s"}
          </span>
        </div>

        {!items.length ? (
          <EmptyState
            title="No assigned complaints"
            description="When an admin forwards a complaint to you, it will appear here."
          />
        ) : (
          <div className="complaint-cards">
            {items.map((c) => (
              <div key={c.id} className="complaint-card">
                <div>
                  <h4>{c.title}</h4>
                  <div className="meta">
                    {c.user?.name ?? "Citizen"} · {c.department?.name ?? "—"} ·{" "}
                    {formatDate(c.updatedAt)}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                  <StatusBadge status={c.status} />
                  <Link
                    href={`/depthead/complaints/${c.id}`}
                    className="btn btn-primary"
                    style={{ padding: "0.35rem 0.75rem", fontSize: "0.76rem" }}
                  >
                    Open
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DeptHeadComplaintsPage() {
  return (
    <DashboardGate roles={["DEPARTMENT_HEAD"]} title="Assigned Complaints">
      <PageHeader
        title="Assigned Complaints"
        description="Review forwarded cases, discuss internally with admin, and post a final resolution."
      />
      <AssignedDashboard />
    </DashboardGate>
  );
}
