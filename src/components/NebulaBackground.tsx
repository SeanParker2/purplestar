"use client";

import React from "react";

export function NebulaBackground() {
  return (
    <div className="fixed inset-0 -z-50 overflow-hidden bg-void">
      {/* Deep Space Background */}
      <div 
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at 50% 120%, #1a0b2e 0%, #000000 70%)"
        }}
      />

      {/* Nebula Orbs */}
      <div
        className="absolute -top-[10%] -left-[20%] w-[300px] h-[300px] rounded-full bg-nebula-purple blur-[80px] opacity-60 animate-float"
      />
      
      <div
        className="absolute bottom-[10%] -right-[10%] w-[250px] h-[250px] rounded-full bg-nebula-blue blur-[80px] opacity-60 animate-float"
        style={{ animationDelay: "-10s" }}
      />

      {/* Noise Overlay */}
      <div 
        className="fixed inset-0 w-full h-full pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")`
        }}
      />
    </div>
  );
}
