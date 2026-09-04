"use client";

import { useRequireAuth } from "@/components/auth/auth-provider";
import { AppShell } from "@/components/layout/app-shell";
import { LoadingBlock } from "@/components/ui/loading-block";

export function DashboardGate({
  roles,
  title,
  children,
}: {
  roles: Array<"USER" | "ADMIN" | "DEPARTMENT_HEAD">;
  title: string;
  children: React.ReactNode;
}) {
  const { user, loading } = useRequireAuth(roles);

  if (loading || !user || !roles.includes(user.role)) {
    return (
      <div style={{ padding: "2rem" }}>
        <LoadingBlock />
      </div>
    );
  }

  return <AppShell title={title}>{children}</AppShell>;
}
