import React, { useState } from "react";
import { useApp } from "../store/AppContext";
import {
  Bug,
  X,
  Clock,
  Settings,
  TimerReset,
  CheckCircle,
  EggOff,
} from "lucide-react";

export function AdminPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    monster,
    setMonster,
    setTaskCooldownUntil,
    tasks,
    setTasks,
    showToast,
  } = useApp();

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-[9999] p-3 bg-[#5D4037] text-white rounded-full shadow-[2px_2px_0px_#FFCC80] hover:bg-[#4E342E] transition-all opacity-70 hover:opacity-100 group"
        title="管理者測試面板"
      >
        <Bug size={24} className="group-hover:animate-pulse" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#FFFAEC] border-[6px] border-[#5D4037] rounded-3xl w-full max-w-sm flex flex-col shadow-[8px_8px_0px_#5D4037]">
        <div className="flex justify-between items-center bg-[#FFF8E7] p-4 border-b-[4px] border-[#5D4037] rounded-t-2xl">
          <h3 className="font-extrabold text-[#5D4037] text-xl flex items-center gap-2">
            <Settings className="text-[#FF8A65]" />
            開發測試控制台
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-[#5D4037] hover:bg-[#EFEBE0] p-1 rounded-xl"
          >
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
          <div className="bg-[#EFEBE0] p-3 rounded-xl border-2 border-[#AF8A63] flex flex-col gap-2">
            <span className="font-bold text-[#5D4037] text-sm">小怪獸狀態</span>
            <button
              onClick={() => {
                setMonster((p) => ({
                  ...p,
                  isEgg: !p.isEgg,
                  hatchTime: p.isEgg ? Date.now() : p.hatchTime,
                }));
                showToast(`已切換為：${monster.isEgg ? "孵化" : "蛋"}`);
              }}
              className="flex items-center justify-center gap-2 p-2 bg-white border-2 border-[#5D4037] rounded-xl font-bold text-[#5D4037] shadow-[2px_2px_0px_#5D4037] active:translate-y-[2px] active:shadow-none"
            >
              <EggOff size={18} />
              切換狀態 (目前: {monster.isEgg ? "蛋" : "已孵化"})
            </button>
            <button
              onClick={() => {
                setMonster((p) => ({
                  ...p,
                  hatchTime: Date.now() - 25 * 60 * 60 * 1000,
                }));
                showToast("已模擬孵化超過 24 小時");
              }}
              className="flex items-center justify-center gap-2 p-2 bg-[#FFCC80] border-2 border-[#5D4037] rounded-xl font-bold text-[#5D4037] shadow-[2px_2px_0px_#5D4037] active:translate-y-[2px] active:shadow-none"
            >
              <Clock size={18} />
              時光機：加速至24小時後 (測試放生)
            </button>
          </div>

          <div className="bg-[#EFEBE0] p-3 rounded-xl border-2 border-[#AF8A63] flex flex-col gap-2">
            <span className="font-bold text-[#5D4037] text-sm">任務與獎勵</span>
            <button
              onClick={() => {
                setTaskCooldownUntil(null);
                showToast("已重置冷卻時間");
              }}
              className="flex items-center justify-center gap-2 p-2 bg-white border-2 border-[#5D4037] rounded-xl font-bold text-[#5D4037] shadow-[2px_2px_0px_#5D4037] active:translate-y-[2px] active:shadow-none"
            >
              <TimerReset size={18} />
              清除任務冷卻
            </button>
            <button
              onClick={() => {
                setTasks((p) => p.map((t) => ({ ...t, completed: true })));
                showToast("請重整畫面或切換Tab來刷新");
              }}
              className="flex items-center justify-center gap-2 p-2 bg-[#A8E6CF] border-2 border-[#5D4037] rounded-xl font-bold text-[#5D4037] shadow-[2px_2px_0px_#5D4037] active:translate-y-[2px] active:shadow-none"
            >
              <CheckCircle size={18} />
              標記當前所有任務完成
            </button>
          </div>

          <div className="bg-[#EFEBE0] p-3 rounded-xl border-2 border-[#AF8A63] flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[#5D4037] text-sm">
                負面值參數: {monster.negativeValue}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={monster.negativeValue}
              onChange={(e) =>
                setMonster((p) => ({
                  ...p,
                  negativeValue: parseInt(e.target.value),
                }))
              }
              className="w-full accent-[#FF8A65]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
