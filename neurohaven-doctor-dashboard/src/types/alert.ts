export type AlertSeverity = "critical" | "warning" | "info";
export type AlertCategory = "medical" | "cognitive" | "emotional" | "system";

export interface Alert {
  id: string;
  patientId: string;
  patientName: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  description: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}
