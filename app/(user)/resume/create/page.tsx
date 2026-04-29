"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Upload, X, Wand2, Loader2, Download,
  RefreshCw, FileText, Eye, Code2, AlertCircle, CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "upload" | "editor";
type PreviewState = "idle" | "compiling" | "ready" | "error";

export default function CreateResumePage() {
  const [step, setStep] = useState<Step>("upload");

  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const [latex, setLatex] = useState("");
  const [activePane, setActivePane] = useState<"editor" | "preview">("editor");
  const [previewState, setPreviewState] = useState<PreviewState>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const previewRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  const handleFile = useCallback((f: File) => {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(f.type)) {
      setGenError("Only PDF and Word (.doc, .docx) files are supported.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setGenError("File must be under 5MB.");
      return;
    }
    setGenError("");
    setFile(f);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError("");

    const formData = new FormData();
    if (file) formData.append("resume", file);

    try {
      const res = await fetch("/api/resume/create", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setGenError(data.error ?? "Generation failed. Please try again.");
        return;
      }
      setLatex(data.latex);
      setStep("editor");
      setPreviewState("idle");
    } catch {
      setGenError("Network error. Please check your connection.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCompile = useCallback(async () => {
    if (!latex.trim()) return;
    setPreviewState("compiling");
    setPreviewError("");

    try {
      const res = await fetch("/api/resume/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latex }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setPreviewError(data.error ?? "Compilation failed.");
        setPreviewState("error");
        return;
      }

      const blob = await res.blob();
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
      const url = URL.createObjectURL(blob);
      previewRef.current = url;
      setPreviewUrl(url);
      setPreviewState("ready");
      setActivePane("preview");
    } catch {
      setPreviewError("Compilation service unavailable.");
      setPreviewState("error");
    }
  }, [latex]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/resume/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latex }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "resume.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  if (step === "upload") {
    return (
      <div className="flex flex-col min-h-full w-full p-6 sm:p-10">
        <div className="mb-8">
          <Link href="/resume" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to Resume Studio
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10">
              <Wand2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Create Resume</h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1 ml-1">
            We'll generate a professional LaTeX resume using your profile. Optionally upload an existing resume to carry over your experience and projects.
          </p>
        </div>

        <div className="max-w-2xl w-full mx-auto space-y-6">
          {/* Upload zone */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">
              Existing resume <span className="text-muted-foreground font-normal">(optional — enhances output)</span>
            </p>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => !file && inputRef.current?.click()}
              className={cn(
                "relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200",
                file ? "border-violet-500/40 bg-violet-500/5 cursor-default" :
                dragOver ? "border-violet-500 bg-violet-500/5 scale-[1.01] cursor-copy" :
                "border-border hover:border-violet-500/50 hover:bg-muted/40 cursor-pointer bg-card"
              )}
            >
              <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              {file ? (
                <>
                  <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-500/10">
                    <FileText className="h-7 w-7 text-violet-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-muted">
                    <Upload className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Drop your resume here</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX · max 5MB</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {genError && (
            <p className="text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />{genError}
            </p>
          )}

          {/* Info card */}
          <div className="rounded-xl border border-border bg-muted/40 p-4 flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your profile data (name, skills, domain, company, role) is automatically included. If you upload a resume, we'll also extract your experience and projects from it.
            </p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
          >
            {generating ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Generating resume…</>
            ) : (
              <><Wand2 className="h-4 w-4" />Generate Resume<ChevronRight className="h-4 w-4 ml-auto" /></>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-card shrink-0 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStep("upload")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="h-4 w-px bg-border" />
          <span className="text-sm font-semibold text-foreground">Resume Editor</span>
        </div>

        {/* Mobile pane switcher */}
        <div className="flex items-center rounded-lg border border-border bg-muted p-0.5 lg:hidden">
          {(["editor", "preview"] as const).map((pane) => (
            <button
              key={pane}
              onClick={() => setActivePane(pane)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize",
                activePane === pane ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              {pane === "editor" ? <Code2 className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {pane}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCompile}
            disabled={previewState === "compiling"}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {previewState === "compiling" ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" />Compiling…</>
            ) : (
              <><RefreshCw className="h-3.5 w-3.5" />Compile</>
            )}
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow shadow-primary/20"
          >
            {downloading ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" />Exporting…</>
            ) : (
              <><Download className="h-3.5 w-3.5" />Download PDF</>
            )}
          </button>
        </div>
      </div>

      {/* Split pane */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: LaTeX editor ── */}
        <div className={cn(
          "flex flex-col border-r border-border bg-[#1e1e2e] overflow-hidden",
          "w-full lg:w-1/2",
          activePane === "preview" ? "hidden lg:flex" : "flex"
        )}>
          <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 shrink-0">
            <Code2 className="h-3.5 w-3.5 text-violet-400" />
            <span className="text-xs font-mono text-white/50">resume.tex</span>
          </div>
          <textarea
            value={latex}
            onChange={(e) => setLatex(e.target.value)}
            spellCheck={false}
            className="flex-1 w-full resize-none bg-transparent font-mono text-sm text-[#cdd6f4] p-4 outline-none leading-relaxed placeholder:text-white/20 overflow-y-auto"
            placeholder="LaTeX source will appear here…"
          />
        </div>

        {/* ── Right: PDF preview ── */}
        <div className={cn(
          "flex flex-col bg-muted/30 overflow-hidden",
          "w-full lg:w-1/2",
          activePane === "editor" ? "hidden lg:flex" : "flex"
        )}>
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border shrink-0">
            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">PDF Preview</span>
            {previewState === "ready" && (
              <span className="ml-auto text-xs text-emerald-500 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Compiled
              </span>
            )}
          </div>

          <div className="flex-1 flex items-center justify-center overflow-hidden">
            {previewState === "idle" && (
              <div className="text-center space-y-3 px-8">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                  <Eye className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">No preview yet</p>
                <p className="text-xs text-muted-foreground">Click <strong>Compile</strong> to render your PDF preview</p>
              </div>
            )}

            {previewState === "compiling" && (
              <div className="text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Compiling LaTeX…</p>
              </div>
            )}

            {previewState === "error" && (
              <div className="text-center space-y-3 px-8 max-w-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10">
                  <AlertCircle className="h-6 w-6 text-rose-500" />
                </div>
                <p className="text-sm font-semibold text-foreground">Compilation failed</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{previewError}</p>
                <p className="text-xs text-muted-foreground">Fix any LaTeX errors in the editor and try again.</p>
              </div>
            )}

            {previewState === "ready" && previewUrl && (
              <iframe
                src={`${previewUrl}#toolbar=0&navpanes=0`}
                className="w-full h-full border-0"
                title="Resume PDF Preview"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}