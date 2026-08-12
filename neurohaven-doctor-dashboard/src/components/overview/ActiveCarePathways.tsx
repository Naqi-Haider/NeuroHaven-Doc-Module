"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronRight, TrendingUp, TrendingDown, MessageSquare } from "lucide-react";
import { Alert } from "@/types/alert";
import { PatientWithLink } from "@/types/patient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ActiveCarePathwaysProps {
  patients: PatientWithLink[];
  alerts: Alert[];
}

type FilterType = "all" | "needs-review" | "improving";

// Static details for initial patients to enrich the clinical details
const patientDetailsMap: Record<string, {
  triggerRationale: string;
  delta: number;
  sparkline: (number | null)[];
}> = {
  "pat-1": {
    triggerRationale: "Low mood sentiment index",
    delta: 2,
    sparkline: [70, 71, null, 72, 70, null, 72],
  },
  "pat-2": {
    triggerRationale: "Score dropped 24% in 3 sessions",
    delta: -7,
    sparkline: [52, 50, 48, null, 46, 45, 45],
  },
  "pat-3": {
    triggerRationale: "Stable baseline maintained",
    delta: 4,
    sparkline: [84, 85, 86, 86, 88, 88, 88],
  },
  "pat-4": {
    triggerRationale: "Missed 2 sessions this week",
    delta: -3,
    sparkline: [64, null, 63, 62, null, 61, 61],
  },
};

