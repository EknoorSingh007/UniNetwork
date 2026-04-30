"use client";

import { useEffect, useState } from "react";
import { Briefcase, Plus, Loader2, Search, Filter, TrendingUp, Compass, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import OpportunityCard from "@/components/opportunities/OpportunityCard";
import MyApplicationCard from "@/components/opportunities/MyApplicationCard";
import PostOpportunityModal from "@/components/opportunities/PostOpportunityModal";

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"discover" | "applications">("discover");

  const fetchOpportunities = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/opportunities");
      if (res.ok) {
        const data = await res.json();
        setOpportunities(data);
      }
      const appRes = await fetch("/api/user/applications");
      if (appRes.ok) {
        const appData = await appRes.json();
        setApplications(appData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const filteredOpportunities = opportunities.filter((op) =>
    op.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    op.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full w-full p-6 sm:p-10 overflow-y-auto bg-background/50">
      <div className="max-w-5xl mx-auto w-full space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pb-2">
          <div className="space-y-1.5 text-left">
            <div className="flex items-center gap-2.5 text-primary">
              <div className="p-2 rounded-xl bg-primary/10">
                <Briefcase className="h-5 w-5" />
              </div>
              <h1 className="text-3xl font-black tracking-tighter text-foreground sm:text-4xl">Opportunities</h1>
            </div>
            <p className="text-muted-foreground font-medium text-sm sm:text-base ml-1">
              Discover and share career growth within your alumni network.
            </p>
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="group relative rounded-2xl px-6 py-3.5 h-auto font-black text-[10px] uppercase tracking-widest bg-primary text-white shadow-[0_10px_30px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_15px_40px_rgba(var(--primary-rgb),0.5)] transition-all duration-500 hover:scale-[1.02] active:scale-95 overflow-hidden"
          >
            <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <div className="relative flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors">
                <Plus className="h-4 w-4" />
              </div>
              Post Opportunity
            </div>
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 p-1 bg-muted/40 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab("discover")}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              activeTab === "discover" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            <Compass className="h-4 w-4" /> Discover
          </button>
          <button
            onClick={() => setActiveTab("applications")}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              activeTab === "applications" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            <FileText className="h-4 w-4" /> My Applications
            {applications.length > 0 && (
              <span className="ml-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px]">{applications.length}</span>
            )}
          </button>
        </div>

        {activeTab === "discover" ? (
          <>
            {/* Search Section */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
               <div className="md:col-span-12 relative">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40" />
                  <input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title, skills, or description..." 
                    className="w-full bg-card rounded-3xl pl-14 pr-6 py-5 text-sm font-bold border-2 border-border/80 shadow-sm focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                  />
               </div>
            </div>

            {/* List of Opportunities */}
            <div className="space-y-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="relative">
                    <div className="size-16 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                    <Briefcase className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary/40" />
                  </div>
                  <p className="text-muted-foreground font-bold animate-pulse tracking-wide uppercase text-xs">Fetching opportunities...</p>
                </div>
              ) : filteredOpportunities.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {filteredOpportunities.map((op) => (
                    <OpportunityCard key={op.id} opportunity={op} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-24 bg-card/40 rounded-[2.5rem] border-2 border-dashed border-border/50">
                  <div className="p-5 rounded-full bg-muted/50 w-fit mx-auto mb-4">
                     <Search className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-bold">No opportunities found</h3>
                  <p className="text-muted-foreground text-sm max-w-[280px] mx-auto mt-2">
                    We couldn't find any opportunities matching your current search.
                  </p>
                  <Button variant="secondary" onClick={() => setSearchQuery("")} className="mt-6 rounded-xl font-bold">Clear Search</Button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : applications.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 animate-in fade-in duration-500">
                {applications.map((app) => (
                  <MyApplicationCard key={app.id} application={app} />
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-card/40 rounded-[2.5rem] border-2 border-dashed border-border/50">
                <div className="p-5 rounded-full bg-muted/50 w-fit mx-auto mb-4">
                   <FileText className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold">No applications yet</h3>
                <p className="text-muted-foreground text-sm mt-2">
                  When you apply for opportunities, they will appear here.
                </p>
                <Button variant="secondary" onClick={() => setActiveTab("discover")} className="mt-6 rounded-xl font-bold">Discover Opportunities</Button>
              </div>
            )}
          </div>
        )}
      </div>

      <PostOpportunityModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onPostAdded={fetchOpportunities}
      />
    </div>
  );
}
