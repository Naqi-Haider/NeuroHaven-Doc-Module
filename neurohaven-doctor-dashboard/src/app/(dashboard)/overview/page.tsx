"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ShieldCheck, Bell, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { io } from "socket.io-client";
import { format } from "date-fns";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/shared/EmptyState";
import SituationStrip from "@/components/overview/SituationStrip";
import ActiveCarePathways from "@/components/overview/ActiveCarePathways";
import TemporalContext from "@/components/overview/TemporalContext";
import { PatientWithLink } from "@/types/patient";
import { Alert as AlertType } from "@/types/alert";
import { getCognitiveStatus } from "@/lib/cognitiveStatus";

// Initial mock patients matching schemas and requirements
const initialPatients: PatientWithLink[] = [
  {
    id: "pat-1",
    name: "Arthur Pendelton",
    email: "arthur.p@care.com",
    cognitiveLevel: 72,
    triggerRationale: "Low mood sentiment index",
    delta: 2,
    sparkline: [70, 71, 71, 72, 70, 73, 72],
    createdAt: "2026-03-12T10:00:00Z",
    updatedAt: "2026-06-21T08:30:00Z",
    linkStatus: "active",
    linkedAt: "2026-03-12T10:00:00Z",
    riskLevel: "moderate",
    lastActivity: "Memory Match Session — 2h ago",
  },
  {
    id: "pat-2",
    name: "Eleanor Vance",
    email: "eleanor.v@care.com",
    cognitiveLevel: 45,
    triggerRationale: "Score dropped 24% in 3 sessions",
    delta: -7,
    sparkline: [52, 50, 48, 48, 46, 45, 45],
    createdAt: "2026-02-18T11:00:00Z",
    updatedAt: "2026-06-21T09:12:00Z",
    linkStatus: "active",
    linkedAt: "2026-02-18T11:00:00Z",
    riskLevel: "severe",
    lastActivity: "Word Recall Session — 45m ago",
  },
  {
    id: "pat-3",
    name: "Gordon Cole",
    email: "gordon.c@care.com",
    cognitiveLevel: 88,
    triggerRationale: "Optimal cognitive stability",
    delta: 4,
    sparkline: [84, 85, 86, 86, 88, 88, 88],
    createdAt: "2026-05-01T09:30:00Z",
    updatedAt: "2026-06-21T07:15:00Z",
    linkStatus: "active",
    linkedAt: "2026-05-01T09:30:00Z",
    riskLevel: "mild",
    lastActivity: "Pattern Recognition Session — 4h ago",
  },
  {
    id: "pat-4",
    name: "Marianne Faith",
    email: "marianne.f@care.com",
    cognitiveLevel: 61,
    triggerRationale: "Missed 2 sessions this week",
    delta: -3,
    sparkline: [64, 63, 63, 62, 61, 61, 61],
    createdAt: "2026-04-10T14:20:00Z",
    updatedAt: "2026-06-20T16:45:00Z",
    linkStatus: "active",
    linkedAt: "2026-04-10T14:20:00Z",
    riskLevel: "moderate",
    lastActivity: "Word Recall Session — 1d ago",
  },
];

// Initial mock alerts center feed
const initialAlerts: AlertType[] = [
  {
    id: "al-1",
    patientId: "pat-2",
    patientName: "Eleanor Vance",
    severity: "critical",
    category: "medical",
    title: "Missed Medication Alert",
    description: "Eleanor missed morning Donepezil dosage. Window elapsed by 3 hours.",
    isRead: false,
    createdAt: "2026-06-22T08:30:00Z",
  },
  {
    id: "al-2",
    patientId: "pat-2",
    patientName: "Eleanor Vance",
    severity: "critical",
    category: "cognitive",
    title: "Severe Cognitive Score Decline",
    description: "Memory Recall score dropped by 24% over the last 3 consecutive sessions.",
    isRead: false,
    createdAt: "2026-06-22T09:15:00Z",
  },
  {
    id: "al-3",
    patientId: "pat-1",
    patientName: "Arthur Pendelton",
    severity: "warning",
    category: "emotional",
    title: "Low Sentiment Index Triggered",
    description: "End-of-session mood tracker indicates low valence or high arousal anxiety levels.",
    isRead: false,
    createdAt: "2026-06-21T18:00:00Z",
  },
];

