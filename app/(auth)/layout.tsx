import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-6 sm:p-12 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.2),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />
      
      <div className="z-10 flex w-full max-w-lg flex-col items-center justify-center rounded-[var(--radius)] border border-border bg-card shadow-2xl p-4 sm:p-6 transition-all animate-in fade-in zoom-in-95 duration-500">
        {children}
      </div>
    </div>
  );
}
