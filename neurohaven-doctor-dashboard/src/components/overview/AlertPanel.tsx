import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert as AlertType } from "@/types/alert";

interface AlertPanelProps {
  alerts: AlertType[];
  onAcknowledge: (id: string) => void;
}

export default function AlertPanel({ alerts, onAcknowledge }: AlertPanelProps) {
  const criticalAlerts = alerts
    .filter((a) => a.severity === "critical")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <Card className="border border-border/60 bg-card shadow-sm flex flex-col h-full min-h-[420px] transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="font-heading text-section-h font-semibold text-jade-dark flex items-center gap-2">
            Critical Alerts Feed
            {criticalAlerts.length > 0 && (
              <Badge
                variant="destructive"
                className="bg-status-critical text-white h-5 px-1.5 min-w-5 flex items-center justify-center rounded-full text-[10px] font-bold animate-pulse select-none"
              >
                {criticalAlerts.length}
              </Badge>
            )}
          </CardTitle>
          <Link href="/alerts" passHref>
            <Button
              variant="ghost"
              size="xs"
              className="text-jade-primary hover:text-jade-dark hover:bg-jade-light/30 flex items-center gap-1 font-semibold text-caption px-2 h-7"
            >
              All Alerts <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
        <CardDescription className="text-caption font-body text-jade-teal select-none">
          Active clinical telemetry anomalies requiring immediate review
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-3 px-4 pb-4 max-h-[420px] pr-2 scrollbar-thin">
        {criticalAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 px-4 border border-dashed border-border rounded-lg bg-jade-bg/10 h-[300px]">
            <CheckCircle className="h-9 w-9 text-status-normal mb-2" />
            <p className="font-heading text-section-h font-semibold text-jade-dark">All Patients Stable</p>
            <p className="text-caption font-body text-jade-teal mt-1">No critical telemetry events are currently flagged.</p>
          </div>
        ) : (
          criticalAlerts.map((alert) => {
            let timeFormatted = "";
            try {
              timeFormatted = format(new Date(alert.createdAt), "HH:mm");
            } catch {
              timeFormatted = "--:--";
            }

            return (
              <Alert
                key={alert.id}
                className="border border-status-critical/20 bg-status-critical/5 text-jade-dark rounded-card transition-all duration-300 hover:shadow-sm"
              >
                <div className="flex items-start gap-2.5 w-full">
                  <AlertTriangle className="h-4 w-4 text-status-critical shrink-0 mt-0.5" />
                  <div className="w-full min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <AlertTitle className="text-body font-semibold text-jade-dark font-heading truncate">
                        {alert.title}
                      </AlertTitle>
                      <span className="text-[10px] text-jade-teal/80 shrink-0 font-mono">
                        {timeFormatted}
                      </span>
                    </div>
                    <AlertDescription className="text-caption text-jade-teal mt-1.5 leading-relaxed font-body">
                      <strong className="text-jade-dark">{alert.patientName}:</strong> {alert.description}
                    </AlertDescription>
                    <div className="mt-3 flex items-center justify-between border-t border-status-critical/10 pt-2">
                      <Link href={`/patients/${alert.patientId}`} passHref>
                        <span className="text-caption text-jade-primary hover:text-jade-dark hover:underline font-semibold cursor-pointer select-none">
                          View Profile
                        </span>
                      </Link>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => onAcknowledge(alert.id)}
                        className="h-6 text-[11px] text-status-critical hover:text-status-critical/80 hover:bg-status-critical/10 font-semibold px-2 py-0.5 rounded-btn"
                      >
                        Acknowledge
                      </Button>
                    </div>
                  </div>
                </div>
              </Alert>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
