"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { type Star } from "@/lib/ziwei";

export interface FateCardProps {
  palaceName: string; // e.g. "命宫"
  stemBranch: string; // e.g. "甲子"
  majorStars: Star[]; 
  minorStars: Star[];
  adjectiveStars?: Star[]; // Added to match HTML structure better if available
  className?: string;
  variant?: "focus" | "grid"; // focus = large card, grid = small card
  onClick?: () => void;
  isActive?: boolean;
}

export function FateCard({
  palaceName,
  stemBranch,
  majorStars,
  minorStars,
  adjectiveStars = [],
  className,
  variant = "focus",
  onClick,
  isActive
}: FateCardProps) {
  // If it's the grid variant, we use a simpler layout (similar to previous implementation but styled consistently)
  if (variant === "grid") {
    return (
      <div 
        onClick={onClick}
        className={cn(
          "relative flex flex-col p-2 rounded-lg transition-all duration-300 border backdrop-blur-sm cursor-pointer min-h-[80px]",
          isActive 
            ? "bg-gold-primary text-void-bg border-gold-primary font-bold shadow-[0_0_10px_rgba(229,195,101,0.4)] scale-105" 
            : "border-white/5 bg-white/5 text-text-muted hover:bg-white/10 hover:border-white/10",
          className
        )}
      >
        <div className="text-[12px] font-serif mb-1">{palaceName}</div>
        <div className="text-[9px] opacity-60 font-mono">{stemBranch.charAt(1)}</div>
      </div>
    );
  }

  // Focus Variant - The "Pro" Card
  const bgChar = palaceName.charAt(0);

  return (
    <div 
      className={cn(
        "relative w-full h-[480px] rounded-[8px] p-[30px] flex flex-col overflow-hidden",
        "bg-[linear-gradient(160deg,rgba(30,30,40,0.6),rgba(10,10,12,0.8))]",
        "backdrop-blur-[20px]",
        "border border-[rgba(255,255,255,0.08)]",
        "shadow-[0_20px_60px_rgba(0,0,0,0.6)]",
        // 3D Effects
        "[transform:rotateX(2deg)_scale(0.98)]",
        "transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
        "hover:[transform:rotateX(0deg)_scale(1)]",
        "hover:shadow-[0_30px_80px_rgba(0,0,0,0.8)]",
        className
      )}
      onClick={onClick}
    >
      {/* Corners */}
      <div className="absolute top-[10px] left-[10px] w-[20px] h-[20px] border border-gold-primary border-r-0 border-b-0 opacity-60 transition-opacity duration-500" />
      <div className="absolute top-[10px] right-[10px] w-[20px] h-[20px] border border-gold-primary border-l-0 border-b-0 opacity-60 transition-opacity duration-500" />
      <div className="absolute bottom-[10px] left-[10px] w-[20px] h-[20px] border border-gold-primary border-r-0 border-t-0 opacity-60 transition-opacity duration-500" />
      <div className="absolute bottom-[10px] right-[10px] w-[20px] h-[20px] border border-gold-primary border-l-0 border-t-0 opacity-60 transition-opacity duration-500" />

      {/* Background Pattern */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full border border-dashed border-[rgba(255,255,255,0.03)] pointer-events-none select-none flex items-center justify-center">
        <span className="font-serif text-[180px] text-[rgba(255,255,255,0.02)] leading-none mt-[-20px]">
          {bgChar}
        </span>
      </div>

      {/* Star Layout */}
      <div className="relative h-full z-10">
        {/* Palace Label - Vertical Right */}
        <div 
          className="absolute right-0 top-[10px] [writing-mode:vertical-rl] font-serif text-[24px] tracking-[8px] text-gold-primary"
          style={{ textShadow: "0 0 10px rgba(229, 195, 101, 0.4)" }}
        >
          {palaceName}
        </div>

        {/* Major Star - Centered */}
        <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full">
          <div 
            className="font-serif text-[42px] font-bold text-text-main tracking-[4px]"
            style={{ textShadow: "0 4px 20px rgba(0,0,0,0.8)" }}
          >
            {majorStars.length > 0 ? (
              majorStars.map(s => s.name).join(" ")
            ) : "无主星"}
          </div>
          {/* Status */}
          {majorStars.length > 0 && (
            <div className="inline-block mt-2 text-[12px] text-[#D64545] border border-current px-[6px] py-[2px] rounded-[2px] shadow-[0_0_8px_rgba(214,69,69,0.4)]">
              {majorStars.map(s => [s.mutagen, s.brightness].filter(Boolean).join(" · ")).join(" | ")}
            </div>
          )}
        </div>

        {/* Minor Stars - Bottom Left */}
        <div className="absolute left-0 bottom-0 flex flex-col gap-[12px]">
          {minorStars.map((star, i) => (
            <div key={i} className="flex items-center gap-[6px] text-[14px] text-[#ccc]">
              {star.name}
              {star.mutagen && <span className="text-[10px] text-[#1E1E1E] bg-gold-primary px-[4px] py-[1px] font-bold">{star.mutagen}</span>}
              {star.brightness && <span className="text-[10px] text-gray-500 opacity-60">({star.brightness})</span>}
            </div>
          ))}
          {/* Adjective Stars */}
          {adjectiveStars.slice(0, 2).map((star, i) => (
             <div key={`adj-${i}`} className="flex items-center gap-[6px] text-[14px] text-[#667]">
               {star.name}
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}
