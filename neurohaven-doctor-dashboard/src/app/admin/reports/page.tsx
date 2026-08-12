"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { 
  FileText, 
  Star, 
  AlertOctagon, 
  RefreshCw 
} from "lucide-react";
import { Card } from "@/components/ui/card";

export default function AdminReportsPage() {
  const [docReports, setDocReports] = useState<any[]>([]);
  const [patReports, setPatReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("doctor-evals");

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

  const loadData = async () => {
    setLoading(true);
    const token = localStorage.getItem("adminToken");
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };

    try {
      const [docRes, patRes] = await Promise.all([
        axios.get(`${apiBaseUrl}/api/admin/reports/doctor-patient`, config),
        axios.get(`${apiBaseUrl}/api/admin/reports/patient-doctor`, config)
      ]);

      if (docRes.data?.success) setDocReports(docRes.data.data);
      if (patRes.data?.success) setPatReports(patRes.data.data);
    } catch (e: any) {
      console.error("Failed to load clinical audits reports:", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-jade-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header titles */}
      <div className="select-none text-left">
        <h3 className="font-heading text-xs font-bold text-jade-dark uppercase tracking-wider">
          Systems Clinical Audits & Feedback
        </h3>
        <p className="text-[10px] text-jade-teal font-semibold mt-0.5">
          Inspect doctor clinical evaluations regarding patients, and patient ratings regarding clinic practitioners
        </p>
      </div>

      {/* 2. Horizontal Buttons Selector Block */}
      <div className="flex flex-row gap-3 border-b border-border/40 pb-3 select-none text-left">
        <button
          onClick={() => setActiveTab("doctor-evals")}
          className={`px-4 py-2 text-[11px] font-bold rounded-lg transition-all ${
            activeTab === "doctor-evals"
              ? "bg-[#7B9669] text-white shadow-sm"
              : "bg-[#F4F7F2] text-jade-teal hover:bg-[#EAEFE6] border border-border/50"
          }`}
        >
          Clinician Case Records
        </button>
        <button
          onClick={() => setActiveTab("patient-reviews")}
          className={`px-4 py-2 text-[11px] font-bold rounded-lg transition-all ${
            activeTab === "patient-reviews"
              ? "bg-[#7B9669] text-white shadow-sm"
              : "bg-[#F4F7F2] text-jade-teal hover:bg-[#EAEFE6] border border-border/50"
          }`}
        >
          Caregiver Ratings & Feedback
        </button>
      </div>

      {/* 3. Feedback Forms / Logs display list */}
      <div className="mt-4 space-y-4">
        {activeTab === "doctor-evals" ? (
          docReports.length === 0 ? (
            <Card className="p-8 text-center border border-border/50 bg-white text-jade-teal text-xs select-none">
              No clinical case evaluations logged.
            </Card>
          ) : (
            docReports.map((rep) => (
              <Card key={rep.id} className="p-5 md:p-6 border border-border/60 bg-white shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-4 text-left">
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="h-6 w-6 rounded bg-[#F4F7F2] text-jade-primary flex items-center justify-center shrink-0">
                      <FileText className="h-3.5 w-3.5" />
                    </span>
                    <h4 className="font-heading text-xs font-bold text-jade-dark truncate">
                      {rep.diagnosis_category || "General Cognitive Audit"}
                    </h4>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border shrink-0 ${
                      rep.risk_level === "severe" ? "bg-red-50 text-red-600 border-red-200" :
                      rep.risk_level === "moderate" ? "bg-amber-50 text-amber-600 border-amber-200" :
                      "bg-emerald-50 text-emerald-600 border-emerald-200"
                    }`}>
                      {rep.risk_level} risk
                    </span>
                  </div>
                  <p className="text-xs text-jade-dark leading-relaxed font-body">
                    {rep.evaluation_summary}
                  </p>
                  <div className="flex items-center gap-3 text-[9px] text-jade-teal font-mono uppercase tracking-tight flex-wrap">
                    <span>Doc ID: {rep.doctor_id}</span>
                    <span>·</span>
                    <span>Pat ID: {rep.patient_id}</span>
                  </div>
                </div>
                <div className="text-right shrink-0 select-none">
                  <span className="text-[10px] text-jade-teal font-semibold">
                    {new Date(rep.created_at || rep.linked_at || Date.now()).toLocaleDateString()}
                  </span>
                </div>
              </Card>
            ))
          )
        ) : (
          patReports.length === 0 ? (
            <Card className="p-8 text-center border border-border/50 bg-white text-jade-teal text-xs select-none">
              No caregiver ratings or practitioner reports logged.
            </Card>
          ) : (
            patReports.map((rep) => (
              <Card key={rep.id} className="p-5 md:p-6 border border-border/60 bg-white shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-4 text-left">
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap select-none">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-3.5 w-3.5 ${
                            i < (rep.rating || 5) 
                              ? "fill-amber-400 text-amber-400" 
                              : "text-border"
                          }`} 
                        />
                      ))}
                    </div>
                    {rep.complaint_logged && (
                      <span className="flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase shrink-0">
                        <AlertOctagon className="h-3 w-3" />
                        Abuse / Complaint Logged
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-jade-dark leading-relaxed font-body">
                    {rep.feedback_text || "No descriptive comments provided."}
                  </p>
                  <div className="flex items-center gap-3 text-[9px] text-jade-teal font-mono uppercase tracking-tight flex-wrap">
                    <span>Patient User ID: {rep.patient_id}</span>
                    <span>·</span>
                    <span>Doctor ID: {rep.doctor_id}</span>
                  </div>
                </div>
                <div className="text-right shrink-0 select-none">
                  <span className="text-[10px] text-jade-teal font-semibold">
                    {new Date(rep.created_at || rep.linked_at || Date.now()).toLocaleDateString()}
                  </span>
                </div>
              </Card>
            ))
          )
        )}
      </div>
    </div>
  );
}
