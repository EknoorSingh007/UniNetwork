"use client";

import { useState, useEffect } from "react";
import { X, Loader2, CheckCircle, Clock, XCircle, ChevronRight, MessageSquare, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ApplicantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunityId: number;
}

export default function ApplicantsModal({ isOpen, onClose, opportunityId }: ApplicantsModalProps) {
  const [applicants, setApplicants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchApplicants();
    }
  }, [isOpen, opportunityId]);

  const fetchApplicants = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}/applicants`);
      if (res.ok) {
        const data = await res.json();
        setApplicants(data);
      }
    } catch (err) {
      console.error("Failed to fetch applicants", err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (requestId: number, status: string) => {
    try {
      const res = await fetch(`/api/opportunities/applicants/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, status }),
      });
      if (res.ok) {
        setApplicants((prev) =>
          prev.map((app) => (app.id === requestId ? { ...app, status } : app))
        );
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="fixed inset-0" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-card border-2 border-border/80 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-border/50 bg-muted/20">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-foreground">Applicants</h2>
            <p className="text-sm font-medium text-muted-foreground mt-1">Review and manage referral requests</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Loading applicants...</p>
            </div>
          ) : applicants.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold">No applicants yet</h3>
              <p className="text-muted-foreground text-sm mt-2">When students apply, they will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applicants.map((app) => (
                <div key={app.id} className="flex flex-col sm:flex-row gap-4 p-5 rounded-2xl border border-border/60 bg-card hover:border-primary/30 transition-colors">
                  
                  {/* Applicant Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="size-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                      {app.requestor.profile_photo ? (
                        <Image src={app.requestor.profile_photo} alt="Avatar" width={48} height={48} className="object-cover w-full h-full" />
                      ) : (
                        <span className="text-primary font-bold">{app.requestor.firstName?.[0] || ""}{app.requestor.lastName?.[0] || ""}</span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-base flex items-center gap-2">
                        {app.requestor.firstName} {app.requestor.lastName}
                      </h4>
                      <div className="flex flex-col gap-1.5 mt-1">
                        <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
                          <span>{app.requestor.roleTitle || "Student"}</span>
                          {app.requestor.graduationYear && (
                            <>
                              <span className="size-1 rounded-full bg-muted-foreground/30" />
                              <span>Class of {app.requestor.graduationYear}</span>
                            </>
                          )}
                        </div>
                        
                        {/* Resume Info */}
                        {(app.resumeUrl || app.resumeText) && (
                          <div className="flex gap-2">
                            {app.resumeUrl && (
                              <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline bg-primary/5 px-2 py-1 rounded-md">
                                <LinkIcon className="h-3 w-3" />
                                Resume Link
                              </a>
                            )}
                            {app.resumeText && (
                              <div className="group/resume relative cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-md">
                                <MessageSquare className="h-3 w-3" />
                                Cover Letter
                                <div className="absolute top-full left-0 mt-2 w-64 p-3 bg-card border border-border shadow-xl rounded-xl opacity-0 group-hover/resume:opacity-100 pointer-events-none group-hover/resume:pointer-events-auto transition-opacity z-10 text-xs text-foreground font-normal whitespace-pre-wrap">
                                  {app.resumeText}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-border/50 sm:border-t-0">
                    
                    <div className="flex items-center gap-2">
                      <select 
                        value={app.status}
                        onChange={(e) => updateStatus(app.id, e.target.value)}
                        className={cn(
                          "text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-xl border appearance-none outline-none transition-colors cursor-pointer",
                          app.status === "Pending" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                          app.status === "Reviewed" ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                          app.status === "Referred" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                          "bg-rose-500/10 text-rose-600 border-rose-500/20"
                        )}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Reviewed">Reviewed</option>
                        <option value="Referred">Referred</option>
                        <option value="Not Now">Not Now</option>
                      </select>
                    </div>

                    <Link href={`/u/${app.requestor.clerkId}`}>
                      <Button variant="outline" size="sm" className="rounded-xl h-9 text-xs font-bold">
                        Profile
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
