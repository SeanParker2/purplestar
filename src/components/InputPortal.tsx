"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface InputPortalProps {
  onSubmit: (data: { date: Date; longitude: number; gender: "male" | "female" }) => void;
}

export default function InputPortal({ onSubmit }: InputPortalProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [longitude, setLongitude] = useState("120.0"); // Keep as string for input handling
  const [gender, setGender] = useState<"male" | "female">("male");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!date || !time) {
      setError("请填写完整的时间信息");
      return;
    }

    const lng = parseFloat(longitude);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setError("经度必须在 -180 到 180 之间");
      return;
    }

    // Construct Date object
    // Note: This creates a Date in the user's local timezone unless we force it.
    // However, for Zi Wei Dou Shu, we typically treat the input as Beijing Time (UTC+8) 
    // or just "Local Clock Time" which calculateTrueSolarTime will adjust.
    // Let's assume the input is "Standard Time" (e.g. Beijing Time).
    const dateTimeStr = `${date}T${time}:00`;
    const d = new Date(dateTimeStr);

    if (isNaN(d.getTime())) {
      setError("无效的日期或时间");
      return;
    }

    setError("");
    onSubmit({
      date: d,
      longitude: lng,
      gender,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Dark Glass Background */}
      <div className="absolute inset-0 bg-void/80 backdrop-blur-md" />

      {/* Form Container */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "relative w-full max-w-[340px] p-8 flex flex-col gap-8",
          "bg-linear-to-b from-white/5 to-transparent",
          "border border-glass-border rounded-2xl",
          "shadow-2xl backdrop-blur-xl"
        )}
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="font-serif text-2xl text-gold-primary tracking-widest">
            命盘开启
          </h2>
          <p className="text-[10px] text-text-muted uppercase tracking-[4px]">
            Enter Your Coordinates
          </p>
        </div>

        {/* Inputs */}
        <div className="space-y-6">
          {/* Date */}
          <div className="space-y-1">
            <label className="text-[10px] text-gold-primary/60 uppercase tracking-wider block">
              出生日期 (Date)
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={cn(
                "w-full bg-transparent border-b border-gold-primary/30",
                "text-gold-primary font-mono text-lg py-1",
                "focus:outline-none focus:border-gold-primary transition-colors",
                "placeholder:text-white/10"
              )}
            />
          </div>

          {/* Time */}
          <div className="space-y-1">
            <label className="text-[10px] text-gold-primary/60 uppercase tracking-wider block">
              出生时间 (Time)
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={cn(
                "w-full bg-transparent border-b border-gold-primary/30",
                "text-gold-primary font-mono text-lg py-1",
                "focus:outline-none focus:border-gold-primary transition-colors"
              )}
            />
          </div>

          {/* Longitude */}
          <div className="space-y-1">
            <label className="text-[10px] text-gold-primary/60 uppercase tracking-wider block">
              经度 (Longitude)
            </label>
            <input
              type="number"
              step="0.1"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className={cn(
                "w-full bg-transparent border-b border-gold-primary/30",
                "text-gold-primary font-mono text-lg py-1",
                "focus:outline-none focus:border-gold-primary transition-colors"
              )}
            />
          </div>

          {/* Gender Toggle */}
          <div className="space-y-2">
            <label className="text-[10px] text-gold-primary/60 uppercase tracking-wider block text-center">
              性别 (Gender)
            </label>
            <div className="flex bg-white/5 rounded-full p-1 border border-white/10 relative">
              <div
                className={cn(
                  "absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-gold-primary transition-all duration-300",
                  gender === "male" ? "left-1" : "left-[calc(50%+4px)]" // Adjust based on layout
                  // Actually left-1 is start, left-[calc(50%)] is mid?
                  // Let's use left-1 for first item, left-[50%] for second?
                )}
                style={{
                    left: gender === "male" ? "4px" : "calc(50% + 4px)",
                    width: "calc(50% - 8px)"
                }}
              />
              <button
                onClick={() => setGender("male")}
                className={cn(
                  "flex-1 relative z-10 py-2 text-xs tracking-widest transition-colors duration-300 text-center rounded-full",
                  gender === "male" ? "text-void-bg font-bold" : "text-text-muted hover:text-white"
                )}
              >
                男 (Male)
              </button>
              <button
                onClick={() => setGender("female")}
                className={cn(
                  "flex-1 relative z-10 py-2 text-xs tracking-widest transition-colors duration-300 text-center rounded-full",
                  gender === "female" ? "text-void-bg font-bold" : "text-text-muted hover:text-white"
                )}
              >
                女 (Female)
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-red-400 text-xs text-center font-serif tracking-wide">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          className={cn(
            "w-full py-4 mt-2",
            "bg-gold-primary text-void-bg font-serif font-bold tracking-[4px]",
            "rounded-full shadow-[0_0_20px_rgba(229,195,101,0.3)]",
            "hover:bg-gold-light hover:shadow-[0_0_30px_rgba(229,195,101,0.5)]",
            "transition-all duration-300 transform active:scale-95"
          )}
        >
          开启命盘
        </button>
      </motion.div>
    </motion.div>
  );
}
