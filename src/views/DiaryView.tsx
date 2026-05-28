import React, { useState, useEffect } from "react";
import { MonsterAvatar } from "../components/Monster";
import { useApp } from "../store/AppContext";
import { RefreshCcw, Maximize2, Minimize2 } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { ConfirmModal } from "../components/ConfirmModal";
import { soundEffects } from "../utils/audio";

export function DiaryView() {
  const { diaries, monster, resetMonster, setActiveTab, showToast } = useApp();
  const [selectedDiaryId, setSelectedDiaryId] = useState<string | null>(
    diaries.length > 0 ? diaries[0].id : null,
  );
  const [isLeftExpanded, setIsLeftExpanded] = useState(false);
  const [showConfirmRelease, setShowConfirmRelease] = useState(false);

  // 當日記本從後端加載完成後，自動選取最新的一篇日記
  useEffect(() => {
    if (diaries.length > 0 && !selectedDiaryId) {
      setSelectedDiaryId(diaries[0].id);
    }
  }, [diaries, selectedDiaryId]);

  const handleReleaseClick = () => {
    soundEffects.click();
    if (monster.isEgg) {
      showToast("操作無效", "還在蛋裡，不能放生喔！");
      soundEffects.error();
      return;
    }
    
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const hatchTimestamp = monster.hatchTime ? new Date(monster.hatchTime).getTime() : 0;
    const timePassed = Date.now() - hatchTimestamp;

    if (!monster.hatchTime || timePassed < twentyFourHours) {
      showToast("放生失敗", "小怪獸才剛孵化不久，要陪牠滿24小時才能放生喔！");
      soundEffects.error();
      return;
    }
    setShowConfirmRelease(true);
  };

  const confirmRelease = () => {
    soundEffects.success();
    resetMonster();
    setActiveTab("home");
  };

  // 1. 取得目前選定的日記物件
  const selectedDiary = diaries.find((d) => d.id === selectedDiaryId) || diaries[0];

  // 2. 🛡️ 安全防護罩：確保隨時有怪獸基本資料可讀取，防止空值崩潰
  const currentMonsterSnapshot = selectedDiary?.finalMonster || {
    isEgg: false,
    color: "#FFEAA7",
    emotionLabel: "未知",
    conversationCount: 0,
    accessories: { head: null, face: null, body: null }
  };

  const dateParts = selectedDiary?.dateRange?.split(" - ") || ["未知日期", "未知日期"];

  // 🌸 計算這隻歷史怪獸解鎖了幾個配件
  const unlockedAccessoriesCount = [
    currentMonsterSnapshot.accessories?.head,
    currentMonsterSnapshot.accessories?.face,
    currentMonsterSnapshot.accessories?.body
  ].filter(Boolean).length;

  // 🛡️ 智慧型動態感言生成器（防範任何欄位遺失或空值）
  const getDynamicFeedback = () => {
    if (selectedDiary) {
      const rawFeedback = (selectedDiary as any).feedback || (selectedDiary as any).feedbackText || (selectedDiary as any).message;
      if (rawFeedback && rawFeedback.trim() !== "") {
        return rawFeedback;
      }
    }

    const mood = currentMonsterSnapshot.emotionLabel || "平靜";
    const count = currentMonsterSnapshot.conversationCount || 0;

    if (mood.includes("難過") || mood.includes("傷心") || mood.includes("焦慮")) {
      return `【${mood}的小怪獸】留在回憶裡的話：\n這幾天看你過得有點累、心情悶悶的，我也跟著好心疼...。不過別擔心！我已經把你的煩惱和眼淚通通吃進肚子裡帶走囉！累了就好好休息，你真的已經非常努力了！`;
    }
    if (mood.includes("開心") || mood.includes("快樂") || mood.includes("溫暖")) {
      return `【${mood}的小怪獸】留在回憶裡的話：\n謝謝你這幾天帶給我這麼多正面能量！待在你身邊的每一天都像在溫暖的陽光下探險，你開心的笑容是我最珍貴的寶藏。未來也要常常保持微笑喔！✨`;
    }
    
    return `【${mood}的小怪獸】留在回憶裡的話：\n能默默陪著你度過這段擁有 ${count} 次珍貴對話的時光，就是我最幸福的事。雖然我要回怪獸花園了，但只要你翻開心情日記，我隨時都會在回憶裡給你大大的擁抱！`;
  };

  return (
    <div className="absolute inset-0 flex flex-col fade-in w-full h-full pb-16 pt-10 sm:pt-12 px-[4%] md:px-[6%] lg:px-[10%] xl:px-[12%] 2xl:px-[15%] items-center justify-center overflow-hidden z-10 bg-transparent">
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmRelease}
        title="確認放生小怪獸？"
        message="放生後小怪獸會回到花園，並被記錄在「心情日記」中作為回顧喔！確定要放生牠嗎？"
        confirmText="確定放生"
        cancelText="再陪牠一下"
        onConfirm={confirmRelease}
        onCancel={() => setShowConfirmRelease(false)}
        isDestructive={true}
      />

      {/* Header Area */}
      <div className="w-full flex justify-end px-4 sm:px-8 absolute top-4 z-50">
        <button
          onClick={handleReleaseClick}
          className="py-2 px-4 bg-[#FFD54F] text-[#5D4037] border-[3px] border-[#5D4037] rounded-2xl font-black text-sm flex items-center justify-center space-x-2 transition-all shadow-[2px_2px_0px_#5D4037] hover:bg-[#FFE082] hover:shadow-[2px_4px_0px_#5D4037] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
        >
          <RefreshCcw size={16} strokeWidth={3} />
          <span>放生目前怪獸</span>
        </button>
      </div>

      <div className="flex-1 w-full flex flex-col justify-start items-center relative z-10 overflow-hidden pt-12 pb-2 min-h-0 px-4 sm:px-8">
        {diaries.length === 0 ? (
          <div className="w-full flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="mb-6 relative mt-[-20px] animate-bounce">
              <div className="w-28 h-28 bg-[#EFEBE0] rounded-full border-[4px] border-[#AF8A63] absolute top-2 left-2" />
              <div className="w-28 h-28 bg-white rounded-full border-[4px] border-[#5D4037] flex items-center justify-center relative shadow-[2px_2px_0px_#5D4037]">
                <span className="text-3xl text-[#5D4037] font-black tracking-widest pl-2 opacity-50">Zzz</span>
              </div>
            </div>
            <h3 className="text-2xl font-extrabold text-[#5D4037] mb-3">回憶書本還空空的</h3>
            <p className="text-[#5D4037] font-bold text-lg leading-relaxed">當你放生小怪獸後<br />牠們的成長紀錄就會保存在這裡喔！</p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row w-full h-full flex-1 overflow-hidden relative py-2 items-start justify-between gap-6 md:gap-[4%] lg:gap-[6%] xl:gap-[8%]">
            
            {/* Left Page (History Preview) */}
            <div className={`transition-all duration-500 h-full flex flex-col pt-2 overflow-hidden relative w-full md:flex-1 z-10 ${isLeftExpanded ? "flex" : "hidden md:flex"}`}>
              <div className="flex justify-center items-center shrink-0 mb-4 w-full relative px-2 sm:px-4">
                <h3 className="text-xl lg:text-2xl font-extrabold text-[#5D4037] tracking-widest drop-shadow-sm border-b-2 border-dashed border-[#C7BBA2] pb-1 text-center">
                  過往回顧
                </h3>
                <div className="absolute right-4">
                  <button
                    onClick={() => setIsLeftExpanded(!isLeftExpanded)}
                    className="flex md:hidden p-2 bg-[#FFFAEC] border-[2px] border-[#e2d8c3] rounded-xl transition-all"
                  >
                    {isLeftExpanded ? <Minimize2 size={20} className="text-[#5D4037]" /> : <Maximize2 size={20} className="text-[#5D4037]" />}
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto hidden-scrollbar w-full pb-16 pt-8 px-2 sm:px-4">
                <div className="flex flex-col w-full mx-auto gap-6 sm:gap-8 min-h-min scroll-smooth">
                  {diaries.map((diary, idx) => {
                    const rotations = ["rotate-[-6deg]", "rotate-[4deg]", "rotate-[-3deg]", "rotate-[5deg]"];
                    const rotation = rotations[idx % rotations.length];
                    const isSelected = selectedDiary?.id === diary.id;
                    const zigzagClass = idx % 2 === 0 ? "self-start ml-2 sm:ml-4" : "self-end mr-2 sm:mr-4";
                    const loopDateParts = diary.dateRange?.split(" - ") || ["未知日期", "未知日期"];

                    return (
                      <button
                        key={diary.id}
                        onClick={() => {
                          setSelectedDiaryId(diary.id);
                          if (isLeftExpanded) setIsLeftExpanded(false);
                        }}
                        className={`relative flex flex-col items-center bg-[#FFFAEC] p-3 pb-8 shadow-[4px_6px_12px_rgba(0,0,0,0.15)] border-[2px] transition-all duration-300 transform hover:scale-110 hover:-translate-y-2 ${isSelected ? "border-[#8D6E63] scale-110 -translate-y-2 z-20" : "border-[#e2d8c3] z-10"} ${!isSelected && rotation} shrink-0 w-[150px] sm:w-[180px] ${zigzagClass} ${idx > 0 ? "-mt-[20%]" : "mt-4"}`}
                      >
                        <div className="w-full aspect-square bg-[#EFEBE0] flex items-center justify-center border-[2px] border-[#C7BBA2] overflow-hidden drop-shadow-inner mb-3">
                          {diary.finalMonster && (
                            <MonsterAvatar state={diary.finalMonster} className="w-[85%] h-[85%] origin-center drop-shadow-md" />
                          )}
                        </div>
                        <div className="flex flex-col justify-center items-center absolute bottom-2 w-full text-center">
                          <span className="font-extrabold text-[#5D4037] text-[11px] sm:text-[13px] font-mono leading-tight tracking-wider">
                            {loopDateParts[0]}<br />~ {loopDateParts[1]}
                          </span>
                        </div>
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 bg-red-400 rounded-full border-[2px] border-red-600 flex items-center justify-center z-10">
                          <div className="w-1.5 h-1.5 bg-white rounded-full ml-1 mb-1 opacity-70" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Page (Detailed Info) */}
            {selectedDiary && (
              /* ✅ 【破案關鍵 1】將 h-full 加上 min-h-0 與 overflow-y-auto，解除右半邊容器硬塞高度不夠的詛咒，允許在小螢幕時自動卡片內滾動 */
              <div className={`transition-all duration-500 h-full min-h-0 flex flex-col pt-2 overflow-y-auto hidden-scrollbar px-1 sm:px-2 w-full md:flex-1 items-center justify-start ${isLeftExpanded ? "hidden md:flex" : "flex"}`}>
                <div className="flex justify-center items-center shrink-0 mb-2 w-full relative">
                  <div className="absolute left-0">
                    <button onClick={() => setIsLeftExpanded(!isLeftExpanded)} className="flex md:hidden p-2 bg-[#FFFAEC] border-[2px] border-[#e2d8c3] rounded-xl">
                      <Maximize2 size={20} className="text-[#5D4037]" />
                    </button>
                  </div>
                  <h3 className="text-xl lg:text-2xl font-extrabold text-[#5D4037] tracking-widest drop-shadow-sm border-b-2 border-dashed border-[#C7BBA2] pb-1 shrink-0 text-center">
                    詳細紀錄
                  </h3>
                </div>

                {/* ✅ 【破案關鍵 2】內層改成 min-h-0 與 pb-8，確保最下方的小語有絕對足夠的延伸呼吸區，不被截斷 */}
                <div className="flex flex-col flex-1 w-full items-center justify-between gap-1 lg:gap-2 min-h-0 pb-8 mx-auto max-w-full">
                  <div className="w-full relative flex flex-col justify-start items-center shrink-0">
                    <span className="font-black text-[#5D4037] text-lg sm:text-xl border-b-[3px] border-dashed border-[#C7BBA2] pb-1 inline-block mb-1 sm:mb-2">
                      {dateParts[0]} 的小夥伴
                    </span>

                    <div className="flex flex-row flex-wrap sm:flex-nowrap items-center justify-center w-full mt-2 lg:mt-3 gap-2 sm:gap-4 lg:gap-8 xl:gap-12 pl-2">
                      <div className="h-24 w-24 sm:h-28 sm:w-28 lg:h-32 lg:w-32 xl:h-36 xl:w-36 shrink-0 relative flex items-center justify-center">
                        <div className="absolute inset-0 bg-white/70 border-[3px] border-dashed border-[#e2d8c3] rounded-full shadow-inner rotate-[-2deg]" />
                        <MonsterAvatar state={currentMonsterSnapshot} className="w-[110%] h-[110%] z-10" />
                      </div>

                      <div className="flex flex-col gap-2 shrink min-w-0">
                        <div className="text-[#5D4037] font-bold text-sm lg:text-base bg-white/60 px-3 py-1.5 rounded-xl border-[2px] border-transparent shadow-sm">
                          互動次數： <span className="font-black text-[#af8a63]">{currentMonsterSnapshot.conversationCount || 0}</span> 次
                        </div>
                        <div className="text-[#5D4037] font-bold text-sm lg:text-base bg-white/60 px-3 py-1.5 rounded-xl border-[2px] border-transparent shadow-sm">
                          解鎖配件： <span className="font-black text-[#af8a63]">{unlockedAccessoriesCount}/3</span>
                        </div>
                        <div className="text-[#5D4037] flex items-center gap-1 font-bold text-sm lg:text-base bg-[#FFD54F]/20 px-3 py-1.5 rounded-xl border-[2px] border-transparent shadow-sm">
                          成長等級： <span className="font-black text-[#E65100]">LV. {Math.floor((currentMonsterSnapshot.conversationCount || 0) / 3) + 1}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Emotion & Accessories Section */}
                  <div className="flex flex-row w-full gap-2 sm:gap-4 shrink-0 border-t-[2px] border-b-[2px] border-dashed border-[#e2d8c3] py-2 lg:py-3">
                    <div className="flex-1 flex flex-col items-center justify-center relative min-h-0">
                      <span className="text-[#5D4037] font-black text-xs sm:text-sm lg:text-base opacity-80 uppercase tracking-widest mt-6 mb-0 z-10">
                        情緒光譜
                      </span>
                      <div className="w-full h-32 flex items-center justify-center relative -mt-5">
                        {selectedDiary.emotionsStats && (
                          <PieChart width={110} height={110}>
                            <Pie
                              data={selectedDiary.emotionsStats}
                              cx="50%"
                              cy="50%"
                              innerRadius={16}
                              outerRadius={35}
                              paddingAngle={0}
                              dataKey="value"
                              stroke="none"
                            >
                              {selectedDiary.emotionsStats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry?.color || "#E0E0E0"} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{ borderRadius: "12px", border: "3px solid #5D4037", fontWeight: "900", boxShadow: "2px 2px 0px #5D4037", padding: "4px 8px" }}
                              itemStyle={{ fontWeight: "900", color: "#5D4037", fontSize: "12px" }}
                            />
                          </PieChart>
                        )}
                      </div>
                    </div>

                    <div className="w-[1px] h-full bg-dashed border-l-[2px] border-dashed border-[#e2d8c3]" />

                    <div className="flex-[1.2] flex flex-col items-center justify-center relative min-h-0">
                      <span className="text-[#5D4037] font-black text-xs sm:text-sm lg:text-base opacity-80 uppercase tracking-widest mt-3 mb-2 z-10">
                        攜帶配件
                      </span>
                      <div className="flex flex-row flex-wrap items-center justify-center gap-2 lg:gap-3 mt-1">
                        {[
                          { part: "head", acc: currentMonsterSnapshot.accessories?.head },
                          { part: "face", acc: currentMonsterSnapshot.accessories?.face },
                          { part: "body", acc: currentMonsterSnapshot.accessories?.body },
                        ].map((item, idx) => (
                          <div key={idx} className="w-[2.6rem] h-[2.6rem] lg:w-[3.0rem] lg:h-[3.0rem] bg-white/60 border-[2px] border-[#e2d8c3] rounded-2xl flex items-center justify-center text-xl shadow-sm transition-all shrink-0" title={item.acc?.name || "此部位無配件"}>
                            {item.acc ? item.acc.icon : <span className="opacity-20 text-xs sm:text-sm font-black text-[#5D4037]">?</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Feedback Box */}
                  <div className="w-full shrink-0 flex flex-col justify-center align-center text-center px-2 sm:px-4 xl:px-8 relative mt-2 pb-4">
                    <span className="text-[#af8a63] font-black text-xs sm:text-sm lg:text-base xl:text-lg mb-1 lg:mb-2 inline-flex items-center justify-center gap-1">
                      ⭐ 專屬小語 ⭐
                    </span>
                    <p className="text-[#5D4037] font-extrabold leading-relaxed text-xs sm:text-sm lg:text-base xl:text-lg whitespace-pre-wrap w-full mt-1">
                      {getDynamicFeedback()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `.hidden-scrollbar::-webkit-scrollbar { display: none; } .hidden-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }` }} />
    </div>
  );
}