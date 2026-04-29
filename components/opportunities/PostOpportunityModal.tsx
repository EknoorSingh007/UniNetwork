"use client";

import { useState } from "react";
import { X, Briefcase, MapPin, DollarSign, Calendar, Target, Loader2, Sparkles, Send, Globe, Layout, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PostOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostAdded: () => void;
}

export default function PostOpportunityModal({ isOpen, onClose, onPostAdded }: PostOpportunityModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    type: "Internship",
    description: "",
    skills: [] as string[],
    salary: "",
    location: "",
    outcomes: "",
    applicationLink: "",
    deadline: "",
  });
  const [skillInput, setSkillInput] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addSkill = () => {
    const val = skillInput.trim();
    if (val && !formData.skills.includes(val)) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, val] }));
      setSkillInput("");
    }
  };

  const removeSkill = (s: string) => {
    setFormData(prev => ({ ...prev, skills: prev.skills.filter(i => i !== s) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/opportunities", {
        method: "POST",
        body: JSON.stringify(formData),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        onPostAdded();
        onClose();
        setFormData({
          title: "",
          type: "Internship",
          description: "",
          skills: [],
          salary: "",
          location: "",
          outcomes: "",
          applicationLink: "",
          deadline: "",
        });
      } else {
        alert("Failed to post opportunity");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const inputClasses = "w-full bg-muted/30 focus:bg-card/50 rounded-2xl px-5 py-3.5 text-sm font-medium outline-none border border-border/50 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all duration-300";
  const labelClasses = "text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 mb-2 block ml-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-500">
      <div className="bg-card w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.4)] border border-border/50 flex flex-col animate-in zoom-in-95 duration-500">
        
        {/* Header */}
        <div className="relative px-8 pt-8 pb-6 bg-linear-to-b from-primary/5 to-transparent border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                 <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                    <Briefcase className="size-5" />
                 </div>
                 <h2 className="text-2xl font-black tracking-tighter">Share Opportunity</h2>
              </div>
              <p className="text-xs font-bold text-muted-foreground ml-1">Connect your network with exclusive roles and career growth.</p>
            </div>
            <button onClick={onClose} className="p-3 rounded-2xl bg-muted/40 hover:bg-muted text-foreground/50 hover:text-foreground transition-all duration-300">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1">
              <label className={labelClasses}>Job Title</label>
              <div className="relative group">
                <Layout className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                <input 
                  name="title" 
                  value={formData.title} 
                  onChange={handleChange} 
                  placeholder="e.g. Senior Frontend Architect" 
                  className={cn(inputClasses, "pl-11")} 
                  required 
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelClasses}>Work Commitment</label>
              <select name="type" value={formData.type} onChange={handleChange} className={inputClasses}>
                <option value="Internship">Internship</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className={labelClasses}>Technical Context & Description</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              rows={4} 
              placeholder="Detail the stack, team mission, and core responsibilities..." 
              className={cn(inputClasses, "resize-none min-h-[120px]")} 
              required 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1">
              <label className={labelClasses}>Financial Range</label>
              <div className="relative group">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                <input 
                  name="salary" 
                  value={formData.salary} 
                  onChange={handleChange} 
                  placeholder="e.g. $12k - $15k" 
                  className={cn(inputClasses, "pl-11")} 
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelClasses}>Base Location</label>
              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                <input 
                  name="location" 
                  value={formData.location} 
                  onChange={handleChange} 
                  placeholder="e.g. SF / Bangalore / Remote" 
                  className={cn(inputClasses, "pl-11")} 
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className={labelClasses}>Success Outcomes</label>
            <div className="relative">
              <Target className="absolute left-4 top-4 size-4 text-muted-foreground/40" />
              <textarea 
                name="outcomes" 
                value={formData.outcomes} 
                onChange={handleChange} 
                rows={2} 
                placeholder="What project milestones or skills will the applicant own?" 
                className={cn(inputClasses, "pl-11 resize-none h-20")} 
              />
            </div>
          </div>

          <div className="space-y-4">
             <label className={labelClasses}>Required Skillset</label>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40" />
                  <input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                    placeholder="Press enter to add skill"
                    className={cn(inputClasses, "pl-11 pr-14")}
                  />
                  <button type="button" onClick={addSkill} className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-white size-10 rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20">
                     <Plus className="size-5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[50px] p-2 rounded-2xl border border-dashed border-border/50 bg-muted/10 content-start">
                   {formData.skills.map((skill) => (
                     <span key={skill} className="inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl bg-card border border-border shadow-sm text-xs font-bold animate-in zoom-in-50">
                       {skill}
                       <button onClick={() => removeSkill(skill)} className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                          <X className="size-3" />
                       </button>
                     </span>
                   ))}
                   {formData.skills.length === 0 && <span className="text-[10px] m-auto font-bold text-muted-foreground/40 uppercase tracking-widest text-center py-2">Added skills appear here</span>}
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1">
              <label className={labelClasses}>Application link</label>
              <div className="relative group">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                <input 
                  name="applicationLink" 
                  value={formData.applicationLink} 
                  onChange={handleChange} 
                  placeholder="Official URL" 
                  className={cn(inputClasses, "pl-11")} 
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelClasses}>Submission Deadline</label>
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                <input 
                  name="deadline" 
                  type="date" 
                  value={formData.deadline} 
                  onChange={handleChange} 
                  className={cn(inputClasses, "pl-11")} 
                />
              </div>
            </div>
          </div>
        </form>

        {/* Action Footer */}
        <div className="p-8 bg-muted/20 border-t border-border/40 flex items-center justify-between gap-6">
           <button type="button" onClick={onClose} className="text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors px-6">
             Discard
           </button>
           <div className="flex gap-4 flex-1 max-w-[340px]">
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting} 
                className="w-full h-14 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all relative overflow-hidden"
              >
                {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : (
                  <span className="flex items-center gap-3">
                    <Send className="size-4" />
                    Publish Opportunity
                  </span>
                 )}
              </Button>
           </div>
        </div>
      </div>
    </div>
  );
}
