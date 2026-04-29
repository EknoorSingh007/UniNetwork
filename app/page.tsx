"use client"
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";
import { UserButton } from "@clerk/react";
import { useClerkOnboardCheck } from "@/hooks/useClerkOnboardCheck";
import { ArrowRight, Sparkles, ShieldCheck } from "lucide-react";

export default function Home() {
  const { userId, isLoaded } = useAuth();
  const { status } = useClerkOnboardCheck();

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-6 sm:p-12 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.2),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />
      
      <div className="z-10 flex w-full max-w-4xl flex-col items-center gap-10 rounded-[calc(var(--radius)+1.5rem)] border border-border bg-card p-10 shadow-2xl sm:p-20 transition-all duration-700 animate-in fade-in zoom-in-95">
        <div className="flex items-center gap-2 rounded-full border border-border bg-muted/50 px-5 py-2 text-sm font-medium text-primary shadow-sm">
          <Sparkles className="size-4 animate-pulse text-yellow-500" />
          <span>The Ultimate Alumni Network</span>
        </div>

        <div className="space-y-6 text-center">
          <h1 className="bg-linear-to-br from-foreground to-foreground/70 bg-clip-text text-5xl font-black tracking-tighter text-transparent sm:text-8xl">
            UniNetwork
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-2xl leading-relaxed">
            Connect, grow, and thrive with your college alumni network. Join the community to unlock exclusive opportunities.
          </p>
        </div>

        {!isLoaded ? (
          <div className="flex h-16 items-center justify-center">
            <div className="size-8 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        ) : !userId ? (
          <div className="flex flex-col gap-6 sm:flex-row w-full sm:w-auto">
            <Button asChild size="lg" className="h-14 rounded-full px-10 text-lg font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 bg-primary hover:shadow-2xl">
              <Link href="/sign-up" className="flex items-center">
                Get Started <ArrowRight className="ml-2 size-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-14 rounded-full px-10 text-lg font-bold transition-all hover:bg-muted active:scale-95 border-2">
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-8">
            <div className="flex items-center gap-6 rounded-full border border-border bg-card p-3 pr-10 shadow-lg hover:shadow-xl transition-all duration-300">
              <UserButton appearance={{ elements: { userButtonAvatarBox: "size-14 shadow-inner ring-2 ring-border" } }} />
              <div className="flex flex-col items-start">
                <span className="text-lg font-bold text-foreground">Welcome back</span>
                <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                  <ShieldCheck className="size-4 text-emerald-500" />
                  {status === "redirecting" ? "Heading to home..." : "Verifying profile..."}
                </span>
              </div>
            </div>
            {status !== "redirecting" && (
               <div className="flex items-center justify-center gap-3 py-2 text-primary">
                 <div className="size-5 animate-spin rounded-full border-b-2 border-primary" />
                 <span className="text-base font-semibold">Updating your workspace...</span>
               </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
