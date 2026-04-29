"use client";

import OnboardingForm from "@/components/OnboardingForm";

export default function OnboardingPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-6 sm:p-12 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.2),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />
      
      <div className="z-10 w-full max-w-2xl rounded-[calc(var(--radius)+1rem)] border border-border bg-card p-8 shadow-2xl sm:p-12 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
        <div className="mb-10 text-center">
          <h1 className="bg-linear-to-br from-foreground to-foreground/60 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-5xl">
            Complete your profile
          </h1>
          <p className="mt-3 text-muted-foreground text-base">
            Tell us a bit about yourself to personalize your experience.
          </p>
        </div>
        
        <OnboardingForm />
      </div>
    </main>
  );
}