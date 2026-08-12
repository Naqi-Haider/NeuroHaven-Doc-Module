"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname.startsWith("/overview")) return "Clinical Overview";
    if (pathname.startsWith("/patients/link")) return "Link Patient";
    if (pathname.startsWith("/patients/")) return "Patient Profile Analysis";
    if (pathname.startsWith("/patients")) return "Patient Directory";
    if (pathname.startsWith("/alerts")) return "Clinical Alerts Centre";
    if (pathname.startsWith("/reports")) return "Performance Reports";
    if (pathname.startsWith("/settings")) return "Workspace Settings";
    return "Clinical Portal";
  };

  return (
    <header className="md:hidden flex h-14 w-full items-center px-4 border-b border-border bg-card shadow-sm shrink-0">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="text-jade-teal hover:text-jade-dark hover:bg-jade-light/50"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <span className="font-heading text-sm font-semibold text-jade-dark ml-2">
        {getPageTitle()}
      </span>
    </header>
  );
}
