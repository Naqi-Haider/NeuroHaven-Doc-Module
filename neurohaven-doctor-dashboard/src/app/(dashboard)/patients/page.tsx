"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { PlusCircle, ToggleLeft, ToggleRight, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { io, Socket } from "socket.io-client";

import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import PatientFilters from "@/components/patients/PatientFilters";
import PatientCard from "@/components/patients/PatientCard";
import { PatientWithLink } from "@/types/patient";
import { Button } from "@/components/ui/button";
import { getCognitiveStatus } from "@/lib/cognitiveStatus";

// Mock directory list matching PatientWithLink definition
const initialPatients: PatientWithLink[] = [
  {
    id: "pat-1",
    name: "Arthur Pendelton",
    email: "arthur.p@care.com",
    cognitiveLevel: 72,
    createdAt: "2026-03-12T10:00:00Z",
    updatedAt: "2026-06-21T08:30:00Z",
    linkStatus: "active",
    linkedAt: "2026-03-12T10:00:00Z",
    riskLevel: "moderate",
    lastActivity: "Memory Match Session — 2h ago",
    dateOfBirth: "1965-04-12",
  },
  {
    id: "pat-2",
    name: "Eleanor Vance",
    email: "eleanor.v@care.com",
    cognitiveLevel: 45,
    createdAt: "2026-02-18T11:00:00Z",
    updatedAt: "2026-06-21T09:12:00Z",
    linkStatus: "active",
    linkedAt: "2026-02-18T11:00:00Z",
    riskLevel: "severe",
    lastActivity: "Word Recall Session — 45m ago",
    dateOfBirth: "1951-11-20",
  },
  {
    id: "pat-3",
    name: "Gordon Cole",
    email: "gordon.c@care.com",
    cognitiveLevel: 88,
    createdAt: "2026-05-01T09:30:00Z",
    updatedAt: "2026-06-21T07:15:00Z",
    linkStatus: "active",
    linkedAt: "2026-05-01T09:30:00Z",
    riskLevel: "mild",
    lastActivity: "Pattern Recognition Session — 4h ago",
    dateOfBirth: "1960-08-15",
  },
  {
    id: "pat-4",
    name: "Marianne Faith",
    email: "marianne.f@care.com",
    cognitiveLevel: 61,
    createdAt: "2026-04-10T14:20:00Z",
    updatedAt: "2026-06-20T16:45:00Z",
    linkStatus: "active",
    linkedAt: "2026-04-10T14:20:00Z",
    riskLevel: "moderate",
    lastActivity: "Word Recall Session — 1d ago",
    dateOfBirth: "1958-01-10",
  },
  {
    id: "pat-5",
    name: "Thomas Sterling",
    email: "thomas.s@care.com",
    cognitiveLevel: 91,
    createdAt: "2026-06-15T09:00:00Z",
    updatedAt: "2026-06-21T05:30:00Z",
    linkStatus: "active",
    linkedAt: "2026-06-15T09:00:00Z",
    riskLevel: "mild",
    lastActivity: "Word Recall Session — 2d ago",
    dateOfBirth: "1962-09-02",
  },
  {
    id: "pat-6",
    name: "Beatrice Harrison",
    email: "beatrice.h@care.com",
    cognitiveLevel: 38,
    createdAt: "2026-01-10T11:30:00Z",
    updatedAt: "2026-06-20T10:15:00Z",
    linkStatus: "active",
    linkedAt: "2026-01-10T11:30:00Z",
    riskLevel: "severe",
    lastActivity: "Pattern Recognition Session — 6d ago",
    dateOfBirth: "1948-03-30",
  },
];

