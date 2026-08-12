import { PatientLink } from "./doctor";

export type RiskLevel = "mild" | "moderate" | "severe" | "unknown";

export interface Patient {
  id: string;
  email: string;
  name: string;
  dateOfBirth?: string;
  emergencyContact?: string;
  cognitiveLevel: number; // 0–100 scale derived from game sessions
  caregiverId?: string;
  avatarUrl?: string | null;
  avatar_url?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PatientWithLink extends Patient {
  linkStatus: PatientLink["status"];
  linkedAt: string;
  riskLevel: RiskLevel;
  lastActivity?: string;
  delta?: number;
  sparkline?: (number | null)[];
  triggerRationale?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

export interface CognitiveProfile {
  patientId: string;
  baselineScore: number;
  currentScore: number;
  improvementPercent: number;
  declinePercent: number;
  lastAssessedAt: string;
}
