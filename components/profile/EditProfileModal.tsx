"use client";

import { useState, useRef, useEffect } from "react";
import { X, Check, Loader2, Camera, User, Briefcase, GraduationCap, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

const DOMAIN_OPTIONS = ["Web", "App", "AI/ML", "CP", "Cybersecurity", "Cloud", "Data"] as const;

interface EditProfileModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedUser: any) => void;
}

export default function EditProfileModal({ user, isOpen, onClose, onUpdate }: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    bio: user.bio || "",
    graduationYear: user.graduationYear || "",
    domain: user.domain || "",
    company: user.company || "",
    roleTitle: user.roleTitle || "",
    openToConnect: user.openToConnect ?? true,
    profile_photo: user.profile_photo || "",
    skills: user.skills || [],
  });

  const [skillInput, setSkillInput] = useState("");
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggle = (name: string) => {
    setFormData((prev: any) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      if (!supabase) throw new Error("Supabase not configured");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.clerkId}-${Date.now()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("media")
        .getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, profile_photo: publicUrl }));
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !formData.skills.includes(trimmed)) {
      setFormData((prev) => ({ ...prev, skills: [...prev.skills, trimmed] }));
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData((prev) => ({ ...prev, skills: prev.skills.filter((s: string) => s !== skill) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      onUpdate(data);
      onClose();
    } catch (err: any) {
      console.error("Update error:", err);
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const inputClasses = "w-full bg-muted/40 rounded-xl px-4 py-2.5 text-sm outline-none border border-border/50 focus:border-primary/30 focus:bg-card transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border border-border animate-in zoom-in-95 duration-300">
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-card/80 backdrop-blur-md border-b border-border/50">
          <h2 className="text-xl font-bold tracking-tight">Edit Profile</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="size-28 rounded-3xl overflow-hidden bg-muted border-4 border-card shadow-xl ring-1 ring-border">
                {formData.profile_photo ? (
                  <Image src={formData.profile_photo} alt="Profile" width={112} height={112} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-muted-foreground uppercase">
                    {formData.firstName?.[0]}{formData.lastName?.[0]}
                  </div>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 bg-primary text-white p-2.5 rounded-2xl shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageUpload} />
            </div>
            <p className="text-xs text-muted-foreground font-medium">Click the camera to upload a new photo</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">First Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                <input name="firstName" value={formData.firstName} onChange={handleChange} className={`${inputClasses} pl-10`} required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Last Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                <input name="lastName" value={formData.lastName} onChange={handleChange} className={`${inputClasses} pl-10`} required />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Bio / Description</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={3}
              placeholder="Tell us about yourself..."
              className={`${inputClasses} resize-none`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Company</label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                <input name="company" value={formData.company} onChange={handleChange} placeholder="e.g. Google" className={`${inputClasses} pl-10`} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Role Title</label>
              <div className="relative">
                <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                <input name="roleTitle" value={formData.roleTitle} onChange={handleChange} placeholder="e.g. Software Engineer" className={`${inputClasses} pl-10`} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Graduation Year</label>
              <div className="relative">
                <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                <input name="graduationYear" type="number" value={formData.graduationYear} onChange={handleChange} className={`${inputClasses} pl-10`} required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Domain</label>
              <select name="domain" value={formData.domain} onChange={handleChange} className={inputClasses} required>
                {DOMAIN_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Skills</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.skills.map((skill: string) => (
                <span key={skill} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors">
                  {skill}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeSkill(skill)} />
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill(skillInput))}
                placeholder="Add a skill..."
                className={inputClasses}
              />
              <Button type="button" variant="outline" onClick={() => addSkill(skillInput)} className="rounded-xl px-6">Add</Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-5 rounded-2xl bg-muted/30 border border-border/50">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${formData.openToConnect ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold">Open to connect</p>
                <p className="text-xs text-muted-foreground font-medium">Show 'Open' status on your profile</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleToggle("openToConnect")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.openToConnect ? 'bg-primary' : 'bg-muted-foreground/30'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.openToConnect ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {error && <p className="text-sm font-medium text-destructive px-1">{error}</p>}

          <div className="flex gap-4 pt-4 sticky bottom-0 bg-card/80 backdrop-blur-md mt-6 -mx-6 px-6 pb-6 border-t border-border/50">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-2xl h-12 font-bold transition-all hover:bg-muted active:scale-95">Cancel</Button>
            <Button type="submit" disabled={isSubmitting || isUploading} className="flex-1 rounded-2xl h-12 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95">
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
