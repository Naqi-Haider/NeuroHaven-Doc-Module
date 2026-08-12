import React from "react";
import { Badge } from "@/components/ui/badge";
import { getCognitiveStatus } from "@/lib/cognitiveStatus";

interface RiskBadgeProps {
  score?: number | null;
  risk?: string;
}

export default function RiskBadge({ score, risk }: RiskBadgeProps) {
  let finalScore: number | null = null;
  
  if (score !== undefined) {
    finalScore = score;
  } else if (risk) {
    // Map string risk back to default values for compatibility
    if (risk === "mild" || risk === "healthy") finalScore = 80;
    else if (risk === "moderate") finalScore = 60;
    else if (risk === "severe" || risk === "at_risk" || risk === "at-risk") finalScore = 40;
    else if (risk === "unhealthy") finalScore = 15;
  }

  const { label, colorClass } = getCognitiveStatus(finalScore);

  return (
    <Badge className={`${colorClass} font-medium px-2 py-0.5 rounded-full text-xs select-none border shadow-none bg-transparent hover:bg-transparent`}>
      {label}
    </Badge>
  );
}
