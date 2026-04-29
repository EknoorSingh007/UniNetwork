"use client";

import { useState, useRef, useCallback } from "react";
import {
  FileText,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Sparkles,
  TrendingUp,
  Tag,
  Target,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Severity = "high" | "medium" | "low";
type ExperienceLevel = "entry" | "mid" | "senior" | "executive";

interface ScoreBreakdown {
  formatting: number;
  keywords: number;
  experience: number;
  education: number;
  skills: number;
}

interface Weakness {
  issue: string;
  description: string;
  severity: Severity;
}

interface Improvement {
  category: string;
  suggestion: string;
  example?: string;
}

interface ResumeAnalysis {
  atsScore: number;
  summary: string;
  scoreBreakdown: ScoreBreakdown;
  strengths: string[];
  weaknesses: Weakness[];
  improvements: Improvement[];
  missingKeywords: string[];
  detectedRole: string;
  experienceLevel: ExperienceLevel;
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-amber-500";
  return "text-rose-500";
}

function getScoreRingColor(score: number) {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#f59e0b";
  return "#f43f5e";
}

function getScoreLabel(score: number) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 55) return "Fair";
  return "Needs Work";
}

function getSeverityConfig(severity: Severity) {
  const map = {
    high: { icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20", label: "High" },
    medium: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "Medium" },
    low: { icon: Info, color: "text-sky-500", bg: "bg-sky-500/10", border: "border-sky-500/20", label: "Low" },
  };
  return map[severity];
}

function ScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative flex items-center justify-center w-40 h-40">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 128 128" fill="none">
        <circle cx="64" cy="64" r={radius} strokeWidth="10" className="stroke-muted" />
        <circle cx="64" cy="64" r={radius} strokeWidth="10" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" stroke={getScoreRingColor(score)} style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div className="flex flex-col items-center">
        <span className={cn("text-4xl font-black tabular-nums", getScoreColor(score))}>{score}</span>
        <span className="text-xs text-muted-foreground font-medium">ATS Score</span>
      </div>
    </div>
  );
}

