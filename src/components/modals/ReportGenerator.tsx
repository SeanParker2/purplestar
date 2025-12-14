import React, { useState, useEffect, useRef } from 'react';
import { X, Printer, Sparkles, Loader2, Download, ChevronRight, Menu } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

interface ReportGeneratorProps {
  onClose: () => void;
  chartContext: any;
}

const SECTIONS = [
  { id: 'summary', title: '命造总纲' },
  { id: 'career-wealth', title: '事业与财富' },
  { id: 'relationships', title: '情感羁绊' },
  { id: 'yearly-fortune', title: '流年运势' },
  { id: 'guide', title: '造命指南' }
];

interface SidebarContentProps {
  activeSection: string;
  scrollToSection: (id: string) => void;
  handlePrint: () => void;
  onClose: () => void;
  isMobile?: boolean;
}

const SidebarContent = ({ activeSection, scrollToSection, handlePrint, onClose, isMobile }: SidebarContentProps) => (
  <div className="flex flex-col h-full bg-[#1a1a24] md:bg-black/40 text-white">
    {/* Header */}
    <div className="p-6 border-b border-white/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gold-primary">
            <Sparkles className="w-5 h-5" />
            <h1 className="text-lg font-serif font-bold tracking-wider">命理白皮书</h1>
        </div>
        {isMobile && (
           <button onClick={onClose} className="text-white/50 hover:text-white">
             <X className="w-5 h-5" />
           </button>
        )}
      </div>
      <p className="text-xs text-white/40 mt-2">2025乙巳年 · 深度解析版</p>
    </div>

    {/* Navigation Links */}
    <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        {SECTIONS.map((section) => (
            <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-all duration-300 ${
                    activeSection === section.id 
                    ? 'bg-gold-primary/10 text-gold-primary border border-gold-primary/20' 
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
            >
                <span>{section.title}</span>
                {activeSection === section.id && <ChevronRight className="w-4 h-4" />}
            </button>
        ))}
    </div>

    {/* Actions */}
    <div className="p-6 border-t border-white/10 space-y-3 bg-black/20">
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors border border-white/10">
            <Download className="w-4 h-4" />
            <span className="text-sm">导出 PDF</span>
        </button>
        <button 
            onClick={handlePrint}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gold-primary/10 hover:bg-gold-primary/20 text-gold-primary transition-colors border border-gold-primary/20"
        >
            <Printer className="w-4 h-4" />
            <span className="text-sm">打印报告</span>
        </button>
        {!isMobile && (
          <button 
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-white/40 hover:text-white transition-colors text-xs mt-2"
          >
              <X className="w-3 h-3" />
              <span>关闭窗口</span>
          </button>
        )}
    </div>
  </div>
);

export default function ReportGenerator({ onClose, chartContext }: ReportGeneratorProps) {
  const [report, setReport] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const cachedReport = localStorage.getItem('report_cache');
    if (cachedReport) {
      setReport(JSON.parse(cachedReport));
      setIsLoading(false);
    } else {
      generateReport();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const generateReport = async () => {
    setIsLoading(true);
    setError(null);
    setReport('');
    
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          chartContext: chartContext,
          mode: 'report'
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.statusText}`);
      }

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                try {
                    const json = JSON.parse(data);
                    const content = json.choices[0]?.delta?.content || '';
                    if (content) {
                        fullText += content;
                        setReport(prev => prev + content);
                        // Auto-scroll logic could be refined here to only scroll if near bottom
                        if (contentRef.current) {
                           // Use requestAnimationFrame for smoother scrolling
                           requestAnimationFrame(() => {
                               if (contentRef.current && isLoading) { // Only auto-scroll while loading
                                   contentRef.current.scrollTop = contentRef.current.scrollHeight;
                               }
                           });
                        }
                    }
                } catch (e) {
                    // ignore incomplete JSON
                }
            }
        }
      }
      
      localStorage.setItem('report_cache', JSON.stringify(fullText));
      setIsLoading(false);

    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error(err);
      setError('生成报告时出错，请重试');
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };
  
  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    // Close mobile menu after selection
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-0 md:p-4 print:p-0 print:bg-white">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full h-full max-w-6xl bg-[#1a1a24] border-0 md:border border-white/10 shadow-2xl rounded-none md:rounded-xl overflow-hidden flex flex-col md:flex-row print:border-none print:shadow-none print:rounded-none print:text-black print:bg-white"
        style={{
             backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")', 
        }}
      >
        {/* Desktop Sidebar (Hidden on Mobile) */}
        <div className="hidden md:flex w-1/4 min-w-[250px] border-r border-white/10 print:hidden">
            <SidebarContent 
                activeSection={activeSection} 
                scrollToSection={scrollToSection} 
                handlePrint={handlePrint} 
                onClose={onClose} 
            />
        </div>

        {/* Mobile Sidebar Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              />
              {/* Drawer */}
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed inset-y-0 left-0 w-[80%] max-w-[300px] z-50 md:hidden shadow-2xl border-r border-white/10"
              >
                <SidebarContent 
                    activeSection={activeSection} 
                    scrollToSection={scrollToSection} 
                    handlePrint={handlePrint} 
                    onClose={() => setIsMobileMenuOpen(false)} 
                    isMobile={true}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Right Content Area */}
        <div 
            ref={contentRef}
            className="flex-1 overflow-y-auto relative scroll-smooth print:overflow-visible print:h-auto w-full"
        >
          {/* Mobile Header Bar */}
          <div className="md:hidden sticky top-0 left-0 right-0 z-30 flex items-center justify-between p-4 bg-[#1a1a24]/80 backdrop-blur-md border-b border-white/10">
             <div className="flex items-center gap-3">
               <button 
                 onClick={() => setIsMobileMenuOpen(true)}
                 className="p-2 -ml-2 text-gold-primary hover:bg-white/5 rounded-lg transition-colors"
               >
                 <Menu className="w-6 h-6" />
               </button>
               <span className="text-gold-primary font-serif font-bold tracking-wide">命理白皮书</span>
             </div>
             <button onClick={onClose} className="p-2 -mr-2 text-white/50 hover:text-white">
                <X className="w-5 h-5" />
             </button>
          </div>

          {error ? (
            <div className="flex flex-col items-center justify-center h-full text-red-400 gap-4">
                <p>{error}</p>
                <button 
                    onClick={generateReport}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded text-white text-sm"
                >
                    重试
                </button>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto py-8 px-5 md:py-12 md:px-12 print:px-0 print:py-0">
                {/* Print Header (Visible only in print) */}
                <div className="hidden print:block mb-8 border-b-2 border-black pb-4">
                    <h1 className="text-3xl font-serif font-bold text-black mb-2">2025年度命理深度白皮书</h1>
                    <p className="text-gray-500 text-sm">PurpleStar AI 命理师亲批</p>
                </div>

                {report ? (
                    <div className="prose prose-invert prose-gold max-w-none print:prose-headings:text-black print:text-black">
                        <ReactMarkdown
                            components={{
                                h1: ({node, ...props}) => {
                                    // Map H1 content to section IDs for navigation
                                    let id = '';
                                    const text = String(props.children);
                                    if (text.includes('命造总纲')) id = 'summary';
                                    else if (text.includes('黄金三角')) id = 'career-wealth';
                                    else if (text.includes('情感羁绊')) id = 'relationships';
                                    else if (text.includes('流年运势')) id = 'yearly-fortune';
                                    else if (text.includes('造命指南')) id = 'guide';
                                    
                                    return (
                                        <h1 
                                            id={id} 
                                            className="text-xl md:text-2xl font-serif text-gold-primary border-b border-gold-primary/30 pb-2 mb-6 mt-10 first:mt-0 print:text-black print:border-black/30 scroll-mt-20 md:scroll-mt-8" 
                                            {...props} 
                                        />
                                    );
                                },
                                h2: ({node, ...props}) => (
                                    <h2 className="text-lg md:text-xl font-serif text-white/90 mt-6 md:mt-8 mb-4 print:text-black" {...props} />
                                ),
                                p: ({node, ...props}) => {
                                    const text = String(props.children);
                                    // Highlight industry tags
                                    if (text.includes('推荐行业：')) {
                                        const parts = text.split('推荐行业：');
                                        return (
                                            <p className="leading-relaxed text-gray-300 mb-4 indent-0 md:indent-8 text-base md:text-lg print:text-gray-800" {...props}>
                                                {parts[0]}
                                                <strong className="text-gold-primary print:text-black">推荐行业：</strong>
                                                <span className="bg-gold-primary/10 text-gold-light px-2 py-0.5 rounded mx-1 print:bg-transparent print:text-black print:border print:border-black print:px-1">
                                                    {parts[1]}
                                                </span>
                                            </p>
                                        );
                                    }
                                    return (
                                        <p className="leading-relaxed text-gray-300 mb-4 indent-0 md:indent-8 text-base md:text-lg print:text-gray-800" {...props} />
                                    );
                                },
                                li: ({node, ...props}) => (
                                    <li className="text-gray-300 ml-4 mb-2 text-base md:text-lg print:text-gray-800" {...props} />
                                ),
                                strong: ({node, ...props}) => (
                                    <strong className="text-gold-light font-bold print:text-black" {...props} />
                                )
                            }}
                        >
                            {report}
                        </ReactMarkdown>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-[60vh] opacity-50">
                        <Loader2 className="w-12 h-12 animate-spin text-gold-primary mb-6" />
                        <p className="text-gold-primary/80 animate-pulse text-lg font-serif">
                            大师正在焚香以此，批阅命盘...
                        </p>
                        <p className="text-white/30 text-sm mt-2">预计耗时 30 秒</p>
                    </div>
                )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
