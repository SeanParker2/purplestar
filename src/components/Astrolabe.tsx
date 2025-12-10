"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AstrolabeProps {
  yearStr?: string; // e.g. "乙巳年"
  termStr?: string; // e.g. "大雪初候"
  className?: string;
}

export function Astrolabe({ 
  yearStr = "乙巳年", 
  termStr = "大雪初候",
  className 
}: AstrolabeProps) {
  return (
    <div className={cn("relative w-[320px] h-[320px] flex justify-center items-center", className)}>
      {/* Vertical Date - Eastern Style */}
      <div 
        className="absolute z-10 font-serif text-[28px] h-[180px] text-text-main tracking-[10px] pl-[15px] border-l border-[rgba(212,175,55,0.3)] [writing-mode:vertical-rl] [text-orientation:upright]"
        style={{ textShadow: "0 0 15px rgba(255,255,255,0.5)" }}
      >
        {yearStr}
        <span 
          className="text-[14px] text-gold-dark mt-[10px] inline-block tracking-[0]" 
          style={{ textOrientation: 'upright' }} // Ensure vertical text
        >
          {termStr}
        </span>
      </div>

      {/* Ring 1 - Outer Dashed */}
      <div
        className="absolute w-[320px] h-[320px] rounded-full border border-dashed border-[rgba(255,255,255,0.05)] animate-spin-slow"
      />

      {/* Ring 2 - Middle Solid Reverse */}
      <div
        className="absolute w-[240px] h-[240px] rounded-full border border-[rgba(255,255,255,0.08)] animate-spin-reverse"
      />

      {/* Ring 3 - Inner Dotted Gold */}
      <div
        className="absolute w-[180px] h-[180px] rounded-full border border-dotted border-[rgba(212,175,55,0.2)] animate-spin-medium"
      />
    </div>
  );
}
