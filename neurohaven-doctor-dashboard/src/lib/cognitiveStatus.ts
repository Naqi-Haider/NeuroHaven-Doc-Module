export interface CognitiveStatusInfo {
  status: "Healthy" | "Moderate" | "At Risk" | "Unhealthy" | "Unknown";
  label: string;
  colorClass: string;
  hexColor: string;
}

export const getCognitiveStatus = (score: number | null | undefined): CognitiveStatusInfo => {
  if (score === null || score === undefined || isNaN(score)) {
    return {
      status: "Unknown",
      label: "Not Assessed",
      colorClass: "text-jade-teal bg-jade-light/35 border-border/60",
      hexColor: "#6C8480"
    };
  }
  if (score >= 75) {
    return {
      status: "Healthy",
      label: "Cognitively Active",
      colorClass: "text-status-normal bg-status-normal/10 border-status-normal/20",
      hexColor: "#1B8A5A"
    };
  }
  if (score >= 50) {
    return {
      status: "Moderate",
      label: "Needs Attention",
      colorClass: "text-status-warning bg-status-warning/10 border-status-warning/20",
      hexColor: "#F57C00"
    };
  }
  if (score >= 25) {
    return {
      status: "At Risk",
      label: "Declining",
      colorClass: "text-[#EA580C] bg-[#EA580C]/10 border-[#EA580C]/20",
      hexColor: "#EA580C"
    };
  }
  return {
    status: "Unhealthy",
    label: "Significant Decline",
    colorClass: "text-status-critical bg-status-critical/10 border-status-critical/20",
    hexColor: "#E53935"
  };
};