export default function ActiveCarePathways({ patients, alerts }: ActiveCarePathwaysProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const getPatientDetails = (patient: PatientWithLink) => {
    const defaultDetails = patientDetailsMap[patient.id] || {
      triggerRationale: "Baseline assessment active",
      delta: 0,
      sparkline: [70, 71, 72, 70, 71, 73, 72],
    };
    const spark = (patient.sparkline && patient.sparkline.some(v => v !== null))
      ? patient.sparkline
      : defaultDetails.sparkline;

    return {
      triggerRationale: patient.triggerRationale || defaultDetails.triggerRationale,
      delta: patient.delta !== undefined && patient.delta !== 0 ? patient.delta : defaultDetails.delta,
      sparkline: spark,
    };
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "severe":
        return {
          text: "text-status-critical",
          bg: "bg-status-critical/10",
          border: "border-status-critical/20",
          progress: "bg-status-critical",
        };
      case "moderate":
        return {
          text: "text-status-warning",
          bg: "bg-status-warning/10",
          border: "border-status-warning/20",
          progress: "bg-status-warning",
        };
      case "mild":
        return {
          text: "text-status-normal",
          bg: "bg-status-normal/10",
          border: "border-status-normal/20",
          progress: "bg-status-normal",
        };
      default:
        return {
          text: "text-jade-teal",
          bg: "bg-jade-light/35",
          border: "border-border/60",
          progress: "bg-jade-primary",
        };
    };
  };

  // Helper to filter patients
  const filteredPatients = patients.filter((patient) => {
    const details = getPatientDetails(patient);
    const hasActiveAlert = alerts.some((a) => a.patientId === patient.id && !a.isRead);

    if (activeFilter === "needs-review") {
      // Needs review: moderate/severe risk or negative delta or active alert
      return (
        patient.riskLevel === "severe" ||
        patient.riskLevel === "moderate" ||
        details.delta < 0 ||
        hasActiveAlert
      );
    }
    if (activeFilter === "improving") {
      // Improving: positive delta and not severe risk
      return details.delta > 0 && patient.riskLevel !== "severe";
    }
    return true; // all
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const daysOfWeek = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div className="w-full bg-white border border-border/60 rounded-[16px] shadow-sm select-none">
      {/* Header section */}
      <div className="p-5 border-b border-border/60">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-jade-dark tracking-tight">
            Active Care Pathways
          </h3>
          <Link href="/patients" passHref>
            <span className="text-xs font-semibold text-jade-primary hover:text-jade-dark flex items-center gap-0.5 cursor-pointer hover:underline transition-all">
              See all patients <ChevronRight className="h-3 w-3" />
            </span>
          </Link>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 mt-4">
          {(["all", "needs-review", "improving"] as FilterType[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide border transition-all duration-200",
                activeFilter === filter
                  ? "bg-jade-primary text-white border-transparent shadow-sm"
                  : "bg-jade-light/10 text-jade-teal border-border/60 hover:bg-jade-light/20 hover:text-jade-dark"
              )}
            >
              {filter === "all" && "All Connected"}
              {filter === "needs-review" && "Needs Review"}
              {filter === "improving" && "Improving"}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table Rows */}
      <div className="divide-y divide-border/50">
        {filteredPatients.length === 0 ? (
          <div className="p-8 text-center text-jade-teal text-xs font-medium">
            No patients match the selected filter.
          </div>
        ) : (
          filteredPatients.map((patient) => {
            const details = getPatientDetails(patient);
            const colors = getRiskColor(patient.riskLevel);
            const initials = getInitials(patient.name);
            const hasActiveAlert = alerts.some((a) => a.patientId === patient.id && !a.isRead);

            return (
              <div
                key={patient.id}
                className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 md:p-5 gap-4 md:gap-0 hover:bg-[#F4F7F2]/20 transition-all duration-200"
              >
                {/* Column 1 — Identity (20%) */}
                <div className="w-full md:w-[20%] flex items-center gap-3">
                  <Avatar className="h-9 w-9 border border-jade-muted bg-white shrink-0 shadow-sm overflow-hidden">
                    {(patient.avatar_url || patient.avatarUrl) ? (
                      <AvatarImage src={patient.avatar_url || patient.avatarUrl || undefined} alt={patient.name} />
                    ) : null}
                    <AvatarFallback className="text-xs font-bold text-white bg-[#1A5C3A]">
                      {initials[0] || "P"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-jade-dark block truncate">
                      {patient.name}
                    </span>
                    <span className="text-[11px] text-jade-teal block truncate font-medium">
                      {patient.lastActivity || "No recent activity"}
                    </span>
                  </div>
                </div>

                {/* Column 2 — Risk (15%) */}
                <div className="w-full md:w-[18%] flex flex-col items-start gap-1">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                      colors.text,
                      colors.bg,
                      colors.border
                    )}
                  >
                    {patient.riskLevel} Risk
                  </span>
                  <span className="text-[11px] text-jade-teal font-medium leading-tight">
                    {details.triggerRationale}
                  </span>
                </div>

                {/* Column 3 — Cognitive Score (22%) */}
                <div className="w-full md:w-[22%] flex flex-col justify-center">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-[19px] font-bold text-jade-dark">
                      {patient.cognitiveLevel}
                    </span>
                    <span className="text-[10px] text-jade-teal/60 font-semibold uppercase">
                      Score
                    </span>
                    {details.delta !== 0 && (
                      <span
                        className={cn(
                          "flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                          details.delta > 0
                            ? "text-status-normal bg-status-normal/10"
                            : "text-status-critical bg-status-critical/10"
                        )}
                      >
                        {details.delta > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {details.delta > 0 ? `+${details.delta}` : details.delta}
                      </span>
                    )}
                  </div>
                  {/* Thin 120px progress bar */}
                  <div className="w-[120px] h-1.5 bg-[#F4F7F2] rounded-full overflow-hidden mt-1.5">
                    <div
                      className={cn("h-full rounded-full transition-all duration-300", colors.progress)}
                      style={{ width: `${patient.cognitiveLevel}%` }}
                    />
                  </div>
                </div>

                {/* Column 4 — Session Activity Sparkline (25%) */}
                <div className="w-full md:w-[25%] flex flex-col items-start justify-center">
                  <span className="text-[10px] font-bold text-jade-teal/50 tracking-wider uppercase mb-1.5 block">
                    7-Day Activity Grid
                  </span>
                  <div className="flex items-end gap-1.5 h-8">
                    {details.sparkline.map((val: number | null, idx: number) => {
                      const isMissed = val === null;
                      return (
                        <div
                          key={idx}
                          className="flex flex-col items-center group relative cursor-pointer"
                        >
                          {/* Sparkline column/bar/square */}
                          {isMissed ? (
                            <div className="w-2.5 h-2.5 rounded-sm border border-dashed border-border/70 bg-transparent mb-1" />
                          ) : (
                            <div
                              className={cn(
                                "w-2.5 rounded-sm transition-all duration-300 hover:brightness-95 mb-0.5",
                                val! >= 75
                                  ? "bg-status-normal"
                                  : val! >= 60
                                  ? "bg-status-warning"
                                  : "bg-status-critical"
                              )}
                              style={{ height: `${Math.max(10, (val! / 100) * 28)}px` }}
                            />
                          )}
                          {/* Day initial */}
                          <span className="text-[9px] font-bold text-jade-teal/60 scale-90 leading-none block">
                            {daysOfWeek[idx]}
                          </span>
                          
                          {/* Minimal Tooltip */}
                          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-jade-dark text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-10">
                            {isMissed ? "Missed Session" : `Score: ${val}`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Column 5 — Actions (15%) */}
                <div className="w-full md:w-[15%] flex items-center justify-end gap-2 shrink-0">
                  {hasActiveAlert && (
                    <span title="Active alert requires clinical intervention">
                      <AlertTriangle className="h-4 w-4 text-status-critical animate-pulse" />
                    </span>
                  )}
                  <Button
                    asChild
                    variant="outline"
                    size="xs"
                    className="border-jade-primary/20 text-jade-primary hover:bg-jade-primary hover:text-white font-bold h-7 px-2.5 text-[11px] rounded-btn shadow-sm transition-all duration-200 flex items-center gap-1"
                  >
                    <Link href={`/patients/${patient.id}/chat`}>
                      <MessageSquare className="h-3.5 w-3.5" />
                      Chat
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="xs"
                    className="border-jade-primary/20 text-jade-primary hover:bg-jade-primary hover:text-white font-bold h-7 px-3 text-[11px] rounded-btn shadow-sm transition-all duration-200"
                  >
                    <Link href={`/patients/${patient.id}`}>
                      Profile
                    </Link>
                  </Button>
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
