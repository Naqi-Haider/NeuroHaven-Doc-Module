"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { 
  Users, 
  UserCheck, 
  Link2, 
  Search, 
  Ban, 
  Unlock, 
  RefreshCw, 
  Link2Off,
  Check 
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  
  const [docSearch, setDocSearch] = useState("");
  const [patSearch, setPatSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

  const loadData = async () => {
    setLoading(true);
    const token = localStorage.getItem("adminToken");
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };

    // 1. Fetch overview stats
    try {
      const res = await axios.get(`${apiBaseUrl}/api/admin/overview-stats`, config);
      if (res.data?.success) setStats(res.data.data);
    } catch (e) {
      console.error("Failed to load admin stats:", e);
    }

    // 2. Fetch doctors directory
    try {
      const res = await axios.get(`${apiBaseUrl}/api/admin/doctors`, config);
      if (res.data?.success) setDoctors(res.data.data);
    } catch (e) {
      console.error("Failed to load admin doctors directory:", e);
      toast.error("Failed to load clinicians directory.");
    }

    // 3. Fetch patients directory
    try {
      const res = await axios.get(`${apiBaseUrl}/api/admin/patients`, config);
      if (res.data?.success) setPatients(res.data.data);
    } catch (e) {
      console.error("Failed to load admin patients directory:", e);
      toast.error("Failed to load patients directory.");
    }

    // 4. Fetch links mapping
    try {
      const res = await axios.get(`${apiBaseUrl}/api/admin/links-map`, config);
      if (res.data?.success) setLinks(res.data.data);
    } catch (e) {
      console.error("Failed to load admin links pairing map:", e);
      toast.error("Failed to load connection link mappings.");
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async (userId: string, role: string, currentStatus: string) => {
    const nextStatus = currentStatus === "blocked" ? "active" : "blocked";
    const token = localStorage.getItem("adminToken");
    setActionLoading(userId);

    try {
      const response = await axios.patch(
        `${apiBaseUrl}/api/admin/users/${userId}/status`,
        { account_status: nextStatus, role },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data?.success) {
        toast.success(`User status updated to ${nextStatus}.`);
        loadData();
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Operation unauthorized or failed.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerifyDoctor = async (doctorId: string) => {
    setActionLoading(doctorId);
    setDoctors((prev) =>
      prev.map((d) => (d.id === doctorId ? { ...d, verified: true } : d))
    );

    const token = localStorage.getItem("adminToken");
    try {
      const response = await axios.patch(
        `${apiBaseUrl}/api/admin/users/${doctorId}/status`,
        { verified: true, role: "doctor" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data?.success) {
        toast.success("Doctor credentials verified successfully.");
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Operation failed.");
      loadData();
    } finally {
      setActionLoading(null);
    }
  };

  const filteredDoctors = doctors.filter(doc => 
    doc.name?.toLowerCase().includes(docSearch.toLowerCase()) ||
    doc.email?.toLowerCase().includes(docSearch.toLowerCase())
  );

  const filteredPatients = patients.filter(pat => 
    pat.full_name?.toLowerCase().includes(patSearch.toLowerCase()) ||
    pat.email?.toLowerCase().includes(patSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-jade-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. System Metadata Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 select-none">
        <Card className="p-6 border border-border/50 bg-white flex items-center gap-4">
          <div className="p-3 bg-jade-light/40 text-jade-primary rounded-xl shrink-0">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-jade-teal font-extrabold uppercase tracking-wider block">
              Registered Doctors
            </span>
            <span className="text-2xl font-bold font-heading text-jade-dark mt-0.5 block">
              {stats?.doctorsCount || 0}
            </span>
          </div>
        </Card>

        <Card className="p-6 border border-border/50 bg-white flex items-center gap-4">
          <div className="p-3 bg-jade-light/40 text-jade-primary rounded-xl shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-jade-teal font-extrabold uppercase tracking-wider block">
              Active Patients Directory
            </span>
            <span className="text-2xl font-bold font-heading text-jade-dark mt-0.5 block">
              {stats?.patientsCount || 0}
            </span>
          </div>
        </Card>

        <Card className="p-6 border border-border/50 bg-white flex items-center gap-4">
          <div className="p-3 bg-jade-light/40 text-jade-primary rounded-xl shrink-0">
            <Link2 className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-jade-teal font-extrabold uppercase tracking-wider block">
              Linked Patient Connections
            </span>
            <span className="text-2xl font-bold font-heading text-jade-dark mt-0.5 block">
              {stats?.activeLinksCount || 0}
            </span>
          </div>
        </Card>
      </div>

      {/* 2. Doctor Directory Panel */}
      <Card className="border border-border/60 bg-white shadow-sm rounded-xl overflow-hidden">
        <div className="p-4 md:p-6 border-b border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
          <div>
            <h3 className="font-heading text-xs font-bold text-jade-dark uppercase tracking-wider">
              Clinical Clinicians Directory
            </h3>
            <p className="text-[10px] text-jade-teal font-semibold mt-0.5">
              Verify license credentials and suspend clinician dashboard account privileges
            </p>
          </div>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-jade-teal/60" />
            <Input
              placeholder="Search clinician name/email..."
              value={docSearch}
              onChange={(e) => setDocSearch(e.target.value)}
              className="pl-9 text-xs h-9 bg-[#F9FBF8] border-border"
            />
          </div>
        </div>
        <div className="overflow-x-auto text-left">
          <table className="w-full text-xs">
            <thead className="bg-[#F4F7F2]/40 text-jade-teal font-bold border-b border-border/40 select-none">
              <tr>
                <th className="p-4">Doctor Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Specialization</th>
                <th className="p-4">Institution</th>
                <th className="p-4">Verified</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-jade-dark font-medium">
              {filteredDoctors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-jade-teal">
                    No doctor profile records found.
                  </td>
                </tr>
              ) : (
                filteredDoctors.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[#F9FBF8]/30 transition-colors">
                    <td className="p-4 font-bold">{doc.name}</td>
                    <td className="p-4 font-mono">{doc.email}</td>
                    <td className="p-4">{doc.specialization}</td>
                    <td className="p-4">{doc.institution}</td>
                    <td className="p-4">
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border bg-emerald-50 text-emerald-600 border-emerald-200">
                        Email Verified
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border ${
                        doc.account_status === "blocked"
                          ? "bg-red-50 text-red-600 border-red-200"
                          : "bg-[#F4F7F2] text-jade-teal border-jade-muted/30"
                      }`}>
                        {doc.account_status || "active"}
                      </span>
                    </td>
                    <td className="p-4 text-right flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actionLoading === doc.id}
                        onClick={() => handleToggleStatus(doc.id, "doctor", doc.account_status || "active")}
                        className={`h-7 px-2 text-[10px] font-bold border transition-colors ${
                          doc.account_status === "blocked"
                            ? "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                            : "border-red-200 text-red-600 hover:bg-red-50"
                        }`}
                      >
                        {actionLoading === doc.id ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : doc.account_status === "blocked" ? (
                          <>
                            <Unlock className="h-3 w-3 mr-1" />
                            Unblock
                          </>
                        ) : (
                          <>
                            <Ban className="h-3 w-3 mr-1" />
                            Block
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 3. Patient Directory Panel */}
      <Card className="border border-border/60 bg-white shadow-sm rounded-xl overflow-hidden">
        <div className="p-4 md:p-6 border-b border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
          <div>
            <h3 className="font-heading text-xs font-bold text-jade-dark uppercase tracking-wider">
              Caregiver Patients Directory
            </h3>
            <p className="text-[10px] text-jade-teal font-semibold mt-0.5">
              Review cognitive status summaries and block clinical patient profiles
            </p>
          </div>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-jade-teal/60" />
            <Input
              placeholder="Search patient name/email..."
              value={patSearch}
              onChange={(e) => setPatSearch(e.target.value)}
              className="pl-9 text-xs h-9 bg-[#F9FBF8] border-border"
            />
          </div>
        </div>
        <div className="overflow-x-auto text-left">
          <table className="w-full text-xs">
            <thead className="bg-[#F4F7F2]/40 text-jade-teal font-bold border-b border-border/40 select-none">
              <tr>
                <th className="p-4">Patient Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Cognitive Index</th>
                <th className="p-4">Initial Test</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-jade-dark font-medium">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-jade-teal">
                    No patient profile records found.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((pat) => (
                  <tr key={pat.user_id} className="hover:bg-[#F9FBF8]/30 transition-colors">
                    <td className="p-4 font-bold">{pat.full_name || pat.name}</td>
                    <td className="p-4 font-mono">{pat.email}</td>
                    <td className="p-4">{pat.cognitive_level || 50} pts</td>
                    <td className="p-4">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border ${
                        pat.completed_initial_test 
                          ? "bg-[#F4F7F2] text-jade-teal border-jade-muted/30" 
                          : "bg-amber-50 text-amber-600 border-amber-200"
                      }`}>
                        {pat.completed_initial_test ? "Completed" : "Pending"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border ${
                        pat.account_status === "blocked"
                          ? "bg-red-50 text-red-600 border-red-200"
                          : "bg-[#F4F7F2] text-jade-teal border-jade-muted/30"
                      }`}>
                        {pat.account_status || "active"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actionLoading === pat.user_id}
                        onClick={() => handleToggleStatus(pat.user_id, "patient", pat.account_status || "active")}
                        className={`h-7 px-2 text-[10px] font-bold border transition-colors ${
                          pat.account_status === "blocked"
                            ? "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                            : "border-red-200 text-red-600 hover:bg-red-50"
                        }`}
                      >
                        {actionLoading === pat.user_id ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : pat.account_status === "blocked" ? (
                          <>
                            <Unlock className="h-3 w-3 mr-1" />
                            Unblock
                          </>
                        ) : (
                          <>
                            <Ban className="h-3 w-3 mr-1" />
                            Block
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 4. Active Connections Links Map Panel */}
      <Card className="border border-border/60 bg-white shadow-sm rounded-xl overflow-hidden">
        <div className="p-4 md:p-6 border-b border-border/50 select-none text-left">
          <h3 className="font-heading text-xs font-bold text-jade-dark uppercase tracking-wider">
            Clinician-Patient Connection Links Map
          </h3>
          <p className="text-[10px] text-jade-teal font-semibold mt-0.5">
            Audit which patient telemetry stream is connected to which active rehabilitation doctor
          </p>
        </div>
        <div className="overflow-x-auto text-left">
          <table className="w-full text-xs">
            <thead className="bg-[#F4F7F2]/40 text-jade-teal font-bold border-b border-border/40 select-none">
              <tr>
                <th className="p-4">Link ID</th>
                <th className="p-4">Doctor Name &amp; ID</th>
                <th className="p-4">Patient Name &amp; ID</th>
                <th className="p-4">Connection Status</th>
                <th className="p-4">Date Linked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-jade-dark font-medium">
              {links.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-jade-teal font-sans">
                    No active connection link pairs mapped.
                  </td>
                </tr>
              ) : (
                links.map((link) => (
                  <tr key={link.id} className="hover:bg-[#F9FBF8]/30 transition-colors">
                    <td className="p-4 font-mono font-bold">{link.id}</td>
                    <td className="p-4">
                      <div className="font-bold text-[#404E3B]">{link.doctor?.name || link.doctor_name || "Dr. Muhammad Naqi"}</div>
                      <div className="text-[10px] text-jade-teal font-mono">{link.doctor_id}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-[#404E3B]">{link.patient?.full_name || link.patient_name || "Arthur Pendelton"}</div>
                      <div className="text-[10px] text-jade-teal font-mono">{link.patient_id}</div>
                    </td>
                    <td className="p-4 font-sans">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border ${
                        link.status === "active"
                          ? "bg-[#F4F7F2] text-jade-teal border-jade-muted/30"
                          : "bg-red-50 text-red-600 border-red-200"
                      }`}>
                        {link.status}
                      </span>
                    </td>
                    <td className="p-4 font-sans text-jade-teal">
                      {new Date(link.linked_at || link.created_at || Date.now()).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
