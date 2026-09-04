"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingBlock } from "@/components/ui/loading-block";

export default function MasterDataRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/users?section=master");
  }, [router]);
  return (
    <div style={{ padding: "2rem" }}>
      <LoadingBlock label="Opening Master Data..." />
    </div>
  );
}
