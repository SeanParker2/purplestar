"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NebulaBackground } from "@/components/NebulaBackground";
import { Astrolabe } from "@/components/Astrolabe";
import { FateCard } from "@/components/FateCard";
import { ZiWeiCalculator, type ZiWeiChart } from "@/lib/ziwei";
import { calculateTrueSolarTime } from "@/lib/time-utils";
import { cn } from "@/lib/utils";

export default function Home() {
  const [chart, setChart] = useState<ZiWeiChart | null>(null);
  const [activeIndex, setActiveIndex] = useState(0); 
  const [view, setView] = useState<'home' | 'chart'>('home');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const now = new Date();
    const trueTime = calculateTrueSolarTime(now, 120);
    
    try {
      const c = ZiWeiCalculator.getZiWeiChartByDate(trueTime, 120, 'male');
      setChart(c);
      
      const lifeIndex = c.palaces.findIndex(p => p.palaceName === "命宫");
      if (lifeIndex !== -1) {
        setActiveIndex(lifeIndex);
      }
    } catch (e) {
      console.error("Failed to generate chart:", e);
    }
  }, []);

  const handleEnterApp = () => {
    setView('chart');
  };

  if (!mounted || !chart) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-void text-text-muted">
        <div className="animate-pulse">Loading Astrolabe...</div>
      </main>
    );
  }

  const currentPalace = chart.palaces[activeIndex];
  
  // Calculate Three Parties (San Fang) and Opposite (Si Zheng)
  // Standard San Fang Si Zheng includes: Self (0), Wealth (+4), Career (+8), Migration (+6)
  // The HTML demo bottom bar shows: Wealth, Migration, Career.
  const wealthIndex = (activeIndex + 4) % 12;
  const migrationIndex = (activeIndex + 6) % 12;
  const careerIndex = (activeIndex + 8) % 12;

  const triSectors = [
    { name: "财帛", index: wealthIndex, palace: chart.palaces[wealthIndex] },
    { name: "迁移", index: migrationIndex, palace: chart.palaces[migrationIndex] },
    { name: "官禄", index: careerIndex, palace: chart.palaces[careerIndex] },
  ];

  return (
    <main className="relative w-full h-screen overflow-hidden bg-void font-sans flex justify-center">
      <NebulaBackground />

      <div className="relative w-full max-w-[414px] h-full flex flex-col">
        
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div 
              key="home"
              className="absolute inset-0 flex flex-col justify-center items-center z-10"
              initial={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1, transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] } }}
            >
              {/* Brand Header */}
              <div className="absolute top-[60px] text-center z-20">
                <div 
                  className="font-serif text-[36px] tracking-[12px] text-gradient-gold ml-[12px]"
                  style={{ textShadow: "0 4px 20px rgba(212, 175, 55, 0.3)" }}
                >
                  紫 垣
                </div>
                <div className="text-[9px] tracking-[6px] text-white/40 mt-[8px] uppercase">
                  The Enclosure
                </div>
              </div>

              {/* Astrolabe */}
              <div className="relative">
                <Astrolabe yearStr="乙巳年" termStr="大雪初候" />
              </div>

              {/* Action Area */}
              <div className="absolute bottom-[80px] w-full flex flex-col items-center">
                <button 
                  onClick={handleEnterApp}
                  className="group relative flex items-center gap-[10px] px-[40px] py-[16px] rounded-[30px] border border-glass-border bg-white/5 backdrop-blur-[10px] text-[14px] tracking-[4px] text-text-main overflow-hidden transition-all duration-400 hover:bg-[rgba(212,175,55,0.15)] hover:border-gold-dark hover:shadow-[0_0_30px_rgba(212,175,55,0.2)]"
                >
                  <span className="relative z-10">开启推演</span>
                  <span className="relative z-10 text-[10px]">→</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full transition-transform duration-500 group-hover:translate-x-full" />
                </button>
                <p className="text-[10px] text-white/20 mt-[15px] tracking-[1px] uppercase">
                  Precision Astrology
                </p>
              </div>
            </motion.div>
          )}

          {view === 'chart' && (
            <motion.div 
              key="chart"
              className="flex flex-col h-full px-[20px] py-[20px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 1, delay: 0.2 } }}
            >
              {/* Chart Nav */}
              <div className="flex justify-between items-center mt-[30px] mb-[20px]">
                <div className="font-serif text-[20px] text-gold-primary">
                  紫微斗数
                </div>
                <div className="text-[12px] text-text-muted text-right leading-[1.4]">
                  {chart.lifeOwner}男 {chart.fiveElements}局<br/>
                  <span className="text-gold-primary">流年 {new Date().getFullYear()}</span>
                </div>
              </div>

              {/* Card Viewport - 3D Perspective */}
              <div className="flex-1 flex items-center justify-center relative perspective-[1000px]">
                <FateCard 
                  variant="focus"
                  palaceName={currentPalace.palaceName}
                  stemBranch={currentPalace.heavenlyEarthly}
                  majorStars={currentPalace.majorStars}
                  minorStars={currentPalace.minorStars}
                  adjectiveStars={currentPalace.miscStars}
                  isActive={true}
                  className="shadow-2xl"
                />
              </div>

              {/* Tri Sector (Bottom Nav) */}
              <div className="h-[80px] flex justify-center gap-[15px] mb-[20px]">
                {triSectors.map((sector) => {
                  // Determine major star to show (first one or specific logic)
                  const starName = sector.palace.majorStars[0]?.name || "无";
                  const isActive = false; // In demo, Migration is active. Here we keep them inactive unless we track "selected related".
                  
                  return (
                    <div 
                      key={sector.name}
                      onClick={() => setActiveIndex(sector.index)}
                      className={cn(
                        "w-[70px] h-[70px] border flex flex-col items-center justify-center text-[10px] transition-all duration-300 cursor-pointer",
                        isActive 
                          ? "border-gold-dark shadow-[0_0_15px_rgba(212,175,55,0.1)] text-text-main bg-black/30"
                          : "border-white/10 bg-black/30 text-text-muted hover:border-white/30"
                      )}
                    >
                      <span className="mb-[4px]">{sector.name}</span>
                      <span className="text-gold-primary">{starName}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </main>
  );
}