export default function OverviewPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<PatientWithLink[]>([]);
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [mockZeroState, setMockZeroState] = useState(false);
  const [loading, setLoading] = useState(true);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

  useEffect(() => {
    async function fetchPatients() {
      try {
        const token = localStorage.getItem("nh-token") || "mock-dev-token";
        const res = await axios.get(`${apiBaseUrl}/api/patients`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const mapped = res.data.data.map((p: any) => {
            const scoreVal = p.cognitive_level !== undefined ? p.cognitive_level : (p.cognitiveLevel || p.overallScore || 50);
            const riskVal = p.risk_level || p.riskLevel || (scoreVal >= 75 ? "mild" : scoreVal >= 50 ? "moderate" : "severe");

            return {
              id: p.id,
              name: p.full_name || p.name || "Unknown Patient",
              email: p.email || "",
              cognitiveLevel: scoreVal,
              triggerRationale: p.triggerRationale || "Baseline assessment active",
              delta: p.delta !== undefined ? p.delta : 0,
              sparkline: Array.isArray(p.sparkline) && p.sparkline.some((v: any) => v !== null) ? p.sparkline : [70, 71, 72, 70, 71, 73, 72],
              createdAt: p.created_at || p.createdAt,
              updatedAt: p.updated_at || p.updatedAt || new Date().toISOString(),
              linkStatus: p.linkStatus || "active",
              linkedAt: p.linkedAt || p.linked_at || new Date().toISOString(),
              riskLevel: riskVal,
              lastActivity: p.lastActivity || "Memory session completed",
              dateOfBirth: p.date_of_birth || p.dateOfBirth || null,
              avatar_url: p.avatar_url || p.avatarUrl || null,
              avatarUrl: p.avatar_url || p.avatarUrl || null,
              isOnline: p.is_online === true,
              lastSeen: p.last_seen || undefined
            };
          });
          setPatients(mapped);

          // Fetch online statuses from backend
          try {
            const onlineRes = await axios.get(`${apiBaseUrl}/api/patients/online-status`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (onlineRes.data?.success && Array.isArray(onlineRes.data.data)) {
              const onlineIds: string[] = onlineRes.data.data;
              setPatients(prev => prev.map(p => ({
                ...p,
                isOnline: onlineIds.includes(p.id)
              })));
            }
          } catch (e) {
            console.warn("Failed to fetch online statuses:", e);
          }

          // Generate dynamic alerts based on patient telemetry data
          const generatedAlerts: AlertType[] = [];
          mapped.forEach((p: any) => {
            if (p.delta && p.delta < -10) {
              generatedAlerts.push({
                id: `al-decline-${p.id}`,
                patientId: p.id,
                patientName: p.name,
                severity: "critical",
                category: "cognitive",
                title: "Severe Cognitive Score Decline",
                description: `${p.name}'s memory performance index dropped by ${Math.abs(p.delta)} points.`,
                isRead: false,
                createdAt: new Date().toISOString()
              });
            }
            
            // Missed medication / exercise warning
            const hasNoActivity = p.lastActivity === "No recent activity" || p.lastActivity === "No sessions logged yet";
            if (hasNoActivity) {
              generatedAlerts.push({
                id: `al-missed-${p.id}`,
                patientId: p.id,
                patientName: p.name,
                severity: "critical",
                category: "medical",
                title: "Missed Medication Alert",
                description: `${p.name} missed morning Donepezil dosage or cognitive exercise today.`,
                isRead: false,
                createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString() // 3 hours ago
              });
            }
          });
          
          setAlerts(generatedAlerts.length > 0 ? generatedAlerts : initialAlerts);
        } else {
          setPatients(initialPatients);
          setAlerts(initialAlerts);
        }
      } catch (err) {
        console.error("Failed loading patients list, using showcase mock data:", err);
        setPatients(initialPatients);
        setAlerts(initialAlerts);
      } finally {
        setTimeout(() => setLoading(false), 800);
      }
    }
    fetchPatients();

    // Connect socket for real-time presence updates
    const socket = io(apiBaseUrl, { transports: ["websocket"] });
    socket.on("patient_online", ({ patientId }: { patientId: string }) => {
      setPatients(prev => prev.map(p =>
        p.id === patientId ? { ...p, isOnline: true } : p
      ));
    });
    socket.on("patient_offline", ({ patientId, lastSeen }: { patientId: string; lastSeen?: string }) => {
      setPatients(prev => prev.map(p =>
        p.id === patientId ? { ...p, isOnline: false, lastSeen: lastSeen || p.lastSeen } : p
      ));
    });
    socket.on("status_change", ({ role, online, userId }: { role: string; online: boolean; userId?: string }) => {
      if (role === "patient" && userId) {
        setPatients(prev => prev.map(p =>
          p.id === userId ? { ...p, isOnline: online } : p
        ));
      }
    });
    return () => { socket.disconnect(); };
  }, [apiBaseUrl]);

  const handleToggleMockMode = () => {
    setMockZeroState(!mockZeroState);
    if (!mockZeroState) {
      toast.info("Demonstrating Zero Connected Patients state.");
    } else {
      toast.success("Demonstrating Populated Workstation Dashboard.");
    }
  };

  const unreadAlertsCount = alerts.filter((a) => !a.isRead).length;

  const todayDateString = format(new Date(), "MMMM d, yyyy");

  // Dynamic doctor details
  const docName = user?.name ? `${user.name}` : "Sarah Jenkins, MD";
  const docSpecialization = user?.specialization || "Neurology & Dementia Care";
  const docLicense = user?.licenseNumber || "MD-98210";

  if (loading) {
    return (
      <div className="space-y-6 flex flex-col min-h-screen justify-between pb-4 select-none">
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-2">
              <div className="h-7 w-48 bg-jade-light/40 rounded animate-pulse" />
              <div className="h-4 w-72 bg-jade-light/40 rounded animate-pulse" />
            </div>
          </div>

          {/* Cards Skeleton Row */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="h-24 bg-white/60 border border-border/40 rounded-2xl animate-pulse" />
            <div className="h-24 bg-white/60 border border-border/40 rounded-2xl animate-pulse" />
            <div className="h-24 bg-white/60 border border-border/40 rounded-2xl animate-pulse" />
          </div>

          {/* Large Content Area Skeleton */}
          <div className="h-64 bg-white/60 border border-border/40 rounded-2xl animate-pulse" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-48 bg-white/60 border border-border/40 rounded-2xl animate-pulse" />
            <div className="h-48 bg-white/60 border border-border/40 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col min-h-screen justify-between pb-4">
      <div className="space-y-6">
        
        {/* Topbar / Page Header sitting on #F4F7F2 Directly */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 select-none">
          <div className="space-y-1">
            <h2 className="font-heading text-2xl font-bold tracking-tight text-jade-dark">
              Clinical Overview
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 text-xs text-jade-teal font-medium">
              <span>{todayDateString}</span>
              <span className="hidden sm:inline text-border/60 font-normal">|</span>
              <div className="flex items-center gap-1 text-[#1B8A5A]">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>{docName.toLowerCase().startsWith("dr") ? "" : "Dr. "}{docName} · {docLicense} · {docSpecialization}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            <Button
              asChild
              className="bg-jade-primary hover:bg-jade-dark text-white rounded-btn h-9 shadow-sm px-4 text-xs font-bold transition-all duration-300"
            >
              <Link href="/patients/link">
                Link Patient
              </Link>
            </Button>
            
            <Button
              asChild
              variant="outline"
              size="icon"
              className="relative text-jade-teal hover:text-jade-dark border-border/60 hover:bg-jade-light/50 h-9 w-9 bg-white"
            >
              <Link href="/alerts">
                <Bell className="h-4 w-4" />
                {unreadAlertsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-status-critical border border-white" />
                )}
              </Link>
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        {mockZeroState ? (
          <div className="py-14 max-w-2xl mx-auto w-full">
            <EmptyState
              title="No connected patients linked yet"
              description="To begin monitoring, invite patients to link their NeuroHaven mobile app using their clinical connection code."
              actionLabel="Link your first patient"
              actionHref="/patients/link"
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Zone 1 — Situation awareness strip */}
            <SituationStrip alerts={alerts} patients={patients} />

            {/* Zone 2 — Active care pathways ledger */}
            <ActiveCarePathways patients={patients} alerts={alerts} />

            {/* Zone 3 — Temporal context (Recharts & digests) */}
            <TemporalContext patients={patients} />
          </div>
        )}

      </div>

      {/* Developer Review Mock State Toggle placed at the footer bottom */}
      <div className="pt-10 pb-2 flex justify-center border-t border-border/40">
        <button
          onClick={handleToggleMockMode}
          className="flex items-center gap-2 text-[10px] uppercase font-bold text-jade-teal/60 hover:text-jade-dark transition-all select-none duration-200"
          aria-label="Toggle mock zero state"
        >
          {mockZeroState ? (
            <>
              <ToggleLeft className="h-4 w-4 text-jade-teal/50" />
              <span>Demonstrate Active Workstation</span>
            </>
          ) : (
            <>
              <ToggleRight className="h-4 w-4 text-jade-primary animate-pulse" />
              <span>Demonstrate Empty Workstation</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
