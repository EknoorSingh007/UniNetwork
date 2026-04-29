"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { X, Check } from "lucide-react";

const ROLE_OPTIONS = ["STUDENT", "ALUMNI"] as const;
const DOMAIN_OPTIONS = ["Web", "App", "AI/ML", "CP", "Cybersecurity", "Cloud", "Data"] as const;

type Role = (typeof ROLE_OPTIONS)[number];
type University = { id: number; name: string; domain: string };

export default function OnboardingForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<Role>("STUDENT");
  const [graduationYear, setGraduationYear] = useState("");
  const [domain, setDomain] = useState("");
  const [universityId, setUniversityId] = useState<number | "">("");
  const [universities, setUniversities] = useState<University[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [company, setCompany] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [openToConnect, setOpenToConnect] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSkillDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetch("/api/universities")
      .then((r) => r.json())
      .then((data) => setUniversities(Array.isArray(data) ? data : []))
      .catch((e) => console.error("Failed to load universities", e));
  }, []);

  const addSkill = (value: string) => {
    const normalized = value.trim();
    if (!normalized) return;

    const exists = skills.some((item) => item.toLowerCase() === normalized.toLowerCase());
    if (exists) {
      setSkillInput("");
      setShowSkillDropdown(false);
      return;
    }

    setSkills([...skills, normalized]);
    setSkillInput("");
    setShowSkillDropdown(false);
  };

  const removeSkill = (value: string) => {
    setSkills(skills.filter((item) => item !== value));
  };

  useEffect(() => {
    const query = skillInput.trim();
    if (query.length < 1) {
      setSkillSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/skills?q=${encodeURIComponent(query)}`, { cache: "no-store" });
        if (!res.ok) {
           setSkillSuggestions([]);
           return;
        }

        const data = (await res.json()) as { skills?: string[] };
        const next = (data.skills ?? []).filter(
          (item) => !skills.some((selected) => selected.toLowerCase() === item.toLowerCase()),
        );
        setSkillSuggestions(next);
      } catch {
        setSkillSuggestions([]);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [skillInput, skills]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!firstName.trim() || !lastName.trim() || !graduationYear || !domain || universityId === "") {
      setError("Please fill all required fields.");
      return;
    }

    if (skills.length === 0) {
      setError("Please select at least one skill.");
      return;
    }

    setIsSubmitting(true);

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        role,
        graduationYear: Number(graduationYear),
        domain,
        universityId: Number(universityId),
        skills,
        company: company.trim() || null,
        roleTitle: roleTitle.trim() || null,
        openToConnect,
      }),
    });

    setIsSubmitting(false);

    if (!res.ok) {
      setError("Could not save onboarding details. Please try again.");
      return;
    }

    router.push("/home");
  };

  const inputClasses = "flex h-11 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">First Name</label>
          <input className={inputClasses} placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Last Name</label>
          <input className={inputClasses} placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Role</label>
          <select className={inputClasses} value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {ROLE_OPTIONS.map((option) => (
              <option key={option} value={option}>{option.charAt(0) + option.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Graduation Year</label>
          <input className={inputClasses} placeholder="2026" type="number" min={1990} max={2100} value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)} required />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Primary Domain</label>
          <select className={inputClasses} value={domain} onChange={(e) => setDomain(e.target.value)} required>
            <option value="" disabled>Select your primary area of expertise</option>
            {DOMAIN_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">University</label>
          <select className={inputClasses} value={universityId} onChange={(e) => setUniversityId(Number(e.target.value))} required>
            <option value="" disabled>Select your university</option>
            {universities.map((uni) => (
              <option key={uni.id} value={uni.id}>{uni.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Skills</label>
        <div className="relative" ref={dropdownRef}>
          <input
            className={inputClasses}
            placeholder="Type a skill (e.g. Next.js, Python) and press Enter"
            value={skillInput}
            onFocus={() => setShowSkillDropdown(true)}
            onChange={(e) => {
              setSkillInput(e.target.value);
              setShowSkillDropdown(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addSkill(skillInput);
              }
            }}
          />

          {showSkillDropdown && skillInput.trim() && (
            <div className="absolute top-[calc(100%+4px)] z-50 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80 zoom-in-95">
              <div className="max-h-[200px] overflow-auto p-1">
                {skillSuggestions.length > 0 ? (
                  skillSuggestions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => addSkill(option)}
                    >
                      {option}
                    </button>
                  ))
                ) : (
                  <button
                    type="button"
                    className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => addSkill(skillInput)}
                  >
                    Add "{skillInput.trim()}"
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {skills.map((skill) => (
              <span key={skill} className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-2.5 py-1 text-sm font-medium text-primary transition-colors hover:bg-primary/10">
                {skill}
                <button type="button" className="rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" onClick={() => removeSkill(skill)}>
                  <X className="size-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Company <span className="text-muted-foreground font-normal">(Optional)</span></label>
          <input className={inputClasses} placeholder="Google" value={company} onChange={(e) => setCompany(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Role/Title <span className="text-muted-foreground font-normal">(Optional)</span></label>
          <input className={inputClasses} placeholder="Software Engineer" value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} />
        </div>
      </div>

      <div className="flex items-center space-x-2 rounded-lg border p-4 shadow-sm">
        <button 
          type="button"
          onClick={() => setOpenToConnect(!openToConnect)}
          className={`peer size-5 shrink-0 rounded-sm border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${openToConnect ? 'bg-primary border-primary text-primary-foreground' : 'border-primary'}`}
        >
          {openToConnect && <Check className="size-4" />}
        </button>
        <div className="grid gap-1.5 leading-none">
          <label className="text-sm font-medium cursor-pointer" onClick={() => setOpenToConnect(!openToConnect)}>
            Open to connect
          </label>
          <p className="text-sm text-muted-foreground">
            Allow other members to find you and send messages
          </p>
        </div>
      </div>

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      <Button type="submit" className="w-full h-11 text-base shadow-md" disabled={isSubmitting}>
        {isSubmitting ? "Saving Profile..." : "Complete Profile"}
      </Button>
    </form>
  );
}