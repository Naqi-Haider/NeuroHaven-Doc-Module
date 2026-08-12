import { CognitiveTrend } from "./game";

export interface CognitiveReport {
  id: string;
  patientId: string;
  patientName: string;
  period: { from: string; to: string };
  metrics: {
    averageScore: number;
    totalSessions: number;
    averageDifficulty: number;
    reminderAdherence: number;
    aiInteractionCount: number;
  };
  trends: CognitiveTrend[];
  generatedAt: string;
}
