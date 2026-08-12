import React from "react";
import Link from "next/link";
import { ArrowRight, MessageSquare } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import RiskBadge from "@/components/shared/RiskBadge";
import { PatientWithLink } from "@/types/patient";

interface RecentPatientsTableProps {
  patients: PatientWithLink[];
}

export default function RecentPatientsTable({ patients }: RecentPatientsTableProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="border border-border/60 bg-card shadow-sm flex flex-col h-full transition-all duration-300">
      <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="font-heading text-section-h font-semibold text-jade-dark">
            Active Care Pathways
          </CardTitle>
          <CardDescription className="text-caption font-body text-jade-teal">
            Recent session progress summaries for linked patient cohort
          </CardDescription>
        </div>
        <Link href="/patients" passHref>
          <Button
            variant="ghost"
            size="xs"
            className="text-jade-primary hover:text-jade-dark hover:bg-jade-light/30 flex items-center gap-1 font-semibold text-caption px-2 h-7"
          >
            See Directory <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader className="bg-jade-bg/40">
            <TableRow className="border-b border-border/60 hover:bg-transparent">
              <TableHead className="text-jade-dark font-semibold font-heading h-11 text-caption select-none">
                Patient / Last Activity
              </TableHead>
              <TableHead className="text-jade-dark font-semibold font-heading h-11 text-caption select-none">
                Clinical Risk Level
              </TableHead>
              <TableHead className="text-jade-dark font-semibold font-heading h-11 text-caption select-none">
                Cognitive Score
              </TableHead>
              <TableHead className="text-jade-dark font-semibold font-heading h-11 text-right text-caption pr-6 select-none">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.map((pat) => (
              <TableRow
                key={pat.id}
                className="border-b border-border/50 hover:bg-jade-bg/10 transition-colors group"
              >
                {/* Patient details & last activity */}
                <TableCell className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-9 w-9 border border-jade-muted bg-white shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105">
                        <AvatarFallback className="text-xs font-bold text-jade-primary bg-jade-light/30">
                          {getInitials(pat.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                        pat.isOnline ? "bg-emerald-500" : "bg-red-400"
                      }`} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-body text-jade-dark font-heading truncate">
                        {pat.name}
                      </span>
                      <span className="text-caption font-body text-jade-teal/80 truncate mt-0.5">
                        {pat.lastActivity || "No recent activity logged"}
                      </span>
                    </div>
                  </div>
                </TableCell>

                {/* Risk Level Badge */}
                <TableCell className="py-3">
                  <RiskBadge risk={pat.riskLevel} />
                </TableCell>

                {/* Progress and Level percentage */}
                <TableCell className="py-3">
                  <div className="flex items-center gap-3 min-w-[130px] max-w-[200px]">
                    <Progress
                      value={pat.cognitiveLevel}
                      className="h-2 w-full bg-jade-light/40"
                      indicatorClassName={
                        pat.cognitiveLevel > 75
                          ? "bg-status-normal"
                          : pat.cognitiveLevel > 50
                          ? "bg-status-warning"
                          : "bg-status-critical"
                      }
                    />
                    <span className="text-data font-semibold text-jade-dark shrink-0 font-mono">
                      {pat.cognitiveLevel}%
                    </span>
                  </div>
                </TableCell>

                {/* Redirection Profile & Chat CTA */}
                <TableCell className="py-3 text-right pr-6">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/patients/${pat.id}/chat`} passHref>
                      <Button
                        size="xs"
                        variant="outline"
                        className="text-jade-primary border-jade-primary/20 hover:bg-jade-primary hover:text-white font-semibold text-caption shadow-sm transition-all duration-200 flex items-center gap-1 h-7 px-2.5 rounded-btn"
                      >
                        <MessageSquare className="h-3 w-3" />
                        Chat
                      </Button>
                    </Link>
                    <Link href={`/patients/${pat.id}`} passHref>
                      <Button
                        size="xs"
                        variant="outline"
                        className="text-jade-teal border-border hover:bg-jade-light/40 font-semibold text-caption shadow-sm transition-all duration-200 h-7 px-2.5 rounded-btn"
                      >
                        Profile
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
