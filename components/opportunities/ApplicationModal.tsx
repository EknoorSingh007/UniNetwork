"use client";

import { useState } from "react";
import { X, Loader2, Link as LinkIcon, Sparkles, Send, CheckCircle2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: any;
  onSuccess: () => void;
}

export default function ApplicationModal({ isOpen, onClose, opportunity, onSuccess }: ApplicationModalProps) {
  const [resumeUrl, setResumeUrl] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"link" | "text">("text");
  const [errorMsg, setErrorMsg] = useState("");
  const [needsConnection, setNeedsConnection] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const generateResume = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/opportunities/apply/generate-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opportunityId: opportunity.id })
      });
      const data = await res.json();
      if (res.ok) {
        setResumeText(data.text);
      } else {
        alert(data.error || "Failed to generate resume summary.");
      }
    } catch (err) {
      alert("An error occurred during generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg("");
    setNeedsConnection(false);
    try {
      const res = await fetch("/api/opportunities/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          opportunityId: opportunity.id,
          resumeUrl: activeTab === "link" ? resumeUrl : null,
          resumeText: activeTab === "text" ? resumeText : null,
        })
      });
      const data = await res.json();
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        if (res.status === 403 && data.error.includes("connect")) {
          setNeedsConnection(true);
        }
        setErrorMsg(data.error || "Failed to submit application.");
      }
    } catch (err) {
      setErrorMsg("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const res = await fetch("/api/connections/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: opportunity.authorId }),
      });
      const data = await res.json();
      if (res.ok || res.status === 409) {
        setNeedsConnection(false);
        setErrorMsg("");
        // After sending request, retry application submission
        handleSubmit();
      } else {
        setErrorMsg(data.error || "Failed to send connection request");
      }
    } catch (error) {
      setErrorMsg("Failed to connect");
    } finally {
      setIsConnecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="fixed inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-card border-2 border-border/80 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 p-6 sm:p-8">
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-foreground">Apply Now</h2>
            <p className="text-sm font-medium text-muted-foreground mt-1">
              Applying for <span className="font-bold text-foreground">{opportunity.title}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex p-1 bg-muted/30 rounded-2xl mb-6">
          <button
            className={cn("flex-1 py-2 text-xs font-bold rounded-xl transition-all", activeTab === "text" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}
            onClick={() => setActiveTab("text")}
          >
            Generate / Paste Text
          </button>
          <button
            className={cn("flex-1 py-2 text-xs font-bold rounded-xl transition-all", activeTab === "link" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}
            onClick={() => setActiveTab("link")}
          >
            Resume URL
          </button>
        </div>

        {activeTab === "link" ? (
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Google Drive / Portfolio Link</label>
            <div className="relative">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50" />
              <input 
                type="url"
                value={resumeUrl}
                onChange={(e) => setResumeUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-muted/20 border-2 border-border/60 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Cover Letter / Summary</label>
              <Button onClick={generateResume} disabled={isGenerating} variant="outline" size="sm" className="h-8 text-[10px] font-bold rounded-lg border-primary/20 text-primary hover:bg-primary/5">
                {isGenerating ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                Generate with AI
              </Button>
            </div>
            <textarea 
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your cover letter or click Generate..."
              className="w-full h-40 bg-muted/20 border-2 border-border/60 rounded-2xl p-4 text-sm font-medium focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none"
            />
          </div>
        )}

        <div className="mt-8 flex justify-between items-center gap-3">
          <div className="flex-1">
            {errorMsg && (
              <p className="text-xs font-bold text-rose-500 bg-rose-500/10 px-3 py-2 rounded-lg inline-block">
                {errorMsg}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold">Cancel</Button>
            
            {needsConnection ? (
              <Button 
                onClick={handleConnect} 
                disabled={isConnecting}
                className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 px-8"
              >
                {isConnecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                Connect & Apply
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || (activeTab === "link" && !resumeUrl) || (activeTab === "text" && !resumeText)}
                className="rounded-xl font-bold bg-primary text-white shadow-lg shadow-primary/20 px-8"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Submit Application
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
