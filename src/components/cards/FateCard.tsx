"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { type Star } from "@/lib/ziwei";
import { getPalaceInterpretations } from "@/lib/interpretation-utils";

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
  id?: string;
  onAskAI?: (question: string) => void;
}

export default function FateCard({
  palaceName,
  stemBranch,
  majorStars,
  minorStars,
  adjectiveStars,
  className,
  variant = "focus",
  onClick,
  isActive,
  layoutId,
  id,
  onAskAI
}: FateCardProps) {
  // Logic: Find interpretation
  const { main, patterns, transformations, minors } = React.useMemo(() => 
    getPalaceInterpretations(palaceName, majorStars, minorStars, adjectiveStars, stemBranch), 
    [palaceName, majorStars, minorStars, adjectiveStars, stemBranch]
  );

  // If it's the grid variant, we use a simpler layout (similar to previous implementation but styled consistently)
  if (variant === "grid") {
    return (
      <motion.div 
        id={id}
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
      id={id}
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
      <div className="relative h-full z-10 flex flex-col">
        {/* Palace Label - Vertical Right */}
        <div 
          className="absolute right-0 top-[10px] [writing-mode:vertical-rl] font-serif text-[24px] tracking-[8px] text-gold-primary"
          style={{ textShadow: "0 0 10px rgba(229, 195, 101, 0.4)" }}
        >
          {palaceName}
        </div>

        {/* Center Content Area: Major Stars & Interpretation */}
        <div className="flex-1 flex flex-col items-center justify-start pt-8 px-6 overflow-hidden">
          {/* Major Star - Centered */}
          <div 
            className="font-serif text-[36px] font-bold text-text-main tracking-[4px] mb-4 shrink-0"
            style={{ textShadow: "0 4px 20px rgba(0,0,0,0.8)" }}
          >
            {majorStars.length > 0 ? (
              majorStars.map(s => s.name).join(" ")
            ) : "无主星"}
          </div>

          {/* Interpretation Section */}
          <div className="w-full flex flex-col items-center gap-6 overflow-y-auto [&::-webkit-scrollbar]:hidden pb-4">
            {(main.length > 0 || transformations.length > 0 || minors.length > 0) ? (
              <div 
                className="flex flex-col items-center gap-6 w-full cursor-pointer group"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onAskAI) {
                     // 构建综合上下文
                     const context = [
                        patterns.length > 0 ? `【特殊格局】${patterns.map(i => `${i.summary}: ${i.detail}`).join("；")}` : "",
                        `【主星格局】${main.map(i => `${i.summary}。${i.detail}`).join(" ")}`,
                        transformations.length > 0 ? `【四化变数】${transformations.map(i => `${i.star}${i.palace.replace("化", "")}: ${i.summary}`).join("；")}` : "",
                        minors.length > 0 ? `【辅星影响】${minors.map(i => `${i.star}: ${i.summary}`).join("；")}` : ""
                     ].filter(Boolean).join("\n\n");
                     
                     onAskAI(`请综合分析${palaceName}的情况：\n\n${context}`);
                  }
                }}
              >
                 {/* 新增：格局展示区 (Patterns) - 置顶显示 */}
                 {patterns.length > 0 && (
                   <div className="w-full flex flex-col gap-2 mb-4">
                     {patterns.map((item, idx) => (
                       <div key={`pat-${idx}`} className="relative p-3 rounded-lg border border-gold-primary/50 bg-gold-primary/10 flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                             <span className="text-xs font-bold px-2 py-0.5 rounded bg-gold-primary text-void-bg">
                               {item.star}
                             </span>
                             <span className="text-sm font-bold text-gold-light">
                               {item.summary}
                             </span>
                          </div>
                          <p className="text-xs opacity-90 leading-relaxed pl-1 text-justify">
                            {item.detail}
                          </p>
                       </div>
                     ))}
                   </div>
                 )}

                 {/* Section 1: 核心格局 (Main) */}
                 {main.map((item, idx) => (
                   <div key={`main-${idx}`} className="flex flex-col items-center gap-3 w-full">
                     <div className="relative px-6 py-2 text-center">
                        <span className="absolute top-0 left-0 text-gold-primary/40 font-serif text-2xl leading-none">❝</span>
                        <p className="font-serif text-lg italic text-gold-primary group-hover:text-gold-light transition-colors duration-300">
                          {item.summary}
                        </p>
                        <span className="absolute bottom-0 right-0 text-gold-primary/40 font-serif text-2xl leading-none">❞</span>
                     </div>
                     <p className="text-text-muted text-sm leading-relaxed text-justify font-sans opacity-90 px-1 group-hover:text-white/90 transition-colors duration-300">
                        {item.detail}
                     </p>
                     <div className="flex flex-wrap justify-center gap-2 mt-1">
                        {item.tags.map((tag: string) => (
                            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gold-light/60 group-hover:border-gold-primary/30 transition-colors">
                                {tag}
                            </span>
                        ))}
                     </div>
                   </div>
                 ))}

                 {/* Section 2: 天机变数 (Transformations) */}
                 {transformations.length > 0 && (
                   <div className="w-full flex flex-col gap-2 mt-2">
                     {transformations.map((item, idx) => {
                       const mutagen = item.palace.replace("化", ""); // "化禄" -> "禄"
                       const isGood = ["禄", "权", "科"].includes(mutagen);
                       return (
                         <div key={`trans-${idx}`} className={cn(
                           "relative p-3 rounded-lg border-l-2 flex flex-col gap-1",
                           isGood ? "bg-red-500/10 border-red-400" : "bg-blue-500/10 border-blue-400"
                         )}>
                            <div className="flex items-center gap-2">
                               <span className={cn(
                                 "text-xs font-bold px-1.5 py-0.5 rounded",
                                 isGood ? "bg-red-500 text-white" : "bg-blue-500 text-white"
                               )}>
                                 {item.star}化{mutagen}
                               </span>
                               <span className={cn(
                                 "text-sm font-bold",
                                 isGood ? "text-red-200" : "text-blue-200"
                               )}>
                                 {item.summary}
                               </span>
                            </div>
                            <p className="text-xs opacity-80 leading-relaxed pl-1">
                              {item.detail}
                            </p>
                         </div>
                       );
                     })}
                   </div>
                 )}

                 {/* Section 3: 辅星细节 (Minors) */}
                 {minors.length > 0 && (
                   <div className="w-full flex flex-col gap-1 mt-2 pt-4 border-t border-white/10">
                      <h4 className="text-[10px] uppercase tracking-widest text-white/40 text-center mb-2">辅星影响</h4>
                      <div className="grid grid-cols-1 gap-2">
                        {minors.map((item, idx) => (
                          <div key={`minor-${idx}`} className="flex items-baseline gap-2 text-xs text-white/60">
                            <span className="text-gold-light/80 font-bold shrink-0">[{item.star}]</span>
                            <span className="opacity-80">{item.summary}</span>
                          </div>
                        ))}
                      </div>
                   </div>
                 )}

              </div>
            ) : (
              <div className="text-white/30 text-sm italic mt-8 flex flex-col items-center gap-2">
                <span className="text-2xl">✨</span>
                星元流转，静待天机...
              </div>
            )}
          </div>
        </div>

        {/* Minor Stars - Bottom Grid */}
        <div className="w-full px-[10px] pb-[10px] flex flex-wrap gap-2 text-[12px] text-text-muted justify-center mt-auto">
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
