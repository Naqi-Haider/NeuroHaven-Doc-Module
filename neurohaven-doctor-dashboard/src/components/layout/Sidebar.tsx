"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Users,
  Bell,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  onCloseMobile?: () => void;
}

export default function Sidebar({ collapsed, setCollapsed, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const menuItems = [
    { name: "Overview", href: "/overview", icon: LayoutDashboard },
    { name: "Patients", href: "/patients", icon: Users },
    { name: "Medical Alerts", href: "/alerts", icon: Bell },
    { name: "Reports", href: "/reports", icon: FileText },
    { name: "Workspace Settings", href: "/settings", icon: Settings },
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-card text-foreground transition-all duration-300 shadow-sm relative",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-border transition-all duration-300",
          collapsed ? "justify-center px-2" : "justify-between px-4"
        )}
      >
        <div className={cn("flex items-center justify-center", collapsed ? "w-full" : "gap-3 overflow-hidden")}>
          <div className="relative h-8 w-8 shrink-0">
            <Image src="/Neurohaven-logo.svg" alt="NeuroHaven Logo" fill className="object-contain" />
          </div>
          {!collapsed && (
            <span className="font-heading text-base font-semibold tracking-tight text-jade-dark whitespace-nowrap">
              NeuroHaven
            </span>
          )}
        </div>

        {/* Collapse Button - Desktop Only */}
        <Button
          variant="outline"
          size="icon-xs"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex absolute -right-3 top-5 z-50 h-6 w-6 items-center justify-center rounded-full border border-border bg-white text-jade-teal hover:text-jade-dark hover:bg-jade-light/50 shadow-sm transition-transform duration-200"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {/* Navigation Links */}
      <nav className={cn("flex-1 space-y-1.5 p-3", collapsed ? "overflow-visible" : "overflow-y-auto")}>
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
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
              <item.icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-105",
                  isActive ? "text-white" : "text-jade-teal group-hover:text-jade-dark"
                )}
              />
              {!collapsed && <span className="truncate">{item.name}</span>}

              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-14 z-50 hidden rounded-md bg-jade-dark px-2 py-1 text-xs text-white opacity-0 group-hover:block group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Doctor User Profile Summary */}
      <div className="border-t border-border p-4 bg-jade-bg/10">
        <div
          className={cn(
            "flex items-center gap-3 overflow-hidden",
            collapsed ? "justify-center" : "justify-between"
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-9 w-9 shrink-0 border border-jade-muted bg-white">
              <AvatarFallback className="text-sm font-semibold text-jade-primary bg-jade-light/40">
                {user?.name ? getInitials(user.name) : "DR"}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-jade-dark">
                  {user?.name || "Dr. Care Provider"}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-jade-teal truncate">
                  <Shield className="h-3 w-3 text-jade-primary shrink-0" />
                  <span>{user?.licenseNumber || "N/A"}</span>
                </div>
              </div>
            )}
          </div>

          {!collapsed && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => signOut()}
              title="Sign Out"
              className="text-jade-teal hover:text-destructive hover:bg-destructive/10 shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
        {collapsed && (
          <div className="mt-3 flex justify-center">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => signOut()}
              title="Sign Out"
              className="text-jade-teal hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
