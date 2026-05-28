import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../store/AppContext";
import { mockPostChat } from "../api/mock";
import { MonsterAvatar } from "../components/Monster";
import { SendHorizontal, Loader2 } from "lucide-react";
import { soundEffects } from "../utils/audio";

export function HomeView() {
  // ✅ 修正 1：把 userId 解構拿出來
  const { monster, setMonster, showToast, equipAccessory, syncMonsterToServer, userId } = useApp();
  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [lastMessage, setLastMessage] = useState(
    monster.isEgg
      ? "對著怪獸蛋說說話，孵化專屬你的小怪獸吧！"
      : "跟我說說你今天的心情吧...",
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setIsSubmitting(true);
    soundEffects.pop();

    try {
      const fetchResult = await fetch(' https://rich-cobras-poke.loca.lt/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // ✅ 修正 2：在這裡把 userId 正式打包打包送給後端！
        body: JSON.stringify({ message: userMessage, userId }), 
      });

      if (!fetchResult.ok) {
        throw new Error('與小怪獸的後端連線失敗');
      }

      const response = await fetchResult.json();

      const wasEgg = monster.isEgg;
      const { llm_data, mapped_accessory } = response;

      const delta = llm_data.emotion_analysis.mood_delta;
      const newNegative = Math.min(
        100,
        Math.max(0, monster.negativeValue - delta),
      );

      const nowHatchTime = monster.isEgg ? Date.now() : monster.hatchTime;

      const nextMonsterState = {
        ...monster,
        isEgg: false, 
        hatchTime: nowHatchTime,
        color: llm_data.visual_commands.base_color,
        emotionLabel: llm_data.emotion_analysis.primary,
        negativeValue: newNegative,
        conversationCount: monster.conversationCount + 1,
      };

      setMonster(nextMonsterState);
      await syncMonsterToServer(nextMonsterState);

      setLastMessage(llm_data.monster_response);

      if (wasEgg) {
        soundEffects.levelUp();
        showToast("小怪獸孵化了！", "根據你的情緒，誕生了專屬的小怪獸 ✨");
      } else {
        soundEffects.success();
      }

      if (mapped_accessory) {
        equipAccessory(mapped_accessory);
      }
    } catch (error) {
      console.error("Chat Error", error);
      showToast("連線失敗", "小怪獸跟外部 AI 斷訊了，請檢查後端錯誤日誌！");
    } finally {
      setIsSubmitting(false);
    }
  };

  const positivePercent = `${100 - monster.negativeValue}%`;

  return (
    <div className="flex flex-col h-full fade-in max-w-[800px] mx-auto w-full pb-6">
      <div className="flex-1 flex flex-col justify-end items-center min-h-[350px] relative pb-8 mt-12 mx-4">
        <div className="mb-4 bg-[#FFFAEC] border-[4px] border-[#5D4037] p-5 rounded-3xl text-[#5D4037] font-extrabold text-lg leading-relaxed max-w-[85%] relative flex items-center justify-center min-h-[72px] z-10 text-center shadow-[4px_4px_0px_#5D4037]">
          <div className="absolute -bottom-[14px] left-1/2 -translate-x-1/2 w-6 h-6 bg-[#FFFAEC] border-b-[4px] border-r-[4px] border-[#5D4037] rotate-45 transform rounded-sm" />
          {isSubmitting ? (
            <span className="flex items-center space-x-2 animate-pulse text-[#AF8A63]">
              <Loader2 className="animate-spin w-5 h-5 cursor-wait" strokeWidth={3} />
              <span>小怪獸正在思考...</span>
            </span>
          ) : (
            lastMessage
          )}
        </div>

        <div className="relative mt-4">
          <MonsterAvatar state={monster} className="w-[180px] h-[180px] drop-shadow-2xl" />
        </div>
      </div>
      
      <div className="bg-[#FFFAEC]/95 backdrop-blur-md border-[4px] border-[#5D4037] rounded-[2rem] p-4 mx-4 shadow-[4px_4px_0px_#5D4037] flex flex-col gap-3 relative z-20">
        <div className="flex flex-col mb-1 relative">
          <div className="flex justify-between items-center px-6 text-sm font-extrabold text-[#5D4037] mb-2">
            <span>怪獸心情</span>
            <span>目前心情：{monster.emotionLabel}</span>
          </div>

          <div className="flex items-center px-4 w-full">
            <span className="font-extrabold text-[#5D4037] w-16 text-left shrink-0">情緒分享</span>
            <div className="flex-1 flex flex-col items-center ml-2">
              <div className="w-full h-8 bg-[#FFFAEC] border-[3px] border-[#5D4037] rounded-full relative overflow-visible flex items-center shadow-inner">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#4FC3F7] via-[#FFF59D] to-[#FF8A65]" />
                <div className="absolute w-5 h-10 border-[3px] border-[#5D4037] rounded-full bg-white transition-all duration-700 ease-out z-10 -ml-2.5 shadow-sm" style={{ left: positivePercent }} />
              </div>
              <div className="flex justify-between text-xs font-bold text-[#5D4037] mt-1 w-full px-1">
                <span className="w-12 text-left">負面</span>
                <span className="w-12 text-center ml-2">中立</span>
                <span className="w-12 text-right">正面</span>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 relative border-[4px] border-[#5D4037] rounded-2xl bg-white shadow-inner overflow-hidden flex items-center px-1">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="跟我說說你今天的心情吧..."
              className="w-full bg-transparent px-3 py-3 text-[#5D4037] font-bold placeholder:text-[#C7BBA2] focus:outline-none resize-none h-[52px]"
              disabled={isSubmitting}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !inputValue.trim()}
            className="w-[60px] h-[60px] shrink-0 bg-[#FFD54F] border-[4px] border-[#5D4037] rounded-2xl flex items-center justify-center text-[#5D4037] transition-all hover:bg-[#FFE082] active:translate-y-1 disabled:opacity-50"
          >
            <SendHorizontal size={26} strokeWidth={3} className="-ml-0.5 mt-0.5" />
          </button>
        </form>
      </div>
      <div className="h-4" />
    </div>
  );
}