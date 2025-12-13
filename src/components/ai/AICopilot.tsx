"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Minimize2, X, Bot, BookOpen, StopCircle, Maximize2, MessageCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { type PalaceData, type ZiWeiChart } from "@/lib/ziwei";
import { STAR_INTERPRETATIONS, type StarInterpretation } from "@/data/interpretations";

// --- Types ---

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  action?: {
    type: "analyze_palace";
    label: string;
    palaceName: string;
  };
}

interface AICopilotProps {
  chart: ZiWeiChart | null;
  palaceData: PalaceData;
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

// --- Helper Hooks ---
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
}

// --- Components ---
const LoadingIndicator = () => {
  const texts = [
    "大师正在推演流年...",
    "正在解析星曜...",
    "连接天地磁场...",
    "查询古籍断语...",
    "推算飞星轨迹..."
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % texts.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-3 px-1">
      <div className="relative w-5 h-5">
        <div className="absolute inset-0 border-2 border-gold-primary/30 rounded-full animate-spin-slow" />
        <div className="absolute inset-0 border-t-2 border-gold-primary rounded-full animate-spin" />
        <div className="absolute inset-1.5 bg-gold-primary/20 rounded-full animate-pulse" />
      </div>
      <motion.span 
        key={index}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        className="text-xs text-gold-light/80 font-serif tracking-widest min-w-[120px]"
      >
        {texts[index]}
      </motion.span>
    </div>
  );
};

