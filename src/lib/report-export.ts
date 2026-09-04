import type { Complaint, ComplaintStatus } from "@/lib/types";
import { formatDate, statusLabel } from "@/lib/ui";

export type ReportRow = {
  createdAt: string;
  citizenName: string;
  citizenEmail: string;
  citizenPhone: string;
  department: string;
  title: string;
  description: string;
  status: string;
  assignedTo: string;
};

export function toReportRows(items: Complaint[]): ReportRow[] {
  return items.map((c) => ({
    createdAt: formatDate(c.createdAt),
    citizenName: c.user?.name ?? "—",
    citizenEmail: c.user?.email ?? "",
    citizenPhone: c.user?.phone ?? "",
    department: c.department?.name ?? "—",
    title: c.title,
    description: c.description.replace(/\s+/g, " ").trim(),
    status: statusLabel(c.status),
    assignedTo: c.assignedDeptHead?.name ?? "—",
  }));
}

function escapeCsv(value: string) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildComplaintsCsv(rows: ReportRow[]) {
  const headers = [
    "Created",
    "Citizen",
    "Email",
    "Phone",
    "Department",
    "Title",
    "Details",
    "Status",
    "Assigned HOD",
  ];
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.createdAt,
        r.citizenName,
        r.citizenEmail,
        r.citizenPhone,
        r.department,
        r.title,
        r.description,
        r.status,
        r.assignedTo,
      ]
        .map(escapeCsv)
        .join(","),
    ),
  ];
  return lines.join("\r\n");
}

export function downloadTextFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadComplaintsCsv(rows: ReportRow[], filename = "complaints-report.csv") {
  const csv = "\uFEFF" + buildComplaintsCsv(rows);
  downloadTextFile(filename, csv, "text/csv;charset=utf-8");
}

export async function downloadComplaintsPdf(
  rows: ReportRow[],
  meta: { title: string; scope: string; total: number },
) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  doc.setFontSize(14);
  doc.setTextColor(15, 61, 38);
  doc.text(meta.title, 40, 36);
  doc.setFontSize(9);
  doc.setTextColor(90, 110, 100);
  doc.text(`${meta.total} matching · scope: ${meta.scope}`, 40, 52);

  autoTable(doc, {
    startY: 64,
    head: [["Created", "Citizen", "Department", "Details", "Status", "Assigned"]],
    body: rows.map((r) => [
      r.createdAt,
      `${r.citizenName}\n${r.citizenPhone || r.citizenEmail}`,
      r.department,
      `${r.title}\n${r.description.slice(0, 140)}${r.description.length > 140 ? "…" : ""}`,
      r.status,
      r.assignedTo,
    ]),
    styles: {
      fontSize: 8,
      cellPadding: 5,
      valign: "top",
      textColor: [21, 38, 29],
    },
    headStyles: {
      fillColor: [15, 61, 38],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [246, 250, 247] },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 110 },
      2: { cellWidth: 100 },
      3: { cellWidth: 220 },
      4: { cellWidth: 70 },
      5: { cellWidth: 90 },
    },
  });

  doc.save("complaints-report.pdf");
}

export function statusFilterOptions(): Array<{ value: "" | ComplaintStatus; label: string }> {
  return [
    { value: "", label: "All statuses" },
    { value: "OPEN", label: "Open" },
    { value: "IN_PROGRESS", label: "In progress" },
    { value: "RESOLVED", label: "Resolved" },
  ];
}
