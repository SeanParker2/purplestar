"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NebulaBackground } from "@/components/NebulaBackground";
import { FateCard } from "@/components/FateCard";
import { InputPortal } from "@/components/InputPortal";
import { FullBoard } from "@/components/FullBoard";
import { AICopilot } from "@/components/AICopilot";
import { FlyingStarOverlayMemo as FlyingStarOverlay } from "@/components/FlyingStarOverlay";
import { ZiWeiCalculator, type ZiWeiChart } from "@/lib/ziwei";
import { calculateTrueSolarTime } from "@/lib/time-utils";
import { cn } from "@/lib/utils";

export default function Home() {
  const [chart, setChart] = useState<ZiWeiChart | null>(null);
  const [activeIndex, setActiveIndex] = useState(0); 
  const [view, setView] = useState<'input' | 'chart'>('input');
  const [isGridView, setIsGridView] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Flying Star State
  const [showFlyingLines, setShowFlyingLines] = useState(false);
  const [showAllFlyingStars, setShowAllFlyingStars] = useState(false); // false: only Lu, true: all
  // Flying Star State - Derived
  const starsData = useMemo(() => {
    if (chart && activeIndex !== null && chart.palaces[activeIndex]) {
      const palace = chart.palaces[activeIndex];
      const stem = palace.heavenlyEarthly.charAt(0);
      const flyingStars = ZiWeiCalculator.getFlyingStars(stem);
      const starNames = [flyingStars.Lu, flyingStars.Quan, flyingStars.Ke, flyingStars.Ji];
      const locations = ZiWeiCalculator.findStarsLocation(chart, starNames);
      return { stars: flyingStars, locations };
    }
    return null;
  }, [chart, activeIndex]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Prepare Transformed Palaces for Overlay
  const transformedPalaces = useMemo(() => {
    if (!starsData) return [];
    
    const types: ('Lu' | 'Quan' | 'Ke' | 'Ji')[] = ['Lu', 'Quan', 'Ke', 'Ji'];
    
    return types.map((type, i) => ({
      index: starsData.locations[i],
      type
    }))
    .filter(tp => tp.index !== -1) // Filter found stars
    .filter(tp => {
      // Filter based on visibility mode
      if (showAllFlyingStars) return true;
      return tp.type === 'Lu'; // Default only show Lu
    });
  }, [starsData, showAllFlyingStars]);

  const handleInputSubmit = (data: { date: Date; longitude: number; gender: "male" | "female" }) => {
    try {
      // 1. Calculate True Solar Time
      const trueTime = calculateTrueSolarTime(data.date, data.longitude);
      
      // 2. Generate Chart
      const c = ZiWeiCalculator.getZiWeiChartByDate(trueTime, data.longitude, data.gender);
      setChart(c);
      
      // 3. Set Active Palace (Life Palace)
      const lifeIndex = c.palaces.findIndex(p => p.palaceName === "命宫");
      if (lifeIndex !== -1) {
        setActiveIndex(lifeIndex);
      }

      // 4. Switch View
      setView('chart');
      
      // Auto-enable flying lines (Lu only) for better UX? Or let user trigger.
      // User says "Default show 'Lu' gold line".
      setShowFlyingLines(true); 
      setShowAllFlyingStars(false);

    } catch (e) {
      console.error("Failed to generate chart:", e);
      // Ideally show a toast or error in InputPortal, but simple console for now or alert
      alert("排盘失败，请检查输入数据");
    }
  };

  const handleToggleFlyingMode = () => {
    // Logic: 
    // If hidden -> Show Lu
    // If showing Lu -> Show All
    // If showing All -> Hide
    
    if (!showFlyingLines) {
      setShowFlyingLines(true);
      setShowAllFlyingStars(false);
    } else if (!showAllFlyingStars) {
      setShowAllFlyingStars(true);
    } else {
      setShowFlyingLines(false);
      setShowAllFlyingStars(false);
    }
  };

  const handlePalaceClick = (index: number) => {
    setActiveIndex(index);
    setIsGridView(false);
  };

  if (!mounted) return null;

  // Prepare chart data if available
  const currentPalace = chart ? chart.palaces[activeIndex] : null;
  
  // Calculate Three Parties (San Fang) and Opposite (Si Zheng)
  const wealthIndex = (activeIndex + 4) % 12;
  const migrationIndex = (activeIndex + 6) % 12;
  const careerIndex = (activeIndex + 8) % 12;

  const triSectors = chart ? [
    { name: "财帛", index: wealthIndex, palace: chart.palaces[wealthIndex] },
    { name: "迁移", index: migrationIndex, palace: chart.palaces[migrationIndex] },
    { name: "官禄", index: careerIndex, palace: chart.palaces[careerIndex] },
  ] : [];

  return (
    <main className="relative w-full h-screen overflow-hidden bg-void font-sans flex justify-center">
      <NebulaBackground />
      
      {/* Flying Star Overlay - Only visible in Focus View */}
      {view === 'chart' && !isGridView && (
        <FlyingStarOverlay 
          focusedPalaceIndex={activeIndex}
          transformedPalaces={transformedPalaces}
          visible={showFlyingLines}
        />
      )}

      <div className="relative w-full max-w-[414px] h-full flex flex-col">
        
        <AnimatePresence mode="wait">
          {view === 'input' && (
            <InputPortal key="input" onSubmit={handleInputSubmit} />
          )}

          {view === 'chart' && chart && currentPalace && (
            <motion.div 
              key="chart"
              className="flex flex-col h-full px-[20px] py-[20px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 1, delay: 0.2 } }}
            >
              {/* Chart Nav & Header */}
              <div className="flex justify-between items-center mt-[30px] mb-[20px] relative z-20">
                <div className="font-serif text-[20px] text-gold-primary">
                  紫微斗数
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-[12px] text-text-muted text-right leading-[1.4]">
                    {chart.lifeOwner}男 {chart.fiveElements}局<br/>
                    <span className="text-gold-primary">流年 {new Date().getFullYear()}</span>
                  </div>
                  
                  {/* View Toggle Button */}
                  <button 
                    onClick={() => setIsGridView(!isGridView)}
                    className="p-2 rounded-full border border-gold-primary/30 text-gold-primary hover:bg-gold-primary/10 transition-all active:scale-95"
                    aria-label={isGridView ? "Switch to Focus View" : "Switch to Grid View"}
                  >
                    {isGridView ? (
                      // Grid -> Focus Icon (Square)
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      </svg>
                    ) : (
                      // Focus -> Grid Icon (Grid 2x2)
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 relative overflow-hidden">
                <AnimatePresence mode="wait">
                  {isGridView ? (
                    <FullBoard 
                      key="grid-view"
                      chart={chart}
                      activeIndex={activeIndex}
                      onPalaceClick={handlePalaceClick}
                    />
                  ) : (
                    <motion.div
                      key="focus-view"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                      className="h-full flex flex-col"
                    >
                      {/* Card Viewport - 3D Perspective */}
                      <div className="flex-1 flex items-center justify-center relative perspective-[1000px]">
                        {/* Main Card Wrapper with ID for Flying Stars */}
                        <div id={`palace-${activeIndex}`} className="relative">
                           <FateCard 
                            layoutId={`palace-${activeIndex}`}
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
                        
                        {/* Toggle Button for Flying Stars */}
                        <button
                          onClick={handleToggleFlyingMode}
                          className={cn(
                            "absolute bottom-4 right-4 z-20 w-10 h-10 rounded-full",
                            "flex items-center justify-center border transition-all duration-300",
                            showFlyingLines 
                              ? "bg-gold-primary text-black border-gold-primary shadow-[0_0_15px_rgba(212,175,55,0.5)]" 
                              : "bg-black/40 text-gold-primary border-gold-primary/30 hover:border-gold-primary"
                          )}
                          title="Toggle Flying Stars"
                        >
                          <span className="text-xs font-serif font-bold">飞</span>
                        </button>
                      </div>

                      {/* Tri Sector (Bottom Nav) */}
                      <div className="h-[80px] flex justify-center gap-[15px] mb-[20px] mt-4">
                        {triSectors.map((sector) => {
                          const starName = sector.palace.majorStars[0]?.name || "无";
                          return (
                            <div 
                              key={sector.name}
                              id={`palace-${sector.index}`}
                              onClick={() => setActiveIndex(sector.index)}
                              className={cn(
                                "w-[70px] h-[70px] border flex flex-col items-center justify-center text-[10px] transition-all duration-300 cursor-pointer",
                                "border-white/10 bg-black/30 text-text-muted hover:border-white/30"
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

              {/* AI Copilot */}
              <AICopilot 
                chart={chart}
                currentPalace={currentPalace}
              />
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </main>
  );
}