function BreakdownBar({ label, value, max = 20 }: { label: string; value: number; max?: number }) {
  const pct = (value / max) * 100;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground font-medium">{label}</span>
        <span className="font-bold tabular-nums">{value}<span className="text-muted-foreground font-normal">/{max}</span></span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-700", pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-rose-500")} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ImprovementCard({ item, index }: { item: Improvement; index: number }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-start gap-3 p-4 text-left hover:bg-muted/40 transition-colors">
        <div className="shrink-0 mt-0.5 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">{index + 1}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{item.category}</span>
            <span className="text-sm font-medium text-foreground line-clamp-2">{item.suggestion}</span>
          </div>
        </div>
        {item.example && <div className="shrink-0 text-muted-foreground">{expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</div>}
      </button>
      {expanded && item.example && (
        <div className="px-4 pb-4 pt-0">
          <div className="ml-9 rounded-lg bg-muted/60 border border-border px-4 py-3">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-1.5">Example</p>
            <p className="text-sm text-foreground leading-relaxed">{item.example}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ImproveResumePage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(f.type)) { setError("Only PDF and Word (.doc, .docx) files are supported."); return; }
    if (f.size > 5 * 1024 * 1024) { setError("File must be under 5MB."); return; }
    setError(""); setFile(f); setAnalysis(null);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true); setError("");
    const formData = new FormData();
    formData.append("resume", file);
    try {
      const res = await fetch("/api/resume/analyze", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Analysis failed."); return; }
      setAnalysis(data.analysis);
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  const reset = () => { setFile(null); setAnalysis(null); setError(""); };

  return (
    <div className="flex flex-col min-h-full w-full p-6 sm:p-10 overflow-y-auto">
      <div className="mb-8">
        <Link href="/resume" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Resume Studio
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10">
            <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Improve Resume</h1>
        </div>
        <p className="text-muted-foreground text-sm sm:text-base mt-1 ml-1">Upload your resume for AI-powered ATS scoring and improvement suggestions.</p>
      </div>

      {!analysis && (
        <div className="max-w-2xl w-full mx-auto">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => !file && inputRef.current?.click()}
            className={cn("relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-200",
              file ? "border-primary/40 bg-primary/5 cursor-default" : dragOver ? "border-primary bg-primary/5 scale-[1.01] cursor-copy" : "border-border hover:border-primary/50 hover:bg-muted/40 cursor-pointer bg-card")}
          >
            <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            {file ? (
              <>
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10"><FileText className="h-8 w-8 text-primary" /></div>
                <div><p className="font-semibold text-foreground text-lg">{file.name}</p><p className="text-sm text-muted-foreground mt-1">{(file.size / 1024).toFixed(1)} KB</p></div>
                <button onClick={(e) => { e.stopPropagation(); reset(); }} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><X className="h-4 w-4" /></button>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-muted"><Upload className="h-8 w-8 text-muted-foreground" /></div>
                <div><p className="font-semibold text-foreground text-lg">Drop your resume here</p><p className="text-sm text-muted-foreground mt-1">or click to browse · PDF, DOC, DOCX · max 5MB</p></div>
              </>
            )}
          </div>
          {error && <p className="mt-3 text-sm text-destructive flex items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0" />{error}</p>}
          {file && (
            <button onClick={handleAnalyze} disabled={loading}
              className="mt-5 w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-primary/20">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Analyzing your resume…</> : <><Sparkles className="h-4 w-4" />Analyze Resume</>}
            </button>
          )}
        </div>
      )}

      {analysis && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Analysis for</p><p className="font-semibold text-foreground truncate max-w-xs">{file?.name}</p></div>
            <button onClick={reset} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-muted"><RotateCcw className="h-4 w-4" />New Analysis</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border border-border bg-card">
              <ScoreRing score={analysis.atsScore} />
              <div className="text-center">
                <p className={cn("text-lg font-bold", getScoreColor(analysis.atsScore))}>{getScoreLabel(analysis.atsScore)}</p>
                <p className="text-xs text-muted-foreground capitalize">{analysis.experienceLevel}-level · {analysis.detectedRole}</p>
              </div>
            </div>
            <div className="sm:col-span-2 flex flex-col gap-4 p-6 rounded-2xl border border-border bg-card">
              <p className="text-sm text-foreground leading-relaxed">{analysis.summary}</p>
              <div className="space-y-3">
                {Object.entries(analysis.scoreBreakdown).map(([key, val]) => (
                  <BreakdownBar key={key} label={key.charAt(0).toUpperCase() + key.slice(1)} value={val} />
                ))}
              </div>
            </div>
          </div>
          <section>
            <div className="flex items-center gap-2 mb-3"><CheckCircle2 className="h-5 w-5 text-emerald-500" /><h2 className="font-bold text-foreground">Strengths</h2></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {analysis.strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground leading-relaxed">{s}</p>
                </div>
              ))}
            </div>
          </section>
          <section>
            <div className="flex items-center gap-2 mb-3"><AlertCircle className="h-5 w-5 text-rose-500" /><h2 className="font-bold text-foreground">Issues Found</h2><span className="text-xs bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded-full font-medium">{analysis.weaknesses.length}</span></div>
            <div className="space-y-3">
              {analysis.weaknesses.map((w, i) => {
                const cfg = getSeverityConfig(w.severity);
                const Icon = cfg.icon;
                return (
                  <div key={i} className={cn("flex items-start gap-3 p-4 rounded-xl border", cfg.bg, cfg.border)}>
                    <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", cfg.color)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-semibold text-foreground">{w.issue}</span>
                        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", cfg.bg, cfg.color)}>{cfg.label}</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{w.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          <section>
            <div className="flex items-center gap-2 mb-3"><TrendingUp className="h-5 w-5 text-primary" /><h2 className="font-bold text-foreground">Suggested Improvements</h2></div>
            <div className="space-y-2">{analysis.improvements.map((item, i) => <ImprovementCard key={i} item={item} index={i} />)}</div>
          </section>
          {analysis.missingKeywords.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3"><Tag className="h-5 w-5 text-violet-500" /><h2 className="font-bold text-foreground">Missing Keywords</h2></div>
              <div className="p-5 rounded-2xl border border-violet-500/20 bg-violet-500/5">
                <p className="text-xs text-muted-foreground mb-3">Consider incorporating these industry-relevant keywords to improve ATS matching:</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.missingKeywords.map((kw, i) => (
                    <span key={i} className="text-xs font-medium px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400">{kw}</span>
                  ))}
                </div>
              </div>
            </section>
          )}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/60 border border-border">
            <Target className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed"><span className="font-semibold text-foreground">Pro tip:</span> Tailor your resume for each job application by mirroring the exact keywords from the job description.</p>
          </div>
          <div className="flex justify-center pb-4">
            <button onClick={reset} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-lg border border-border hover:bg-muted">
              <RotateCcw className="h-4 w-4" />Analyze another resume
            </button>
          </div>
        </div>
      )}
    </div>
  );
}