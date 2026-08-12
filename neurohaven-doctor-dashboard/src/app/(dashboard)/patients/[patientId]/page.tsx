"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Clock,
  Activity,
  Brain,
  MessageSquare,
  Loader2,
  Phone,
  User,
  UserMinus,
  Flame
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import axios from "axios";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCognitiveStatus } from "@/lib/cognitiveStatus";

interface PatientDetailsPageProps {
  params: {
    patientId: string;
  };
}

// Simplified mock fallbacks matching database schema
const patientDatabase: Record<string, { patient: any; exercise_scores: any[] }> = {
  "pat-1": {
    patient: {
      id: "pat-1",
      user_id: "user-arthur",
      full_name: "Arthur Pendelton",
      email: "arthur.p@care.com",
      date_of_birth: "1958-03-12",
      cognitive_level: 72,
      created_at: "2026-03-12T10:00:00Z",
      emergency_contact: "+1 (555) 438-9210",
      subscription_type: "Clinical Premium Plan"
    },
    exercise_scores: [
      { game_name: "memory_match", score: 72, moves: 12, level: 5, created_at: "2026-07-12T15:20:00Z", duration_seconds: 492, mood: "happy", completed: true },
      { game_name: "abstract_reasoning", score: 73, moves: 14, level: 6, created_at: "2026-07-11T14:45:00Z", duration_seconds: 545, mood: "neutral", completed: true },
      { game_name: "word_select", score: 70, moves: 10, level: 5, created_at: "2026-07-10T16:00:00Z", duration_seconds: 520, mood: "tired", completed: true }
    ]
  },
  "pat-2": {
    patient: {
      id: "pat-2",
      user_id: "user-eleanor",
      full_name: "Eleanor Vance",
      email: "eleanor.v@care.com",
      date_of_birth: "1955-06-10",
      cognitive_level: 45,
      created_at: "2026-02-18T11:00:00Z",
      emergency_contact: "+1 (555) 832-7211",
      subscription_type: "Clinical Premium Plan"
    },
    exercise_scores: [
      { game_name: "memory_match", score: 45, moves: 22, level: 3, created_at: "2026-07-12T09:12:00Z", duration_seconds: 612, mood: "tired", completed: true },
      { game_name: "sequence_recall", score: 43, moves: 19, level: 2, created_at: "2026-07-11T10:30:00Z", duration_seconds: 642, mood: "anxious", completed: true },
      { game_name: "word_select", score: 48, moves: 18, level: 3, created_at: "2026-07-10T09:45:00Z", duration_seconds: 590, mood: "sad", completed: true }
    ]
  },
  "pat-3": {
    patient: {
      id: "pat-3",
      user_id: "user-gordon",
      full_name: "Gordon Cole",
      email: "gordon.c@care.com",
      date_of_birth: "1960-08-15",
      cognitive_level: 88,
      created_at: "2026-05-01T09:30:00Z",
      emergency_contact: "+1 (555) 732-8410",
      subscription_type: "Clinical Premium Plan"
    },
    exercise_scores: [
      { game_name: "abstract_reasoning", score: 88, moves: 8, level: 7, created_at: "2026-07-13T07:15:00Z", duration_seconds: 372, mood: "happy", completed: true },
      { game_name: "memory_match", score: 88, moves: 9, level: 7, created_at: "2026-07-12T08:30:00Z", duration_seconds: 410, mood: "happy", completed: true },
      { game_name: "word_select", score: 86, moves: 7, level: 6, created_at: "2026-07-10T09:15:00Z", duration_seconds: 350, mood: "neutral", completed: true }
    ]
  },
  "pat-4": {
    patient: {
      id: "pat-4",
      user_id: "user-marianne",
      full_name: "Marianne Faith",
      email: "marianne.f@care.com",
      date_of_birth: "1958-01-10",
      cognitive_level: 61,
      created_at: "2026-04-10T14:20:00Z",
      emergency_contact: "+1 (555) 308-4521",
      subscription_type: "Institutional Standard Plan"
    },
    exercise_scores: [
      { game_name: "word_select", score: 61, moves: 12, level: 4, created_at: "2026-07-12T16:00:00Z", duration_seconds: 480, mood: "neutral", completed: true },
      { game_name: "memory_match", score: 63, moves: 14, level: 5, created_at: "2026-07-11T15:20:00Z", duration_seconds: 510, mood: "tired", completed: true }
    ]
  }
};

