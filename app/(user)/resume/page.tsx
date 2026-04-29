"use client";

import Link from "next/link";
import { FileText, Wand2, TrendingUp, ArrowRight } from "lucide-react";

export default function ResumePage() {
  return (
    <div className="flex flex-col min-h-full w-full p-6 sm:p-10">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-linear-to-br from-amber-500/10 to-orange-500/10">
            <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Resume Studio
          </h1>
        </div>
        <p className="text-muted-foreground text-sm sm:text-base mt-1 ml-1">
          Build a polished resume from scratch or get AI-powered feedback on your existing one.
        </p>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl">
        {/* Create */}
        <Link
          href="/resume/create"
          className="group relative flex flex-col gap-5 p-7 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 overflow-hidden"
        >
          <div className="absolute inset-0 bg-linear-to-br from-violet-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-center justify-between">
            <div className="p-3 rounded-xl bg-linear-to-br from-violet-500/10 to-indigo-500/10 group-hover:from-violet-500/20 group-hover:to-indigo-500/20 transition-colors">
              <Wand2 className="h-6 w-6 text-violet-600 dark:text-violet-400" />
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
          </div>
          <div className="relative space-y-2">
            <h2 className="text-lg font-bold text-foreground">Create Resume</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Generate a professional LaTeX resume using your profile data. Edit live in a built-in editor and download as PDF.
            </p>
          </div>
          <div className="relative flex flex-wrap gap-2">
            {["LaTeX editor", "Live preview", "PDF export"].map((tag) => (
              <span
                key={tag}
                className="text-xs font-medium px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20"
              >
                {tag}
              </span>
            ))}
          </div>
        </Link>

        {/* Analyze */}
        <Link
          href="/resume/improve"
          className="group relative flex flex-col gap-5 p-7 rounded-2xl border border-border bg-card hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 overflow-hidden"
        >
          <div className="absolute inset-0 bg-linear-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-center justify-between">
            <div className="p-3 rounded-xl bg-linear-to-br from-amber-500/10 to-orange-500/10 group-hover:from-amber-500/20 group-hover:to-orange-500/20 transition-colors">
              <TrendingUp className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
          </div>
          <div className="relative space-y-2">
            <h2 className="text-lg font-bold text-foreground">Analyze Resume</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Upload your existing resume for AI-powered ATS scoring, weakness detection, and actionable improvement suggestions.
            </p>
          </div>
          <div className="relative flex flex-wrap gap-2">
            {["ATS score", "Weakness scan", "Keyword gaps"].map((tag) => (
              <span
                key={tag}
                className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
              >
                {tag}
              </span>
            ))}
          </div>
        </Link>
      </div>
    </div>
  );
}