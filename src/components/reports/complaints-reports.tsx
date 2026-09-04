"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingBlock } from "@/components/ui/loading-block";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { ApiError, apiFetch } from "@/lib/api-client";
import {
  downloadComplaintsCsv,
  downloadComplaintsPdf,
  statusFilterOptions,
  toReportRows,
} from "@/lib/report-export";
import type { Complaint, ComplaintStatus, Department, Role } from "@/lib/types";
import { formatDate } from "@/lib/ui";

type ReportResponse = {
  items: Complaint[];
  total: number;
  scopeLabel: string;
  role: Role;
  departments: Department[];
};

function IconEye() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

export function ComplaintsReports({
  title = "Reports",
  description = "Filter, preview, and download complaint reports for your access scope.",
}: {
  title?: string;
  description?: string;
}) {
  const [status, setStatus] = useState<"" | ComplaintStatus>("");
  const [departmentId, setDepartmentId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (departmentId) params.set("departmentId", departmentId);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const q = params.toString();
    return q ? `?${q}` : "";
  }, [status, departmentId, from, to]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch<ReportResponse>(`/api/reports/complaints${queryString}`);
      setData(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load report");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(() => toReportRows(data?.items ?? []), [data]);
  const showDeptFilter = (data?.departments.length ?? 0) > 0;

  function resetFilters() {
    setStatus("");
    setDepartmentId("");
    setFrom("");
    setTo("");
  }

  async function onDownloadCsv() {
    setExporting("csv");
    try {
      downloadComplaintsCsv(rows);
    } finally {
      setExporting(null);
    }
  }

  async function onDownloadPdf() {
    setExporting("pdf");
    try {
      await downloadComplaintsPdf(rows, {
        title: "MNFSR Complaints Report",
        scope: data?.scopeLabel ?? "all",
        total: data?.total ?? rows.length,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF export failed");
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="reports-page">
      <PageHeader title={title} description={description} />

      <div className="reports-toolbar">
        <div className="reports-filters">
          <div className="field" style={{ margin: 0, minWidth: 150 }}>
            <label>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "" | ComplaintStatus)}
            >
              {statusFilterOptions().map((o) => (
                <option key={o.label} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {showDeptFilter ? (
            <div className="field" style={{ margin: 0, minWidth: 180 }}>
              <label>Department</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
              >
                <option value="">All departments</option>
                {(data?.departments ?? []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="field" style={{ margin: 0, minWidth: 150 }}>
            <label>From date</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="field" style={{ margin: 0, minWidth: 150 }}>
            <label>To date</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>

          <button type="button" className="reports-reset" onClick={resetFilters}>
            Reset filters
          </button>
        </div>

        <div className="reports-actions">
          <button
            type="button"
            className="btn btn-secondary reports-action-btn"
            onClick={() => setPreviewOpen(true)}
            disabled={!data || loading}
          >
            <IconEye />
            Preview
          </button>
          <button
            type="button"
            className="btn btn-secondary reports-action-btn"
            onClick={() => void onDownloadCsv()}
            disabled={!rows.length || exporting !== null}
          >
            <IconDownload />
            {exporting === "csv" ? "CSV…" : "Download CSV"}
          </button>
          <button
            type="button"
            className="btn btn-primary reports-action-btn"
            onClick={() => void onDownloadPdf()}
            disabled={!rows.length || exporting !== null}
          >
            <IconDownload />
            {exporting === "pdf" ? "PDF…" : "Download PDF"}
          </button>
        </div>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}

      {loading ? (
        <LoadingBlock />
      ) : !data?.items.length ? (
        <EmptyState
          title="No matching complaints"
          description="Adjust filters or wait for new filings in your scope."
        />
      ) : (
        <div className="card table-wrap">
          <div className="reports-table-meta">
            <strong>{data.total}</strong> matching · scope: {data.scopeLabel}
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Created</th>
                <th>Citizen</th>
                <th>Department</th>
                <th>Details</th>
                <th>Status</th>
                <th>Assigned</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((c) => (
                <tr key={c.id}>
                  <td className="muted" style={{ whiteSpace: "nowrap" }}>
                    {formatDate(c.createdAt)}
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{c.user?.name ?? "—"}</div>
                    <div className="muted" style={{ fontSize: "0.75rem" }}>
                      {c.user?.phone || c.user?.email}
                    </div>
                  </td>
                  <td>{c.department?.name ?? "—"}</td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{c.title}</div>
                    <div className="muted" style={{ fontSize: "0.75rem" }}>
                      {c.description.slice(0, 90)}
                      {c.description.length > 90 ? "…" : ""}
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="muted">{c.assignedDeptHead?.name ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {previewOpen && data ? (
        <Modal
          title="Complaint report preview"
          description={`${data.total} matching · scope: ${data.scopeLabel}`}
          onClose={() => setPreviewOpen(false)}
          wide
          headerActions={
            <div className="reports-actions" style={{ gap: "0.35rem" }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: "0.35rem 0.7rem", fontSize: "0.78rem" }}
                onClick={() => void onDownloadCsv()}
                disabled={!rows.length}
              >
                CSV
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: "0.35rem 0.7rem", fontSize: "0.78rem" }}
                onClick={() => void onDownloadPdf()}
                disabled={!rows.length}
              >
                PDF
              </button>
            </div>
          }
        >
          {!data.items.length ? (
            <EmptyState title="Nothing to preview" />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Created</th>
                    <th>Citizen</th>
                    <th>Department</th>
                    <th>Details</th>
                    <th>Status</th>
                    <th>Assigned</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((c) => (
                    <tr key={c.id}>
                      <td className="muted" style={{ whiteSpace: "nowrap" }}>
                        {formatDate(c.createdAt)}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{c.user?.name ?? "—"}</div>
                        <div className="muted" style={{ fontSize: "0.75rem" }}>
                          {c.user?.phone || c.user?.email}
                        </div>
                      </td>
                      <td>{c.department?.name ?? "—"}</td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{c.title}</div>
                        <div className="muted" style={{ fontSize: "0.75rem" }}>
                          {c.description.slice(0, 120)}
                          {c.description.length > 120 ? "…" : ""}
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="muted">{c.assignedDeptHead?.name ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal>
      ) : null}
    </div>
  );
}
