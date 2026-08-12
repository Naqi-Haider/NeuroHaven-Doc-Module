"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAuth } from "@/hooks/useAuth";
import DashboardShell from "@/components/layout/DashboardShell";

if (typeof window !== "undefined") {
  axios.defaults.headers.common["ngrok-skip-browser-warning"] = "true";
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  return <DashboardShell>{children}</DashboardShell>;
}
