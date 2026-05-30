import React, { useEffect, useState } from "react";
import { useApp } from "../store/AppContext";
import {
  Egg,
  CheckCircle2,
  Heart,
  Loader2,
  Sparkles,
  Clock,
} from "lucide-react";
import { soundEffects } from "../utils/audio";

export function TasksView() {
  const {
    monster,
    setMonster,
    tasks,
    setTasks,
    grantRandomAccessory,
    showToast,
    taskCooldownUntil,
    setTaskCooldownUntil,
    currentRewards,
    generateNewRewards,
    userId, // 🛠️ 核心對接：引入雲端 userId
  } = useApp();
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [lastResetDay, setLastResetDay] = useState(new Date().getDate());
  const [timeToMidnight, setTimeToMidnight] = useState<string>("");

  useEffect(() => {
    const formatMidnightStr = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      if (diff <= 0) return "00:00:00";

      let totalSecs = Math.floor(diff / 1000);
      const h = Math.floor(totalSecs / 3600);
      totalSecs %= 3600;
      const m = Math.floor(totalSecs / 60);
      const s = totalSecs % 60;
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    setTimeToMidnight(formatMidnightStr());
    const interval = setInterval(() => {
      setTimeToMidnight(formatMidnightStr());

      const now = new Date();
      if (now.getDate() !== lastResetDay) {
        const hasUnclaimedRewards =
          tasks.length > 0 && tasks.every((t) => t.completed);

        setLastResetDay(now.getDate());
        if (!hasUnclaimedRewards) {
          setTasks([]);
          generateNewRewards();
          setTaskCooldownUntil(null);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lastResetDay, setTasks, generateNewRewards, setTaskCooldownUntil, tasks]);

  // 任務冷卻計時器
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (taskCooldownUntil && taskCooldownUntil > Date.now()) {
      setTimeLeft(Math.floor((taskCooldownUntil - Date.now()) / 1000));
      interval = setInterval(() => {
        const remaining = Math.floor((taskCooldownUntil - Date.now()) / 1000);
        if (remaining <= 0) {
          setTimeLeft(0);
          setTaskCooldownUntil(null);
          setTasks([]); 
          generateNewRewards(); 
        } else {
          setTimeLeft(remaining);
        }
      }, 1000);
    } else {
      setTimeLeft(0);
      if (taskCooldownUntil) {
        setTaskCooldownUntil(null);
      }
    }
    return () => clearInterval(interval);
  }, [
    taskCooldownUntil,
    setTaskCooldownUntil,
    setTasks,
    generateNewRewards,
  ]);

  // 🛠️ 核心對接修正：從你的雲端 Render 後端拉取真正的每日任務資料！
  useEffect(() => {
    if (monster.isEgg || !userId) {
      setIsLoading(false);
      return;
    }

    const loadTasksFromBackend = async () => {
      // 處於冷卻時間則先不拉取
      if (taskCooldownUntil && taskCooldownUntil > Date.now()) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // 串接後端真正的任務清單路由
        const response = await fetch(`https://emo-gotchi.onrender.com/api/tasks/${userId}`);
        const data = await response.json();

        if (response.ok && data.tasks) {
          // 將後端陣列格式結構化為前端任務清單
          const formattedTasks = data.tasks.map((t: any) => ({
            id: t.taskId,
            title: t.description,
            completed: t.isCompleted,
            moodBenefit: 15, // 每完成一條固定改善 15% 的心情！
          }));
          setTasks(formattedTasks);
        }
      } catch (err) {
        console.error("雲端任務同步失敗：", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadTasksFromBackend();
  }, [userId, monster.isEgg, setTasks, taskCooldownUntil]);

  // 點擊完成單個任務
  const handleCompleteTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updatedTasks = tasks.map((t) =>
      t.id === taskId ? { ...t, completed: true } : t,
    );
    setTasks(updatedTasks);

    setMonster((prev) => ({
      ...prev,
      negativeValue: Math.max(0, prev.negativeValue - task.moodBenefit),
    }));

    showToast(`好棒！正面能量增強了！`, `心情改善 ${task.moodBenefit}%`);

    const allCompleted = updatedTasks.every((t) => t.completed);
    if (allCompleted) {
      soundEffects.success();
    } else {
      soundEffects.pop();
    }
  };

  // 🛠️ 核心對接修正：連動點擊領取驚喜大獎，並通知雲端 MongoDB 伺服器
  const handleClaimReward = async () => {
    soundEffects.levelUp();
    
    // 1. 觸發前端發放隨機配飾（包含剛剛新增的 hand 飾品！）
    grantRandomAccessory();
    generateNewRewards();
    setTaskCooldownUntil(Date.now() + 5 * 60 * 1000); // 5分鐘冷卻
    setTasks([]);

    showToast("太棒了！連續任務達成", "小怪獸獲得了隨機配飾獎勵！");

    // 2. 將領獎紀錄即時同步拋送給雲端後端，扣除怪獸負面值並保存狀態
    try {
      await fetch(`https://emo-gotchi.onrender.com/api/tasks/${userId}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: "feed_monster" }), // 通用代發領取標籤
      });
    } catch (e) {
      console.warn("後端獎勵領取紀錄未成功連通，僅前端保留。");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF8A65] animate-spin" />
      </div>
    );
  }

  // 蛋狀態處理
  if (monster.isEgg) {
    return (
      <div className="flex flex-col h-full items-center justify-center fade-in text-center space-y-6 px-6">
        <Egg
          className="w-32 h-32 text-[#AF8A63] animate-pulse drop-shadow-md"
          strokeWidth={1.5}
        />
        <h2 className="text-3xl font-extrabold text-[#5D4037]">還沒孵化喔！</h2>
        <div className="bg-[#FFFAEC] border-4 border-[#5D4037] rounded-3xl p-6 shadow-[4px_4px_0px_#5D4037]">
          <p className="text-lg text-[#5D4037] leading-relaxed font-bold">
            小怪獸還在蛋殼裡睡覺呢。
            <br />
            請先到「首頁」與牠說說話，
            <br />
            專屬你的小怪獸就會誕生了！
          </p>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m} 分 ${s < 10 ? "0" : ""}${s} 秒`;
  };

  return (
    <div className="absolute inset-0 flex flex-col h-full fade-in space-y-4 max-w-5xl mx-auto w-full pb-24 pt-4 px-4 overflow-y-auto hidden-scrollbar">
      <div className="bg-[#FFF8E7] border-4 border-[#5D4037] rounded-[2rem] shadow-[8px_8px_0px_#5D4037] flex flex-col p-6 relative flex-1">
        <div className="text-center mb-6">
          <h2 className="text-[26px] font-extrabold text-[#5D4037] mb-1 tracking-wider inline-flex items-center gap-2">
            小怪獸的快樂處方：讓我們一起努力！
          </h2>
          <div className="absolute right-6 top-6 bg-white/70 border-2 border-[#5D4037] rounded-xl px-3 py-1 shadow-[2px_2px_0px_#5D4037]">
            <span className="text-xs font-bold text-[#5D4037]">
              自動重置: {timeToMidnight}
            </span>
          </div>
        </div>

        {timeLeft > 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 space-y-4">
            <Clock
              className="w-20 h-20 text-[#C7BBA2] animate-pulse"
              strokeWidth={2}
            />
            <p className="font-extrabold text-2xl text-[#AF8A63]">
              進入冷卻時間
            </p>
            <div className="bg-white border-[3px] border-[#C7BBA2] rounded-full px-6 py-3 shadow-inner">
              <span className="font-mono font-bold text-xl text-[#5D4037]">
                {formatTime(timeLeft)}
              </span>
            </div>
            <p className="font-bold text-[#C7BBA2]">休息一下再迎接新任務吧！</p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
            {/* 任務排布網格 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:w-2/3 overflow-y-auto content-start pr-2">
              {tasks.map((task, index) => {
                const icons = ["🌿", "📝", "💬", "😋", "🖍️", "🌱", "🎵"];
                const icon = icons[index % icons.length];

                return (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between p-4 rounded-[1.5rem] border-[3px] transition-all duration-300 ${
                      task.completed
                        ? "bg-[#EFEBE0] border-[#C7BBA2] opacity-70 scale-[0.98]"
                        : "bg-[#FFCC80] border-[#5D4037] hover:-translate-y-1"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-14 h-14 bg-white/60 border-2 border-[#5D4037] rounded-full flex justify-center items-center text-3xl shadow-sm ${task.completed ? "grayscale opacity-50 border-[#C7BBA2]" : ""}`}
                      >
                        {icon}
                      </div>
                      <div className="flex flex-col">
                        <span
                          className={`font-extrabold text-[1.1rem] leading-tight ${task.completed ? "text-[#9E937F]" : "text-[#5D4037]"}`}
                        >
                          {task.title}
                        </span>
                        <span
                          className={`font-bold mt-1 text-sm ${task.completed ? "text-[#C7BBA2]" : "text-[#8D6E63]"}`}
                        >
                          降低負面值 {task.moodBenefit}%
                        </span>
                      </div>
                    </div>
                    <button
                      disabled={task.completed}
                      onClick={() => handleCompleteTask(task.id)}
                      className={`ml-2 flex flex-col justify-center items-center flex-shrink-0 transition-all ${
                        task.completed
                          ? "text-[#C7BBA2]"
                          : "text-[#5D4037] active:scale-90 hover:opacity-80"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-md border-[3px] flex items-center justify-center ${task.completed ? "bg-[#5D4037] border-[#5D4037]" : "bg-white border-[#5D4037]"}`}
                      >
                        {task.completed && (
                          <CheckCircle2
                            className="text-white"
                            size={24}
                            strokeWidth={4}
                          />
                        )}
                      </div>
                      <span className="text-xs font-bold mt-1">
                        {task.completed ? "完成" : "按我完成"}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* 獎勵預覽側邊欄 */}
            <div className="bg-white border-[4px] border-[#5D4037] rounded-[2rem] p-6 lg:w-1/3 flex flex-col items-center shadow-[4px_4px_0px_#5D4037] relative">
              <div className="bg-[#FFCC80] border-[4px] border-[#5D4037] rounded-full px-6 py-2 -mt-10 font-bold text-[#5D4037] shadow-[2px_2px_0px_#5D4037] absolute top-2">
                獎勵預覽
              </div>
              <div className="mt-6 text-center space-y-4 w-full flex-1 flex flex-col justify-between">
                <div>
                  <p className="font-extrabold text-[#AF8A63] text-[15px]">
                    完成全部任務，即可獲得隨機配件獎勵！
                  </p>
                  <div className="flex gap-4 justify-center items-center mt-6 flex-wrap">
                    {currentRewards && currentRewards.map((reward, i) => (
                      <div
                        key={i}
                        className="w-16 h-16 bg-[#FFF8E7] border-[3px] border-[#C7BBA2] rounded-xl flex items-center justify-center text-4xl shadow-inner hover:scale-110 transition-transform cursor-help"
                        title={reward.name}
                      >
                        {reward.icon}
                      </div>
                    ))}
                  </div>
                </div>
                {tasks.length > 0 && tasks.every((t) => t.completed) && (
                  <button
                    onClick={handleClaimReward}
                    className="mt-6 w-full py-4 bg-[#FFD54F] text-[#5D4037] border-[4px] border-[#5D4037] rounded-3xl font-extrabold text-lg flex items-center justify-center space-x-2 transition-all shadow-[4px_4px_0px_#5D4037] hover:bg-[#FFE082] hover:-translate-y-1 active:translate-y-1 active:shadow-none animate-bounce"
                  >
                    <Sparkles size={24} className="text-[#5D4037]" />
                    <span>領取驚喜獎勵！</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}