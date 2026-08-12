"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  HelpCircle,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<string>("All");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

  const loadTickets = async () => {
    setLoading(true);
    const token = localStorage.getItem("adminToken");
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };

    try {
      const response = await axios.get(`${apiBaseUrl}/api/admin/tickets`, config);
      if (response.data?.success) {
        setTickets(response.data.data);
      }
    } catch (e: any) {
      toast.error("Failed to load help desk support tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleResolveTicket = async (ticketId: string) => {
    const token = localStorage.getItem("adminToken");
    setUpdatingId(ticketId);

    try {
      const response = await axios.patch(
        `${apiBaseUrl}/api/admin/tickets/${ticketId}`,
        { status: "resolved" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data?.success) {
        toast.success("Support ticket marked as resolved.");
        loadTickets();
      }
    } catch (e: any) {
      toast.error("Could not resolve support ticket.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredTickets = tickets.filter(t => {
    if (filterType === "All") return true;
    const comp = (t.complaint_type || t.category || "").toLowerCase();
    const filter = filterType.toLowerCase();
    if (filter.includes("technical") && (comp.includes("technical") || comp.includes("bug"))) return true;
    if (filter.includes("account") && (comp.includes("account") || comp.includes("licensing"))) return true;
    if (filter.includes("telemetry") && comp.includes("telemetry")) return true;
    return comp.includes(filter);
  });

  const categories = ["All", "Technical Issue", "Clinical Telemetry", "Account & Licensing", "Bug Report", "Other Query"];

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-jade-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header description */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none text-left">
        <div>
          <h3 className="font-heading text-xs font-bold text-jade-dark uppercase tracking-wider">
            Help Desk Support Tickets
          </h3>
          <p className="text-[10px] text-jade-teal font-semibold mt-0.5">
            Manage inquiries, bug submissions, and clinical complaints logged by doctors and patients
          </p>
        </div>

        {/* Filter categories */}
        <div className="flex flex-wrap gap-1.5 bg-jade-light/20 p-1 rounded-lg">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterType(cat)}
              className={`px-2.5 py-1 text-[9px] font-bold rounded-md transition-all cursor-pointer ${filterType === cat
                  ? "bg-white text-jade-primary shadow-sm"
                  : "text-jade-teal hover:text-jade-primary"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Tickets list */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <Card className="p-8 text-center border border-border/50 bg-white text-jade-teal text-xs select-none">
            No support tickets match the selected complaint category.
          </Card>
        ) : (
          filteredTickets.map((t) => (
            <Card
              key={t.id}
              className={`p-5 md:p-6 border bg-white shadow-sm flex flex-col md:flex-row justify-between gap-4 text-left ${t.status === "resolved"
                  ? "border-border/50 opacity-75"
                  : "border-border"
                }`}
            >
              <div className="space-y-3 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="h-6 w-6 rounded bg-[#F4F7F2] text-jade-teal border border-jade-muted/30 flex items-center justify-center shrink-0">
                    <HelpCircle className="h-3.5 w-3.5" />
                  </span>
                  <h4 className="font-heading text-xs font-bold text-jade-dark uppercase tracking-wider">
                    {t.complaint_type}
                  </h4>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border shrink-0 ${t.status === "resolved"
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                      : "bg-[#F4F7F2] text-jade-teal border-jade-muted/30"
                    }`}>
                    {t.status}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border shrink-0 ${t.priority === "high"
                      ? "bg-red-50 text-red-600 border-red-200"
                      : "bg-[#F4F7F2] text-jade-teal border-jade-muted/30"
                    }`}>
                    {t.priority} priority
                  </span>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] text-jade-teal font-medium">
                    Submitted by: <strong className="text-jade-dark">{t.sender_name}</strong> ({t.sender_email}) · Role: <strong className="capitalize">{t.sender_role}</strong>
                  </p>
                  <p className="text-xs text-jade-dark leading-relaxed font-body whitespace-pre-wrap">
                    {t.problem_description}
                  </p>
                </div>

                <div className="text-[8px] font-mono text-jade-teal/70">
                  Ticket ID: {t.id} · Logged: {new Date(t.created_at).toLocaleString()}
                </div>
              </div>

              {/* Action resolve buttons */}
              <div className="flex items-center shrink-0 self-center md:self-start select-none">
                {t.status !== "resolved" ? (
                  <Button
                    size="sm"
                    disabled={updatingId === t.id}
                    onClick={() => handleResolveTicket(t.id)}
                    className="bg-[#1B8A5A] hover:bg-[#156d47] text-white text-[10px] font-bold h-8 px-3 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    {updatingId === t.id ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="h-3.5 w-3.5" />
                        Mark Resolved
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-bold border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 rounded-lg">
                    <CheckCircle className="h-4 w-4" />
                    Resolved Request
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
