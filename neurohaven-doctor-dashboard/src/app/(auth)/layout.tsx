import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-jade-bg/30 px-4 py-12 sm:px-6 lg:px-8">
      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-jade-muted/20 blur-3xl" />
      <div className="w-full max-w-md space-y-8 rounded-card border border-border bg-card p-8 shadow-md">
        {children}
      </div>
    </div>
  );
}
