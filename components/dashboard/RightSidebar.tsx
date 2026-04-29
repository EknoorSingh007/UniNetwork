"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { UserPlus, MapPin, GraduationCap, Briefcase, Mail, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type RecommendedUser = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  roleTitle: string | null;
  company: string | null;
  domain: string | null;
  skills: string[];
  profile_photo: string | null;
  role: string;
  openToMentor: boolean;
  clerkId: string | null;
  similarity: number;
};

const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400",
  "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400",
  "bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/40 dark:text-fuchsia-400",
  "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
  "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
];

export default function RightSidebar() {
  const { user, isLoaded } = useUser();
  const [dbUser, setDbUser] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<RecommendedUser[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(true);

  useEffect(() => {
    if (user) {
      fetch("/api/me")
        .then(res => res.json())
        .then(data => setDbUser(data))
        .catch(err => console.error("Error fetching user data:", err));
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setLoadingRecs(true);
      fetch("/api/embeddings/recommend")
        .then(res => res.json())
        .then(data => {
          setRecommendations(data.recommendations || []);
        })
        .catch(err => console.error("Error fetching recommendations:", err))
        .finally(() => setLoadingRecs(false));
    }
  }, [user]);

  if (!isLoaded) return null;

  const firstName = user?.firstName || "User";
  const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`;
  const initials = `${user?.firstName?.charAt(0) || ""}${user?.lastName?.charAt(0) || ""}`;

  return (
    <aside className="hidden xl:flex flex-col w-[320px] shrink-0 h-screen sticky top-0 overflow-y-auto p-5 gap-6 bg-transparent">
      {/* User Profile Summary Card */}
      <div className="soft-card overflow-hidden">
        {/* Minified Banner */}
        <div className="h-16 w-full bg-linear-to-r from-primary/80 to-primary relative">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        </div>
        
        <div className="px-5 pb-5 relative">
          {/* Avatar Area */}
          <div className="absolute -top-10 left-5">
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt={firstName}
                className="h-20 w-20 rounded-2xl object-cover border-4 border-card shadow-lg"
              />
            ) : (
              <div className="h-20 w-20 rounded-2xl bg-card border-4 border-card flex items-center justify-center text-xl font-bold text-primary shadow-lg">
                {initials}
              </div>
            )}
          </div>

          <div className="pt-12">
            <h2 className="text-lg font-extrabold text-foreground tracking-tight leading-tight">
              {fullName}
            </h2>
            <p className="text-xs font-semibold text-primary mt-0.5">
              {dbUser?.roleTitle || "Student"}
            </p>
            
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground text-[11px] font-medium">
                <GraduationCap className="h-3.5 w-3.5 text-primary/60" />
                <span>{dbUser?.university?.name || "University"} · Cl. of {dbUser?.graduationYear || "2026"}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-[11px] font-medium">
                <Briefcase className="h-3.5 w-3.5 text-primary/60" />
                <span>{dbUser?.company || "Open to opportunities"}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-[11px] font-medium">
                <Mail className="h-3.5 w-3.5 text-primary/60" />
                <span className="truncate">{user?.primaryEmailAddress?.emailAddress}</span>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-1.5">
              {(dbUser?.skills?.slice(0, 3) || ["Networking", "Growth", "Career"]).map((skill: string) => (
                <Badge key={skill} variant="secondary" className="px-2 py-0 h-5 text-[9px] font-bold bg-primary/5 text-primary border-transparent hover:bg-primary/10">
                  {skill}
                </Badge>
              ))}
              {(dbUser?.skills?.length > 3) && (
                <span className="text-[9px] font-bold text-muted-foreground pl-1 leading-5">+{dbUser.skills.length - 3}</span>
              )}
            </div>
            
            <Link href="/profile" className="block w-full mt-5">
              <button className="w-full bg-primary text-white text-[11px] font-bold py-2.5 rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20 cursor-pointer">
                View Full Profile
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Recommended Mentors Card */}
      <div className="soft-card p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-foreground tracking-tight">Recommended Mentors</h3>
          <button className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors cursor-pointer">
            <span className="text-sm font-bold">...</span>
          </button>
        </div>

        <div className="space-y-4">
          {loadingRecs ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-primary/50" />
              <span className="ml-2 text-xs text-muted-foreground">Finding mentors...</span>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-xs text-muted-foreground">No recommendations yet.</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">Complete your profile to get personalized mentor suggestions.</p>
            </div>
          ) : (
            recommendations.map((mentor, i) => {
              const name = [mentor.firstName, mentor.lastName].filter(Boolean).join(" ") || "User";
              const mentorInitials = name.split(" ").map(n => n[0]).join("");
              const colorClass = AVATAR_COLORS[i % AVATAR_COLORS.length];

              return (
                <div key={mentor.id} className="flex items-center gap-3 group">
                  {mentor.profile_photo ? (
                    <img
                      src={mentor.profile_photo}
                      alt={name}
                      className="h-10 w-10 rounded-xl object-cover shrink-0 shadow-sm ring-1 ring-inset ring-black/5"
                    />
                  ) : (
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${colorClass} shadow-sm ring-1 ring-inset ring-black/5`}>
                      {mentorInitials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-extrabold text-foreground truncate group-hover:text-primary transition-colors">{name}</p>
                    <p className="text-[10px] text-muted-foreground font-medium truncate">
                      {mentor.roleTitle || mentor.domain || mentor.role}
                    </p>
                  </div>
                  <Link href={`/u/${mentor.clerkId}`}>
                    <button className="flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/10 hover:bg-primary hover:text-white px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap">
                      <UserPlus className="h-3 w-3" />
                      View
                    </button>
                  </Link>
                </div>
              );
            })
          )}
        </div>

        <button className="w-full mt-5 text-center text-[11px] font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer py-2 rounded-xl hover:bg-primary/5 border border-primary/10">
          Discover More Mentors
        </button>
      </div>
    </aside>
  );
}
