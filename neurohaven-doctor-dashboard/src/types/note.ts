export interface ExtractedEntity {
  type: "PERSON" | "DATE" | "MEDICATION" | "APPOINTMENT" | "LOCATION";
  value: string;
  confidence: number;
}

export interface DailyNote {
  id: string;
  userId: string;
  content: string;
  voicePath?: string;
  extractedEntities: ExtractedEntity[];
  createdAt: string;
  synced: boolean;
}
