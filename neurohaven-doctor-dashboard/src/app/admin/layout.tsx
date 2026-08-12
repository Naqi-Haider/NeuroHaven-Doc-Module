"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  LayoutDashboard, 
  FileText, 
  HelpCircle, 
  LogOut, 
  Loader2, 
  Shield,
  Menu,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axios from "axios";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  axios.defaults.headers.common["ngrok-skip-browser-warning"] = "true";
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdminLoaded, setIsAdminLoaded] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const userStr = localStorage.getItem("adminUser");

    if (!token || !userStr) {
      toast.error("Access denied. Please log in as an administrator.");
      router.replace("/login-admin");
    } else {
      setAdminUser(JSON.parse(userStr));
      setIsAdminLoaded(true);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    toast.success("Logged out successfully.");
    router.push("/login-admin");
  };

  if (!isAdminLoaded) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-jade-bg/30">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-jade-primary" />
          <p className="font-heading text-sm font-medium text-jade-dark">
            Verifying Admin Session...
          </p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { name: "Overview Stats", href: "/admin/overview", icon: LayoutDashboard },
    { name: "Clinical Audits", href: "/admin/reports", icon: FileText },
    { name: "Support Tickets", href: "/admin/tickets", icon: HelpCircle },
  ];

  const renderSidebar = (isMobile: boolean = false, onCloseMobile?: () => void) => {
    const isCollapsed = !isMobile && collapsed;
    return (
      <aside 
        className={cn(
          "flex h-full flex-col border-r border-border bg-card text-foreground transition-all duration-300 shadow-sm relative",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Sidebar Brand Logo Header */}
        <div
          className={cn(
            "flex h-16 items-center border-b border-border transition-all duration-300",
            isCollapsed ? "justify-center px-2" : "justify-between px-4"
          )}
        >
          <div className={cn("flex items-center justify-center", isCollapsed ? "w-full" : "gap-3 overflow-hidden")}>
            <div className="relative h-8 w-8 shrink-0">
              <Image src="/Neurohaven-logo.svg" alt="NeuroHaven Logo" fill className="object-contain" />
            </div>
            {!isCollapsed && (
              <span className="font-heading text-base font-semibold tracking-tight text-jade-dark whitespace-nowrap">
                NeuroHaven
              </span>
            )}
          </div>

          {/* Collapse Button - Desktop Only */}
          {!isMobile && (
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex absolute -right-3 top-5 z-50 h-6 w-6 items-center justify-center rounded-full border border-border bg-white text-jade-teal hover:text-jade-dark hover:bg-jade-light/50 shadow-sm transition-transform duration-200"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
            </Button>
          )}
        </div>

        {/* Navigation list items */}
        <nav className={cn("flex-1 space-y-1.5 p-3", isCollapsed ? "overflow-visible" : "overflow-y-auto")}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 group relative",
                  isActive
                    ? "bg-jade-primary text-white shadow-sm"
                    : "text-jade-teal hover:bg-jade-bg hover:text-jade-dark"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-105", isActive ? "text-white" : "text-jade-teal group-hover:text-jade-dark")} />
                {!isCollapsed && <span className="truncate">{item.name}</span>}

                {/* Collapsed Tooltip helper */}
                {isCollapsed && (
                  <div className="absolute left-14 z-50 hidden rounded-md bg-jade-dark px-2 py-1 text-xs text-white opacity-0 group-hover:block group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Profile Card Footer */}
        <div className="border-t border-border p-4 bg-jade-bg/10">
          <div
            className={cn(
              "flex items-center gap-3 overflow-hidden",
              isCollapsed ? "justify-center" : "justify-between"
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-full bg-jade-light/80 text-jade-primary border border-jade-muted flex items-center justify-center text-xs font-bold shrink-0">
                AD
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-jade-dark">
                    {adminUser?.name || "Admin User"}
                  </p>
                  <div className="flex items-center gap-1 text-[11px] text-jade-teal truncate">
                    <Shield className="h-3 w-3 text-jade-primary shrink-0" />
                    <span>Administrator</span>
                  </div>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button
                onClick={handleLogout}
                title="Logout Session"
                className="text-jade-teal hover:text-destructive hover:bg-destructive/10 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
          {isCollapsed && (
            <div className="mt-3 flex justify-center">
              <button
                onClick={handleLogout}
                title="Logout Session"
                className="text-jade-teal hover:text-destructive hover:bg-destructive/10 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    );
  };

  return (
    <div className="flex h-screen bg-jade-bg/30 w-full overflow-hidden">
      {/* Desktop Sidebar (Persistent) */}
      <div className="hidden md:block h-full shrink-0">
        {renderSidebar(false)}
      </div>

      {/* Mobile Sidebar (Drawer Sheet Overlay) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64 border-r-0" showCloseButton={false}>
          {renderSidebar(true, () => setMobileOpen(false))}
        </SheetContent>
      </Sheet>

      {/* Main content body container */}
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-border bg-white px-4 md:px-8 flex items-center justify-between select-none shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden text-jade-teal hover:text-jade-dark p-1.5 rounded-lg transition-colors cursor-pointer"
              aria-label="Open mobile menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-sm font-bold text-jade-dark font-heading uppercase tracking-wide">
              Systems Management Console
            </h2>
          </div>
        </header>

        {/* Inner dynamic view scrolls */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
