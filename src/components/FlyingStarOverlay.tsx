"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface TransformedPalace {
  index: number;
  type: 'Lu' | 'Quan' | 'Ke' | 'Ji';
}

interface FlyingStarOverlayProps {
  focusedPalaceIndex: number;
  transformedPalaces: TransformedPalace[];
}

interface PathData {
  id: string;
  d: string;
  color: string;
  dashArray?: string;
}

export function FlyingStarOverlay({ focusedPalaceIndex, transformedPalaces, visible = false }: FlyingStarOverlayProps & { visible?: boolean }) {
  const [paths, setPaths] = useState<PathData[]>([]);

  // Calculate coordinates and paths
  useEffect(() => {
    const calculatePaths = () => {
      if (!visible) {
        setPaths(prev => prev.length > 0 ? [] : prev);
        return;
      }

      const newPaths: PathData[] = [];
      // Use ref or context for better reliability? 
      // For now, assuming DOM elements have IDs 'palace-index' is risky if those elements don't exist or IDs changed.
      // But the user didn't ask to change the ID strategy, just the logic.
      // Wait, in page.tsx, the TriSector elements don't seem to have IDs "palace-X".
      // The TriSector items are just divs.
      // AND the main card is just one card.
      // The Flying Star logic usually connects the "Life Palace" (or active palace) to other palaces ON THE CHART.
      // But currently we only show ONE card (Focus View).
      // If we are in Focus View, we don't have all 12 palaces visible on screen at correct positions.
      // This Overlay component seems designed for a "Grid View" or "Astrolabe View" where all palaces are visible.
      // However, the user asked to "Integrate Flying Star logic".
      // If the UI is "Focus View" (one big card), where do the lines fly TO?
      // Maybe the user implies we should have the "TriSector" (3 small cards) + Main Card acting as targets?
      // Or maybe this is for the "Grid View" (which is hidden/optional)?
      // BUT, the TriSector only shows 3 palaces. What if the flying star goes to a palace not in the TriSector?
      // The user prompt says: "Visual interaction: Default show 'Lu' gold line...".
      // If the target is not visible, we can't draw a line.
      // Assumption: The user might be expecting this to work in a context where targets ARE visible, 
      // OR I need to ensure the target elements exist.
      // In `page.tsx`, we have `TriSector` which has 3 items. And `FateCard` (Focus).
      // The IDs `palace-${index}` must exist.
      // I should probably add `id={`palace-${index}`}` to the relevant elements in `page.tsx`.
      // The Main Card is `currentPalace`.
      // The TriSectors are `wealthIndex`, `migrationIndex`, `careerIndex`.
      // But Flying Stars can fly to ANY of the 12 palaces.
      // If the target is not on screen, we can't draw.
      // I will implement the logic. If `document.getElementById` fails, it just skips.
      
      const sourceId = `palace-${focusedPalaceIndex}`;
      const sourceEl = document.getElementById(sourceId);

      if (!sourceEl) return;

      const sourceRect = sourceEl.getBoundingClientRect();
      const sourceX = sourceRect.left + sourceRect.width / 2;
      const sourceY = sourceRect.top + sourceRect.height / 2;

      transformedPalaces.forEach((target) => {
        const targetId = `palace-${target.index}`;
        const targetEl = document.getElementById(targetId);

        if (!targetEl) return;

        const targetRect = targetEl.getBoundingClientRect();
        const targetX = targetRect.left + targetRect.width / 2;
        const targetY = targetRect.top + targetRect.height / 2;

        const dx = targetX - sourceX;
        const dy = targetY - sourceY;
        
        // Curvature logic
        // If the distance is small, maybe less curve?
        // Let's keep the simple logic for now but maybe refine if needed.
        // If target is same as source (Self-Hua), we need a loop?
        // Current logic handles dx=0 dy=0 -> d="M x y C x y x y x y" -> dot.
        // Self-Hua loop is complex. For now, let's assume it flies to others.
        
        // Add some offset to control points for curvature
        // To make it look nice, we can offset perpendicular to the line connecting source and target.
        const midX = (sourceX + targetX) / 2;
        const midY = (sourceY + targetY) / 2;
        
        // Perpendicular vector (-dy, dx)
        const perpX = -dy;
        const perpY = dx;
        const len = Math.sqrt(perpX*perpX + perpY*perpY) || 1;
        
        // Curvature amount
        const curveAmount = 50; // pixels
        
        const cp1x = midX + (perpX / len) * curveAmount;
        const cp1y = midY + (perpY / len) * curveAmount;
        
        // Quadratic Bezier for simpler arc: M source Q cp target
        // Or Cubic: M source C cp1 cp2 target
        // Let's use a Quadratic curve for a nice arc.
        const d = `M ${sourceX} ${sourceY} Q ${cp1x} ${cp1y} ${targetX} ${targetY}`;

        // Determine style
        let color = '#FFFFFF';
        let dashArray = undefined;

        switch (target.type) {
          case 'Lu':
            color = '#FFD700'; // Gold (User request)
            break;
          case 'Quan':
            color = '#D64545'; // Red (User request)
            break;
          case 'Ke':
            color = '#4169E1'; // Blue (User request)
            break;
          case 'Ji':
            color = '#000000'; // Black (User request)
            dashArray = '5,3';
            break;
        }

        newPaths.push({
          id: `${sourceId}-${targetId}-${target.type}`,
          d,
          color,
          dashArray
        });
      });

      setPaths(newPaths);
    };

    calculatePaths();

    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(calculatePaths, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
      clearTimeout(timeoutId);
    };
  }, [focusedPalaceIndex, transformedPalaces, visible]);

  return (
    <svg className="fixed inset-0 w-full h-full z-50 pointer-events-none overflow-visible">
      <AnimatePresence>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            transition={{ duration: 0.4, ease: "easeInOut" }} // 300-500ms
            stroke={path.color}
            strokeWidth={2}
            strokeDasharray={path.dashArray}
            fill="none"
            strokeLinecap="round"
          />
        ))}
      </AnimatePresence>
    </svg>
  );
}

// Memoize the component
export const FlyingStarOverlayMemo = React.memo(FlyingStarOverlay);
