"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingBlock } from "@/components/ui/loading-block";

export default function DepartmentsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/master-data");
  }, [router]);
  return (
    <div style={{ padding: "2rem" }}>
      <LoadingBlock label="Opening Master Data..." />
    </div>
  );
}
