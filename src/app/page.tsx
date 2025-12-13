"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Grid, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  RotateCcw
} from "lucide-react";

// Components
import NebulaBackground from "@/components/background/NebulaBackground";
import Astrolabe from "@/components/visual/Astrolabe";
import InputPortal from "@/components/InputPortal";
import FateCard from "@/components/cards/FateCard";
import FullBoard from "@/components/charts/FullBoard";
import AICopilot from "@/components/ai/AICopilot";
import FlyingStarOverlay from "@/components/effects/FlyingStarOverlay";

// Logic & Utils
import { ZiWeiCalculator, type ZiWeiChart } from "@/lib/ziwei";
import { calculateTrueSolarTime } from "@/lib/time-utils";
import { cn } from "@/lib/utils";

// --- Types ---

type ViewMode = 'home' | 'input' | 'chart';
type ChartMode = 'focus' | 'grid';

const OPPOSITE_MAP: Record<string, string> = {
  "命宫": "迁移宫", "迁移宫": "命宫",
  "兄弟宫": "交友宫", "交友宫": "兄弟宫",
  "夫妻宫": "官禄宫", "官禄宫": "夫妻宫",
  "子女宫": "田宅宫", "田宅宫": "子女宫",
  "财帛宫": "福德宫", "福德宫": "财帛宫",
  "疾厄宫": "父母宫", "父母宫": "疾厄宫"
};

// --- Main Page Component ---

