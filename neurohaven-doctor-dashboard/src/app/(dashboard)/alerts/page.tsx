"use client";

import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import {
  Check,
  CheckCircle,
  Activity,
  User,
  Search,
  MoreVertical,
  ShieldCheck,
  Brain,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "@/hooks/useAuth";
import { Alert as AlertType, AlertCategory } from "@/types/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PatientDetailDrawer from "@/components/patients/PatientDetailDrawer";
import { cn } from "@/lib/utils";

// Helper to generate mock times relative to current execution
const getRelativeDate = (hrsAgo: number, minsAgo: number = 0) => {
  return new Date(new Date().getTime() - (hrsAgo * 60 * 60 * 1000 + minsAgo * 60 * 1000)).toISOString();
};

// Rich initial alerts cohort
const initialAlerts: AlertType[] = [
  {
    id: "al-1",
    patientId: "pat-2",
    patientName: "Eleanor Vance",
    severity: "critical",
    category: "medical",
    title: "Missed Medication Alert",
    description: "Eleanor missed morning Donepezil dosage. Window elapsed by 3 hours.",
    isRead: false,
    createdAt: getRelativeDate(2, 14),
  },
  {
    id: "al-2",
    patientId: "pat-2",
    patientName: "Eleanor Vance",
    severity: "critical",
    category: "cognitive",
    title: "Severe Cognitive Score Decline",
    description: "Memory Recall score dropped by 24% over the last 3 consecutive sessions.",
    isRead: false,
    createdAt: getRelativeDate(1, 5),
  },
  {
    id: "al-3",
    patientId: "pat-1",
    patientName: "Arthur Pendelton",
    severity: "warning",
    category: "emotional",
    title: "Low Sentiment Index Triggered",
    description: "End-of-session mood tracker indicates low valence or high arousal anxiety levels.",
    isRead: false,
    createdAt: getRelativeDate(3, 10),
  },
  {
    id: "al-4",
    patientId: "pat-3",
    patientName: "Gordon Cole",
    severity: "critical",
    category: "medical",
    title: "Emergency Fall Alert Pressed",
    description: "Wearable sensor registered manual SOS distress button trigger event.",
    isRead: false,
    createdAt: getRelativeDate(4, 0),
  },
  {
    id: "al-5",
    patientId: "pat-4",
    patientName: "Marianne Faith",
    severity: "info",
    category: "cognitive",
    title: "Game Skipped: 3 Days Elapsed",
    description: "Marianne has not completed any cognitive memory match exercises for 72h.",
    isRead: true,
    createdAt: getRelativeDate(24, 0),
  },
  {
    id: "al-6",
    patientId: "pat-1",
    patientName: "Arthur Pendelton",
    severity: "warning",
    category: "emotional",
    title: "Sentiment Index Negative Trend",
    description: "Conversational NLP indexing shows negative cognitive decay for 3 consecutive days.",
    isRead: false,
    createdAt: getRelativeDate(5, 30),
  },
  {
    id: "al-7",
    patientId: "pat-system",
    patientName: "Platform System",
    severity: "info",
    category: "system",
    title: "Custom Threshold Settings Modified",
    description: "Clinician adjusted memory drop warning trigger index to 20% decline rates.",
    isRead: true,
    createdAt: getRelativeDate(48, 0),
  },
];

export default function AlertsPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAlerts() {
      try {
        const token = localStorage.getItem("nh-token") || "mock-dev-token";
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
        const res = await axios.get(`${apiBaseUrl}/api/patients`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (res.data?.success && res.data.data.length > 0) {
          const generated: AlertType[] = [];
          res.data.data.forEach((p: any) => {
            if (p.delta && p.delta < -10) {
              generated.push({
                id: `al-decline-${p.id}`,
                patientId: p.id,
                patientName: p.name,
                severity: "critical",
                category: "cognitive",
                title: "Severe Cognitive Score Decline",
                description: `${p.name}'s memory performance index dropped by ${Math.abs(p.delta)} points over consecutive sessions.`,
                isRead: false,
                createdAt: new Date().toISOString()
              });
            }
            if (p.cognitiveLevel < 50) {
              generated.push({
                id: `al-score-${p.id}`,
                patientId: p.id,
                patientName: p.name,
                severity: "critical",
                category: "cognitive",
                title: "Cognitive Score At Risk",
                description: `${p.name}'s cognitive score is at ${p.cognitiveLevel}%, signaling potential cognitive decline.`,
                isRead: false,
                createdAt: new Date(Date.now() - 3600 * 1000).toISOString()
              });
            }
            const hasNoActivity = p.lastActivity === "No recent activity" || p.lastActivity === "No sessions logged yet";
            if (hasNoActivity) {
              generated.push({
                id: `al-missed-${p.id}`,
                patientId: p.id,
                patientName: p.name,
                severity: "warning",
                category: "medical",
                title: "Missed Scheduled Exercise",
                description: `${p.name} has not logged any telemetry session activity today.`,
                isRead: false,
                createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
              });
            }
          });
          const savedAck = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("nh-acknowledged-alerts") || "[]") : [];
          const updated = generated.map(a => ({ ...a, isRead: a.isRead || savedAck.includes(a.id) }));
          setAlerts(updated);
        } else {
          const savedAck = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("nh-acknowledged-alerts") || "[]") : [];
          const updated = initialAlerts.map(a => ({ ...a, isRead: a.isRead || savedAck.includes(a.id) }));
          setAlerts(updated);
        }
      } catch (err) {
        console.warn("Using offline fallback alerts:", err);
        const savedAck = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("nh-acknowledged-alerts") || "[]") : [];
        const updated = initialAlerts.map(a => ({ ...a, isRead: a.isRead || savedAck.includes(a.id) }));
        setAlerts(updated);
      } finally {
        setTimeout(() => setLoading(false), 800);
      }
    }
    loadAlerts();
  }, []);

  const AlertCardSkeleton = () => (
    <div className="bg-white/60 border border-border/40 rounded-2xl p-5 space-y-4 animate-pulse select-none">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-jade-light/40 shrink-0" />
          <div className="space-y-2">
            <div className="h-3 w-28 bg-jade-light/40 rounded" />
            <div className="h-3 w-40 bg-jade-light/40 rounded" />
          </div>
        </div>
        <div className="h-3 w-10 bg-jade-light/40 rounded" />
      </div>
      <div className="space-y-1.5">
        <div className="h-3.5 w-full bg-jade-light/40 rounded" />
        <div className="h-3.5 w-[80%] bg-jade-light/40 rounded" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <div className="h-6 w-24 bg-jade-light/40 rounded-full" />
        <div className="flex gap-2">
          <div className="h-8 w-20 bg-jade-light/40 rounded-btn" />
          <div className="h-8 w-24 bg-jade-light/40 rounded-btn" />
        </div>
      </div>
    </div>
  );

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<"all" | "critical" | "warning" | "info">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"unread" | "all">("unread");

  // Drawer / Context Detail State
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Transient highlight styling for scrolling
  const [highlightedZone, setHighlightedZone] = useState<string | null>(null);

  const handleAcknowledge = (id: string) => {
    setAlerts((prev) =>
      prev.map((al) => (al.id === id ? { ...al, isRead: true } : al))
    );
    if (typeof window !== "undefined") {
      const saved = JSON.parse(localStorage.getItem("nh-acknowledged-alerts") || "[]");
      const updated = Array.from(new Set([...saved, id]));
      localStorage.setItem("nh-acknowledged-alerts", JSON.stringify(updated));
    }
    toast.success("Alert acknowledged and indicator cleared.");
  };

  const handleDismiss = (id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
    toast.success("Alert dismissed.");
  };

  const handleMarkAllRead = () => {
    const allIds = alerts.map((al) => al.id);
    setAlerts((prev) => prev.map((alert) => ({ ...alert, isRead: true })));
    if (typeof window !== "undefined") {
      const saved = JSON.parse(localStorage.getItem("nh-acknowledged-alerts") || "[]");
      const updated = Array.from(new Set([...saved, ...allIds]));
      localStorage.setItem("nh-acknowledged-alerts", JSON.stringify(updated));
    }
    toast.success("All active alerts marked as resolved.");
  };

  const getTimeSince = (dateStr: string) => {
    const diffMs = new Date().getTime() - new Date(dateStr).getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHrs > 24) {
      const diffDays = Math.floor(diffHrs / 24);
      return `${diffDays}d ago`;
    }
    if (diffHrs > 0) {
      return `${diffHrs}h ${diffMins}m ago`;
    }
    return `${diffMins}m ago`;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getCategoryIcon = (category: AlertCategory) => {
    switch (category) {
      case "medical":
        return <Activity className="h-3 w-3 shrink-0" />;
      case "cognitive":
        return <Brain className="h-3 w-3 shrink-0" />;
      case "emotional":
        return <MessageSquare className="h-3 w-3 shrink-0" />;
      case "system":
      default:
        return <User className="h-3 w-3 shrink-0" />;
    }
  };

  const getRecommendedAction = (category: string) => {
    switch (category) {
      case "medical":
        return "Suggested: Contact caregiver or adjust medication window in patient profile.";
      case "cognitive":
        return "Suggested: Initiate diagnostic tele-consultation and review session history trends.";
      case "emotional":
        return "Suggested: Conduct clinical check-in or request caregiver acoustic observation.";
      default:
        return "Suggested: Audit recent telemetry inputs and check patient device logs.";
    }
  };

  // Scroll and highlight effect
  const scrollToZone = (zoneId: string) => {
    const el = document.getElementById(zoneId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedZone(zoneId);
      setTimeout(() => setHighlightedZone(null), 2000);
    }
  };

  const getPatientAvatarColor = (name: string) => {
    const colors = [
      "bg-[#1A5C3A]/10 text-[#1A5C3A] border-[#1A5C3A]/20",
      "bg-[#0284C7]/10 text-[#0284C7] border-[#0284C7]/20",
      "bg-[#F57C00]/10 text-[#F57C00] border-[#F57C00]/20",
      "bg-[#7C3AED]/10 text-[#7C3AED] border-[#7C3AED]/20",
      "bg-[#DB2777]/10 text-[#DB2777] border-[#DB2777]/20",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // Triage state counters based on active (unread) alerts
  const criticalCount = alerts.filter((a) => a.severity === "critical" && !a.isRead).length;
  const warningCount = alerts.filter((a) => a.severity === "warning" && !a.isRead).length;
  const infoCount = alerts.filter((a) => a.severity === "info" && !a.isRead).length;

  const lastCriticalAlert = alerts.find((a) => a.severity === "critical" && !a.isRead);
  const lastWarningAlert = alerts.find((a) => a.severity === "warning" && !a.isRead);

  // Main filter engine
  const filteredAlerts = useMemo(() => {
    return alerts
      .filter((alert) => {
        const matchesSearch =
          alert.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          alert.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter;
        const matchesCategory = categoryFilter === "all" || alert.category === categoryFilter;
        const matchesStatus = statusFilter === "all" || (statusFilter === "unread" && !alert.isRead);

        return matchesSearch && matchesSeverity && matchesCategory && matchesStatus;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [alerts, searchQuery, severityFilter, categoryFilter, statusFilter]);

  const criticalList = filteredAlerts.filter((a) => a.severity === "critical");
  const warningList = filteredAlerts.filter((a) => a.severity === "warning");
  const infoList = filteredAlerts.filter((a) => a.severity === "info");

  const totalUnresolved = alerts.filter((a) => !a.isRead).length;

  // Clinician metadata context
  const docName = user?.name ? `${user.name}` : "Sarah Jenkins, MD";
  const docSpecialization = user?.specialization || "Neurology & Dementia Care";
  const docLicense = user?.licenseNumber || "MD-98210";

  if (loading) {
    return (
      <div className="space-y-6 select-none relative pb-10">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-jade-light/40 rounded animate-pulse" />
            <div className="h-4 w-72 bg-jade-light/40 rounded animate-pulse" />
          </div>
        </div>
        <div className="space-y-4 mt-6 animate-fadeIn">
          <AlertCardSkeleton />
          <AlertCardSkeleton />
          <AlertCardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none relative pb-10">
      
      {/* Page Header Zone (No Card Wrapper) */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-[#404E3B] font-inter">
            Clinical Alerts Centre
          </h2>
          <p className="text-[13px] font-normal font-sans text-[#6C8480]">
            Active warning indicators, medication omissions, and cognitive deterioration triggers.
          </p>
          <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#1A5C3A] pt-0.5">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#1A5C3A]" />
            <span>Dr. Muhammad Naqi &middot; MD-22333 &middot; Neurology</span>
          </div>
        </div>

        {/* Right header options - Resolve all button */}
        <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
          <Button
            onClick={handleMarkAllRead}
            disabled={totalUnresolved === 0}
            className="bg-[#1A5C3A] hover:bg-[#156d47] text-white rounded-lg h-9 px-4 text-xs font-bold shadow-sm transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Resolve all</span>
          </Button>
        </div>
      </div>

      {/* Triage Situation Strip - Transparent Brutalist Minimal */}
      <div className="w-full bg-transparent border border-border/80 rounded-xl select-none flex flex-col md:flex-row items-stretch overflow-hidden">
        {/* Critical Zone (45%) */}
        <button
          onClick={() => scrollToZone("critical-zone")}
          className="w-full md:w-[45%] p-4 flex flex-col justify-center hover:bg-black/5 transition-all text-left relative border-l-4 border-l-[#E53935] border-r md:border-r-border/60"
        >
          <span className="text-xs font-bold text-[#E53935] uppercase tracking-wider block">
            {criticalCount} unresolved critical alert{criticalCount !== 1 && "s"}
          </span>
          <span className="text-xs text-[#6C8480] mt-1 block font-medium truncate">
            {lastCriticalAlert
              ? `Recent: ${lastCriticalAlert.patientName} · ${lastCriticalAlert.title} · ${getTimeSince(lastCriticalAlert.createdAt)}`
              : "All critical items stabilized"}
          </span>
        </button>

        {/* Warning Zone (35%) */}
        <button
          onClick={() => scrollToZone("warning-zone")}
          className="w-full md:w-[35%] p-4 flex flex-col justify-center hover:bg-black/5 transition-all text-left relative border-l-4 border-l-[#F57C00] border-r md:border-r-border/60"
        >
          <span className="text-xs font-bold text-[#F57C00] uppercase tracking-wider block">
            {warningCount} warning-level alert{warningCount !== 1 && "s"}
          </span>
          <span className="text-xs text-[#6C8480] mt-1 block font-medium truncate">
            {lastWarningAlert
              ? `${lastWarningAlert.patientName} · ${lastWarningAlert.title}`
              : "No warning alerts today"}
          </span>
        </button>

        {/* Info Zone (20%) */}
        <button
          onClick={() => scrollToZone("info-zone")}
          className="w-full md:w-[20%] p-4 flex flex-col justify-center hover:bg-black/5 transition-all text-left relative border-l-4 border-l-[#1565C0]"
        >
          <span className="text-xs font-bold text-[#1565C0] uppercase tracking-wider block">
            {infoCount} informational{infoCount === 0 ? "" : ` alert${infoCount !== 1 ? "s" : ""}`}
          </span>
          <span className="text-xs text-[#6C8480] mt-1 block font-medium">
            Telemetry logs
          </span>
        </button>
      </div>

      {/* Filter and search row */}
      <div className="flex flex-row items-center gap-2 select-none w-full h-[38px] mt-6 mb-[20px]">
        {/* Search bar */}
        <div className="relative w-[280px] shrink-0">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#6C8480]" />
          <Input
            type="text"
            placeholder="Search patient or alert type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 h-[38px] rounded-lg border border-border/80 bg-transparent text-xs text-[#404E3B] font-medium placeholder-[#6C8480]/60 focus-visible:ring-[#1A5C3A]/50"
          />
        </div>

        {/* Severity Toggle Pills */}
        <div className="flex items-center gap-1.5 h-9">
          {(["all", "critical", "warning", "info"] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={cn(
                "px-3.5 h-9 rounded-lg text-xs font-bold transition-all capitalize select-none border border-border/80",
                severityFilter === sev
                  ? "bg-[#1A5C3A] text-white border-[#1A5C3A]"
                  : "bg-transparent text-[#6C8480] hover:text-[#404E3B] hover:border-[#1A5C3A]/40"
              )}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Category Dropdown */}
        <div className="relative h-9">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-9 border border-border/80 bg-transparent text-xs font-bold text-[#404E3B] focus:ring-[#1A5C3A]/50 rounded-lg px-3 gap-1.5">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-border">
              <SelectItem value="all" className="text-xs text-jade-dark font-medium">All Categories</SelectItem>
              <SelectItem value="medical" className="text-xs text-jade-dark font-medium">Medical Events</SelectItem>
              <SelectItem value="cognitive" className="text-xs text-jade-dark font-medium">Cognitive Scores</SelectItem>
              <SelectItem value="emotional" className="text-xs text-jade-dark font-medium">Sentiment Mood</SelectItem>
              <SelectItem value="system" className="text-xs text-jade-dark font-medium">System Logs</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Resolved/Unresolved Toggle Switch (Far Right) */}
        <div className="ml-auto flex items-center border border-border/80 p-0.5 bg-transparent rounded-lg">
          <button
            onClick={() => setStatusFilter("unread")}
            className={cn(
              "px-3 py-1 h-7 rounded text-[11px] font-bold transition-all flex items-center gap-1.5",
              statusFilter === "unread"
                ? "bg-[#1A5C3A] text-white"
                : "text-[#6C8480] hover:text-[#404E3B]"
            )}
          >
            {statusFilter === "unread" && <span className="h-1.5 w-1.5 rounded-full bg-[#F57C00] animate-pulse" />}
            <span>Unresolved</span>
          </button>
          <button
            onClick={() => setStatusFilter("all")}
            className={cn(
              "px-3 py-1 h-7 rounded text-[11px] font-bold transition-all",
              statusFilter === "all"
                ? "bg-[#1A5C3A] text-white"
                : "text-[#6C8480] hover:text-[#404E3B]"
            )}
          >
            All
          </button>
        </div>
      </div>

      {/* Main Alerts Zones */}
      {filteredAlerts.length === 0 ? (
        /* Entire page clear state */
        <div className="bg-transparent border border-border/80 rounded-xl py-12 px-6 text-center shadow-none max-w-xl mx-auto select-none mt-4 flex flex-col items-center justify-center">
          <CheckCircle className="w-10 h-10 text-emerald-600 mb-3" />
          <h3 className="font-heading text-base font-bold text-[#404E3B]">
            All clear
          </h3>
          <p className="text-xs font-medium text-[#6C8480] mt-1 max-w-sm">
            All warning indicators and cognitive alerts acknowledged.
          </p>
        </div>
      ) : (
        <div className="space-y-8 mt-2">
          
          {/* Critical Alerts Zone */}
          {(severityFilter === "all" || severityFilter === "critical") && (
            <div
              id="critical-zone"
              className={cn(
                "space-y-3 transition-all duration-300 rounded-xl",
                highlightedZone === "critical-zone" ? "ring-2 ring-status-critical/30 p-2 bg-status-critical/[0.01]" : ""
              )}
            >
              {/* Heading row */}
              <div className="flex items-center justify-between text-[11px] font-bold select-none">
                <div className="flex items-center gap-2 text-[#E53935] tracking-wider uppercase font-heading">
                  <span className="h-2 w-2 rounded-full bg-[#E53935] shrink-0" />
                  <span>Critical &mdash; Requires immediate action</span>
                </div>
                <span className="text-[#E53935] font-medium">{criticalList.length} unresolved</span>
              </div>
              <div className="h-[1px] bg-[#E53935]/25 w-full mb-3" />

              {/* Card List */}
              <div className="space-y-3">
                {criticalList.length === 0 ? (
                  <div className="flex items-center gap-2 text-[11px] text-[#6C8480]/60 font-semibold py-2 bg-transparent border border-border/40 rounded-lg justify-center">
                    <CheckCircle className="h-4 w-4 text-status-normal shrink-0" />
                    <span>No critical alerts at this time.</span>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {criticalList.map((alert) => {
                      const initials = getInitials(alert.patientName);
                      
                      return (
                        <motion.div
                          key={alert.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{ duration: 0.25 }}
                          className={cn(
                            "bg-transparent border border-border/80 border-l-4 border-l-[#E53935] rounded-xl p-4 flex flex-col gap-3 hover:border-[#1A5C3A]/50 transition-colors",
                            alert.isRead ? "opacity-50" : ""
                          )}
                        >
                          {/* Row 1: Identity & Time */}
                          <div className="flex items-start justify-between w-full">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 shrink-0 border border-border bg-transparent">
                                <AvatarFallback className="text-xs font-bold text-[#404E3B] bg-transparent">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-[#404E3B]">
                                  {alert.patientName}
                                </span>
                                <span className="text-xs font-semibold text-[#6C8480]">
                                  {alert.title}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-mono text-[#6C8480]">
                                {getTimeSince(alert.createdAt)}
                              </span>
                              <span className="text-[10px] font-mono uppercase text-[#6C8480] border border-border/80 px-2 py-0.5 rounded">
                                {alert.category}
                              </span>
                            </div>
                          </div>

                          {/* Row 2: Description */}
                          <div className="text-xs text-[#404E3B] font-mono leading-relaxed pl-11">
                            <strong>{alert.patientName}:</strong> {alert.description.replace(alert.patientName + ":", "").trim()}
                          </div>

                          {/* Row 3: Action Zone */}
                          <div className="flex items-center justify-between w-full pt-1 pl-11">
                            <span className="text-[11px] text-[#6C8480] font-mono italic">
                              {getRecommendedAction(alert.category)}
                            </span>

                            <div className="flex items-center gap-3 select-none">
                              <button
                                onClick={() => setSelectedPatientId(alert.patientId)}
                                className="text-xs font-bold text-[#1A5C3A] hover:underline"
                              >
                                Profile &rarr;
                              </button>
                              {!alert.isRead && (
                                <button
                                  onClick={() => handleAcknowledge(alert.id)}
                                  className="h-7 px-3 rounded border border-[#E53935] text-[#E53935] hover:bg-[#E53935] hover:text-white text-xs font-bold transition-all"
                                >
                                  Acknowledge
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            </div>
          )}

          {/* Warning Alerts Zone */}
          {(severityFilter === "all" || severityFilter === "warning") && (
            <div
              id="warning-zone"
              className={cn(
                "space-y-3 transition-all duration-300 rounded-xl mt-7",
                highlightedZone === "warning-zone" ? "ring-2 ring-status-warning/30 p-2 bg-status-warning/[0.01]" : ""
              )}
            >
              {/* Heading row */}
              <div className="flex items-center justify-between text-[11px] font-bold select-none">
                <div className="flex items-center gap-2 text-[#F57C00] tracking-wider uppercase font-heading">
                  <span className="h-2 w-2 rounded-full bg-[#F57C00] shrink-0" />
                  <span>Warning &mdash; Review today</span>
                </div>
                <span className="text-[#F57C00] font-medium">{warningList.length} unresolved</span>
              </div>
              <div className="h-[1px] bg-[#F57C00]/25 w-full mb-3" />

              {/* Card List */}
              <div className="space-y-3">
                {warningList.length === 0 ? (
                  <div className="flex items-center gap-2 text-[11px] text-[#6C8480]/60 font-semibold py-2 bg-transparent border border-border/40 rounded-lg justify-center">
                    <CheckCircle className="h-4 w-4 text-status-normal shrink-0" />
                    <span>No warning alerts today.</span>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {warningList.map((alert) => {
                      const initials = getInitials(alert.patientName);

                      return (
                        <motion.div
                          key={alert.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{ duration: 0.25 }}
                          className={cn(
                            "bg-transparent border border-border/80 border-l-4 border-l-[#F57C00] rounded-xl p-4 flex flex-col gap-3 hover:border-[#1A5C3A]/50 transition-colors",
                            alert.isRead ? "opacity-50" : ""
                          )}
                        >
                          {/* Row 1: Identity & Time */}
                          <div className="flex items-start justify-between w-full">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 shrink-0 border border-border bg-transparent">
                                <AvatarFallback className="text-xs font-bold text-[#404E3B] bg-transparent">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-[#404E3B]">
                                  {alert.patientName}
                                </span>
                                <span className="text-xs font-semibold text-[#6C8480]">
                                  {alert.title}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-mono text-[#6C8480]">
                                {getTimeSince(alert.createdAt)}
                              </span>
                              <span className="text-[10px] font-mono uppercase text-[#6C8480] border border-border/80 px-2 py-0.5 rounded">
                                {alert.category}
                              </span>
                            </div>
                          </div>

                          {/* Row 2: Description */}
                          <div className="text-xs text-[#404E3B] font-mono leading-relaxed pl-11">
                            <strong>{alert.patientName}:</strong> {alert.description.replace(alert.patientName + ":", "").trim()}
                          </div>

                          {/* Row 3: Action Zone */}
                          <div className="flex items-center justify-between w-full pt-1 pl-11">
                            <span className="text-[11px] text-[#6C8480] font-mono italic">
                              {getRecommendedAction(alert.category)}
                            </span>

                            <div className="flex items-center gap-3 select-none">
                              <button
                                onClick={() => setSelectedPatientId(alert.patientId)}
                                className="text-xs font-bold text-[#1A5C3A] hover:underline"
                              >
                                Profile &rarr;
                              </button>
                              {!alert.isRead && (
                                <button
                                  onClick={() => handleAcknowledge(alert.id)}
                                  className="h-7 px-3 rounded border border-[#F57C00] text-[#F57C00] hover:bg-[#F57C00] hover:text-white text-xs font-bold transition-all"
                                >
                                  Acknowledge
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            </div>
          )}

          {/* Informational Alerts Zone */}
          {(severityFilter === "all" || severityFilter === "info") && (
            <div
              id="info-zone"
              className={cn(
                "space-y-3 transition-all duration-300 rounded-xl mt-7",
                highlightedZone === "info-zone" ? "ring-2 ring-status-info/30 p-2 bg-status-info/[0.01]" : ""
              )}
            >
              {/* Heading row */}
              <div className="flex items-center justify-between text-[11px] font-bold select-none">
                <div className="flex items-center gap-2 text-[#1565C0] tracking-wider uppercase font-heading">
                  <span className="h-2 w-2 rounded-full bg-[#1565C0] shrink-0" />
                  <span>Informational &mdash; For your awareness</span>
                </div>
                <span className="text-[#1565C0] font-medium">{infoList.length} unresolved</span>
              </div>
              <div className="h-[1px] bg-[#1565C0]/25 w-full mb-3" />

              {/* Card List */}
              <div className="space-y-3">
                {infoList.length === 0 ? (
                  <div className="text-xs font-normal text-[#6C8480] py-2 flex items-center gap-1.5 select-none">
                    &bull; 0 informational alerts &mdash; nothing requires attention.
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {infoList.map((alert) => {
                      const initials = getInitials(alert.patientName);

                      return (
                        <motion.div
                          key={alert.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{ duration: 0.25 }}
                          className={cn(
                            "bg-transparent border border-border/80 border-l-4 border-l-[#1565C0] rounded-xl p-4 flex flex-col gap-3 hover:border-[#1A5C3A]/50 transition-colors",
                            alert.isRead ? "opacity-50" : ""
                          )}
                        >
                          {/* Row 1: Identity & Time */}
                          <div className="flex items-start justify-between w-full">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 shrink-0 border border-border bg-transparent">
                                <AvatarFallback className="text-xs font-bold text-[#404E3B] bg-transparent">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-[#404E3B]">
                                  {alert.patientName}
                                </span>
                                <span className="text-xs font-semibold text-[#6C8480]">
                                  {alert.title}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-mono text-[#6C8480]">
                                {getTimeSince(alert.createdAt)}
                              </span>
                              <span className="text-[10px] font-mono uppercase text-[#6C8480] border border-border/80 px-2 py-0.5 rounded">
                                {alert.category}
                              </span>
                            </div>
                          </div>

                          {/* Row 2: Description */}
                          <div className="text-xs text-[#404E3B] font-mono leading-relaxed pl-11">
                            {alert.patientId !== "pat-system" ? (
                              <><strong>{alert.patientName}:</strong> {alert.description.replace(alert.patientName + ":", "").trim()}</>
                            ) : (
                              <>{alert.description}</>
                            )}
                          </div>

                          {/* Row 3: Action Zone */}
                          <div className="flex items-center justify-between w-full pt-1 pl-11">
                            <span />

                            {/* Action Buttons */}
                            <div className="flex items-center gap-4 select-none">
                              {alert.patientId !== "pat-system" && (
                                <button
                                  onClick={() => setSelectedPatientId(alert.patientId)}
                                  className="text-xs font-bold text-[#1A5C3A] hover:underline"
                                >
                                  Profile &rarr;
                                </button>
                              )}
                              <button
                                onClick={() => handleDismiss(alert.id)}
                                className="text-xs font-bold text-[#E53935] hover:underline"
                              >
                                Dismiss
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Slide-in contextual Patient Detail Drawer */}
      <PatientDetailDrawer
        patientId={selectedPatientId}
        onClose={() => setSelectedPatientId(null)}
      />

    </div>
  );
}
