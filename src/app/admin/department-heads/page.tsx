"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingBlock } from "@/components/ui/loading-block";

export default function DepartmentHeadsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/users?tab=heads");
  }, [router]);
  return (
    <div style={{ padding: "2rem" }}>
      <LoadingBlock label="Opening User Management..." />
    </div>
  );
}
