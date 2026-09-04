"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DashboardGate } from "@/components/layout/dashboard-gate";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingBlock } from "@/components/ui/loading-block";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ApiError, apiFetch } from "@/lib/api-client";
import type { Complaint, ComplaintStatus } from "@/lib/types";
import { formatDate } from "@/lib/ui";

type Tab = "overview" | "requests";
type StatusFilter = "ALL" | ComplaintStatus;

type AssignFilter = "ALL" | "ASSIGNED" | "UNASSIGNED";

function AdminComplaintsView() {
  const [tab, setTab] = useState<Tab>("overview");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [deptFilter, setDeptFilter] = useState<string>("ALL");
  const [assignFilter, setAssignFilter] = useState<AssignFilter>("ALL");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Complaint[]>("/api/admin/complaints")
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
    const resolvedPct = total ? Math.round((resolved / total) * 100) : 0;
    const reviewed = resolved + progress;
    return { total, open, progress, resolved, resolvedPct, reviewed };
  }, [items]);

  const departmentStats = useMemo(() => {
    const map = new Map<string, { id: string; name: string; total: number; open: number; progress: number; resolved: number }>();
    for (const c of items) {
      const id = c.departmentId;
      const name = c.department?.name ?? "Unknown";
      const row = map.get(id) ?? { id, name, total: 0, open: 0, progress: 0, resolved: 0 };
      row.total += 1;
      if (c.status === "OPEN") row.open += 1;
      else if (c.status === "IN_PROGRESS") row.progress += 1;
      else if (c.status === "RESOLVED") row.resolved += 1;
      map.set(id, row);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [items]);

  const monthly = useMemo(() => buildMonthlySeries(items), [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((c) => {
      if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
      if (deptFilter !== "ALL" && c.departmentId !== deptFilter) return false;
      if (assignFilter === "ASSIGNED" && !c.assignedDeptHeadId) return false;
      if (assignFilter === "UNASSIGNED" && c.assignedDeptHeadId) return false;
      if (!q) return true;
      const hay = [
        c.title,
        c.description,
        c.user?.name,
        c.user?.email,
        c.department?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, statusFilter, deptFilter, assignFilter, search]);

  function openDeptRequests(deptId: string) {
    setDeptFilter(deptId);
    setTab("requests");
  }

  if (loading) return <LoadingBlock />;
  if (error) return <EmptyState title="Could not load complaints" description={error} />;

  return (
    <>
      <PageHeader
        title="Complaints"
        description="Overview of all citizen complaints and department forwarding."
      />

      <div style={{ display: "flex", gap: "0.3rem", marginBottom: "0.65rem" }}>
        {(["overview", "requests"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            className={`tab-pill${tab === t ? " active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t === "overview" ? "Overview" : "Requests"}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="dash-stack">
          <div className="hero-banner">
            <div>
              <h2>All complaints</h2>
              <p className="hero-copy">
                Review volume across every citizen — open work and resolved cases.
              </p>
              <div style={{ fontSize: "0.7rem", opacity: 0.85, marginBottom: "0.25rem" }}>
                Review progress · {stats.reviewed} of {stats.total || 0} reviewed
              </div>
              <div className="progress-track">
                <div
                  style={{
                    width: `${pct(stats.resolved, stats.total)}%`,
                    background: "#4ade80",
                  }}
                />
                <div
                  style={{
                    width: `${pct(stats.progress, stats.total)}%`,
                    background: "#60a5fa",
                  }}
                />
                <div
                  style={{
                    width: `${pct(stats.open, stats.total)}%`,
                    background: "#fbbf24",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  marginTop: "0.4rem",
                  fontSize: "0.68rem",
                  opacity: 0.9,
                  flexWrap: "wrap",
                }}
              >
                <span>● Resolved {stats.resolved}</span>
                <span>● In progress {stats.progress}</span>
                <span>● Open {stats.open}</span>
              </div>
            </div>

            <div className="hero-chip-row">
              <div className="hero-chip">
                <div style={{ fontSize: "0.62rem", opacity: 0.8 }}>Resolved</div>
                <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{stats.resolvedPct}%</div>
              </div>
              <div className="hero-chip">
                <div style={{ fontSize: "0.62rem", opacity: 0.8 }}>Open</div>
                <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{stats.open}</div>
              </div>
              <div className="hero-chip">
                <div style={{ fontSize: "0.62rem", opacity: 0.8 }}>Scope</div>
                <div style={{ fontWeight: 700, fontSize: "0.88rem" }}>All citizens</div>
              </div>
            </div>
          </div>

          <div className="stat-grid">
            <StatCard label="Total complaints" value={stats.total} accent="#0f3d26" icon="total" />
            <StatCard label="Open" value={stats.open} accent="#d97706" icon="open" />
            <StatCard label="In progress" value={stats.progress} accent="#2563eb" icon="progress" />
            <StatCard label="Resolved" value={stats.resolved} accent="#16a34a" icon="resolved" />
          </div>

          <div className="analytics-grid">
            <div className="panel">
              <div className="panel-head">
                <h3>Complaint status</h3>
              </div>
              <div style={{ display: "flex", gap: "0.85rem", alignItems: "center" }}>
                <Donut
                  open={stats.open}
                  progress={stats.progress}
                  resolved={stats.resolved}
                  total={stats.total}
                />
                <div style={{ flex: 1, display: "grid", gap: "0.45rem" }}>
                  <StatusRow label="Open" value={stats.open} total={stats.total} color="#d97706" />
                  <StatusRow
                    label="In progress"
                    value={stats.progress}
                    total={stats.total}
                    color="#2563eb"
                  />
                  <StatusRow
                    label="Resolved"
                    value={stats.resolved}
                    total={stats.total}
                    color="#16a34a"
                  />
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <h3>Complaints over time</h3>
                <span className="muted" style={{ fontSize: "0.7rem" }}>
                  Last 6 months
                </span>
              </div>
              <Sparkline values={monthly.values} labels={monthly.labels} />
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h3>By department</h3>
              <span className="muted" style={{ fontSize: "0.7rem" }}>
                Click a row to filter requests
              </span>
            </div>
            {!departmentStats.length ? (
              <p className="muted" style={{ margin: 0, fontSize: "0.8rem" }}>
                No department volume yet.
              </p>
            ) : (
              <div className="dept-stat-list">
                {departmentStats.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    className="dept-stat-row"
                    onClick={() => openDeptRequests(d.id)}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{d.name}</div>
                      <div className="muted" style={{ fontSize: "0.7rem" }}>
                        Open {d.open} · In progress {d.progress} · Resolved {d.resolved}
                      </div>
                    </div>
                    <div className="dept-stat-count">{d.total}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panel-head">
              <h3>Latest requests</h3>
              <button
                type="button"
                className="tab-pill"
                style={{ padding: "0.25rem 0.65rem" }}
                onClick={() => setTab("requests")}
              >
                View all
              </button>
            </div>
            {!items.length ? (
              <p className="muted" style={{ margin: 0, fontSize: "0.8rem" }}>
                No complaints yet.
              </p>
            ) : (
              <div className="complaint-cards">
                {items.slice(0, 5).map((c) => (
                  <div key={c.id} className="complaint-card">
                    <div>
                      <h4>{c.title}</h4>
                      <div className="meta">
                        {c.user?.name ?? "Citizen"} · {c.department?.name ?? "—"} ·{" "}
                        {formatDate(c.createdAt)}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                      <StatusBadge status={c.status} />
                      <Link
                        href={`/admin/complaints/${c.id}`}
                        className="btn btn-primary"
                        style={{ padding: "0.32rem 0.7rem", fontSize: "0.75rem" }}
                      >
                        Review
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "0.7rem" }}>
          <div className="filter-bar">
            <input
              type="search"
              className="filter-search"
              placeholder="Search citizen, title, department…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
              {(["ALL", "ASSIGNED", "UNASSIGNED"] as AssignFilter[]).map((a) => (
                <button
                  key={a}
                  type="button"
                  className={`tab-pill${assignFilter === a ? " active" : ""}`}
                  onClick={() => setAssignFilter(a)}
                >
                  {a === "ALL" ? "All assignment" : a === "ASSIGNED" ? "Assigned" : "Unassigned"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="muted" style={{ fontSize: "0.68rem", fontWeight: 700, marginBottom: 6 }}>
              STATUS
            </div>
            <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
              {(["ALL", "OPEN", "IN_PROGRESS", "RESOLVED"] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`tab-pill${statusFilter === s ? " active" : ""}`}
                  onClick={() => setStatusFilter(s)}
                >
                  {s === "ALL" ? "All" : s.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="muted" style={{ fontSize: "0.68rem", fontWeight: 700, marginBottom: 6 }}>
              DEPARTMENT
            </div>
            <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
              <button
                type="button"
                className={`tab-pill${deptFilter === "ALL" ? " active" : ""}`}
                onClick={() => setDeptFilter("ALL")}
              >
                All ({items.length})
              </button>
              {departmentStats.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className={`tab-pill${deptFilter === d.id ? " active" : ""}`}
                  onClick={() => setDeptFilter(d.id)}
                >
                  {d.name} ({d.total})
                </button>
              ))}
            </div>
          </div>

          <div className="muted" style={{ fontSize: "0.75rem" }}>
            Showing {filtered.length} of {items.length} requests
          </div>

          {!filtered.length ? (
            <EmptyState title="No complaints in this filter" />
          ) : (
            <div className="card table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Citizen</th>
                    <th>Department</th>
                    <th>Details</th>
                    <th>Status</th>
                    <th>Filed</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{c.user?.name ?? "—"}</div>
                        <div className="muted" style={{ fontSize: "0.78rem" }}>
                          {c.user?.email}
                          {c.user?.homeDepartment?.name
                            ? ` · ${c.user.homeDepartment.name}`
                            : ""}
                        </div>
                      </td>
                      <td>{c.department?.name ?? "—"}</td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{c.title}</div>
                        <div className="muted" style={{ fontSize: "0.78rem" }}>
                          {c.description.slice(0, 80)}
                          {c.description.length > 80 ? "…" : ""}
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="muted">{formatDate(c.createdAt)}</td>
                      <td>
                        <Link
                          href={`/admin/complaints/${c.id}`}
                          className="btn btn-primary"
                          style={{ padding: "0.35rem 0.75rem", fontSize: "0.78rem" }}
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function pct(part: number, total: number) {
  return total ? (part / total) * 100 : 0;
}

function StatusRow({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percent = total ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.78rem",
          marginBottom: "0.2rem",
        }}
      >
        <span>
          <span style={{ color, fontWeight: 700 }}>● </span>
          {label}
        </span>
        <span className="muted">
          {value} · {percent}%
        </span>
      </div>
      <div className="mini-bar">
        <span style={{ width: `${percent}%`, background: color }} />
      </div>
    </div>
  );
}

function Donut({
  open,
  progress,
  resolved,
  total,
}: {
  open: number;
  progress: number;
  resolved: number;
  total: number;
}) {
  const size = 108;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const toDash = (n: number) => (total ? (n / total) * c : 0);
  let offset = 0;
  const segments = [
    { value: resolved, color: "#16a34a" },
    { value: progress, color: "#2563eb" },
    { value: open, color: "#d97706" },
  ];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e8eee9" strokeWidth={stroke} />
      {segments.map((seg) => {
        const dash = toDash(seg.value);
        const el = (
          <circle
            key={seg.color}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${c - dash}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        );
        offset += dash;
        return el;
      })}
      <text x="50%" y="48%" textAnchor="middle" style={{ fontSize: 10, fill: "#6b7c72" }}>
        TOTAL
      </text>
      <text
        x="50%"
        y="62%"
        textAnchor="middle"
        style={{ fontSize: 18, fontWeight: 700, fill: "#15261d" }}
      >
        {total}
      </text>
    </svg>
  );
}

function Sparkline({ values, labels }: { values: number[]; labels: string[] }) {
  const max = Math.max(...values, 1);
  const w = 420;
  const h = 150;
  const pad = 10;
  const pointsArr = values.map((v, i) => {
    const x = pad + (i * (w - pad * 2)) / Math.max(values.length - 1, 1);
    const y = h - pad - (v / max) * (h - pad * 2);
    return { x, y };
  });
  const points = pointsArr.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPoints = `${pad},${h - pad} ${points} ${w - pad},${h - pad}`;

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={150} style={{ display: "block" }}>
        {[0.25, 0.5, 0.75].map((g) => (
          <line
            key={g}
            x1={pad}
            x2={w - pad}
            y1={h - pad - g * (h - pad * 2)}
            y2={h - pad - g * (h - pad * 2)}
            stroke="#e8eee9"
            strokeWidth="1"
          />
        ))}
        <polygon points={areaPoints} fill="rgb(15 61 38 / 10%)" />
        <polyline
          fill="none"
          stroke="#0f3d26"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points}
        />
        {pointsArr.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#0f3d26" />
        ))}
      </svg>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${labels.length}, 1fr)`,
          gap: "0.2rem",
          marginTop: "0.2rem",
        }}
      >
        {labels.map((label) => (
          <div
            key={label}
            className="muted"
            style={{ fontSize: "0.65rem", textAlign: "center" }}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

function buildMonthlySeries(items: Complaint[]) {
  const now = new Date();
  const labels: string[] = [];
  const values: number[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(d.toLocaleString("en", { month: "short" }));
    const count = items.filter((c) => {
      const created = new Date(c.createdAt);
      return (
        created.getFullYear() === d.getFullYear() &&
        created.getMonth() === d.getMonth()
      );
    }).length;
    values.push(count);
  }

  return { labels, values };
}

export default function AdminComplaintsPage() {
  return (
    <DashboardGate roles={["ADMIN"]} title="Complaints">
      <AdminComplaintsView />
    </DashboardGate>
  );
}
