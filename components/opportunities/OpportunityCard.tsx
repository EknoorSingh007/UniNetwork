"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { 
  Briefcase, MapPin, DollarSign, Calendar, Sparkles, 
  Target, Zap, Loader2, CheckCircle2, ChevronDown,
  ChevronUp, Globe, Building2, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface OpportunityCardProps {
  opportunity: any;
}

export default function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const [isApplying, setIsApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleQuickApply = async () => {
    if (opportunity.applicationLink) {
      window.open(opportunity.applicationLink, "_blank", "noopener,noreferrer");
      setApplied(true);
      return;
    }

    setIsApplying(true);
    try {
      const res = await fetch("/api/opportunities/apply", {
        method: "POST",
        body: JSON.stringify({ opportunityId: opportunity.id }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setApplied(true);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to apply");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setIsApplying(false);
    }
  };

  const authorInitials = `${opportunity.author?.firstName?.[0] || ""}${opportunity.author?.lastName?.[0] || ""}`;

  return (
    <div className="group relative overflow-hidden bg-card/40 backdrop-blur-xl border-2 border-border hover:border-primary/30 rounded-[2.5rem] transition-all duration-500 hover:shadow-[0_20px_50px_rgba(var(--primary-rgb),0.05)]">
      {/* Decorative Gradient Background */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500" />
      
      <div className="relative z-10 p-8 flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex gap-5">
            <Link href={`/u/${opportunity.author?.clerkId}`} className="relative shrink-0 group/avatar">
              <div className="size-14 rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center overflow-hidden transition-all duration-500 group-hover/avatar:scale-105 shadow-sm">
                {opportunity.author?.profile_photo ? (
                  <Image src={opportunity.author.profile_photo} alt="Avatar" width={56} height={56} className="object-cover w-full h-full" />
                ) : (
                  <span className="text-primary font-black text-lg">{authorInitials}</span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 size-4 bg-emerald-500 border-2 border-card rounded-full shadow-sm" />
            </Link>
            
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-xl font-black tracking-tight text-foreground group-hover:text-primary transition-colors duration-300">
                  {opportunity.title}
                </h3>
                <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-transparent rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
                  {opportunity.type}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-4 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  <User className="size-2 text-muted-foreground" />
                </div>
                <span className="text-xs font-bold text-muted-foreground">
                  Posted by <span className="text-foreground hover:text-primary transition-colors cursor-pointer">{opportunity.author?.firstName} {opportunity.author?.lastName}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 self-end md:self-center">
            {opportunity.applicationLink && (
               <Button variant="outline" onClick={() => window.open(opportunity.applicationLink, "_blank")} className="rounded-2xl border-border hover:bg-muted text-xs font-bold gap-2 px-5 h-12 shadow-sm transition-all active:scale-95">
                 <Globe className="size-4" />
                 Company Site
               </Button>
            )}
            <Button
              onClick={handleQuickApply}
              disabled={isApplying || applied}
              className={cn(
                "rounded-2xl px-10 h-12 font-black text-xs uppercase tracking-widest transition-all duration-500 shadow-xl active:scale-95 group/btn overflow-hidden relative",
                applied 
                  ? "bg-emerald-500 text-white shadow-emerald-500/20" 
                  : "bg-primary hover:bg-primary/95 text-white shadow-primary/20 hover:shadow-primary/40"
              )}
            >
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
              
              {isApplying ? (
                <Loader2 className="h-4 w-4 animate-spin font-bold" />
              ) : applied ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Applied
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 fill-current" />
                  {opportunity.applicationLink ? "Quick Apply" : "Apply Now"}
                </div>
              )}
            </Button>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Left Column - Specs */}
          <div className="flex flex-col gap-4 min-w-[200px]">
             {[
               { icon: DollarSign, label: "Salary", value: opportunity.salary || "Negotiable" },
               { icon: MapPin, label: "Location", value: opportunity.location || "Remote" },
               { icon: Building2, label: "Env", value: "Hybrid/Onsite" },
               { icon: Calendar, label: "Deadline", value: opportunity.deadline ? new Date(opportunity.deadline).toLocaleDateString() : "Rolling" }
             ].map((spec, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-muted/20 border border-border/50 hover:border-primary/20 transition-colors group/spec">
                  <div className="size-10 rounded-xl bg-card border border-border/50 flex items-center justify-center text-primary shadow-sm group-hover/spec:scale-110 transition-transform">
                    <spec.icon className="size-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">{spec.label}</span>
                    <span className="text-xs font-extrabold text-foreground">{spec.value}</span>
                  </div>
                </div>
             ))}
          </div>

          {/* Right Column - Content */}
          <div className="flex-1 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-primary" />
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">About the Role</h4>
              </div>
              <div className={cn(
                "relative text-sm text-foreground/80 leading-relaxed font-medium transition-all duration-500",
                !isExpanded && "line-clamp-3"
              )}>
                {opportunity.description}
                {!isExpanded && (
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-linear-to-t from-card/40 to-transparent pointer-events-none" />
                )}
              </div>
            </div>

            {/* Expansible Content - Outcomes Only */}
            <div className={cn(
              "space-y-8 overflow-hidden transition-all duration-700 ease-in-out",
              isExpanded && opportunity.outcomes ? "max-h-[500px] opacity-100 mt-8" : "max-h-0 opacity-0"
            )}>
              {opportunity.outcomes && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-primary" />
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Learning Outcomes</h4>
                  </div>
                  <div className="p-6 rounded-4xl bg-primary/5 border border-primary/10 relative overflow-hidden">
                    <Target className="absolute -bottom-4 -right-4 size-20 text-primary/5" />
                    <p className="text-xs text-foreground/80 leading-relaxed italic font-medium relative z-10">
                      "{opportunity.outcomes}"
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Required Skillset - ALWAYS VISIBLE */}
            <div className="space-y-4 pt-2">
               <div className="flex items-center gap-2">
                 <div className="size-1.5 rounded-full bg-primary" />
                 <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Required Skillset</h4>
               </div>
               <div className="flex flex-wrap gap-2">
                {opportunity.skills?.map((skill: string) => (
                  <div key={skill} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border/60 hover:border-primary/30 transition-colors duration-300 group/skill">
                    <Sparkles className="size-3 text-primary/60 group-hover/skill:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold text-foreground">{skill}</span>
                  </div>
                ))}
                {!opportunity.skills?.length && (
                  <div className="text-[10px] font-medium text-muted-foreground italic bg-muted/20 px-4 py-2 rounded-xl border border-dashed border-border/40">
                    Standard technical skills
                  </div>
                )}
               </div>
            </div>

            {/* Expand Toggle */}
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/70 transition-all duration-300 group/expand pt-2"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="size-4 group-hover/expand:-translate-y-0.5 transition-transform" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="size-4 group-hover/expand:translate-y-0.5 transition-transform" />
                  View Full Details
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
