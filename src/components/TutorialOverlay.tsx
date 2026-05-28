import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { soundEffects } from "../utils/audio";
import { Sparkles, HeartHandshake, CalendarHeart } from "lucide-react";

export function TutorialOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Check local storage for onboarding
    const hasSeen = localStorage.getItem("hasSeenTutorial");
    if (!hasSeen) {
      setIsOpen(true);
    }
  }, []);

  if (!isOpen) return null;

  const handleNext = () => {
    soundEffects.click();
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    soundEffects.success();
    localStorage.setItem("hasSeenTutorial", "true");
    setIsOpen(false);
  };

  const steps = [
    {
      title: "歡迎來到怪獸心靈花園！",
      content:
        "這是一個將你的情緒具象化的小世界。在這裡，所有的開心、生氣或難過，都會成為培育小怪獸成長的養分。",
      icon: <Sparkles className="w-12 h-12 text-[#FFD54F]" />,
    },
    {
      title: "1. 孵化與陪伴",
      content:
        "在首頁選擇你的情緒，寫下當下的感受來「孵化」專屬小怪獸。每天與牠分享心情，能增加彼此的羈絆！",
      icon: <HeartHandshake className="w-12 h-12 text-[#FF8A65]" />,
    },
    {
      title: "2. 完成任務",
      content:
        "根據你的心情，我們會提供適合的「任務」。無論是去跑步發洩，或是安靜看書，完成它們讓小怪獸獲得新配件吧！",
      icon: <span className="text-4xl">📝</span>,
    },
    {
      title: "3. 成長日記",
      content:
        "當小怪獸陪伴你一天以上，你可以選擇「放生」牠，讓牠帶著你的回憶回到花園，並在「過往回顧」中隨時翻閱！",
      icon: <CalendarHeart className="w-12 h-12 text-[#64B5F6]" />,
    },
  ];

  const currentStep = steps[step];

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 fade-in">
      <div className="bg-[#FFFAEC] border-4 border-[#5D4037] rounded-[2rem] p-8 max-w-md w-full shadow-[12px_12px_0px_#5D4037] flex flex-col items-center text-center relative overflow-hidden slide-up">
        {/* Progress Dots */}
        <div className="flex gap-2 mb-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i === step ? "bg-[#5D4037]" : "bg-[#C7BBA2]"
              }`}
            />
          ))}
        </div>

        <div className="w-24 h-24 bg-white rounded-full border-4 border-[#5D4037] flex items-center justify-center mb-6 shadow-inner shrink-0 transform hover:scale-105 transition-transform duration-300">
          {currentStep.icon}
        </div>

        <h2 className="text-2xl font-black text-[#5D4037] mb-4">
          {currentStep.title}
        </h2>

        <p className="text-[#5D4037] font-bold text-lg leading-relaxed mb-8 h-28 flex items-center justify-center">
          {currentStep.content}
        </p>

        <button
          onClick={handleNext}
          className="w-full bg-[#FFD54F] border-4 border-[#5D4037] text-[#5D4037] px-6 py-4 rounded-2xl font-black text-xl shadow-[4px_4px_0px_#5D4037] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#5D4037] transition-all active:translate-y-[4px] active:shadow-none"
        >
          {step === steps.length - 1 ? "開始旅程！" : "下一步"}
        </button>

        {step < steps.length - 1 && (
          <button
            onClick={handleClose}
            className="mt-4 text-[#af8a63] font-bold underline hover:text-[#5D4037] transition-colors"
          >
            跳過導覽
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
