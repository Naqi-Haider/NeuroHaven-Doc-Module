import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Alert } from "@/types/alert";
import { PatientWithLink } from "@/types/patient";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SituationStripProps {
  alerts: Alert[];
  patients: PatientWithLink[];
}

export default function SituationStrip({ alerts, patients }: SituationStripProps) {
  // Filter active (unread) critical alerts
  const criticalAlerts = alerts
    .filter((a) => a.severity === "critical" && !a.isRead)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 2);

  // Today's snapshot numbers (mocked realistically based on cohort size)
  const totalPatients = patients.length;
  const sessionsToday = totalPatients > 0 ? Math.round(totalPatients * 0.75) : 0;
  const activeNow = totalPatients > 0 ? 1 : 0;

  // Next recommended action logic
  const getSuggestedAction = () => {
    if (criticalAlerts.length > 0) {
      const topAlert = criticalAlerts[0];
      return {
        text: `${topAlert.patientName}'s cognitive score dropped — review profile.`,
        patientId: topAlert.patientId,
      };
    }
    // Default suggestion if stable
    return {
      text: "All connected patients are stable. Perform weekly cohort telemetry check.",
      patientId: patients[0]?.id || "all",
    };
  };

  const suggestion = getSuggestedAction();

  return (
    <div className="w-full bg-white border border-border/60 rounded-[14px] shadow-sm overflow-hidden select-none">
      <div className="flex flex-col lg:flex-row min-h-[140px] divide-y lg:divide-y-0 lg:divide-x divide-border/60">
        
        {/* Left Zone - Critical Alerts (40% width) */}
        <div className="w-full lg:w-[40%] p-4 bg-[#E53935]/[0.02] flex flex-col justify-between min-h-[140px]">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-status-critical tracking-wider uppercase block">
              Requires Attention
            </span>
            {criticalAlerts.length === 0 ? (
              <div className="flex items-center gap-2 py-3">
                <CheckCircle className="h-5 w-5 text-status-normal shrink-0" />
                <div>
                  <span className="text-body font-semibold text-jade-dark block leading-none">
                    All Systems Stable
                  </span>
                  <span className="text-caption text-jade-teal mt-1 block">
                    No critical telemetry anomalies reported.
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {criticalAlerts.map((alert) => {
                  let formattedTime = "";
                  try {
                    formattedTime = format(new Date(alert.createdAt), "HH:mm");
                  } catch {
                    formattedTime = "--:--";
                  }
                  return (
                    <div key={alert.id} className="relative flex items-center justify-between gap-4 pl-3.5 py-0.5">
                      {/* Red severity left indicator strip */}
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full bg-status-critical" />
                      <div className="min-w-0 flex-1">
                        <span className="text-caption font-bold text-jade-dark block truncate leading-tight">
                          {alert.title}
                        </span>
                        <span className="text-[11px] text-jade-teal truncate block mt-0.5">
                          {alert.patientName} · {alert.description}
                        </span>
                      </div>
                      <div className="flex flex-col items-end shrink-0 select-none">
                        <span className="text-[10px] text-jade-teal/70 font-mono">
                          {formattedTime}
                        </span>
                        <Link href={`/patients/${alert.patientId}`} passHref>
                          <span className="text-[11px] text-status-critical font-bold hover:underline cursor-pointer mt-1">
                            Review
                          </span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Middle Zone - Today's Snapshot (35% width) */}
        <div className="w-full lg:w-[35%] p-4 flex items-center justify-around min-h-[140px]">
          {/* Total connected */}
          <div className="flex flex-col items-center text-center">
            <span className="font-heading text-2xl font-extrabold text-jade-dark">
              {totalPatients}
            </span>
            <span className="text-[11px] font-medium text-jade-teal uppercase tracking-wider mt-1">
              Connected Cohort
            </span>
          </div>

          {/* Divider */}
          <div className="h-10 w-[0.5px] bg-border/60" />

          {/* Completed today */}
          <div className="flex flex-col items-center text-center">
            <span className="font-heading text-2xl font-extrabold text-jade-dark">
              {sessionsToday}
            </span>
            <span className="text-[11px] font-medium text-jade-teal uppercase tracking-wider mt-1">
              Sessions Today
            </span>
          </div>

          {/* Divider */}
          <div className="h-10 w-[0.5px] bg-border/60" />

          {/* Active now */}
          <div className="flex flex-col items-center text-center">
            <span className="font-heading text-2xl font-extrabold text-jade-dark flex items-center gap-1.5 leading-none">
              {activeNow}
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-normal opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-status-normal"></span>
              </span>
            </span>
            <span className="text-[11px] font-medium text-jade-teal uppercase tracking-wider mt-1">
              Active Now
            </span>
          </div>
        </div>

        {/* Right Zone - Next Recommended Action (25% width) */}
        <div className="w-full lg:w-[25%] p-4 bg-[#EAF3DE]/40 flex flex-col justify-between min-h-[140px]">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-jade-primary tracking-wider uppercase block">
              Suggested next step
            </span>
            <p className="text-xs font-semibold text-jade-dark leading-relaxed leading-snug">
              {suggestion.text}
            </p>
          </div>
          {suggestion.patientId === "all" ? (
            <Button
              asChild
              size="xs"
              variant="outline"
              className="w-full mt-2 h-7 font-bold text-[11px] text-jade-primary border-jade-primary/30 bg-white hover:bg-jade-primary hover:text-white hover:border-transparent transition-all duration-200"
            >
              <Link href="/patients">
                See Directory <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          ) : (
            <Button
              asChild
              size="xs"
              className="w-full mt-2 h-7 font-bold text-[11px] bg-jade-primary hover:bg-jade-dark text-white rounded-btn transition-all duration-200"
            >
              <Link href={`/patients/${suggestion.patientId}`}>
                Review Profile <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}
