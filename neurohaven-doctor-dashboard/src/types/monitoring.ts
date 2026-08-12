export type LiveStatus = "active" | "idle" | "distressed" | "offline";

export interface LivePatient {
  patientId: string;
  patientName: string;
  status: LiveStatus;
  currentActivity?: "game" | "companion_chat" | "notes" | "reminders";
  lastSeen: string;
  currentMood?: number; // sentiment score -1.0 to 1.0
}
