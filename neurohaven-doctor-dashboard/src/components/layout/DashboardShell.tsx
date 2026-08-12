"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Loader2 } from "lucide-react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

interface DashboardShellProps {
  children: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const { user, loading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // If session is loading, show a premium loading indicator
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-jade-bg/30">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-jade-primary" />
          <p className="font-heading text-sm font-medium text-jade-dark animate-pulse">
            Verifying Care Workstation Session...
          </p>
        </div>
      </div>
    );
  }

  // Auth guard is handled in the page/layout, but we return null here to avoid flashing content
  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full bg-jade-bg/30">
      {/* Desktop Sidebar (Persistent) */}
      <div className="hidden md:block h-screen sticky top-0 shrink-0">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* Mobile Sidebar (Drawer Overlay) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64 border-r-0" showCloseButton={false}>
          <Sidebar collapsed={false} setCollapsed={() => {}} onCloseMobile={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
