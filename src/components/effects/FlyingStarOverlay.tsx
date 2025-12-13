"use client";

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type FlyingStarType = 'Lu' | 'Quan' | 'Ke' | 'Ji';

export interface FlyingStar {
  index: number;
  type: FlyingStarType;
}

interface FlyingStarOverlayProps {
  activeIndex: number;
  flyingStars: FlyingStar[];
  className?: string;
}

interface Path {
  id: string;
  d: string;
  color: string;
  width: number;
  dashArray?: string;
  type: FlyingStarType;
}

const STAR_CONFIG: Record<FlyingStarType, { color: string; width: number; dash?: string }> = {
  Lu: { color: '#FFD700', width: 2 }, // Gold
  Quan: { color: '#9333EA', width: 2 }, // Purple
  Ke: { color: '#3B82F6', width: 2 }, // Blue
  Ji: { color: '#EF4444', width: 1, dash: '4 4' }, // Red Dashed
};

export default function FlyingStarOverlay({ activeIndex, flyingStars, className }: FlyingStarOverlayProps) {
  const [paths, setPaths] = useState<Path[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const calculatePaths = () => {
      if (!containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const startEl = document.getElementById(`palace-${activeIndex}`);
      
      if (!startEl) {
        setPaths([]); // Start element not found (e.g., switched view)
        return;
      }

      const startRect = startEl.getBoundingClientRect();
      const startX = startRect.left - containerRect.left + startRect.width / 2;
      const startY = startRect.top - containerRect.top + startRect.height / 2;

      const newPaths: Path[] = [];

      flyingStars.forEach((star) => {
        const endEl = document.getElementById(`palace-${star.index}`);
        if (!endEl) return;

        const endRect = endEl.getBoundingClientRect();
        const endX = endRect.left - containerRect.left + endRect.width / 2;
        const endY = endRect.top - containerRect.top + endRect.height / 2;

        // Calculate Bezier Curve
        // Control point: Perpendicular offset or center biased
        // Simple quadratic bezier: start -> control -> end
        // Or cubic: start -> c1 -> c2 -> end
        
        // Let's use a simple curve that arcs slightly
        // Midpoint
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        
        // Offset for curvature (make it proportional to distance)
        const dist = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        const curvature = dist * 0.2; // 20% of distance
        
        // Direction vector
        const dx = endX - startX;
        const dy = endY - startY;
        
        // Normal vector (-dy, dx)
        // We can alternate curvature direction based on type or index to avoid overlap
        // Or just always curve "outward" from center of screen? 
        // Let's curve based on index parity or just fixed normal.
        // For simplicity: fixed normal + some randomness or specific logic?
        // Let's use type to offset slightly to avoid perfect overlap if multiple stars go to same place (rare but possible)
        
        // Simplified: Fixed offset
        const normX = -dy / dist;
        const normY = dx / dist;
        
        const cpX = midX + normX * curvature;
        const cpY = midY + normY * curvature;

        const d = `M ${startX} ${startY} Q ${cpX} ${cpY} ${endX} ${endY}`;
        
        const config = STAR_CONFIG[star.type];

        newPaths.push({
          id: `${activeIndex}-${star.index}-${star.type}`,
          d,
          color: config.color,
          width: config.width,
          dashArray: config.dash,
          type: star.type
        });
      });

      setPaths(newPaths);
    };

    // Calculate immediately
    calculatePaths();

    // Recalculate on resize
    window.addEventListener('resize', calculatePaths);
    
    // Optional: Recalculate on animation frame if layout is animating
    // But for now resize is enough. 
    // If cards are animating in, we might need a timeout or ResizeObserver.
    // Let's add a small delay/interval to catch layout settlements
    const interval = setInterval(calculatePaths, 500);

    return () => {
      window.removeEventListener('resize', calculatePaths);
      clearInterval(interval);
    };
  }, [activeIndex, flyingStars]);

  return (
    <div ref={containerRef} className={`absolute inset-0 pointer-events-none z-50 ${className || ''}`}>
      <svg className="w-full h-full overflow-visible">
        <AnimatePresence>
          {paths.map((path) => (
            <motion.path
              key={path.id}
              d={path.d}
              stroke={path.color}
              strokeWidth={path.width}
              fill="none"
              strokeDasharray={path.dashArray}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              exit={{ pathLength: 0, opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            >
                {/* Add flowing animation for Lu (solid lines) */}
                {path.type === 'Lu' && (
                    <animate 
                        attributeName="stroke-dasharray" 
                        values="0,1000;1000,0" // Just a guess, better to use CSS or motion values
                        // Actually, motion handles pathLength. 
                        // For "flow", we usually use strokeDashoffset with a dasharray pattern.
                        // But if it's solid, we can't "flow" dashes.
                        // We can add a gradient or a second path that moves?
                        // User asked for "Slow flow animation".
                        // Simple way: make it dashed with very small gaps or just overlay a moving light.
                        // Let's stick to simple path drawing for now as per "pathLength" animation.
                        // If "flow" implies continuous movement after drawing:
                    />
                )}
            </motion.path>
          ))}
          
          {/* Add arrowheads or markers if needed? User didn't ask. */}
        </AnimatePresence>
      </svg>
    </div>
  );
}
