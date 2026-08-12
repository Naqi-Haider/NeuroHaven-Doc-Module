import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Users2 } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onClick,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 md:p-12 border border-dashed border-jade-muted bg-white/40 backdrop-blur-md rounded-card shadow-sm animate-fadeIn">
      <div className="mb-4 flex items-center justify-center h-16 w-16 rounded-full bg-jade-light/50 text-jade-primary">
        {icon || <Users2 className="h-8 w-8" />}
      </div>
      <h3 className="font-heading text-lg font-semibold text-jade-dark mb-2">
        {title}
      </h3>
      <p className="text-sm text-jade-teal max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && actionHref && (
        <Link href={actionHref} passHref>
          <Button className="bg-jade-primary hover:bg-jade-dark text-white rounded-btn px-6 py-2 shadow-sm font-semibold transition-all duration-300">
            {actionLabel}
          </Button>
        </Link>
      )}
      {actionLabel && onClick && (
        <Button onClick={onClick} className="bg-jade-primary hover:bg-jade-dark text-white rounded-btn px-6 py-2 shadow-sm font-semibold transition-all duration-300">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
