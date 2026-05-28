import React, { useState, useEffect } from "react";
import { useApp } from "../store/AppContext";
import { Sparkles, ArrowRight, Check } from "lucide-react";

export function Tutorial() {
  const { showToast } = useApp();
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show if haven't seen before
    const hasSeen = localStorage.getItem("mood-monster-tutorial");
    if (!hasSeen) {
      setIsVisible(true);
    }
  }, []);

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep((s) => s + 1);
    } else {
      setIsVisible(false);
      localStorage.setItem("mood-monster-tutorial", "true");
      showToast("歡迎來到治癒小怪獸", "教學結束，開始你的旅程吧！");
    }
  };

  if (!isVisible) return null;

  const steps = [
    {
      title: "哈囉！歡迎來到情緒小怪獸",
      desc: "這是一個陪伴你釋放壓力、記錄心情的溫暖角落。在這裡，你可以孵化出屬於自己的專屬小怪獸！",
    },
    {
      title: "第一步：與小怪獸說說話",
      desc: "在「首頁」下方輸入你的煩惱或開心的事情，魔法就會發生！小怪獸會根據你的情緒改變顏色，並長出對應的可愛配件喔。",
    },
    {
      title: "第二步：完成治癒任務",
      desc: "當心情不好的時候（負面值上升），小怪獸會看起來很生氣或難過。這時趕緊到「治癒任務」完成一些小活動，讓你也讓牠心情好起來！",
    },
    {
      title: "第三步：寫下心情日記",
      desc: "想放生的時候，你可以將現在這隻小怪獸收錄到「心情日記」中作為回顧，然後再重新孵化一隻新怪獸繼續陪伴你！",
    },
  ];

  return (
    <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 fade-in">
      <div className="bg-[#FFFAEC] border-[6px] border-[#5D4037] rounded-3xl w-full max-w-md p-6 flex flex-col relative overflow-hidden shadow-[8px_8px_0px_#5D4037]">
        {/* Decorative elements */}
        <div className="absolute top-[-20px] right-[-20px] text-[#FFCC80] opacity-30 text-8xl rotate-12 pointer-events-none">
          <Sparkles fill="currentColor" />
        </div>

        <div className="z-10 relative">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-extrabold text-[#5D4037] text-2xl flex items-center gap-2">
              <Sparkles className="text-[#FF8A65]" />
              新手教學
            </h3>
            <span className="font-bold text-[#AF8A63] bg-[#EFEBE0] px-3 py-1 rounded-full text-sm">
              {step + 1} / {steps.length}
            </span>
          </div>

          <div className="min-h-[120px]">
            <h4 className="font-bold text-[#5D4037] text-xl mb-3">
              {steps[step].title}
            </h4>
            <p className="text-[#AF8A63] font-bold leading-relaxed">
              {steps[step].desc}
            </p>
          </div>

          <div className="mt-8 flex justify-between items-center">
            <div className="flex gap-2">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${i === step ? "bg-[#FF8A65] w-6" : "bg-[#EFEBE0]"}`}
                />
              ))}
            </div>
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 bg-[#FFCC80] text-[#5D4037] font-extrabold rounded-2xl border-4 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] hover:-translate-y-1 hover:shadow-[2px_4px_0px_#5D4037] active:translate-y-0 active:shadow-none transition-all"
            >
              {step < steps.length - 1 ? (
                <>
                  下一步 <ArrowRight strokeWidth={3} size={20} />
                </>
              ) : (
                <>
                  開始體驗 <Check strokeWidth={3} size={20} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
