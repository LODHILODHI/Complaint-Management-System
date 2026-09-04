"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { DashboardGate } from "@/components/layout/dashboard-gate";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingBlock } from "@/components/ui/loading-block";
import { StatusBadge } from "@/components/ui/status-badge";
import { ApiError, apiFetch } from "@/lib/api-client";
import { isCitizenProfileComplete } from "@/lib/profile";
import type { Complaint, ComplaintStatus } from "@/lib/types";
import { formatDate } from "@/lib/ui";

const statusAccent: Record<ComplaintStatus, string> = {
  OPEN: "#d97706",
  IN_PROGRESS: "#2563eb",
  RESOLVED: "#16a34a",
};

function ComplaintsDashboard() {
  const { user } = useAuth();
  const [items, setItems] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"ALL" | ComplaintStatus>("ALL");

  useEffect(() => {
    apiFetch<Complaint[]>("/api/complaints")
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

  const filtered = useMemo(() => {
    if (filter === "ALL") return items;
    return items.filter((c) => c.status === filter);
  }, [items, filter]);

  if (loading) return <LoadingBlock />;
  if (error) return <EmptyState title="Could not load complaints" description={error} />;

  const firstName = user?.name?.split(" ")[0] ?? "there";
  const profileReady = user ? isCitizenProfileComplete(user) : false;

  return (
    <div className="user-shell">
      {!profileReady ? (
        <div className="alert alert-error" style={{ marginBottom: "0.85rem" }}>
          Complete your profile to unlock filing complaints.{" "}
          <Link href="/user/profile" style={{ fontWeight: 700, color: "inherit" }}>
            Complete profile →
          </Link>
        </div>
      ) : null}

      <div className="user-hero">
        <div>
          <h2>Welcome back, {firstName}</h2>
          <p>
            Follow every case you file with MNFSR. Staff discussion stays private — you only
            see status and the final resolution.
          </p>
          <div className="user-hero-meta">
            {user?.homeDepartment?.name
              ? `Department · ${user.homeDepartment.name}`
              : "Department assignment pending"}
          </div>
        </div>
        <div className="user-hero-stats">
          <div className="user-hero-stat">
            <span>Filed</span>
            <strong>{stats.total}</strong>
          </div>
          <div className="user-hero-stat">
            <span>Active</span>
            <strong>{stats.open + stats.progress}</strong>
          </div>
          <div className="user-hero-stat">
            <span>Resolved</span>
            <strong>{stats.resolved}</strong>
          </div>
        </div>
      </div>

      <div className="user-stat-row">
        {(
          [
            ["ALL", "All", stats.total, "#0f3d26"],
            ["OPEN", "Open", stats.open, "#d97706"],
            ["IN_PROGRESS", "In progress", stats.progress, "#2563eb"],
            ["RESOLVED", "Resolved", stats.resolved, "#16a34a"],
          ] as const
        ).map(([key, label, value, accent]) => (
          <button
            key={key}
            type="button"
            className="stat-card"
            onClick={() => setFilter(key)}
            style={{
              ["--stat-accent" as string]: accent,
              textAlign: "left",
              cursor: "pointer",
              outline: filter === key ? `2px solid ${accent}` : undefined,
              outlineOffset: 1,
            }}
          >
            <div className="muted" style={{ fontSize: "0.66rem", fontWeight: 700, letterSpacing: "0.05em" }}>
              {label.toUpperCase()}
            </div>
            <div style={{ fontSize: "1.35rem", fontWeight: 700, marginTop: "0.1rem" }}>{value}</div>
          </button>
        ))}
      </div>

      <div className="user-main-grid">
        <section className="user-form-card" style={{ padding: "0.9rem" }}>
          <div className="panel-head" style={{ marginBottom: "0.7rem" }}>
            <h3 style={{ margin: 0, fontSize: "0.95rem" }}>Your complaints</h3>
            <Link className="btn btn-primary" href="/user/complaints/new">
              + File complaint
            </Link>
          </div>

          {!filtered.length ? (
            <EmptyState
              title={items.length ? "Nothing in this filter" : "No complaints yet"}
              description={
                items.length
                  ? "Try another status filter above."
                  : "File your first complaint to start tracking progress with the ministry."
              }
              action={
                !items.length ? (
                  <Link className="btn btn-primary" href="/user/complaints/new">
                    + File complaint
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <div className="complaint-cards">
              {filtered.map((c) => (
                <Link
                  key={c.id}
                  href={`/user/complaints/${c.id}`}
                  className="user-complaint"
                >
                  <span
                    className="user-complaint-bar"
                    style={{ background: statusAccent[c.status] }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <h4 title={c.title}>{c.title}</h4>
                    <div className="meta">
                      {c.department?.name ?? "—"} · {formatDate(c.createdAt)}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                    <StatusBadge status={c.status} />
                    <span className="btn btn-secondary" style={{ padding: "0.3rem 0.65rem", fontSize: "0.72rem" }}>
                      View
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <aside className="user-side-card">
          <h3>How it works</h3>
          <ul className="user-side-list">
            <li>
              <span className="step">1</span>
              <span>File a complaint with a clear title and supporting documents.</span>
            </li>
            <li>
              <span className="step">2</span>
              <span>Admin forwards it to the right department head.</span>
            </li>
            <li>
              <span className="step">3</span>
              <span>Track status here until a final resolution is posted.</span>
            </li>
          </ul>

          <div
            style={{
              marginTop: "0.95rem",
              padding: "0.75rem",
              borderRadius: 12,
              background: "linear-gradient(180deg, #f4faf6, #eaf4ee)",
              border: "1px solid #d5e6db",
            }}
          >
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--mnfsr-green)" }}>
              Need help?
            </div>
            <p className="muted" style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", lineHeight: 1.4 }}>
              Keep your profile phone and address updated so departments can follow up quickly.
            </p>
            <Link
              href="/user/profile"
              style={{
                display: "inline-block",
                marginTop: "0.55rem",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "var(--mnfsr-green)",
              }}
            >
              Update profile →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function UserComplaintsPage() {
  return (
    <DashboardGate roles={["USER"]} title="My Complaints">
      <ComplaintsDashboard />
    </DashboardGate>
  );
}
