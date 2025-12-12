"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface PathData {
  id: string;
  d: string;
  color: string;
  dashArray?: string;
}

interface FlyingStarOverlayProps {
  paths: PathData[];
  visible?: boolean;
}

export default function FlyingStarOverlay({ paths }: FlyingStarOverlayProps) {
  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      <svg className="w-full h-full overflow-visible">
        <AnimatePresence>
          {paths.map((path) => (
            <motion.path
              key={path.id}
              d={path.d}
              stroke={path.color}
              strokeWidth="2"
              fill="none"
              strokeDasharray={path.dashArray}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              exit={{ pathLength: 0, opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
          ))}
        </AnimatePresence>
      </svg>
    </div>
  );
}
