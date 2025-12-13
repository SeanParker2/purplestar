"use client";

import React from "react";
import { motion } from "framer-motion";
import { LayoutTemplate } from "lucide-react";
import FateCard from "@/components/cards/FateCard";
import { type ZiWeiChart, type PalaceData } from "@/lib/ziwei";
import { cn } from "@/lib/utils";

interface FullBoardProps {
  chart: ZiWeiChart;
  activeIndex: number;
  onSelect: (index: number) => void;
  className?: string;
  gridStyle: 'classic' | 'modern';
  onToggleStyle: () => void;
}

const BRANCH_ORDER = ["巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑", "寅", "卯", "辰"];

// --- Mini Classic Card Component ---
const MiniClassicCard = ({ 
  palace, 
  isActive, 
  onClick,
  idx 
}: { 
  palace: PalaceData; 
  isActive: boolean; 
  onClick: () => void;
  idx: number;
}) => {
  return (
    <motion.div
      layoutId={`palace-${idx}`}
      onClick={onClick}
      className={cn(
        "relative w-full h-full flex flex-col p-1 border cursor-pointer overflow-hidden",
        isActive
          ? "bg-gold-primary text-void-bg border-gold-primary shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]"
          : "bg-white/5 border-white/10 text-text-muted hover:bg-white/10 hover:border-gold-primary/30"
      )}
    >
      {/* Header: Palace Name & Stem/Branch */}
      <div className="flex justify-between items-start leading-none mb-0.5">
        <span className="text-[10px] font-bold font-serif scale-90 origin-top-left">{palace.palaceName}</span>
        <span className="text-[9px] opacity-70 scale-90 origin-top-right font-mono">{palace.heavenlyEarthly}</span>
      </div>

      {/* Content: Major Stars */}
      <div className="flex flex-col gap-0.5 flex-1">
        {palace.majorStars.length > 0 ? (
          palace.majorStars.map((star, i) => (
            <div key={i} className="flex items-center gap-0.5 leading-none">
              <span className={cn(
                "text-[10px] font-serif tracking-tighter",
                star.mutagen ? "text-red-500 font-bold" : (isActive ? "text-void-bg" : "text-gold-primary")
              )}>
                {star.name}
              </span>
              {star.mutagen && (
                <span className="text-[8px] scale-75 origin-left font-bold bg-red-500/10 text-red-500 px-0.5 rounded-[2px]">
                  {star.mutagen}
                </span>
              )}
            </div>
          ))
        ) : (
          <span className="text-[9px] opacity-30 mt-1 ml-0.5"></span>
        )}
      </div>
    </motion.div>
  );
};

export default function FullBoard({ chart, activeIndex, onSelect, className, gridStyle, onToggleStyle }: FullBoardProps) {
  // Helper to find palace by branch char
  const getPalaceByBranch = (branch: string) => {
    return chart.palaces.find(p => p.heavenlyEarthly.endsWith(branch));
  };
  
  // Helper to get index in the original array
  const getPalaceIndex = (palaceName: string) => {
    return chart.palaces.findIndex(p => p.palaceName === palaceName);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn("w-full h-full flex flex-col relative", className)}
    >
      {/* Layout Toggle - Floating Button */}
      <button 
        onClick={onToggleStyle}
        className="absolute top-0 right-0 z-50 p-2 text-gold-primary/50 hover:text-gold-primary transition-colors bg-void/80 backdrop-blur rounded-bl-xl border-l border-b border-white/5"
        title="切换视图"
      >
        <LayoutTemplate size={18} />
      </button>

      <div className="flex-1 w-full h-full">
        {gridStyle === 'modern' ? (
          // Modern 3x4 Grid - Scrollable
          <div className="grid grid-cols-3 gap-2 p-2 pb-20 overflow-y-auto h-full content-start">
            {chart.palaces.map((palace, idx) => (
              <FateCard
                key={palace.palaceName}
                id={`palace-${idx}`}
                layoutId={`palace-${idx}`}
                variant="grid"
                palaceName={palace.palaceName}
                stemBranch={palace.heavenlyEarthly}
                majorStars={palace.majorStars}
                minorStars={palace.minorStars}
                adjectiveStars={palace.miscStars}
                isActive={idx === activeIndex}
                onClick={() => onSelect(idx)}
              />
            ))}
          </div>
        ) : (
          // Traditional Ring Layout (CSS Grid) - No Scroll, 100% Height
          <div className="w-full h-[calc(100dvh-140px)] p-1">
             <div className="grid grid-cols-4 grid-rows-4 gap-px w-full h-full bg-gold-primary/20 border border-gold-primary/20 rounded-lg overflow-hidden">
              {/* Center Area */}
              <div className="col-start-2 col-end-4 row-start-2 row-end-4 flex flex-col items-center justify-center bg-void/90 p-2 text-center z-10">
                <div className="text-gold-primary font-serif text-2xl font-bold mb-1 tracking-[0.2em]">紫微斗数</div>
                <div className="w-full h-px bg-gradient-to-r from-transparent via-gold-primary/50 to-transparent my-2" />
                <div className="text-text-muted text-[10px] space-y-1">
                  <p><span className="text-gold-light/60">命主:</span> {chart.lifeOwner || "命主"}</p>
                  <p><span className="text-gold-light/60">五行:</span> {chart.fiveElements}局</p>
                </div>
              </div>

              {/* Render Palaces based on Position */}
              {BRANCH_ORDER.map((branch) => {
                const palace = getPalaceByBranch(branch);
                if (!palace) return null;
                
                const idx = getPalaceIndex(palace.palaceName);
                
                let gridClass = "";
                switch(branch) {
                  case "巳": gridClass = "col-start-1 row-start-1"; break;
                  case "午": gridClass = "col-start-2 row-start-1"; break;
                  case "未": gridClass = "col-start-3 row-start-1"; break;
                  case "申": gridClass = "col-start-4 row-start-1"; break;
                  
                  case "辰": gridClass = "col-start-1 row-start-2"; break;
                  case "酉": gridClass = "col-start-4 row-start-2"; break;
                  
                  case "卯": gridClass = "col-start-1 row-start-3"; break;
                  case "戌": gridClass = "col-start-4 row-start-3"; break;
                  
                  case "寅": gridClass = "col-start-1 row-start-4"; break;
                  case "丑": gridClass = "col-start-2 row-start-4"; break;
                  case "子": gridClass = "col-start-3 row-start-4"; break;
                  case "亥": gridClass = "col-start-4 row-start-4"; break;
                }

                return (
                  <div key={branch} className={cn(gridClass, "w-full h-full bg-void")}>
                    <MiniClassicCard 
                      palace={palace} 
                      isActive={idx === activeIndex}
                      onClick={() => onSelect(idx)}
                      idx={idx}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