export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientWithLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [mockZeroState, setMockZeroState] = useState(false);

  // Filter and Sorting state
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [recencyFilter, setRecencyFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("recent");

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    async function fetchPatients() {
      try {
        const token = localStorage.getItem("nh-token") || "mock-dev-token";
        const res = await axios.get(`${apiBaseUrl}/api/patients`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (res.data?.success) {
          const mapped = res.data.data.map((p: any) => {
            const scoreVal = p.cognitive_level !== undefined ? p.cognitive_level : (p.cognitiveLevel || p.overallScore || 50);
            const riskVal = p.risk_level || p.riskLevel || (scoreVal >= 75 ? "mild" : scoreVal >= 50 ? "moderate" : "severe");

            return {
              id: p.id,
              name: p.full_name || p.name || "Unknown Patient",
              email: p.email || "",
              cognitiveLevel: scoreVal,
              createdAt: p.created_at || p.createdAt,
              updatedAt: p.updated_at || p.updatedAt || new Date().toISOString(),
              linkStatus: p.linkStatus || "active",
              linkedAt: p.linkedAt || p.linked_at || new Date().toISOString(),
              riskLevel: riskVal,
              lastActivity: p.lastActivity || "Memory session completed",
              dateOfBirth: p.date_of_birth || p.dateOfBirth || "1970-01-01",
              avatarUrl: p.avatar_url || p.avatarUrl || null,
              isOnline: p.is_online === true,
              lastSeen: p.last_seen || undefined
            };
          });
          setPatients(mapped);

          // Fetch online statuses from in-memory socket tracker
          try {
            const onlineRes = await axios.get(`${apiBaseUrl}/api/patients/online-status`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (onlineRes.data?.success) {
              const onlineIds: string[] = onlineRes.data.data;
              setPatients(prev => prev.map(p => ({
                ...p,
                isOnline: onlineIds.includes(p.id)
              })));
            }
          } catch (e) {
            console.warn("Failed to fetch online statuses:", e);
          }
        } else {
          setPatients(initialPatients);
        }
      } catch (err) {
        console.error("Failed loading patients list, using showcase mock data:", err);
        setPatients(initialPatients);
      } finally {
        setTimeout(() => setLoading(false), 800);
      }
    }
    fetchPatients();

    // Connect socket for real-time presence updates
    const socket = io(apiBaseUrl, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      // Join each patient's room to receive presence events
      // (handled per-patient in the chat page; here we just listen globally)
    });

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

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [apiBaseUrl]);

  const handleToggleMockMode = () => {
    setMockZeroState(!mockZeroState);
    if (!mockZeroState) {
      toast.info("Demonstrating Zero Linked Patients view.");
    } else {
      toast.success("Demonstrating Connected Cohort Directory.");
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setRiskFilter("all");
    setRecencyFilter("all");
    setSortOrder("recent");
    toast.success("Filters reset successfully.");
  };

  // Helper matching activity recency keywords
  const matchesRecency = (lastActive: string | undefined, filter: string) => {
    if (filter === "all") return true;
    if (!lastActive) return false;

    const activeText = lastActive.toLowerCase();
    if (filter === "today") {
      return activeText.includes("h ago") || activeText.includes("m ago") || activeText.includes("minute");
    }
    if (filter === "week") {
      return (
        activeText.includes("h ago") ||
        activeText.includes("m ago") ||
        activeText.includes("1d") ||
        activeText.includes("2d") ||
        activeText.includes("6d") ||
        activeText.includes("day ago")
      );
    }
    if (filter === "month") {
      return !activeText.includes("month"); // all mock items are within a month
    }
    return true;
  };

  // Filtered and sorted patient list
  const filteredPatients = useMemo(() => {
    if (mockZeroState) return [];

    return patients
      .filter((p) => {
        // Name Search Match
        const matchesName = p.name.toLowerCase().includes(searchQuery.toLowerCase());

        // Risk Filter Match
        const matchesRisk = riskFilter === "all" || p.riskLevel === riskFilter;

        // Recency Match
        const matchesTime = matchesRecency(p.lastActivity, recencyFilter);

        return matchesName && matchesRisk && matchesTime;
      })
      .sort((a, b) => {
        if (sortOrder === "alpha") {
          return a.name.localeCompare(b.name);
        }
        if (sortOrder === "score") {
          return a.cognitiveLevel - b.cognitiveLevel;
        }
        // "recent" ordering mapping activity timings
        const activityOrder: Record<string, number> = {
          "pat-2": 1, // 45m
          "pat-1": 2, // 2h
          "pat-3": 3, // 4h
          "pat-5": 4, // 2d
          "pat-4": 5, // 1d (yesterday)
          "pat-6": 6, // 6d
        };
        const orderA = activityOrder[a.id] || 99;
        const orderB = activityOrder[b.id] || 99;
        return orderA - orderB;
      });
  }, [patients, searchQuery, riskFilter, recencyFilter, sortOrder, mockZeroState]);

  if (loading) {
    return (
      <div className="space-y-6 select-none">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-jade-light/40 rounded animate-pulse" />
            <div className="h-4 w-72 bg-jade-light/40 rounded animate-pulse" />
          </div>
        </div>

        <div className="h-12 bg-white/60 border border-border/40 rounded-2xl animate-pulse" />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="h-48 bg-white/60 border border-border/40 rounded-2xl animate-pulse" />
          <div className="h-48 bg-white/60 border border-border/40 rounded-2xl animate-pulse" />
          <div className="h-48 bg-white/60 border border-border/40 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Patient Directory"
        description="Monitor cognitive levels, risk indexes, and daily rehabilitation engagement across all linked patients."
        action={
          <div className="flex items-center gap-3">
            {/* Developer Review Mode Toggle */}
            <div className="flex items-center gap-2 bg-white border border-border/80 px-3 py-1.5 rounded-card shadow-sm select-none">
              <span className="text-xs font-semibold text-jade-teal">
                {mockZeroState ? "Zero Linked Patients" : "Cohort View"}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleMockMode}
                className="h-7 w-7 text-jade-primary hover:bg-transparent"
                aria-label="Toggle demo state"
              >
                {mockZeroState ? (
                  <ToggleLeft className="h-7 w-7 text-jade-teal" />
                ) : (
                  <ToggleRight className="h-7 w-7 text-jade-primary" />
                )}
              </Button>
            </div>

            <Link href="/patients/link" passHref>
              <Button className="bg-jade-primary hover:bg-jade-dark text-white rounded-btn h-9 shadow-sm flex items-center gap-1.5 transition-all duration-300 font-semibold text-xs px-3">
                <PlusCircle className="h-4 w-4" />
                Link Patient
              </Button>
            </Link>
          </div>
        }
      />

      {mockZeroState ? (
        <div className="py-10 max-w-2xl mx-auto">
          <EmptyState
            title="No connected patients linked yet"
            description="To begin monitoring, invite patients to link their NeuroHaven mobile app using their clinical connection code."
            actionLabel="Link your first patient"
            actionHref="/patients/link"
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Filters Bar */}
          <PatientFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            riskFilter={riskFilter}
            setRiskFilter={setRiskFilter}
            recencyFilter={recencyFilter}
            setRecencyFilter={setRecencyFilter}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
          />

          {/* Patient Grid / Empty State */}
          {filteredPatients.length === 0 ? (
            <div className="py-10 max-w-xl mx-auto">
              <EmptyState
                title="No patients match filters"
                description="Adjust your search query, change risk level dropdown selections, or reset active recency boundaries to locate patients."
                actionLabel="Reset Active Filters"
                icon={<XCircle className="h-8 w-8 text-status-warning" />}
                onClick={handleResetFilters}
              />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPatients.map((patient) => (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  onUnlink={(unlinkedId) => {
                    setPatients((prev) => prev.filter((p) => p.id !== unlinkedId));
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}