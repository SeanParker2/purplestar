"use client";

import React from "react";
import { motion } from "framer-motion";
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
  layoutId?: string;
}

export function FateCard({
  palaceName,
  stemBranch,
  majorStars,
  minorStars,
  className,
  variant = "focus",
  onClick,
  isActive,
  layoutId
}: FateCardProps) {
  // If it's the grid variant, we use a simpler layout (similar to previous implementation but styled consistently)
  if (variant === "grid") {
    return (
      <motion.div 
        layoutId={layoutId}
        onClick={onClick}
        className={cn(
          "relative flex flex-col p-2 rounded-lg transition-colors duration-300 border backdrop-blur-sm cursor-pointer h-full min-h-[100px] overflow-hidden group",
          isActive 
            ? "bg-gold-primary text-void-bg border-gold-primary font-bold shadow-[0_0_10px_rgba(229,195,101,0.4)] z-10" 
            : "border-white/10 bg-white/5 text-text-muted hover:bg-white/10 hover:border-gold-primary/50 hover:text-gold-light",
          className
        )}
      >
        <div className="flex justify-between items-start mb-1">
           <div className="text-[14px] font-serif font-bold">{palaceName}</div>
           <div className="text-[10px] opacity-60 font-mono border border-current px-1 rounded">{stemBranch}</div>
        </div>
        
        {/* Major Stars for Grid View */}
        <div className="flex flex-wrap gap-1 mt-1">
          {majorStars.length > 0 ? (
            majorStars.map((star, idx) => (
              <span key={idx} className={cn(
                "text-[12px] font-serif",
                star.mutagen ? "text-red-400 font-bold" : (isActive ? "text-void-bg" : "text-gold-primary")
              )}>
                {star.name}
                {star.mutagen && <span className="text-[8px] align-top ml-px">{star.mutagen}</span>}
              </span>
            ))
          ) : (
            <span className="text-[10px] opacity-50">无主星</span>
          )}
        </div>

        {/* Minor Stars - Only show top 2 or so if space permits, or just count */}
        {minorStars.length > 0 && (
           <div className="mt-auto pt-2 flex flex-wrap gap-1 opacity-70 text-[9px]">
             {minorStars.slice(0, 4).map(s => s.name).join(' ')}
           </div>
        )}
      </motion.div>
    );
  }

  // Focus Variant - The "Pro" Card
  const bgChar = palaceName.charAt(0);

  return (
    <motion.div 
      layoutId={layoutId}
      className={cn(
        "relative w-full h-[480px] rounded-[8px] p-[30px] flex flex-col overflow-hidden",
        "bg-[linear-gradient(160deg,rgba(30,30,40,0.6),rgba(10,10,12,0.8))]",
        "backdrop-blur-[20px]",
        "border border-glass-border",
        "shadow-[0_20px_60px_rgba(0,0,0,0.6)]",
        // 3D Effects
        "transform-[rotateX(2deg)_scale(0.98)]",
        "transition-shadow duration-500 ease-in-out",
        "hover:transform-[rotateX(0deg)_scale(1)]",
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
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full border border-dashed border-glass-surface pointer-events-none select-none flex items-center justify-center">
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
        </div>

        {/* Minor Stars - Bottom Grid */}
        <div className="absolute bottom-[10px] left-0 w-full px-[10px] flex flex-wrap gap-2 text-[12px] text-text-muted justify-center">
          {minorStars.map((star, i) => (
            <span key={i} className="px-2 py-1 bg-white/5 rounded backdrop-blur-sm border border-white/5">
              {star.name}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
