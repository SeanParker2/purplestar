"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface LegalDocsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LegalDocs({ isOpen, onClose }: LegalDocsProps) {
  const [activeTab, setActiveTab] = useState<"agreement" | "privacy">("agreement");

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-60 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className={cn(
              "relative w-full max-w-2xl max-h-[80vh] flex flex-col",
              "bg-void border border-gold-primary/30 rounded-xl shadow-2xl overflow-hidden"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gold-primary/20 bg-white/5">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab("agreement")}
                  className={cn(
                    "text-sm font-serif tracking-widest px-4 py-2 rounded-lg transition-colors",
                    activeTab === "agreement"
                      ? "bg-gold-primary text-void font-bold"
                      : "text-gold-primary/60 hover:text-gold-primary hover:bg-white/5"
                  )}
                >
                  用户协议
                </button>
                <button
                  onClick={() => setActiveTab("privacy")}
                  className={cn(
                    "text-sm font-serif tracking-widest px-4 py-2 rounded-lg transition-colors",
                    activeTab === "privacy"
                      ? "bg-gold-primary text-void font-bold"
                      : "text-gold-primary/60 hover:text-gold-primary hover:bg-white/5"
                  )}
                >
                  隐私政策
                </button>
              </div>
              <button
                onClick={onClose}
                className="text-gold-primary/60 hover:text-gold-primary transition-colors p-2"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 text-justify">
              <div className="prose prose-invert prose-sm max-w-none text-gray-300 space-y-6">
                {activeTab === "agreement" ? (
                  <>
                    <section>
                      <h3 className="text-gold-primary font-serif text-lg mb-3">1. 服务说明</h3>
                      <p>
                        欢迎使用 PurpleStar 系统。本系统结合传统易学理论与现代人工智能技术，为您提供紫微斗数排盘及辅助解读服务。
                      </p>
                    </section>

                    <section className="p-4 border border-red-500/30 bg-red-900/10 rounded-lg">
                      <h3 className="text-red-400 font-serif text-lg mb-3 flex items-center gap-2">
                        ⚠️ 免责声明 (核心条款)
                      </h3>
                      <p className="text-red-200/90 font-bold leading-relaxed">
                        本系统提供的分析结果仅供娱乐、心理咨询辅助及传统文化研究使用，不具备科学依据，不构成任何形式的决策建议（包括但不限于投资、医疗、法律等）。用户应理性看待分析结果，相信科学，拒绝迷信。您的命运掌握在自己手中。
                      </p>
                    </section>

                    <section>
                      <h3 className="text-gold-primary font-serif text-lg mb-3">2. 未成年人保护</h3>
                      <p>
                        未满 18 周岁用户请在监护人陪同下使用本服务。我们致力于营造健康的网络环境，任何引导未成年人进行非理性消费或迷信活动的行为都是被严格禁止的。
                      </p>
                    </section>

                    <section>
                      <h3 className="text-gold-primary font-serif text-lg mb-3">3. 知识产权</h3>
                      <p>
                        本系统产生的所有排盘数据、UI 设计、算法逻辑及生成式文本内容，其知识产权归 PurpleStar 团队所有。未经授权，不得进行商业转载或反向工程。
                      </p>
                    </section>
                  </>
                ) : (
                  <>
                    <section>
                      <h3 className="text-gold-primary font-serif text-lg mb-3">1. 数据收集与使用</h3>
                      <p className="font-bold text-gold-light">
                        我们重视您的隐私。
                      </p>
                      <p>
                        您的生辰八字（出生日期、时间、地点）仅用于生成命盘数据。为了提供更精准的 AI 问策服务，您的精简盘面数据（不包含任何身份识别信息）可能会被匿名发送至第三方大模型服务商进行推理。
                      </p>
                    </section>

                    <section>
                      <h3 className="text-gold-primary font-serif text-lg mb-3">2. 数据存储</h3>
                      <p>
                        我们不会在服务器端永久存储您的个人身份信息，除非您明确选择云端同步功能（目前仅本地存储）。您的历史记录默认保存在您本地浏览器的 LocalStorage 中，您可以随时清除。
                      </p>
                    </section>

                    <section>
                      <h3 className="text-gold-primary font-serif text-lg mb-3">3. 第三方服务</h3>
                      <p>
                        本服务集成了 Vercel Analytics 等统计工具以优化用户体验，这些工具可能会收集匿名的访问数据。我们承诺不会向任何无关第三方出售您的个人信息。
                      </p>
                    </section>
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gold-primary/20 bg-white/5 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gold-primary text-void font-bold rounded hover:bg-gold-light transition-colors"
              >
                我已阅读并同意
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
