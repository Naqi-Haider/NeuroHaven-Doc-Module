import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: React.ReactNode;
  iconClassName?: string;
  className?: string;
}

export default function MetricCard({
  title,
  value,
  icon: Icon,
  description,
  iconClassName = "text-jade-primary bg-jade-light/40",
  className,
}: MetricCardProps) {
  return (
    <Card className={`border border-border/60 bg-card shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-caption font-semibold font-body text-jade-teal uppercase tracking-wider select-none">
          {title}
        </CardTitle>
        <div className={`rounded-lg p-1.5 shrink-0 transition-transform duration-300 ${iconClassName}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-[28px] font-extrabold text-jade-dark font-heading tracking-tight leading-none">
          {value}
        </div>
        {description && (
          <div className="text-caption text-jade-teal mt-2 flex items-center gap-1 font-body">
            {description}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
