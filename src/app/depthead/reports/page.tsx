"use client";

import { DashboardGate } from "@/components/layout/dashboard-gate";
import { ComplaintsReports } from "@/components/reports/complaints-reports";

export default function DeptHeadReportsPage() {
  return (
    <DashboardGate roles={["DEPARTMENT_HEAD"]} title="Reports">
      <ComplaintsReports
        title="Reports"
        description="Preview and download reports for departments you manage."
      />
    </DashboardGate>
  );
}