export default function AICopilot({ chart, palaceData, className, isOpen: externalIsOpen, onClose }: AICopilotProps) {
  // Layout State
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [isMinimized, setIsMinimized] = useState(false);

  // Visibility Control
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
  
  // Reset minimized state when opened
  useEffect(() => {
    if (isOpen) {
      setIsMinimized(false);
    }
  }, [isOpen]);

  // Chat State
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
  
  // Knowledge Base State
  const [interpretation, setInterpretation] = useState<StarInterpretation | null>(null);
  const [isLoadingKnowledge, setIsLoadingKnowledge] = useState(false);
  const [matchedStarName, setMatchedStarName] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Chart State Tracking
  const prevChartRef = useRef<ZiWeiChart | null>(null);
  const prevPalaceRef = useRef<string>(palaceData.palaceName);

  // Check for palace changes
  useEffect(() => {
    if (prevPalaceRef.current !== palaceData.palaceName) {
      if (isOpen) {
        const starNames = palaceData.majorStars.map(s => s.name).join("、");
        const label = starNames ? `分析此宫 [${palaceData.palaceName}·${starNames}]` : `分析此宫 [${palaceData.palaceName}]`;
        
        setMessages(prev => [
          ...prev,
          {
            id: `system-switch-${Date.now()}`,
            role: "assistant",
            content: `检测到您已切换至 ${palaceData.palaceName}。`,
            timestamp: Date.now(),
            action: {
              type: "analyze_palace",
              label: label,
              palaceName: palaceData.palaceName
            }
          }
        ]);
      }
      prevPalaceRef.current = palaceData.palaceName;
    }
  }, [palaceData.palaceName, isOpen]);

  // Check for chart changes
  useEffect(() => {
    // Skip initial render or if chart is null
    if (!chart) return;

    // Compare with previous chart
    if (prevChartRef.current && 
        (prevChartRef.current.solarDateStr !== chart.solarDateStr || 
         prevChartRef.current.timeIndex !== chart.timeIndex ||
         prevChartRef.current.gender !== chart.gender)) {
      
      // Chart has changed!
      setMessages(prev => [
        ...prev,
        {
          id: `system-reset-${Date.now()}`,
          role: "assistant",
          content: "检测到您的命盘已更新。是否需要为您重新分析当前的新命盘？",
          timestamp: Date.now(),
        }
      ]);
      
      // If copilot is hidden, maybe show a notification dot? 
      // For now, we just ensure the user sees the message if they open it.
      if (!isOpen && !isControlled) {
        // Optional: Auto-open or show badge
      }
    }

    // Update ref
    prevChartRef.current = chart;
  }, [chart, isOpen, isControlled]);

  // Load Knowledge Base
  useEffect(() => {
    if (!palaceData) return;

    setIsLoadingKnowledge(true);
    setInterpretation(null);
    setMatchedStarName("");

    // Simulate network/db latency
    const timer = setTimeout(() => {
      let found: StarInterpretation | null = null;
      let starName = "";

      // Only search if we have major stars
      if (palaceData.majorStars && palaceData.majorStars.length > 0) {
        // Try to find a match for any of the major stars
        for (const star of palaceData.majorStars) {
          // Direct lookup in array
          const match = STAR_INTERPRETATIONS.find(
            (item) => item.star === star.name && item.palace === palaceData.palaceName
          );

          if (match) {
            found = match;
            starName = star.name;
            break; // Use the first match
          }
        }
      }

      setInterpretation(found);
      setMatchedStarName(starName);
      setIsLoadingKnowledge(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [palaceData]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current && !isMinimized && isOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isOpen, interpretation, isMinimized]);

  // Focus input on open/expand
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      // Small delay to allow animation to complete
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, isMinimized]);

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsTyping(false);
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg.role === "assistant") {
          return [
            ...prev.slice(0, -1),
            { ...lastMsg, content: lastMsg.content + "\n(已停止生成)" },
          ];
        }
        return prev;
      });
    }
  };

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

    // Build Prompt with Knowledge Base
    let additionalContext = "";
    if (interpretation && matchedStarName) {
      // Sanitize input just in case
      const safeStarName = matchedStarName.replace(/[<>]/g, "");
      const safeSummary = interpretation.summary.replace(/[<>]/g, "");
      additionalContext = `\n\n相关断语参考（用户宫位：${palaceData.palaceName}，主星：${safeStarName}）：${safeSummary}`;
    }

    // Construct Chart Context
    const chartContext = {
      palace: palaceData,
      basicInfo: chart ? {
        gender: chart.gender,
        solarDate: chart.solarDateStr,
        timeIndex: chart.timeIndex
      } : null,
      knowledgeBase: additionalContext
    };

    // Filter history (exclude init message)
    const history = messages
      .filter(m => m.id !== 'init')
      .map(m => ({ role: m.role, content: m.content }));
    
    const apiMessages = [...history, { role: 'user', content: text + additionalContext }];

    // API Call
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          messages: apiMessages,
          chartContext: chartContext
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        let errorMsg = '连接异常';
        try {
          // Try to parse the error json from server
          const errorData = await response.json();
          errorMsg = errorData.error || response.statusText;
        } catch (e) {
          // If not json, use status text
          errorMsg = response.statusText;
        }
        throw new Error(errorMsg);
      }

      // Prepare empty assistant message
      const aiMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: aiMsgId,
        role: 'assistant',
        content: '',
        timestamp: Date.now()
      }]);

      // Stream handling
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiContent = "";
      let buffer = "";

      if (!reader) throw new Error('No response body');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        const lines = buffer.split('\n');
        buffer = lines.pop() || ""; // Keep the incomplete line

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') break;
            
            try {
              const data = JSON.parse(dataStr);
              // DeepSeek/OpenAI stream format: choices[0].delta.content
              const content = data.choices?.[0]?.delta?.content || "";
              if (content) {
                aiContent += content;
                setMessages(prev => prev.map(m => 
                  m.id === aiMsgId ? { ...m, content: aiContent } : m
                ));
              }
            } catch (e) {
              console.warn('JSON parse error in stream:', e);
            }
          }
        }
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
      } else {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: `[系统提示] 抱歉，${error.message}`,
          timestamp: Date.now()
        }]);
      }
    } finally {
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      {isMinimized ? (
        // --- Minimized View (Floating Icon) ---
        <motion.button
          key="minimized"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsMinimized(false)}
          className={cn(
            "fixed z-50 flex flex-col items-center justify-center gap-1",
            isDesktop ? "bottom-6 right-6" : "bottom-24 right-4"
          )}
        >
          <div className="relative w-14 h-14 rounded-full bg-gold-primary/20 backdrop-blur-md border border-gold-primary/50 flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.3)] overflow-hidden group">
            <div className="absolute inset-0 bg-gold-primary/10 group-hover:bg-gold-primary/20 transition-colors" />
            <Sparkles className="w-6 h-6 text-gold-primary animate-pulse" />
          </div>
          <span className="text-[10px] font-medium text-gold-primary/80 bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-sm">
            问策
          </span>
        </motion.button>
      ) : (
        // --- Expanded View (Chat Window) ---
        <motion.div
          key="expanded"
          initial={isDesktop 
            ? { opacity: 0, x: 20, y: 0 } 
            : { opacity: 0, y: "100%" }
          }
          animate={isDesktop 
            ? { opacity: 1, x: 0, y: 0 } 
            : { opacity: 1, y: 0 }
          }
          exit={isDesktop 
            ? { opacity: 0, x: 20 } 
            : { opacity: 0, y: "100%" }
          }
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden shadow-2xl backdrop-blur-xl bg-void/90 border border-gold-primary/20",
            isDesktop 
              ? "bottom-6 right-6 w-96 h-[600px] rounded-2xl" 
              : "bottom-0 left-0 right-0 h-[50vh] rounded-t-2xl border-b-0"
          )}
        >
          {/* Mobile Drag Handle */}
          {!isDesktop && (
            <div className="w-full flex justify-center pt-2 pb-1 bg-white/5 cursor-grab active:cursor-grabbing" onClick={() => setIsMinimized(true)}>
              <div className="w-12 h-1.5 bg-white/20 rounded-full" />
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gold-primary/20 bg-gold-dark/5">
            <div className="flex items-center gap-2 text-gold-primary">
              <Bot size={20} />
              <span className="font-serif font-medium tracking-wide">PurpleStar AI 问策</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                title="最小化"
              >
                <Minimize2 size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-white/50 hover:text-red-400 hover:bg-white/10 transition-colors"
                title="关闭"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gold-primary/20 scrollbar-track-transparent">
            
            {/* Featured Interpretation Card */}
            <AnimatePresence>
              {isLoadingKnowledge ? (
                 <motion.div
                   initial={{ opacity: 0, height: 0 }}
                   animate={{ opacity: 1, height: "auto" }}
                   exit={{ opacity: 0, height: 0 }}
                   className="mb-4"
                 >
                   <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2 animate-pulse">
                     <div className="h-4 w-1/3 bg-white/10 rounded"></div>
                     <div className="h-16 w-full bg-white/10 rounded"></div>
                   </div>
                 </motion.div>
              ) : interpretation ? (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-liner-to-br from-gold-dark/20 to-void border border-gold-primary/30 rounded-lg p-4 mb-4 relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                    <BookOpen size={48} />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-gold-primary text-void">精选断语</span>
                    <span className="text-xs text-gold-light/70">{matchedStarName} · {palaceData.palaceName}</span>
                  </div>
                  <p className="text-sm text-gray-200 leading-relaxed font-serif">
                    {interpretation.summary}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {interpretation.tags.map(tag => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full border border-white/10 text-white/60">
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

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
                    "max-w-[85%] rounded-lg px-4 py-2.5 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-gold-primary text-void font-medium"
                      : "bg-white/10 text-gray-100 border border-white/5"
                  )}
                >
                  {msg.role === "user" ? (
                    msg.content
                  ) : (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                        strong: ({ children }) => <span className="font-bold text-gold-light">{children}</span>,
                        ul: ({ children }) => <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="text-gray-200">{children}</li>,
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-2 border-gold-primary/50 pl-3 my-2 italic text-white/60">
                            {children}
                          </blockquote>
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  )}
                  {msg.action && msg.action.type === 'analyze_palace' && (
                    <button
                      onClick={() => handleSendMessage(`请分析${msg.action!.palaceName}的运势`, true)}
                      className="mt-3 w-full py-2 px-3 bg-gold-dark/20 hover:bg-gold-dark/30 border border-gold-primary/20 rounded text-sm text-gold-light transition-colors flex items-center justify-center gap-2 group"
                    >
                      <Sparkles size={14} className="group-hover:text-gold-primary" />
                      {msg.action.label}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start items-center gap-2 pl-2">
                <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                  <LoadingIndicator />
                </div>
                <button 
                  onClick={handleStopGeneration}
                  className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-red-400 transition-colors"
                  title="停止生成"
                >
                  <StopCircle size={16} />
                </button>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-void/30 border-t border-white/10">
            {messages.length === 1 && (
              <button
                onClick={() => handleSendMessage(`请分析${palaceData.palaceName}的运势`, true)}
                className="w-full mb-3 py-2 px-3 bg-gold-dark/20 hover:bg-gold-dark/30 border border-gold-primary/20 rounded text-sm text-gold-light transition-colors flex items-center justify-center gap-2 group"
              >
                <Sparkles size={14} className="group-hover:text-gold-primary" />
                分析此宫 ({palaceData.palaceName})
              </button>
            )}
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入您的问题..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-gold-primary/50 transition-colors"
              />
              <button
                onClick={() => handleSendMessage(inputValue)}
                disabled={!inputValue.trim() || isTyping}
                className="p-2 bg-gold-primary text-void rounded-lg hover:bg-gold-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
