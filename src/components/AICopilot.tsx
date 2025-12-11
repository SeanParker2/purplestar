"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Minimize2, Bot } from "lucide-react"; // Assuming lucide-react is available or use standard SVGs
import { cn } from "@/lib/utils";
import { type PalaceData, type ZiWeiChart } from "@/lib/ziwei";

// --- Types ---

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface AICopilotProps {
  chart: ZiWeiChart | null;
  currentPalace: PalaceData | null;
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

// --- Mock AI Service ---

const MOCK_RESPONSES = [
  "从星象来看，此宫位吉星高照，主星得力，预示着顺遂的发展趋势。若能把握机会，定能有所斩获。",
  "此宫位受化忌星影响，可能会有一些波折和变动。建议稳中求进，不可操之过急，注意防范潜在的风险。",
  "主星庙旺，且有吉星拱照，这是一个非常有力的格局。在相关领域投入精力，必有丰厚回报。",
  "虽然主星平平，但辅星配合得当，呈现出一种平稳上升的态势。适合积累沉淀，等待时机。",
  "此处星曜组合略显驳杂，显示出内心的纠结与外部环境的多变。建议保持冷静，理清思路再做决定。",
];

// --- Component ---

export function AICopilot({ chart, currentPalace, className, isOpen: externalIsOpen, onClose }: AICopilotProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  const isControlled = externalIsOpen !== undefined;
  const isOpen = isControlled ? externalIsOpen : internalIsOpen;

  const setIsOpen = (value: boolean) => {
    if (isControlled) {
      if (!value && onClose) {
        onClose();
      }
    } else {
      setInternalIsOpen(value);
    }
  };
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "assistant",
      content: "你好，我是你的紫微斗数 AI 助手。我可以为你解读命盘，分析运势。点击“分析此宫”开始吧。",
      timestamp: Date.now(),
    },
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle Send Message
  const handleSendMessage = async (text: string, isAnalysisRequest: boolean = false) => {
    if (!text.trim()) return;

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI Delay & Stream
    // In a real app, this would be a fetch call to an API
    timeoutRef.current = setTimeout(() => {
      let responseText = "";
      
      if (isAnalysisRequest && currentPalace && chart) {
        // Construct a pseudo-intelligent response based on the palace
        const palaceName = currentPalace.palaceName;
        const mainStars = currentPalace.majorStars.map(s => s.name).join("、") || "无主星";
        const brightness = currentPalace.majorStars.map(s => s.brightness).filter(Boolean).join("、");
        const mutagens = currentPalace.majorStars.map(s => s.mutagen).filter(Boolean).join("、");
        
        responseText = `【${palaceName}分析】\n`;
        responseText += `主星：${mainStars} ${brightness ? `(${brightness})` : ''}\n`;
        if (mutagens) responseText += `四化：${mutagens}\n`;
        
        // Pick a random template response for variety
        const randomAnalysis = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
        responseText += `\n大师解读：${randomAnalysis}`;
      } else {
        responseText = "这是一个非常有趣的问题。在紫微斗数中，我们需要综合考虑本宫、对宫以及三方四正的星曜组合。";
      }

      // Start "Streaming" Typewriter Effect
      let charIndex = 0;
      const streamId = Date.now().toString() + "_ai";
      
      // Initialize empty assistant message
      setMessages((prev) => [
        ...prev,
        { id: streamId, role: "assistant", content: "", timestamp: Date.now() },
      ]);

      const interval = setInterval(() => {
        if (charIndex < responseText.length) {
          const nextChar = responseText[charIndex];
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === streamId
                ? { ...msg, content: msg.content + nextChar }
                : msg
            )
          );
          charIndex++;
        } else {
          clearInterval(interval);
          setIsTyping(false);
        }
      }, 50); // 50ms per character

    }, 1000); // Initial delay
  };

  // Handle "Analyze This Palace"
  const handleAnalyzeClick = () => {
    if (!currentPalace || !chart) return;
    
    // Find Life Palace
    const lifePalace = chart.palaces.find(p => p.palaceName === "命宫");
    const lifeMainStars = lifePalace?.majorStars.map(s => s.name).join("、") || "无";

    // Find current palace index to calculate Three Parties & Opposite
    const currentIndex = chart.palaces.indexOf(currentPalace);
    const wealthIndex = (currentIndex + 4) % 12;
    const careerIndex = (currentIndex + 8) % 12;
    const migrationIndex = (currentIndex + 6) % 12;

    const wealthPalace = chart.palaces[wealthIndex];
    const careerPalace = chart.palaces[careerIndex];
    const migrationPalace = chart.palaces[migrationIndex];

    const getStars = (p: PalaceData) => {
      const majors = p.majorStars.map(s => s.name).join("");
      const minors = p.minorStars.map(s => s.name).join("");
      return majors + (minors ? "、" + minors : "") || "无主星";
    };

    const triStars = [
      `${wealthPalace.palaceName}：${getStars(wealthPalace)}`,
      `${careerPalace.palaceName}：${getStars(careerPalace)}`,
      `${migrationPalace.palaceName}：${getStars(migrationPalace)}`
    ].join("；");
    
    const currentMainStars = currentPalace.majorStars.map(s => s.name).join("、") || "无主星";
    const currentMinorStars = currentPalace.minorStars.map(s => s.name).join("、");
    
    // User Template: "你是一名紫微斗数大师。当前命主命宫主星为[MainStar]，三方四正有[Stars]。请分析今年的流年运势。"
    // Adapted for specific palace analysis:
    const prompt = `你是一名紫微斗数大师。当前命主命宫主星为【${lifeMainStars}】。
我正在查看【${currentPalace.palaceName}】，本宫主星为【${currentMainStars}】，辅星【${currentMinorStars}】。
其三方四正（${triStars}）。
请分析此宫位的吉凶趋势及流年运势。`;
    
    handleSendMessage(prompt, true);
  };

  return (
    <>
      <AnimatePresence>
        {/* Chat Window */}
        {isOpen && (
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50",
              "h-[50vh] md:h-[600px] md:w-[400px] md:right-4 md:left-auto md:bottom-4 md:rounded-2xl",
              "bg-void/90 backdrop-blur-xl border-t md:border border-white/10 shadow-2xl",
              "flex flex-col overflow-hidden",
              "font-serif text-white",
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-gold-primary" />
                <span className="font-bold tracking-wide">AI 问策</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <Minimize2 className="w-4 h-4 text-white/70" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex w-full",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed whitespace-pre-wrap shadow-sm",
                      msg.role === "user"
                        ? "bg-gold-primary text-void-bg font-sans font-medium rounded-br-none"
                        : "bg-white/10 text-white/90 border border-white/5 rounded-bl-none"
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/10 rounded-2xl rounded-bl-none px-4 py-2 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-gold-primary/70 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-gold-primary/70 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-gold-primary/70 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {currentPalace && !isTyping && (
              <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar">
                <button
                  onClick={handleAnalyzeClick}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gold-primary/10 border border-gold-primary/30 rounded-full text-xs text-gold-primary hover:bg-gold-primary/20 transition-colors whitespace-nowrap"
                >
                  <Sparkles className="w-3 h-3" />
                  分析{currentPalace.palaceName}
                </button>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t border-white/10 bg-white/5">
              <div className="relative flex items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputValue)}
                  placeholder="输入问题..."
                  disabled={isTyping}
                  className="w-full bg-black/20 border border-white/10 rounded-full pl-4 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-gold-primary/50 transition-colors placeholder:text-white/30"
                />
                <button
                  onClick={() => handleSendMessage(inputValue)}
                  disabled={!inputValue.trim() || isTyping}
                  className="absolute right-1.5 p-1.5 bg-gold-primary text-void-bg rounded-full hover:bg-gold-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Send Message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Bubble (Only visible when closed) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className={cn(
              "fixed bottom-6 right-6 z-50",
              "flex items-center gap-2 px-4 py-3",
              "bg-gold-primary text-void-bg font-serif font-bold shadow-[0_4px_20px_rgba(229,195,101,0.4)]",
              "rounded-full border border-white/20 backdrop-blur-md",
              className
            )}
          >
            <Bot className="w-5 h-5" />
            <span>问策</span>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
