"use client";

import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";
import { Brain, Smile, Activity, CalendarDays, Info } from "lucide-react";
import { PatientWithLink } from "@/types/patient";
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface TemporalContextProps {
  patients: PatientWithLink[];
}

import { useEffect } from "react";

interface TrendPoint {
  date: string;
  Cohort: number;
  [key: string]: any;
  hasAlert: boolean;
  alertInfo?: string;
}

export default function TemporalContext({ patients }: TemporalContextProps) {
  const [viewMode, setViewMode] = useState<"cohort" | "individual">("cohort");
  const [selectedIndividual, setSelectedIndividual] = useState<string>("");

  // Set initial selected individual dynamically
  useEffect(() => {
    if (patients.length > 0 && !selectedIndividual) {
      setSelectedIndividual(patients[0].name);
    }
  }, [patients, selectedIndividual]);

  // Compute 7-day trend telemetry dynamically based on patient weekly scores
  const trendData = (() => {
    const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return daysOfWeek.map((day, dayIdx) => {
      const point: TrendPoint = { date: day, Cohort: 60, hasAlert: false };
      let sum = 0;
      let count = 0;
      
      patients.forEach(p => {
        // Use sparkline average if exists, else default cognitiveLevel
        const score = (p.sparkline && p.sparkline[dayIdx] !== null) 
          ? p.sparkline[dayIdx] 
          : p.cognitiveLevel;
        
        point[p.name] = score;
        sum += score;
        count++;

        // Mark telemetry alerts dynamically if score is critically low or dropping
        if (p.delta && p.delta < -10 && dayIdx === 6) {
          point.hasAlert = true;
          point.alertInfo = `${p.name}: Cognitive decline alert (${p.delta} pts)`;
        }
      });
      
      point.Cohort = count > 0 ? Math.round(sum / count) : 60;
      return point;
    });
  })();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Recharts Custom Tooltip Types
  interface ChartTooltipPayloadItem {
    name: string;
    value: number;
    color: string;
    payload: TrendPoint;
  }

  interface CustomChartTooltipProps {
    active?: boolean;
    payload?: ChartTooltipPayloadItem[];
    label?: string;
  }

  const CustomChartTooltip = ({ active, payload, label }: CustomChartTooltipProps) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-md border border-border/80 p-3 rounded-card shadow-lg text-xs font-medium max-w-[220px]">
          <p className="font-heading font-semibold text-jade-dark mb-1">{label}</p>
          <div className="space-y-1">
            {payload.map((item) => (
              <div key={item.name} className="flex items-center justify-between gap-4">
                <span className="text-jade-teal flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  {item.name}
                </span>
                <span className="font-mono font-bold text-jade-dark">{item.value}%</span>
              </div>
            ))}
            {point.hasAlert && (
              <div className="mt-2 pt-1.5 border-t border-status-critical/10 text-status-critical flex items-start gap-1">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span className="text-[10px] leading-tight font-bold">{point.alertInfo}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  interface RenderAlertDotProps {
    cx?: number;
    cy?: number;
    payload?: TrendPoint;
  }

  // Custom Dot component to render alerts
  const RenderAlertDot = (props: RenderAlertDotProps) => {
    const { cx, cy, payload } = props;
    if (payload && payload.hasAlert) {
      return (
        <g>
          <circle cx={cx} cy={cy} r={7} className="fill-status-critical/30 animate-pulse" />
          <circle cx={cx} cy={cy} r={4.5} className="fill-status-critical stroke-white stroke-[1.5]" />
        </g>
      );
    }
    return null;
  };

  // Adherence Heatmap Days data (M, T, W, T, F, S, S) computed dynamically
  const connectedCount = patients.length;
  
  // Count how many patients completed exercises today (Sunday is day 6, Saturday is day 5, etc.)
  const todayDayIdx = new Date().getDay();
  // adjust to Mon=0, Tue=1, ..., Sun=6
  const adjustedTodayIdx = todayDayIdx === 0 ? 6 : todayDayIdx - 1;
  
  const activeCount = patients.filter(p => p.sparkline && p.sparkline[adjustedTodayIdx] !== null).length;

  const weeklyAdherence = (() => {
    const daysOfWeek = ["M", "T", "W", "T", "F", "S", "S"];
    const total = connectedCount || 1;
    
    return daysOfWeek.map((day, dayIdx) => {
      let completedCount = 0;
      patients.forEach(p => {
        if (p.sparkline && p.sparkline[dayIdx] !== null) {
          completedCount++;
        }
      });
      
      const rate = completedCount / total;
      let colorClass = "bg-jade-primary/5"; // default empty
      if (rate > 0.75) colorClass = "bg-[#1B8A5A]";
      else if (rate > 0.5) colorClass = "bg-[#1B8A5A]/85";
      else if (rate > 0.25) colorClass = "bg-[#1B8A5A]/55";
      else if (rate > 0) colorClass = "bg-[#1B8A5A]/25";
      
      return {
        day,
        completed: completedCount,
        total,
        color: colorClass
      };
    });
  })();

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full items-stretch select-none">
      
      {/* Left Panel (60%): Cohort Cognitive Trend */}
      <div className="w-full lg:w-[60%] bg-white border border-border/60 rounded-[16px] p-5 shadow-sm flex flex-col justify-between select-none">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-jade-dark tracking-tight">
                Cognitive Trend Telemetry
              </h3>
              <p className="text-[11px] font-medium text-jade-teal mt-0.5">
                Cohort longitudinal variance relative to stable reference band
              </p>
            </div>
            
            {/* View Mode Tabs */}
            <div className="flex bg-[#F4F7F2] p-1 rounded-lg shrink-0 self-start sm:self-auto">
              <button
                onClick={() => setViewMode("cohort")}
                className={cn(
                  "px-3 py-1 rounded-md text-[11px] font-bold transition-all",
                  viewMode === "cohort"
                    ? "bg-white text-jade-dark shadow-sm"
                    : "text-jade-teal hover:text-jade-dark"
                )}
              >
                Cohort Average
              </button>
              <button
                onClick={() => setViewMode("individual")}
                className={cn(
                  "px-3 py-1 rounded-md text-[11px] font-bold transition-all",
                  viewMode === "individual"
                    ? "bg-white text-jade-dark shadow-sm"
                    : "text-jade-teal hover:text-jade-dark"
                )}
              >
                Individual
              </button>
            </div>
          </div>

          {/* Individual Patient Selector (only visible if individual mode is selected) */}
          {viewMode === "individual" && (
            <div className="flex flex-wrap gap-1.5 mb-4 animate-fadeIn">
              {patients.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedIndividual(p.name)}
                  className={cn(
                    "px-2.5 py-1 rounded text-[10px] font-bold border transition-all",
                    selectedIndividual === p.name
                      ? "bg-jade-light/60 text-jade-dark border-jade-primary/30"
                      : "bg-white text-jade-teal border-border/60 hover:bg-jade-light/20"
                  )}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recharts Chart */}
        <div className="h-[230px] w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="cohortColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7B9669" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#7B9669" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="individualColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1B8A5A" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#1B8A5A" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6E6E6" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                stroke="#6C8480"
                fontSize={10}
                tickMargin={8}
              />
              <YAxis
                domain={[30, 100]}
                tickLine={false}
                axisLine={false}
                stroke="#6C8480"
                fontSize={10}
                tickMargin={8}
                tickCount={5}
              />
              <Tooltip content={<CustomChartTooltip />} cursor={{ stroke: "#BAC8B1", strokeWidth: 1 }} />
              
              {/* Reference Area representing expected stable band (60-75) */}
              <ReferenceArea
                y1={60}
                y2={75}
                fill="#7B9669"
                fillOpacity={0.06}
                strokeWidth={0}
              />

              {viewMode === "cohort" ? (
                <>
                  <Area
                    name="Cohort Average"
                    type="monotone"
                    dataKey="Cohort"
                    stroke="#7B9669"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#cohortColor)"
                    dot={<RenderAlertDot />}
                    activeDot={{ r: 5, strokeWidth: 0, fill: "#7B9669" }}
                  />
                </>
              ) : (
                <Area
                  name={selectedIndividual}
                  type="monotone"
                  dataKey={selectedIndividual}
                  stroke="#1B8A5A"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#individualColor)"
                  dot={<RenderAlertDot />}
                  activeDot={{ r: 5, strokeWidth: 0, fill: "#1B8A5A" }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend / Info footer */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50 text-[10px] text-jade-teal font-medium">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-2 bg-[#7B9669]/10 border border-[#7B9669]/20 rounded-sm" />
            <span>Expected stable range (60-75)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-status-critical" />
            <span>Telemetry Alert Correlated</span>
          </div>
        </div>

      </div>

      {/* Right Panel (40%): Activity Digest */}
      <div className="w-full lg:w-[40%] flex flex-col gap-4">
        
        {/* Card A: Today's Sessions progress */}
        <div className="bg-white border border-border/60 rounded-[16px] p-4 flex-1 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-jade-dark flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-jade-primary shrink-0" />
              Active Telemetry (Today)
            </span>
            <span className="text-[11px] font-bold text-jade-primary font-mono bg-jade-light/30 px-2 py-0.5 rounded">
              {activeCount}/{connectedCount} Active
            </span>
          </div>
          
          <div className="my-3">
            <div className="flex items-center justify-between text-[11px] font-medium text-jade-teal mb-1">
              <span>Rounds completion rate</span>
              <span>{connectedCount > 0 ? Math.round((activeCount / connectedCount) * 100) : 0}%</span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2 bg-[#F4F7F2] rounded-full overflow-hidden">
              <div
                className="h-full bg-jade-primary rounded-full transition-all duration-300"
                style={{ width: `${connectedCount > 0 ? (activeCount / connectedCount) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
            <span className="text-[10px] font-bold text-jade-teal/60 uppercase tracking-wider">
              Active sessions cohort
            </span>
            <AvatarGroup className="select-none">
              {patients.slice(0, activeCount).map((p) => (
                <Avatar key={p.id} className="h-6 w-6 border-2 border-white">
                  <AvatarFallback className="text-[9px] font-extrabold text-jade-primary bg-jade-light/40">
                    {getInitials(p.name)}
                  </AvatarFallback>
                </Avatar>
              ))}
            </AvatarGroup>
          </div>
        </div>

        {/* Card B: Adherence Heatmap */}
        <div className="bg-white border border-border/60 rounded-[16px] p-4 flex-1 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-jade-dark flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-jade-primary shrink-0" />
              Weekly Adherence Grid
            </span>
            <span className="text-[10px] font-bold text-jade-teal/60">
              Last 7 Days
            </span>
          </div>

          {/* Inline Squares Heatmap */}
          <div className="grid grid-cols-7 gap-2.5 my-3.5">
            {weeklyAdherence.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center gap-1 group relative cursor-pointer"
              >
                <div
                  className={cn(
                    "w-full aspect-square rounded-md shadow-sm transition-all duration-200 hover:scale-105",
                    item.color
                  )}
                />
                <span className="text-[10px] font-bold text-jade-teal/70">
                  {item.day}
                </span>

                {/* Heatmap Tooltip */}
                <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-jade-dark text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-10">
                  {item.completed} of {item.total} Patients completed
                </div>
              </div>
            ))}
          </div>

          <div className="text-[10px] font-bold text-jade-teal/50 text-right leading-none uppercase">
            Less Adherent •••• More Adherent
          </div>
        </div>

      </div>

    </div>
  );
}
