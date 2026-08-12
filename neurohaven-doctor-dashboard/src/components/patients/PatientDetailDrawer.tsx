"use client";

import React from "react";
import Link from "next/link";
import { X, ChevronRight, TrendingUp, TrendingDown, Clock, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface PatientDetailDrawerProps {
  patientId: string | null;
  onClose: () => void;
}

const patientMetrics: Record<string, {
  name: string;
  avatarColor: string;
  cognitiveScore: number;
  delta: number;
  lastSessions: number[];
  reminders: string[];
  severity?: "critical" | "warning" | "info" | "normal";
}> = {
  "pat-1": {
    name: "Arthur Pendelton",
    avatarColor: "bg-jade-light/30 text-jade-primary",
    cognitiveScore: 72,
    delta: 2,
    lastSessions: [70, 71, 72],
    reminders: [
      "Spatial Memory Training — scheduled at 15:00",
      "Hydration compliance check — every 4 hours",
    ],
    severity: "warning",
  },
  "pat-2": {
    name: "Eleanor Vance",
    avatarColor: "bg-status-critical/10 text-status-critical",
    cognitiveScore: 45,
    delta: -7,
    lastSessions: [50, 48, 45],
    reminders: [
      "Donepezil Medication — Morning dose (missed by 3h)",
      "Reaction Time Exercise — scheduled at 11:00",
      "Caregiver wellness check-in — scheduled at 17:30",
    ],
    severity: "critical",
  },
  "pat-3": {
    name: "Gordon Cole",
    avatarColor: "bg-status-normal/10 text-status-normal",
    cognitiveScore: 88,
    delta: 4,
    lastSessions: [85, 86, 88],
    reminders: [
      "Executive Function Quiz — scheduled at 09:00",
      "Acoustic reading session — scheduled at 14:00",
    ],
    severity: "critical",
  },
  "pat-4": {
    name: "Marianne Faith",
    avatarColor: "bg-status-warning/10 text-status-warning",
    cognitiveScore: 61,
    delta: -3,
    lastSessions: [64, 62, 61],
    reminders: [
      "Number Recall Session — scheduled at 16:00",
      "Acoustic analyzer speech logs — scheduled at 18:00",
    ],
    severity: "info",
  },
};

export default function PatientDetailDrawer({ patientId, onClose }: PatientDetailDrawerProps) {
  const isOpen = patientId !== null;
  const metrics = patientId ? patientMetrics[patientId] : null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <AnimatePresence>
      {isOpen && metrics && (
        <>
          {/* Backdrop Overlay (nearly transparent so doctor sees alert list borders) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[0.5px] cursor-pointer"
          />

          {/* Drawer container */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-[400px] bg-white border-l border-border/80 shadow-2xl flex flex-col p-6 select-none"
          >
            {/* Header Content (Sticky Top) */}
            <div className="flex items-center justify-between pb-4 border-b border-border/40 shrink-0">
              <span className="text-[10px] font-bold text-jade-primary tracking-wider uppercase flex items-center gap-1">
                <Shield className="h-3.5 w-3.5" />
                Clinical Detail Triage
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 text-jade-teal hover:text-jade-dark hover:bg-jade-light/40 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto py-5 space-y-6 pr-1 -mr-1">
              {/* Patient Identity Profile */}
              <div className="flex items-center gap-4 border-b border-border/40 pb-5">
                <Avatar className="h-14 w-14 border border-jade-muted bg-white shrink-0 shadow-sm">
                  <AvatarFallback className={cn("text-base font-bold", metrics.avatarColor)}>
                    {getInitials(metrics.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-jade-dark truncate">
                    {metrics.name}
                  </h3>
                  <span className="text-xs text-jade-teal block mt-0.5 font-medium">
                    Patient Reference ID: <span className="font-mono">{patientId}</span>
                  </span>
                </div>
              </div>

              {/* Cognitive Score and Delta */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-jade-teal/60 uppercase tracking-wider">
                  Current Telemetry Indicators
                </h4>
                <div className="bg-[#F4F7F2]/40 border border-border/40 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-jade-teal block uppercase">
                      Cognitive Score
                    </span>
                    <span className="font-mono text-3xl font-extrabold text-jade-dark mt-1 block">
                      {metrics.cognitiveScore}%
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-jade-teal block uppercase mb-1">
                      7-day Change
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full border",
                        metrics.delta > 0
                          ? "text-status-normal bg-status-normal/10 border-status-normal/20"
                          : "text-status-critical bg-status-critical/10 border-status-critical/20"
                      )}
                    >
                      {metrics.delta > 0 ? (
                        <>
                          <TrendingUp className="h-3 w-3" />
                          +{metrics.delta}%
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-3.5 w-3.5" />
                          {metrics.delta}%
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Last 3 session sparkline */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-jade-teal/60 uppercase tracking-wider">
                  Last 3 Sessions Progress
                </h4>
                <div className="flex items-end justify-around bg-[#F4F7F2]/20 border border-border/40 rounded-xl p-4 h-28 pt-6">
                  {metrics.lastSessions.map((score, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 max-w-[60px]">
                      <span className="text-[10px] font-extrabold text-jade-dark font-mono">{score}%</span>
                      <div className="w-6 bg-[#F4F7F2] rounded-t-sm h-[40px] relative overflow-hidden">
                        <div
                          className={cn(
                            "absolute bottom-0 left-0 right-0 rounded-t-sm transition-all duration-500",
                            score >= 75
                              ? "bg-status-normal"
                              : score >= 60
                              ? "bg-status-warning"
                              : "bg-status-critical"
                          )}
                          style={{ height: `${(score / 100) * 40}px` }}
                        />
                      </div>
                      <span className="text-[9px] font-bold text-jade-teal/50 uppercase mt-0.5">
                        Session {i + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Reminders */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-jade-teal/60 uppercase tracking-wider">
                  Reminders Scheduled Today
                </h4>
                <div className="space-y-2">
                  {metrics.reminders.map((reminder, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 bg-white border border-border/60 p-3 rounded-lg text-xs"
                    >
                      <Clock className="h-4 w-4 text-jade-primary shrink-0 mt-0.5" />
                      <span className="font-medium text-jade-dark leading-normal">
                        {reminder}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Go to full profile CTA (Sticky Bottom) */}
            <div className="pt-4 border-t border-border/40 shrink-0">
              <Link href={`/patients/${patientId}`} passHref>
                <Button
                  className={cn(
                    "w-full text-white rounded-btn h-10 font-bold transition-all duration-300 flex items-center justify-center gap-1.5 shadow-sm",
                    metrics.severity === "critical"
                      ? "bg-status-critical hover:bg-red-700"
                      : metrics.severity === "warning"
                      ? "bg-status-warning hover:bg-orange-600"
                      : "bg-jade-primary hover:bg-jade-dark"
                  )}
                >
                  Go to full profile <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
