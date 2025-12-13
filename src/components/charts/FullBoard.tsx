"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import FateCard from "@/components/cards/FateCard";
import { type ZiWeiChart } from "@/lib/ziwei";
import { cn } from "@/lib/utils";

interface FullBoardProps {
  chart: ZiWeiChart;
  activeIndex: number;
  onSelect: (index: number) => void;
  className?: string;
}

const BRANCH_ORDER = ["巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑", "寅", "卯", "辰"];

const OPPOSITE_MAP: Record<string, string> = {
  "命宫": "迁移宫", "迁移宫": "命宫",
  "兄弟宫": "交友宫", "交友宫": "兄弟宫",
  "夫妻宫": "官禄宫", "官禄宫": "夫妻宫",
  "子女宫": "田宅宫", "田宅宫": "子女宫",
  "财帛宫": "福德宫", "福德宫": "财帛宫",
  "疾厄宫": "父母宫", "父母宫": "疾厄宫"
};

export default function FullBoard({ chart, activeIndex, onSelect, className }: FullBoardProps) {
  const [layoutMode, setLayoutMode] = useState<'modern' | 'traditional'>('modern');

  // Helper to find palace by branch char
  const getPalaceByBranch = (branch: string) => {
    return chart.palaces.find(p => p.heavenlyEarthly.endsWith(branch));
  };
  
  // Helper to get index in the original array
  const getPalaceIndex = (palaceName: string) => {
    return chart.palaces.findIndex(p => p.palaceName === palaceName);
  };

  // Helper to get opposite palace stars
  const getOppositeStars = (palaceName: string) => {
    const targetName = OPPOSITE_MAP[palaceName];
    if (!targetName) return [];
    return chart.palaces.find(p => p.palaceName === targetName)?.majorStars || [];
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn("w-full h-full flex flex-col", className)}
    >
      {/* Layout Toggle */}
      <div className="flex justify-end mb-2 px-4">
        <button 
          onClick={() => setLayoutMode(prev => prev === 'modern' ? 'traditional' : 'modern')}
          className="text-xs text-gold-primary border border-gold-primary/30 px-2 py-1 rounded hover:bg-gold-primary/10 transition-colors"
        >
          {layoutMode === 'modern' ? "切换经典视图" : "切换现代视图"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {layoutMode === 'modern' ? (
          // Modern 3x4 Grid
          <div className="grid grid-cols-3 gap-2 h-full content-center">
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
                oppositeMajorStars={getOppositeStars(palace.palaceName)}
                isActive={idx === activeIndex}
                onClick={() => onSelect(idx)}
              />
            ))}
          </div>
        ) : (
          // Traditional Ring Layout (CSS Grid)
          <div className="grid grid-cols-4 grid-rows-4 gap-2 h-full max-h-[600px] aspect-square mx-auto">
            {/* Center Area (Empty or Info) */}
            <div className="col-start-2 col-end-4 row-start-2 row-end-4 flex items-center justify-center border border-white/5 rounded-lg bg-white/5">
              <div className="text-center">
                <div className="text-gold-primary font-serif text-xl mb-2">紫微斗数</div>
                <div className="text-text-muted text-xs">
                  {chart.lifeOwner}男<br/>
                  {chart.fiveElements}局
                </div>
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
                <div key={branch} className={gridClass}>
                  <FateCard
                    id={`palace-${idx}`}
                    layoutId={`palace-${idx}`}
                    variant="grid"
                    palaceName={palace.palaceName}
                    stemBranch={palace.heavenlyEarthly}
                    majorStars={palace.majorStars}
                minorStars={palace.minorStars}
                adjectiveStars={palace.miscStars}
                oppositeMajorStars={getOppositeStars(palace.palaceName)}
                isActive={idx === activeIndex}
                    onClick={() => onSelect(idx)}
                    className="h-full"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
