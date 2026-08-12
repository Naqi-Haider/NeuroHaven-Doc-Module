export type GameType = "memory_match" | "word_recall" | "pattern_recognition";

export interface GameSession {
  id: string;
  userId: string;
  gameType: GameType;
  difficulty: number; // 1–10
  score: number;
  durationSeconds: number;
  completedAt: string;
  synced: boolean;
}

export interface CognitiveTrend {
  date: string;
  averageScore: number;
  sessionsCount: number;
  averageDifficulty: number;
}
