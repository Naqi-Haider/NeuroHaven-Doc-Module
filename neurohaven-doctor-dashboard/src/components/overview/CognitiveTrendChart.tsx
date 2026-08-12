import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { PatientWithLink } from "@/types/patient";
import { subDays, format } from "date-fns";

interface CognitiveTrendChartProps {
  patients: PatientWithLink[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number | string;
    color?: string;
  }>;
  label?: string;
}

// Custom Glassmorphic Tooltip Component for Recharts
const CustomTooltip = ({
  active,
  payload,
  label,
}: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-border p-3 rounded-card shadow-lg animate-fadeIn text-xs">
        <p className="font-heading font-semibold text-jade-dark mb-1.5">{label}</p>
        <div className="space-y-1">
          {payload.map((item) => (
            <p key={item.name} className="font-body text-jade-teal flex items-center gap-2">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="font-medium text-jade-dark">{item.name}:</span>
              <span className="font-mono font-semibold text-right min-w-[28px]">{item.value}%</span>
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function CognitiveTrendChart({ patients }: CognitiveTrendChartProps) {
  const [viewMode, setViewMode] = useState<"cohort" | "individual">("cohort");

  // Generate 30 days of clean fluctuating telemetry matching clinical profiles
  const trendData = useMemo(() => {
    const data = [];
    const baseScores: Record<string, number> = {
      "pat-1": 73, // Arthur
      "pat-2": 52, // Eleanor (Severe - declining trend)
      "pat-3": 86, // Gordon (Mild - high stable)
      "pat-4": 62, // Marianne (Moderate - moderate stable)
    };

    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, "MMM dd");
      const scores: Record<string, number> = {};
      let total = 0;
      let count = 0;

      patients.forEach((p) => {
        const base = baseScores[p.id] || p.cognitiveLevel;
        let trendVal = base;

        if (p.id === "pat-2") {
          // Linear decline
          trendVal -= (29 - i) * 0.28;
        } else if (p.id === "pat-3") {
          // Gradual improvement
          trendVal += (29 - i) * 0.12;
        }

        const fluctuation = Math.sin(i + (p.id === "pat-1" ? 1.5 : p.id === "pat-2" ? 3 : 5)) * 2.5;
        const finalScore = Math.min(100, Math.max(0, Math.round(trendVal + fluctuation)));

        scores[p.name] = finalScore;
        total += finalScore;
        count++;
      });

      data.push({
        date: dateStr,
        "Cohort Average": count > 0 ? Math.round(total / count) : 0,
        ...scores,
      });
    }
    return data;
  }, [patients]);

  const getColorForRisk = (risk: string) => {
    switch (risk) {
      case "severe":
        return "#E53935"; // critical red
      case "moderate":
        return "#F57C00"; // warning amber
      case "mild":
        return "#1B8A5A"; // normal green
      default:
        return "#6C8480"; // jade-teal
    }
  };

  return (
    <Card className="border border-border/60 bg-card shadow-sm transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-4 gap-4">
        <div>
          <CardTitle className="font-heading text-section-h font-semibold text-jade-dark">
            Cognitive Trends
          </CardTitle>
          <CardDescription className="text-caption font-body text-jade-teal">
            Aggregated longitudinal cognitive score tracking (last 30 days)
          </CardDescription>
        </div>
        <div className="shrink-0 select-none">
          <Select
            value={viewMode}
            onValueChange={(val: "cohort" | "individual") => setViewMode(val)}
          >
            <SelectTrigger className="w-[170px] h-9 border border-border bg-white text-caption font-semibold text-jade-dark focus:ring-jade-primary/50">
              <SelectValue placeholder="View cohort" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-border">
              <SelectItem value="cohort" className="text-caption text-jade-dark font-medium focus:bg-jade-light/30">
                Cohort Average
              </SelectItem>
              <SelectItem value="individual" className="text-caption text-jade-dark font-medium focus:bg-jade-light/30">
                Individual Breakdown
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pl-0 pr-4 pb-4">
        <div className="h-[300px] w-full">
          {patients.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-xs text-jade-teal">
              No patient data available to plot trends
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
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
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  stroke="#6C8480"
                  fontSize={10}
                  tickMargin={8}
                  tickCount={6}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#BAC8B1", strokeWidth: 1 }} />
                
                {viewMode === "cohort" ? (
                  <Line
                    name="Cohort Average"
                    type="monotone"
                    dataKey="Cohort Average"
                    stroke="#7B9669"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 0, fill: "#7B9669" }}
                  />
                ) : (
                  patients.map((p) => (
                    <Line
                      key={p.id}
                      name={p.name}
                      type="monotone"
                      dataKey={p.name}
                      stroke={getColorForRisk(p.riskLevel)}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                  ))
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
