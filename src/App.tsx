import React from "react";
import { useApp } from "./store/AppContext";
import { Navigation } from "./components/Navigation";
import { Volume2, VolumeX } from "lucide-react";
import { LoginView } from "./views/LoginView";

// Component Views
import { HomeView } from "./views/HomeView";
import { TasksView } from "./views/TasksView";
import { DiaryView } from "./views/DiaryView";
import { CommunityView } from "./views/CommunityView";
import { AdminPanel } from "./components/AdminPanel";
import { Particles } from "./components/Particles";
import { TutorialOverlay } from "./components/TutorialOverlay";

function AppContent() {
  const {
    userId,          // 👈 新增
    username,      // 👈 把 username 拿出來
    logout,        // 👈 把 logout 拿出來
    loginSuccess,    // 👈 新增
    activeTab,
    toasts,
    removeToast,
    pendingAccessory,
    resolveAccessoryChoice,
    monster,
    soundEnabled,
    setSoundEnabled,
  } = useApp();

  if (!userId) {
    return <LoginView onLoginSuccess={loginSuccess} />;
  }

  const getTabTitle = () => {
    switch (activeTab) {
      case "home":
        return "情緒小怪獸";
      case "tasks":
        return "治癒任務";
      case "diary":
        return "心情日記";
      case "community":
        return "社群分享";
      default:
        return "情緒小怪獸";
    }
  };

  const today = new Date();
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日 (${["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"][today.getDay()]})`;

  return (
    <div className="min-h-screen text-[#5D4037] font-sans pb-24 relative overflow-hidden font-bold selection:bg-[#FFB74D] flex flex-col">
      {/* Dynamic Background Image */}
      <div
        className="absolute inset-0 z-[-20] bg-cover bg-no-repeat transition-all duration-700"
        style={{
          backgroundImage:
            activeTab === "home"
              ? "url('/home_bg.png')"
              : activeTab === "tasks"
                ? "url('/room_bg.png')"
                : activeTab === "diary"
                  ? "url('/book_bg.png')"
                  : activeTab === "community"
                    ? "url('/community_bg.png')"
                    : "url('/home_bg.png')",
          backgroundPosition: "center bottom",
          backgroundAttachment: "fixed",
        }}
      ></div>

      {/* Sound Toggle */}
      <button
        onClick={() => setSoundEnabled(!soundEnabled)}
        className="absolute top-4 right-4 z-[60] bg-[#FFFAEC] p-2 rounded-full border-4 border-[#5D4037] text-[#5D4037] shadow-[2px_2px_0px_#5D4037] active:translate-y-1 active:shadow-none transition-all hover:bg-[#FFECCC]"
      >
        {soundEnabled ? (
          <Volume2 size={20} strokeWidth={3} />
        ) : (
          <VolumeX size={20} strokeWidth={3} />
        )}
      </button>

      {/* 溫暖漸層大背景與粒子特效 */}
      <Particles />

      {/* App Header */}
      <header className="relative z-50 w-full max-w-5xl mx-auto px-4 pt-6 pb-2 flex items-center justify-between">
        
        {/* 左側：標題 */}
        <div className="flex items-center gap-3 w-1/3">
          <div className="w-10 h-10 bg-[#A6E3E9] border-4 border-[#5D4037] rounded-full flex items-center justify-center relative shadow-[2px_2px_0px_#5D4037]">
             <div className="absolute top-1 left-2 w-1.5 h-1.5 bg-[#5D4037] rounded-full" />
             <div className="absolute top-1 right-2 w-1.5 h-1.5 bg-[#5D4037] rounded-full" />
             <div className="absolute top-4 w-2 h-1 border-b-2 border-l-2 border-r-2 border-[#5D4037] rounded-b-full" />
          </div>
          <h1 className="text-2xl font-black text-[#5D4037] drop-shadow-sm whitespace-nowrap">
            {getTabTitle()}
          </h1>
        </div>

        {/* 中間：日期 */}
        <div className="flex-1 flex justify-center w-1/3">
          <div className="bg-[#FFFAEC] border-4 border-[#5D4037] px-8 py-2 rounded-full font-bold text-lg shadow-[2px_2px_0px_#AF8A63] text-[#5D4037] whitespace-nowrap">
            {dateStr}
          </div>
        </div>

        {/* 右側：玩家大名與登出按鈕！ */}
        <div className="w-1/3 flex justify-end items-center gap-4">
          <span className="font-extrabold text-lg text-[#5D4037] bg-white/50 px-3 py-1 rounded-xl">
            👤 {username}
          </span>
          <button 
            onClick={logout}
            className="bg-[#D84315] text-white border-2 border-[#5D4037] px-4 py-2 rounded-xl font-bold shadow-[2px_2px_0px_#5D4037] active:translate-y-1 active:shadow-none transition-all text-sm"
          >
            登出
          </button>
        </div>

      </header>

      {/* Active Tab View Rendering */}
      <main
        className={`flex-1 ${activeTab === "diary" ? "w-full max-w-full px-0" : "max-w-5xl w-full px-4"} mx-auto pt-2 pb-6 relative z-10 flex flex-col`}
      >
        {activeTab === "home" && <HomeView />}
        {activeTab === "tasks" && <TasksView />}
        {activeTab === "diary" && <DiaryView />}
        {activeTab === "community" && <CommunityView />}
      </main>

      {/* Global Bottom Navigation */}
      <Navigation />

      {/* Tutorial Overlay */}
      <TutorialOverlay />

      {/* Global Toast Container */}
      <div className="fixed top-4 inset-x-0 z-50 flex flex-col items-center space-y-2 pointer-events-none px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="bg-[#FFFAEC] border-4 border-[#5D4037] text-[#5D4037] px-6 py-4 rounded-3xl shadow-[4px_4px_0px_#5D4037] pointer-events-auto flex items-start space-x-3 w-full max-w-sm animate-bounce-slow"
            onClick={() => removeToast(toast.id)}
          >
            <div className="text-2xl">✨</div>
            <div className="flex-1">
              <p className="font-extrabold text-base">{toast.message}</p>
              {toast.subMessage && (
                <p className="text-sm font-bold opacity-80 mt-1">
                  {toast.subMessage}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Accessory Replacement Dialog */}
      {pendingAccessory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 fade-in">
          <div className="bg-[#FFFAEC] border-4 border-[#5D4037] rounded-3xl p-6 w-full max-w-sm shadow-[8px_8px_0px_rgba(93,64,55,1)] relative">
            <h3 className="text-2xl font-extrabold text-center text-[#5D4037] mb-2 text-balance">
              獲得新配件！
            </h3>
            <p className="text-base text-center mb-6 font-bold opacity-80 text-balance">
              {monster.accessories[pendingAccessory.part]
                ? `你的小怪獸已經有${pendingAccessory.part === "head" ? "頭部" : pendingAccessory.part === "face" ? "臉部" : "身體"}配件了，要替換成新的嗎？`
                : "太棒了！為小怪獸換上新配件吧！"}
            </p>

            <div className="flex justify-center items-center gap-6 mb-8">
              {monster.accessories[pendingAccessory.part] && (
                <>
                  <div className="flex flex-col items-center">
                    <div className="text-5xl mb-2 opacity-50 grayscale drop-shadow-md">
                      {monster.accessories[pendingAccessory.part]?.icon}
                    </div>
                    <span className="text-sm font-bold opacity-70">原本的</span>
                  </div>
                  <div className="font-extrabold text-2xl text-[#AF8A63]">
                    →
                  </div>
                </>
              )}

              <div className="flex flex-col items-center scale-110">
                <div className="text-7xl mb-2 animate-bounce-slow drop-shadow-md">
                  {pendingAccessory.icon}
                </div>
                <span className="text-sm font-bold text-[#D84315]">
                  {pendingAccessory.name}
                </span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => resolveAccessoryChoice(false)}
                className="flex-1 py-3 bg-[#E0E0E0] border-4 border-[#5D4037] text-[#5D4037] font-extrabold rounded-2xl shadow-[4px_4px_0px_#5D4037] active:translate-y-[4px] active:shadow-none transition-all"
              >
                {monster.accessories[pendingAccessory.part]
                  ? "保留原本"
                  : "先不要"}
              </button>
              <button
                onClick={() => resolveAccessoryChoice(true)}
                className="flex-1 py-3 bg-[#FFB74D] border-4 border-[#5D4037] text-[#5D4037] font-extrabold rounded-2xl shadow-[4px_4px_0px_#5D4037] active:translate-y-[4px] active:shadow-none transition-all"
              >
                換上新裝
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Panel */}
      {/* <AdminPanel /> */}
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
