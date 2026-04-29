"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Building2, GraduationCap, MapPin, Search, Edit3, Share2, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import EditProfileModal from "./EditProfileModal";
import Image from "next/image";

export default function ProfileClient({ initialUser }: { initialUser: any }) {
  const [user, setUser] = useState(initialUser);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleShare = () => {
    const publicUrl = `${window.location.origin}/u/${user.clerkId}`;
    navigator.clipboard.writeText(publicUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full w-full p-6 sm:p-10 overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl">
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-lg relative">
          
          {/* Action Buttons Top Right */}
          <div className="absolute top-4 right-4 z-20 flex gap-2">
            <button
               onClick={handleShare}
               className="flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-white/30 transition-all active:scale-95 cursor-pointer"
            >
              {isCopied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
              {isCopied ? "Copied!" : "Share Profile"}
            </button>
            <button
               onClick={() => setIsEditModalOpen(true)}
               className="flex items-center gap-2 bg-white text-primary px-4 py-2 rounded-xl text-xs font-bold hover:bg-white/90 shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit Profile
            </button>
          </div>

          {/* Banner Section */}
          <div className="relative h-40 w-full bg-linear-to-r from-primary/80 to-primary sm:h-56">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          </div>
          
          <div className="relative px-6 pb-8 pt-16 sm:px-12 sm:pb-12">
            {/* Avatar / Profile Initial Badge */}
            <div className="absolute -top-16 left-6 sm:-top-20 sm:left-12">
              <div className="flex size-32 items-center justify-center rounded-full border-4 border-card bg-muted text-5xl font-bold text-muted-foreground shadow-lg sm:size-40 sm:text-6xl overflow-hidden">
                 {user.profile_photo ? (
                    <Image src={user.profile_photo} alt={user.firstName} width={160} height={160} className="w-full h-full object-cover" unoptimized />
                 ) : (
                    <span>{user.firstName?.charAt(0)}{user.lastName?.charAt(0)}</span>
                 )}
              </div>
              {user.openToConnect && (
                 <div className="absolute bottom-0 right-4 rounded-full border-4 border-card bg-emerald-500 size-6 sm:bottom-2 sm:right-6 sm:size-8 shadow-sm" title="Open to Connect"></div>
              )}
            </div>

            <div className="flex flex-col gap-6 pt-20 sm:flex-row sm:items-start sm:justify-between sm:pt-24">
              <div className="space-y-1">
                <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
                  {user.firstName} {user.lastName}
                </h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="font-medium text-primary uppercase text-xs tracking-wider">{user.role}</span>
                  <span className="text-muted-foreground/30">•</span>
                  <span className="flex items-center gap-1 text-sm font-medium">
                    <GraduationCap className="size-4 text-primary/60" />
                    Class of {user.graduationYear}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Badge variant="secondary" className="px-4 py-1.5 font-bold bg-primary/10 text-primary border-transparent">
                  {user.domain}
                </Badge>
              </div>
            </div>

            {/* Bio Section */}
            {user.bio && (
              <div className="mt-8 p-5 rounded-2xl bg-muted/30 border border-border/50">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">About</h2>
                <p className="text-sm text-foreground/80 leading-relaxed italic">
                  "{user.bio}"
                </p>
              </div>
            )}

            <div className="mt-10 grid gap-10 sm:grid-cols-2">
               <div className="space-y-5">
                  <h2 className="text-sm font-bold tracking-tight text-foreground/50 uppercase">Experience & Focus</h2>
                  
                  <div className="space-y-4">
                     {user.company && (
                        <div className="flex items-start gap-4">
                           <div className="rounded-xl bg-primary/5 p-2.5 text-primary">
                              <Building2 className="size-5" />
                           </div>
                           <div>
                              <p className="text-sm font-bold text-foreground leading-none">{user.company}</p>
                              <p className="text-[11px] font-semibold text-muted-foreground mt-1">Current Company</p>
                           </div>
                        </div>
                     )}
                     {user.roleTitle && (
                        <div className="flex items-start gap-4">
                           <div className="rounded-xl bg-primary/5 p-2.5 text-primary">
                              <Briefcase className="size-5" />
                           </div>
                           <div>
                              <p className="text-sm font-bold text-foreground leading-none">{user.roleTitle}</p>
                              <p className="text-[11px] font-semibold text-muted-foreground mt-1">Role / Position</p>
                           </div>
                        </div>
                     )}
                     {!user.company && !user.roleTitle && (
                         <div className="flex items-start gap-4 opacity-60">
                           <div className="rounded-xl bg-muted p-2.5 text-muted-foreground">
                              <Search className="size-5" />
                           </div>
                           <div>
                              <p className="text-sm font-bold leading-none">Exploring Opportunities</p>
                              <p className="text-[11px] font-semibold text-muted-foreground mt-1">Open to new roles</p>
                           </div>
                         </div>
                     )}
                  </div>
               </div>

               <div className="space-y-5">
                  <h2 className="text-sm font-bold tracking-tight text-foreground/50 uppercase">Technical Skills</h2>
                  <div className="flex flex-wrap gap-2">
                     {(user.skills ?? []).map((skill: string) => (
                         <Badge key={skill} variant="outline" className="rounded-xl border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/10 transition-colors">
                             {skill}
                         </Badge>
                     ))}
                  </div>
               </div>
            </div>

            {user.openToConnect && (
              <div className="mt-10 rounded-2xl border border-primary/20 bg-primary/5 p-5">
                 <div className="flex items-center gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
                       <MapPin className="size-6" />
                    </div>
                    <div>
                       <p className="text-sm font-bold text-foreground">Open for Connections</p>
                       <p className="text-xs text-muted-foreground font-medium mt-0.5">{user.firstName} is welcoming connection requests and mentorship messages.</p>
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <EditProfileModal
        user={user}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={(updated) => setUser(updated)}
      />
    </div>
  );
}
