"use client";

import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Calendar, ExternalLink, MessageSquare, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface MyApplicationCardProps {
  application: any;
}

export default function MyApplicationCard({ application }: MyApplicationCardProps) {
  const { opportunity, status, resumeUrl, resumeText, createdAt } = application;

  return (
    <div className="bg-card/40 backdrop-blur-xl border-2 border-border rounded-3xl p-6 transition-all duration-300 hover:border-primary/30">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-black tracking-tight text-foreground">
                {opportunity.title}
              </h3>
              <p className="text-xs font-bold text-muted-foreground mt-1 flex items-center gap-2">
                <Building2 className="h-3 w-3" />
                {opportunity.author?.company || opportunity.author?.firstName + "'s Company"}
              </p>
            </div>
            <Badge className={cn(
              "px-3 py-1 text-[10px] font-black uppercase tracking-widest",
              status === "Pending" ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20" :
              status === "Reviewed" ? "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20" :
              status === "Referred" ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" :
              "bg-rose-500/10 text-rose-600 hover:bg-rose-500/20"
            )}>
              {status}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {opportunity.location || "Remote"}</span>
            <span className="size-1 rounded-full bg-border" />
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Applied {new Date(createdAt).toLocaleDateString()}</span>
          </div>

          <div className="pt-3 border-t border-border/50 flex flex-wrap items-center gap-2">
            {resumeUrl && (
              <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-xl transition-colors">
                <LinkIcon className="h-3 w-3" /> View Submitted Link
              </a>
            )}
            {resumeText && (
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-xl">
                <MessageSquare className="h-3 w-3" /> Summary Generated
              </div>
            )}
            {opportunity.applicationLink && (
              <a href={opportunity.applicationLink} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground bg-muted hover:bg-muted/80 px-3 py-1.5 rounded-xl transition-colors">
                Opportunity Link <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