export default function Home() {
  // 1. State Management
  const [view, setView] = useState<ViewMode>('home');
  const [chartMode, setChartMode] = useState<ChartMode>('focus');
  const [userData, setUserData] = useState<{
    date: Date;
    gender: "male" | "female";
    name?: string;
  } | null>(null);
  const [chart, setChart] = useState<ZiWeiChart | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [showAI, setShowAI] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Hydration fix & Persistence
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);

    // Load saved data
    const savedData = localStorage.getItem('ziwei_user_data');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Restore Date object
        const date = new Date(parsed.date);
        
        // Regenerate Chart
        const trueTime = calculateTrueSolarTime(date, parsed.longitude);
        const newChart = ZiWeiCalculator.getZiWeiChartByDate(trueTime, parsed.longitude, parsed.gender);
        
        setChart(newChart);
        setUserData({
          date: date,
          gender: parsed.gender,
          name: parsed.name || "命主"
        });

        // Set Active Palace to Life Palace
        const lifeIndex = newChart.palaces.findIndex(p => p.palaceName === "命宫");
        setActiveIndex(lifeIndex !== -1 ? lifeIndex : 0);
        
        setView('chart');
      } catch (e) {
        console.error("Failed to restore saved data:", e);
        localStorage.removeItem('ziwei_user_data');
      }
    }
  }, []);

  // 2. Flying Star Logic
  // Calculate transformed palaces for the overlay based on the current active palace's stem
  const transformedPalaces = useMemo(() => {
    if (!chart || activeIndex === null) return [];
    
    const palace = chart.palaces[activeIndex];
    const stem = palace.heavenlyEarthly.charAt(0);
    const flyingStars = ZiWeiCalculator.getFlyingStars(stem);
    const starNames = [flyingStars.Lu, flyingStars.Quan, flyingStars.Ke, flyingStars.Ji];
    const locations = ZiWeiCalculator.findStarsLocation(chart, starNames);
    
    const types: ('Lu' | 'Quan' | 'Ke' | 'Ji')[] = ['Lu', 'Quan', 'Ke', 'Ji'];
    
    return types.map((type, i) => ({
      index: locations[i],
      type
    })).filter(tp => tp.index !== -1);
  }, [chart, activeIndex]);

  // 3. Handlers
  const handleStart = () => {
    setView('input');
  };

  const handleInputSubmit = (data: { date: Date; longitude: number; gender: "male" | "female" }) => {
    try {
      // Calculate True Solar Time
      const trueTime = calculateTrueSolarTime(data.date, data.longitude);
      
      // Generate Chart
      const newChart = ZiWeiCalculator.getZiWeiChartByDate(trueTime, data.longitude, data.gender);
      setChart(newChart);
      setUserData({
        date: data.date,
        gender: data.gender,
        name: "命主" // Default name
      });
      
      // Set Active Palace to Life Palace
      const lifeIndex = newChart.palaces.findIndex(p => p.palaceName === "命宫");
      setActiveIndex(lifeIndex !== -1 ? lifeIndex : 0);
      
      // Transition to Chart View
      setView('chart');
      setChartMode('focus');

      // Auto-save to localStorage
      localStorage.setItem('ziwei_user_data', JSON.stringify({
        date: data.date,
        longitude: data.longitude,
        gender: data.gender,
        name: "命主"
      }));
    } catch (e) {
      console.error("Chart generation failed:", e);
      alert("排盘失败，请检查输入信息");
    }
  };

  const handlePalaceChange = (direction: 'next' | 'prev') => {
    setActiveIndex(prev => {
      if (direction === 'next') return (prev + 1) % 12;
      return (prev - 1 + 12) % 12;
    });
  };

  const handleReset = () => {
    if (confirm("确定要重新排盘吗？当前数据将清除。")) {
      localStorage.removeItem('ziwei_user_data');
      setChart(null);
      setUserData(null);
      setView('home');
      setChartMode('focus');
    }
  };

  if (!mounted) return null;

  return (
    <main className="relative w-full h-dvh overflow-hidden bg-void font-sans flex flex-col items-center">
      {/* Level 1: Background (Always present) */}
      <NebulaBackground />

      <AnimatePresence mode="wait">
        
        {/* --- Step 1: Home View --- */}
        {view === 'home' && (
          <motion.div 
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center justify-center h-full z-10 space-y-12"
          >
            <div className="relative">
              <Astrolabe className="scale-125" />
              <motion.div 
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <div className="w-32 h-32 bg-gold-primary/20 blur-[50px] rounded-full" />
              </motion.div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStart}
              className="px-8 py-3 rounded-full border border-gold-primary/30 bg-white/5 backdrop-blur-md text-gold-primary font-serif tracking-widest text-lg hover:bg-gold-primary hover:text-void-bg transition-all duration-300 shadow-[0_0_20px_rgba(212,175,55,0.2)]"
            >
              开启推演
            </motion.button>
          </motion.div>
        )}

        {/* --- Step 2: Input View --- */}
        {view === 'input' && (
          <motion.div
            key="input"
            className="w-full h-full z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <InputPortal onSubmit={handleInputSubmit} />
          </motion.div>
        )}

        {/* --- Step 3: Chart View --- */}
        {view === 'chart' && chart && (
          <motion.div
            key="chart"
            className="relative w-full h-full flex flex-col z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Level 2: Flying Star Overlay */}
            <FlyingStarOverlay 
              activeIndex={activeIndex}
              flyingStars={transformedPalaces}
              className="z-0"
            />

            {/* Header: User Info */}
            <header className="flex justify-between items-center px-6 pt-6 pb-2 z-20">
              <div>
                <h1 className="text-gold-primary font-serif text-xl tracking-wider">紫微斗数</h1>
                <p className="text-xs text-text-muted mt-1">
                  {userData?.name || "命主"} · {chart.fiveElements}局 · {chart.lifeOwner}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-gold-primary/20 bg-white/5 text-xs text-gold-light/70 hover:text-gold-primary hover:border-gold-primary/50 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>新排盘</span>
                </button>
                <div className="text-xs text-gold-light opacity-80 border border-gold-primary/30 px-2 py-1 rounded">
                  {chart.palaces[activeIndex].heavenlyEarthly}年
                </div>
              </div>
            </header>

            {/* Level 3: Main Content */}
            <div className="flex-1 relative overflow-hidden flex flex-col justify-center items-center p-4">
              <AnimatePresence mode="wait">
                
                {/* Mode: Focus (Single Card) */}
                {chartMode === 'focus' && (
                  <motion.div
                    key="focus"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="w-full max-w-md h-full flex flex-col items-center justify-center relative"
                  >
                    {/* Navigation Arrows */}
                    <button 
                      onClick={() => handlePalaceChange('prev')}
                      className="absolute left-0 top-1/2 -translate-y-1/2 p-2 text-white/20 hover:text-gold-primary transition-colors z-30"
                    >
                      <ChevronLeft size={32} />
                    </button>
                    
                    {/* The Card */}
                    <div id={`palace-${activeIndex}`} className="w-full">
                      <FateCard 
                        {...chart.palaces[activeIndex]}
                        stemBranch={chart.palaces[activeIndex].heavenlyEarthly}
                        variant="focus"
                        layoutId={`palace-${activeIndex}`}
                        oppositeMajorStars={
                          chart.palaces.find(p => p.palaceName === OPPOSITE_MAP[chart.palaces[activeIndex].palaceName])?.majorStars
                        }
                      />
                    </div>

                    <button 
                      onClick={() => handlePalaceChange('next')}
                      className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-white/20 hover:text-gold-primary transition-colors z-30"
                    >
                      <ChevronRight size={32} />
                    </button>
                    
                    {/* San Fang Si Zheng Indicators (Mini Cards) - Visual context for Flying Stars */}
                    {/* This ensures the Overlay has targets if we render them with IDs */}
                    <div className="absolute bottom-0 w-full flex justify-between px-4 opacity-50 scale-75 pointer-events-none">
                       {/* Just placeholders to indicate structure if needed, but for now keeping it clean as per strict requirements */}
                    </div>
                  </motion.div>
                )}

                {/* Mode: Grid (Full Board) */}
                {chartMode === 'grid' && (
                  <motion.div
                    key="grid"
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="w-full h-full"
                  >
                    <FullBoard 
                      chart={chart}
                      activeIndex={activeIndex}
                      onSelect={(idx) => {
                        setActiveIndex(idx);
                        setChartMode('focus');
                      }}
                    />
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* Level 4: Bottom Navigation Bar */}
            <div className="pb-8 pt-2 px-6 z-50">
               <BottomNavBar 
                 currentMode={chartMode}
                 onModeChange={setChartMode}
                 onAskAI={() => setShowAI(true)}
               />
            </div>

            {/* Level 5: AI Copilot Popup */}
            {showAI && (
              <AICopilot 
                chart={chart}
                palaceData={chart.palaces[activeIndex]}
                isOpen={true}
                onClose={() => setShowAI(false)}
                className="z-60"
              />
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

// --- Subcomponent: BottomNavBar ---

interface BottomNavBarProps {
  currentMode: ChartMode;
  onModeChange: (mode: ChartMode) => void;
  onAskAI: () => void;
}

function BottomNavBar({ currentMode, onModeChange, onAskAI }: BottomNavBarProps) {
  const navItems = [
    { 
      id: 'focus', 
      label: '聚焦', 
      icon: Search, 
      active: currentMode === 'focus',
      onClick: () => onModeChange('focus')
    },
    { 
      id: 'grid', 
      label: '全盘', 
      icon: Grid, 
      active: currentMode === 'grid',
      onClick: () => onModeChange('grid')
    },
    { 
      id: 'ai', 
      label: '问策', 
      icon: Sparkles, 
      active: false,
      onClick: onAskAI
    }
  ];

  return (
    <div className="relative w-full max-w-[320px] mx-auto h-[64px] rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg flex items-center justify-around px-2">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={item.onClick}
          className={cn(
            "flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all duration-300",
            item.active 
              ? "text-gold-primary bg-gold-primary/10 shadow-[0_0_10px_rgba(212,175,55,0.1)]" 
              : "text-text-muted hover:text-white hover:bg-white/5"
          )}
        >
          <item.icon size={20} className={cn("mb-1", item.active && "stroke-[2.5px]")} />
          <span className="text-[10px] font-medium">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