export default function PatientDetailsPage({ params }: PatientDetailsPageProps) {
  const { patientId } = params;
  const router = useRouter();
  
  const [patient, setPatient] = useState<any>(null);
  const [scores, setScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getAge = (dobString?: string) => {
    if (!dobString) return "22";
    try {
      const dob = new Date(dobString);
      const diffMs = Date.now() - dob.getTime();
      const ageDate = new Date(diffMs);
      const computedAge = Math.abs(ageDate.getUTCFullYear() - 1970);
      return computedAge > 0 && computedAge < 120 ? computedAge : 22;
    } catch {
      return 22;
    }
  };

  useEffect(() => {
    async function loadPatientDetails() {
      const fallbackData = patientDatabase[patientId] || {
        patient: {
          id: patientId,
          full_name: "Arthur Pendelton",
          email: "arthur.p@care.com",
          date_of_birth: "1958-03-12",
          cognitive_level: 72,
          created_at: new Date().toISOString()
        },
        exercise_scores: [
          { game_name: "memory_match", score: 72, moves: 12, level: 5, created_at: "2026-07-12T15:20:00Z", duration_seconds: 492, mood: "happy", completed: true }
        ]
      };

      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("nh-token") : null;
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
        const config = {
          headers: {
            Authorization: token ? `Bearer ${token}` : "Bearer mock-dev-token",
            "ngrok-skip-browser-warning": "true"
          },
        };

        // 1. Fetch patient profile and session scores details
        try {
          const profileRes = await axios.get(`${apiBaseUrl}/api/patients/${patientId}`, config);
          if (profileRes.data?.success && profileRes.data.data && profileRes.data.data.patient) {
            const rawData = profileRes.data.data;
            setPatient(rawData.patient);
            setScores(rawData.exercise_scores || []);
          } else {
            setPatient(fallbackData.patient);
            setScores(fallbackData.exercise_scores);
          }
        } catch {
          setPatient(fallbackData.patient);
          setScores(fallbackData.exercise_scores);
        }
      } catch (err) {
        console.error("Global patient details loader error", err);
        setPatient(fallbackData.patient);
        setScores(fallbackData.exercise_scores);
      } finally {
        setLoading(false);
      }
    }

    loadPatientDetails();
  }, [patientId]);

  const getInitials = (name: string) => {
    if (!name) return "P";
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getRiskLevel = (cognitiveLevel: number) => {
    if (cognitiveLevel >= 75) return "mild";
    if (cognitiveLevel >= 55) return "moderate";
    return "severe";
  };

  if (loading) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 text-jade-primary animate-spin" />
        <span className="text-xs text-jade-teal font-medium">Synchronizing patient metrics...</span>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center text-center p-6 select-none">
        <span className="text-sm font-bold text-jade-dark">Patient not found</span>
      </div>
    );
  }

  // --- Dynamic Dashboard Calculations ---
  const statusInfo = getCognitiveStatus(patient.cognitive_level || 50);
  const calculatedRisk = statusInfo.status === "Healthy" ? "mild" : (statusInfo.status === "Moderate" ? "moderate" : "severe");
  const totalSessions = scores.length;
  
  const completedSessionsCount = scores.filter(s => s.completed === true).length;
  const completionRate = scores.length > 0 ? Math.round((completedSessionsCount / scores.length) * 100) : 0;

  // Past 7 Days activity calculations
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const scoresThisWeek = scores.filter(s => new Date(s.created_at || s.createdAt) >= sevenDaysAgo);
  const minutesThisWeek = Math.round(scoresThisWeek.reduce((acc, s) => acc + (s.duration_seconds || 0), 0) / 60);

  // Group activity minutes for past 7 days (Training Volume Bar Chart)
  const weeklyActivityTime = (() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const activity = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      const dateStr = d.toDateString();
      
      const daySessions = scores.filter(s => new Date(s.created_at || s.createdAt).toDateString() === dateStr);
      const mins = Math.round(daySessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0) / 60);
      activity.push({ day: dayName, minutes: mins });
    }
    return activity;
  })();

  // 7-day chronological progression line chart (Sun to Sat matching bar chart)
  const weeklyTrend = (() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      const dateStr = d.toDateString();
      
      const daySessions = scores.filter(s => new Date(s.created_at || s.createdAt).toDateString() === dateStr && s.score !== null && s.score !== undefined);
      const avgScore = daySessions.length > 0 
        ? Math.round(daySessions.reduce((acc, s) => acc + (s.score || 0), 0) / daySessions.length)
        : null;
      trend.push({ day: dayName, score: avgScore });
    }
    return trend;
  })();

  // Streak calculations (Consecutive days of game sessions)
  const streak = (() => {
    const playDates = Array.from(new Set(
      scores.map(s => format(new Date(s.created_at || s.createdAt), "yyyy-MM-dd"))
    )).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (playDates.length === 0) return 0;

    let currentStreak = 0;
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = format(yesterday, "yyyy-MM-dd");

    if (playDates[0] !== todayStr && playDates[0] !== yesterdayStr) {
      return 0;
    }

    let cursor = new Date(playDates[0]);
    for (let i = 0; i < playDates.length; i++) {
      const dateStr = format(cursor, "yyyy-MM-dd");
      if (playDates[i] === dateStr) {
        currentStreak++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
    return currentStreak;
  })();

  // Longest date gap without sessions
  const missedDayGap = (() => {
    const playDates = Array.from(new Set(
      scores.map(s => format(new Date(s.created_at || s.createdAt), "yyyy-MM-dd"))
    )).map(d => new Date(d).getTime())
      .sort((a, b) => a - b);

    if (playDates.length < 2) return "0 days";

    let maxGapMs = 0;
    for (let i = 1; i < playDates.length; i++) {
      const gap = playDates[i] - playDates[i-1];
      if (gap > maxGapMs) {
        maxGapMs = gap;
      }
    }
    const gapDays = Math.floor(maxGapMs / (24 * 60 * 60 * 1000));
    return gapDays > 0 ? `${gapDays} days` : "0 days";
  })();

  // Mapping domain weakness
  const domainWeakness = (() => {
    const domainMapping: Record<string, string> = {
      abstract_reasoning: "Executive Function",
      digit_span: "Working Memory",
      focus_flow: "Attention",
      memory_match: "Visual Memory",
      paired_associate: "Associative Memory",
      sequence_recall: "Working Memory",
      sound_sequence: "Auditory Attention",
      statement_completion: "Language & Logic",
      train_of_thought: "Cognitive Flexibility",
      word_select: "Attention"
    };

    const domainScores: Record<string, { total: number; count: number }> = {};
    scores.forEach(s => {
      const domain = domainMapping[s.game_name] || "General Cognitive";
      if (s.score !== null && s.score !== undefined) {
        if (!domainScores[domain]) {
          domainScores[domain] = { total: 0, count: 0 };
        }
        domainScores[domain].total += s.score;
        domainScores[domain].count += 1;
      }
    });

    let weakness = "Stable Base";
    let minAvg = 101;
    Object.keys(domainScores).forEach(domain => {
      const avg = domainScores[domain].total / domainScores[domain].count;
      if (avg < minAvg) {
        minAvg = avg;
        weakness = `${domain} (${Math.round(avg)}%)`;
      }
    });

    return weakness;
  })();

  // Dynamic calculated delta from first and latest sessions
  const delta = (() => {
    const completed = scores.filter(s => s.completed === true || s.completed === 1);
    if (completed.length >= 2) {
      const sorted = [...completed].sort((a, b) => new Date(b.created_at || b.createdAt).getTime() - new Date(a.created_at || a.createdAt).getTime());
      return sorted[0].score - sorted[sorted.length - 1].score;
    }
    return -18; // fallback requested
  })();

  return (
    <div className="space-y-6">
      
      {/* 1. Page Header Zone: Full Width, sits directly on background */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 select-none pb-2">
        <div className="space-y-2">
          <Link href="/patients" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#6C8480] hover:text-jade-primary transition-all">
            ← Back to Patient Directory
          </Link>
          
          <div className="flex items-center gap-4">
            <Avatar className="h-[44px] w-[44px] border border-jade-muted bg-white shrink-0 shadow-sm overflow-hidden">
              {(patient?.avatar_url || patient?.avatarUrl) ? (
                <AvatarImage src={patient.avatar_url || patient.avatarUrl} alt={patient.full_name} />
              ) : null}
              <AvatarFallback className="text-sm font-bold text-jade-primary bg-jade-light/30">
                {getInitials(patient.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-heading text-[22px] font-bold tracking-tight text-jade-dark select-all">
                  {patient.full_name}
                </h2>
                <div className="flex items-center gap-1.5 ml-1">
                  {(statusInfo.status === "Unhealthy" || statusInfo.status === "At Risk") && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E53935] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E53935]"></span>
                    </span>
                  )}
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-none",
                    statusInfo.colorClass
                  )}>
                    {statusInfo.label}
                  </span>
                </div>
              </div>
              <p className="text-[12px] text-[#6C8480] font-medium mt-0.5">
                Joined {format(new Date(patient.created_at || new Date()), "MMMM d, yyyy")} · Age {getAge(patient.date_of_birth)} · DOB {patient.date_of_birth}
              </p>
            </div>
          </div>
        </div>

        {/* Right Header elements: Connection pill and outline Chat button */}
        <div className="flex items-center gap-3 shrink-0 self-start md:self-auto select-none pt-6 md:pt-4">
          <span className="px-2.5 py-0.5 bg-status-normal/10 text-status-normal font-semibold rounded-full text-[12px]">
            Connection: Linked
          </span>
          <Button asChild variant="outline" className="border-jade-primary/20 text-jade-primary hover:bg-jade-primary hover:text-white font-bold h-9 px-4 text-xs rounded-btn shadow-sm transition-all duration-300 flex items-center gap-1.5 ml-3">
            <Link href={`/patients/${patientId}/chat`}>
              <MessageSquare className="h-4 w-4" />
              Chat
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              if (window.confirm(`Are you sure you want to unlink ${patient.full_name || "this patient"} from your workstation?`)) {
                try {
                  const token = localStorage.getItem("nh-token");
                  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
                  try {
                    await axios.delete(`${apiBaseUrl}/api/patients/${patientId}/link`, {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                  } catch {
                    await axios.post(`${apiBaseUrl}/api/patients/${patientId}/unlink`, {}, {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                  }
                  toast.success(`Unlinked ${patient.full_name || "Patient"} successfully.`);
                  router.push("/patients");
                } catch {
                  toast.error("Failed to unlink patient.");
                }
              }
            }}
            className="border-red-200 text-red-600 hover:bg-red-600 hover:text-white font-bold h-9 px-3 text-xs rounded-btn shadow-sm transition-all duration-300 flex items-center gap-1.5"
            title="Unlink Patient"
          >
            <UserMinus className="h-4 w-4" />
            Unlink
          </Button>
        </div>
      </div>

      {/* 2. Primary Metrics Strip: unequal width zones separated by vertical dividers */}
      <Card className="border border-border/60 bg-white shadow-sm rounded-[14px] overflow-hidden select-none">
        <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border/60">
          {/* Zone 1 — Overall Cognitive Score (45%) */}
          <div className="w-full md:w-[45%] p-5 flex flex-col justify-between">
            <div>
              <span className={cn(
                "font-mono text-[36px] font-bold leading-none", 
                statusInfo.status === "Healthy" ? "text-status-normal" : 
                statusInfo.status === "Moderate" ? "text-status-warning" : 
                statusInfo.status === "At Risk" ? "text-[#EA580C]" : 
                "text-status-critical"
              )}>
                {patient.cognitive_level || 50}%
              </span>
              <span className="text-[12px] uppercase font-bold text-[#6C8480] block mt-1">Overall Cognitive Score</span>
            </div>
            
            <div className="mt-3">
              <div className="w-[200px] h-1.5 bg-[#F4F7F2] rounded-full overflow-hidden">
                <div 
                  className={cn("h-full rounded-full transition-all duration-300", 
                    statusInfo.status === "Healthy" ? "bg-status-normal" : 
                    statusInfo.status === "Moderate" ? "bg-status-warning" : 
                    statusInfo.status === "At Risk" ? "bg-[#EA580C]" : 
                    "bg-status-critical"
                  )}
                  style={{ width: `${patient.cognitive_level || 50}%` }}
                />
              </div>
              <span className={cn("text-[12px] font-semibold mt-2 block", 
                delta < 0 ? "text-[#E53935]" : "text-status-normal"
              )}>
                {delta < 0 ? `↓ ${Math.abs(delta)}pts from baseline` : `↑ ${delta}pts from baseline`}
              </span>
            </div>
          </div>

          {/* Zone 2 — Session Adherence (30%) */}
          <div className="w-full md:w-[30%] p-5 flex flex-col justify-center">
            <span className="text-[24px] font-bold text-status-normal">{completionRate}%</span>
            <span className="text-[12px] uppercase font-bold text-[#6C8480] block mt-0.5">Completion Rate</span>
            <span className="text-[12px] text-[#6C8480] font-medium mt-1.5 block">Completed vs. missed plays</span>
          </div>

          {/* Zone 3 — Activity summary (25%) */}
          <div className="w-full md:w-[25%] p-5 flex flex-col justify-center gap-2">
            <span className="text-[16px] font-semibold text-jade-dark block">{totalSessions} Sessions total</span>
            <div className="flex items-center gap-1.5 text-jade-dark font-semibold">
              <Flame className="h-4.5 w-4.5 text-amber-500 fill-amber-500 shrink-0" />
              <span className="text-[16px]">{streak} day streak</span>
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Main Content Area — Two-Column Layout (28% left sticky panel, 72% right content) */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-10 items-start">
        
        {/* Left Column (28% width, sticky reference panel) */}
        <div className="lg:col-span-3 lg:sticky lg:top-6 space-y-4">
          {/* Card 1 — Patient Record */}
          <div className="space-y-2">
            <h3 className="font-heading text-xs font-bold text-jade-teal uppercase tracking-wider select-none">
              Patient Record
            </h3>
            <Card className="border border-border/60 bg-white shadow-sm rounded-[12px] overflow-hidden">
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="flex justify-between items-center py-0.5 border-b border-border/30 pb-2">
                  <span className="text-jade-teal font-semibold">Email:</span>
                  <span className="text-jade-dark font-bold truncate ml-2 max-w-[150px]">{patient.email}</span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-border/30 pb-2">
                  <span className="text-jade-teal font-semibold">DOB:</span>
                  <span className="text-jade-dark font-bold">{patient.date_of_birth}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-jade-teal font-semibold">Connection:</span>
                  <Badge className="bg-status-normal/15 text-status-normal hover:bg-status-normal/20 border-status-normal/20 border font-bold text-[9px] uppercase px-2 py-0.5 select-none rounded-full">
                    Linked
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Card 2 — Quick Actions */}
          <div className="space-y-2">
            <h3 className="font-heading text-xs font-bold text-jade-teal uppercase tracking-wider select-none">
              Quick Actions
            </h3>
            <Card className="border border-border/60 bg-white shadow-sm rounded-[12px] overflow-hidden">
              <CardContent className="p-4 flex flex-col gap-2.5 text-xs select-none">
                <Link href="/reports" className="text-jade-primary hover:text-jade-dark font-bold hover:underline transition-all">
                  Generate report →
                </Link>
                <Link href="/settings" className="text-jade-primary hover:text-jade-dark font-bold hover:underline transition-all">
                  Configure alerts →
                </Link>
                <Link href="/alerts" className="text-jade-primary hover:text-jade-dark font-bold hover:underline transition-all">
                  View alert history →
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column (72% width, primary clinical content charts & metrics) */}
        <div className="lg:col-span-7 space-y-6">
          <Tabs defaultValue="weekly" className="flex flex-col gap-6">
            <TabsList className="bg-transparent border-b border-border/60 p-0 rounded-none flex w-full gap-6 justify-start select-none">
              <TabsTrigger
                value="weekly"
                className="text-xs font-semibold pb-3 rounded-none bg-transparent transition-all duration-200 text-jade-teal data-[state=active]:text-jade-primary data-[state=active]:border-b-[2.5px] data-[state=active]:border-[#1A5C3A] hover:text-jade-dark"
              >
                Weekly Progress
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="text-xs font-semibold pb-3 rounded-none bg-transparent transition-all duration-200 text-jade-teal data-[state=active]:text-jade-primary data-[state=active]:border-b-[2.5px] data-[state=active]:border-[#1A5C3A] hover:text-jade-dark"
              >
                Longitudinal History
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Weekly Progress — Stacked Vertical Layout */}
            <TabsContent value="weekly" className="focus-visible:outline-none mt-0 space-y-6">
              {/* Top Section: Side-by-Side Charts (58% and 42%) */}
              <div className="flex flex-col md:flex-row gap-6 items-stretch">
                {/* Score Progression Line Chart (58%) */}
                <div className="w-full md:w-[58%] space-y-2">
                  <div className="space-y-0.5 select-none">
                    <h4 className="font-heading text-xs font-bold text-jade-dark uppercase tracking-wider">
                      Cognitive Score Progression
                    </h4>
                    <p className="text-[11px] font-medium text-jade-teal">
                      Daily scores relative to baseline
                    </p>
                  </div>
                  <Card className="border border-border/60 bg-white shadow-sm rounded-[14px]">
                    <CardContent className="pb-4 pl-0 pr-4 pt-5">
                      <div className="h-[240px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={weeklyTrend} margin={{ left: -15, right: 10, top: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6E6E6" />
                            <XAxis dataKey="day" stroke="#6C8480" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis domain={[0, 100]} stroke="#6C8480" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{ stroke: "#BAC8B1", strokeWidth: 1 }} />
                            <ReferenceLine 
                              y={65} 
                              stroke="#E53935" 
                              strokeDasharray="3 3" 
                              label={{ 
                                value: 'Personal Baseline (65%)', 
                                fill: '#E53935', 
                                fontSize: 9, 
                                position: 'insideRight',
                                offset: 10
                              }} 
                            />
                            <Line 
                              type="monotone" 
                              dataKey="score" 
                              stroke="#1B8A5A" 
                              strokeWidth={2.5} 
                              activeDot={{ r: 6 }} 
                              dot={{ r: 3 }} 
                              connectNulls={true}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Training Volume Bar Chart (42%) */}
                <div className="w-full md:w-[42%] space-y-2">
                  <div className="space-y-0.5 select-none">
                    <h4 className="font-heading text-xs font-bold text-jade-dark uppercase tracking-wider">
                      Cognitive Training Volume
                    </h4>
                    <p className="text-[11px] font-medium text-jade-teal">
                      Daily session active durations (minutes)
                    </p>
                  </div>
                  <Card className="border border-border/60 bg-white shadow-sm rounded-[14px]">
                    <CardContent className="pb-4 pl-0 pr-4 pt-5">
                      <div className="h-[240px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={weeklyActivityTime} margin={{ left: -15, right: 10, top: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6E6E6" />
                            <XAxis dataKey="day" stroke="#6C8480" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#6C8480" fontSize={10} tickLine={false} axisLine={false} unit="m" />
                            <Tooltip cursor={{ fill: "#BAC8B1", opacity: 0.15 }} />
                            <Bar dataKey="minutes" fill="#1B8A5A" radius={[4, 4, 0, 0]} barSize={20} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Bottom Section: Cognitive Performance Metrics card (2x2 grid of small metric tiles) */}
              <div className="space-y-3 mt-6">
                <h4 className="font-heading text-xs font-bold text-jade-dark uppercase tracking-wider select-none">
                  Cognitive Performance Metrics
                </h4>
                <div className="grid gap-4 grid-cols-2">
                  {/* Tile 1: Play Streak */}
                  <div className="p-4 rounded-[12px] bg-emerald-50/70 text-emerald-800 border border-emerald-200/40 flex flex-col justify-between min-h-[90px]">
                    <span className="text-[11px] uppercase font-bold text-[#6C8480] block">Daily Play Streak</span>
                    <span className="text-[18px] font-semibold block mt-1">{streak} Consecutive Days</span>
                  </div>
                  
                  {/* Tile 2: Active Volume */}
                  <div className="p-4 rounded-[12px] bg-white text-jade-dark border border-border/50 flex flex-col justify-between min-h-[90px]">
                    <span className="text-[11px] uppercase font-bold text-[#6C8480] block">Weekly Active Volume</span>
                    <span className="text-[18px] font-semibold block mt-1">{minutesThisWeek} Minutes</span>
                  </div>

                  {/* Tile 3: Domain Weakness */}
                  <div className="p-4 rounded-[12px] bg-amber-50/70 text-amber-800 border border-amber-200/40 flex flex-col justify-between min-h-[90px]">
                    <span className="text-[11px] uppercase font-bold text-[#6C8480] block">Cognitive Domain Weakness</span>
                    <span className="text-[18px] font-semibold block mt-1">{domainWeakness}</span>
                  </div>

                  {/* Tile 4: Inactivity Gap */}
                  <div className="p-4 rounded-[12px] bg-emerald-50/70 text-emerald-800 border border-emerald-200/40 flex flex-col justify-between min-h-[90px]">
                    <span className="text-[11px] uppercase font-bold text-[#6C8480] block">Longest Inactivity Gap</span>
                    <span className="text-[18px] font-semibold block mt-1">{missedDayGap}</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tab 2: Longitudinal History */}
            <TabsContent value="history" className="focus-visible:outline-none mt-0 space-y-4">
              <div className="space-y-1 select-none">
                <h3 className="font-heading text-base font-bold text-jade-dark">
                  Chronological Activity Ledger
                </h3>
                <p className="text-xs font-medium text-jade-teal">
                  Comprehensive log of all game play sessions since subscription date
                </p>
              </div>
              <Card className="border border-border/60 bg-white shadow-sm rounded-[14px] overflow-hidden">
                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-[#F4F7F2]/40">
                      <TableRow className="border-b border-border/60 hover:bg-transparent">
                        <TableHead className="text-jade-dark font-semibold font-heading h-10 text-xs pl-4">Date</TableHead>
                        <TableHead className="text-jade-dark font-semibold font-heading h-10 text-xs">Game</TableHead>
                        <TableHead className="text-jade-dark font-semibold font-heading h-10 text-xs">Diff</TableHead>
                        <TableHead className="text-jade-dark font-semibold font-heading h-10 text-xs">Score</TableHead>
                        <TableHead className="text-jade-dark font-semibold font-heading h-10 text-xs text-right pr-4">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scores.map((session: any, idx: number) => (
                        <TableRow key={session.id || idx} className="border-b border-border/50 hover:bg-[#F4F7F2]/10 transition-colors">
                          <TableCell className="py-3 pl-4 font-semibold text-[11px] text-jade-dark font-mono">
                            {format(new Date(session.created_at || session.createdAt), "MM-dd HH:mm")}
                          </TableCell>
                          <TableCell className="py-3 text-[11px] text-jade-teal font-medium capitalize">
                            {(session.game_name || "Memory Match").replace("_", " ")}
                          </TableCell>
                          <TableCell className="py-3 text-[11px] text-jade-dark font-semibold font-mono">
                            L{session.level || 0}
                          </TableCell>
                          <TableCell className="py-3 text-[11px] text-jade-dark font-bold font-mono">
                            {session.score !== null && session.score !== undefined ? `${session.score}%` : "--"}
                          </TableCell>
                          <TableCell className="py-3 text-right pr-4 select-none">
                            <Badge className={cn(
                                "text-[8px] font-bold uppercase rounded-full border px-1.5 py-0.5 select-none",
                                session.completed
                                  ? "bg-status-normal/15 text-status-normal border-status-normal/20"
                                  : "bg-status-critical/15 text-status-critical border-status-critical/20"
                              )}>
                              {session.completed ? "completed" : "missed"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

      </div>

    </div>
  );
}
