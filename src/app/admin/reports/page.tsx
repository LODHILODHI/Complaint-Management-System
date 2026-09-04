"use client";

import { DashboardGate } from "@/components/layout/dashboard-gate";
import { ComplaintsReports } from "@/components/reports/complaints-reports";

export default function AdminReportsPage() {
  return (
    <DashboardGate roles={["ADMIN"]} title="Reports">
      <ComplaintsReports
        title="Reports"
        description="Preview and download complaint reports across every department."
      />
    </DashboardGate>
  );
}
