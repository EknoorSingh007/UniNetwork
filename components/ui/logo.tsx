import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import logoIcon from "@/app/favicon.ico";

export const Logo = ({ className }: { className?: string }) => {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <Image
        src={logoIcon}
        alt="GradLoop Logo"
        width={40}
        height={40}
        className="w-full h-full object-contain"
        priority
      />
    </div>
  );
};
