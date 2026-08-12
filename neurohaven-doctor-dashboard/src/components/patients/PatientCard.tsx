import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { MessageSquare, Phone, UserMinus } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import RiskBadge from "@/components/shared/RiskBadge";
import { PatientWithLink } from "@/types/patient";
import { differenceInYears } from "date-fns";

interface PatientCardProps {
  patient: PatientWithLink;
  onUnlink?: (patientId: string) => void;
}

export default function PatientCard({ patient, onUnlink }: PatientCardProps) {
  const router = useRouter();
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAge = (dobString?: string) => {
    if (!dobString) return ", 22y/o";
    try {
      const dob = new Date(dobString);
      const age = differenceInYears(new Date(), dob);
      return `, ${age > 0 && age < 120 ? age : 22}y/o`;
    } catch {
      return ", 22y/o";
    }
  };

  return (
    <Link href={`/patients/${patient.id}`} className="block group select-none">
      <Card className="border border-border/60 bg-card shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 h-full cursor-pointer">
        <CardContent className="p-5 flex flex-col gap-4">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-11 w-11 border border-jade-muted bg-white shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105">
                  {(patient.avatarUrl || patient.avatar_url) && <AvatarImage src={patient.avatarUrl || patient.avatar_url || undefined} alt={patient.name} />}
                  <AvatarFallback className="text-sm font-bold text-white bg-jade-primary">
                    {patient.name ? patient.name.charAt(0).toUpperCase() : ""}
                  </AvatarFallback>
                </Avatar>
                <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${
                  patient.isOnline ? "bg-emerald-500" : "bg-red-400"
                }`} />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-heading font-extrabold text-base text-jade-dark truncate leading-tight group-hover:text-jade-primary transition-colors">
                    {patient.name}
                    <span className="text-xs text-jade-teal font-medium ml-1">
                      {getAge(patient.dateOfBirth)}
                    </span>
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    patient.isOnline ? "text-emerald-500" : "text-red-400"
                  }`}>
                    {patient.isOnline ? "Online" : "Offline"}
                  </span>
                </div>
                <span className="text-xs text-jade-teal/80 truncate mt-0.5 font-medium">
                  {patient.email}
                </span>
              </div>
            </div>
            <RiskBadge risk={patient.riskLevel} />
          </div>

          {/* Cognitive Level progress */}
          <div className="space-y-1.5 mt-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-jade-teal font-semibold">Cognitive Score</span>
              <span className="font-mono font-bold text-jade-dark">{patient.cognitiveLevel}%</span>
            </div>
            <Progress
              value={patient.cognitiveLevel}
              className="h-2 w-full bg-jade-light/40"
              indicatorClassName={
                patient.cognitiveLevel > 75
                  ? "bg-status-normal"
                  : patient.cognitiveLevel > 50
                  ? "bg-status-warning"
                  : "bg-status-critical"
              }
            />
          </div>

          {/* Last Activity bottom border info & direct Chat triggers */}
          <div className="border-t border-border/50 pt-3 flex items-center justify-between gap-3 text-xs mt-1">
            <div className="min-w-0">
              <span className="text-jade-teal font-medium block truncate">Last active telemetry:</span>
              <span className="font-semibold text-jade-dark truncate block mt-0.5">{patient.lastActivity || "No active logs"}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 select-none">
              <Button
                variant="outline"
                size="xs"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/patients/${patient.id}/chat`);
                }}
                className="h-7 border-jade-primary/20 text-jade-primary hover:bg-jade-primary hover:text-white text-[11px] font-bold px-2.5 rounded-btn shadow-sm transition-all duration-200 flex items-center gap-1"
              >
                <MessageSquare className="h-3 w-3" />
                Chat
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/patients/${patient.id}/chat?call=true`);
                }}
                className="h-7 border-jade-primary/20 text-jade-primary hover:bg-jade-primary hover:text-white text-[11px] font-bold px-2.5 rounded-btn shadow-sm transition-all duration-200 flex items-center gap-1"
              >
                <Phone className="h-3 w-3" />
                Call
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (window.confirm(`Are you sure you want to unlink ${patient.name} from your workstation?`)) {
                    try {
                      const token = localStorage.getItem("nh-token");
                      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
                      try {
                        await axios.delete(`${apiBaseUrl}/api/patients/${patient.id}/link`, {
                          headers: { Authorization: `Bearer ${token}` }
                        });
                      } catch {
                        await axios.post(`${apiBaseUrl}/api/patients/${patient.id}/unlink`, {}, {
                          headers: { Authorization: `Bearer ${token}` }
                        });
                      }
                      toast.success(`Unlinked ${patient.name} successfully.`);
                      if (onUnlink) onUnlink(patient.id);
                    } catch {
                      toast.error("Failed to unlink patient.");
                    }
                  }
                }}
                className="h-7 border-red-200 text-red-600 hover:bg-red-600 hover:text-white text-[11px] font-bold px-2 rounded-btn shadow-sm transition-all duration-200 flex items-center gap-1"
                title="Unlink Patient"
              >
                <UserMinus className="h-3 w-3" />
                Unlink
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
