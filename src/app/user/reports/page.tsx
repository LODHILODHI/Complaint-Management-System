"use client";

import { DashboardGate } from "@/components/layout/dashboard-gate";
import { ComplaintsReports } from "@/components/reports/complaints-reports";

export default function UserReportsPage() {
  return (
    <DashboardGate roles={["USER"]} title="Reports">
      <ComplaintsReports
        title="My reports"
        description="Preview and download reports for complaints you filed."
      />
    </DashboardGate>
  );
}
