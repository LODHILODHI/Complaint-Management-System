"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { LoadingBlock } from "@/components/ui/loading-block";
import { roleHome } from "@/lib/ui";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    router.replace(roleHome(user.role));
  }, [user, loading, router]);

  return (
    <div style={{ padding: "3rem" }}>
      <LoadingBlock label="Opening portal..." />
    </div>
  );
}
