import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import { MonsterState, AccessoryPart, Accessory, ApiTaskItem } from "../types";

type ToastInfo = { id: string; message: string; subMessage?: string };

interface AppContextType {
  // === 認證與使用者資料 ===
  userId: string | null;
  username: string | null;
  loginSuccess: (id: string, name: string, backendMonster: any) => void;
  logout: () => void;

  activeTab: "home" | "tasks" | "diary" | "community";
  setActiveTab: (tab: "home" | "tasks" | "diary" | "community") => void;

  monster: MonsterState;
  setMonster: React.Dispatch<React.SetStateAction<MonsterState>>;

  tasks: ApiTaskItem[];
  setTasks: React.Dispatch<React.SetStateAction<ApiTaskItem[]>>;
  taskCooldownUntil: number | null;
  setTaskCooldownUntil: React.Dispatch<React.SetStateAction<number | null>>;

  currentRewards: Accessory[];
  generateNewRewards: () => void;

  toasts: ToastInfo[];
  showToast: (message: string, subMessage?: string) => void;
  removeToast: (id: string) => void;

  diaries: import("../types").ApiDiaryEntry[];
  communityPosts: import("../types").CommunityPost[];
  setCommunityPosts: React.Dispatch<React.SetStateAction<import("../types").CommunityPost[]>>;

  pendingAccessory: Accessory | null;
  equipAccessory: (acc: Accessory) => void;
  resolveAccessoryChoice: (accept: boolean) => void;
  grantRandomAccessory: () => void;
  resetMonster: () => void;

  soundEnabled: boolean;
  setSoundEnabled: React.Dispatch<React.SetStateAction<boolean>>;

  // ✅ 新增：全域即時雲端同步函數
  syncMonsterToServer: (updatedMonster: MonsterState) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const DEFAULT_MONSTER: MonsterState = {
  isEgg: true,
  hatchTime: null,
  negativeValue: 50,
  color: "#FFEAA7",
  emotionLabel: "未知",
  daysOld: 1,
  accessories: { head: null, face: null, body: null },
  conversationCount: 0,
};

const ACCESSORY_POOL: Accessory[] = [
  { part: "head", id: "cat-ears", name: "貓耳", icon: "🐱" },
  { part: "head", id: "flower", name: "小花環", icon: "🌸" },
  { part: "face", id: "glasses", name: "書呆子眼鏡", icon: "👓" },
  { part: "body", id: "scarf", name: "溫暖圍巾", icon: "🧣" },
];

export const AppProvider = ({ children }: { children: ReactNode }) => {
  // === 讀取瀏覽器記憶體，判斷有沒有登入過 ===
  const [userId, setUserId] = useState<string | null>(localStorage.getItem("userId"));
  const [username, setUsername] = useState<string | null>(localStorage.getItem("username"));

  const [activeTab, setActiveTab] = useState<"home" | "tasks" | "diary" | "community">("home");
  const [monster, setMonster] = useState<MonsterState>(DEFAULT_MONSTER);
  const [tasks, setTasks] = useState<ApiTaskItem[]>([]);
  const [taskCooldownUntil, setTaskCooldownUntil] = useState<number | null>(null);
  const [currentRewards, setCurrentRewards] = useState<Accessory[]>([]);
  const [toasts, setToasts] = useState<ToastInfo[]>([]);
  const [pendingAccessory, setPendingAccessory] = useState<Accessory | null>(null);
  const [diaries, setDiaries] = useState<import("../types").ApiDiaryEntry[]>([]);
  const [communityPosts, setCommunityPosts] = useState<import("../types").CommunityPost[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // 🚀 F5防失憶機制：網頁載入時自動從後端撈取怪獸狀態
  useEffect(() => {
    if (userId) {
      fetch(`https://emo-gotchi.onrender.com/api/monster/${userId}`)
        .then((res) => res.json())
        .then((backendMonster) => {
          if (backendMonster && !backendMonster.message) {
            setMonster({
              ...DEFAULT_MONSTER,
              isEgg: backendMonster.isEgg,
              hatchTime: backendMonster.hatchTime,
              negativeValue: 100 - (backendMonster.moodScore || 50),
              emotionLabel: backendMonster.emotionLabel || "平靜",
              conversationCount: backendMonster.conversationCount || 0,
              color: backendMonster.color || DEFAULT_MONSTER.color,
              accessories: backendMonster.accessories || DEFAULT_MONSTER.accessories
            });
          }
        })
        .catch((err) => console.error("找回怪獸失敗：", err));
    }
  }, [userId]);

  // 🚀 日記加載機制：自動拉取歷史心情日記，內建安全防護罩防止髒資料造成死白
  useEffect(() => {
    if (userId) {
      fetch(` https://emo-gotchi.onrender.com/api/diary/${userId}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            const formattedDiaries = data.map((d: any) => ({
              id: d._id,
              dateRange: d.dateRange,
              emotionsStats: d.emotionsStats,
              finalMonster: {
                ...DEFAULT_MONSTER,
                ...d.finalMonster,
                accessories: d.finalMonster?.accessories || { head: null, face: null, body: null },
                color: d.finalMonster?.color || DEFAULT_MONSTER.color
              },
              // ✅【核心修正】把後端的 feedback 欄位解構傳給前端！沒有這行，前端一輩子讀不到專屬小語！
              feedback: d.feedback || d.feedbackText || "" 
            }));
            setDiaries(formattedDiaries);
          }
        })
        .catch((err) => console.error("撈取歷史日記失敗：", err));
    }
  }, [userId]);

  // ✅ 新增：即時將怪獸狀態打包發射並存進 MongoDB 雲端
  const syncMonsterToServer = async (updatedMonster: MonsterState) => {
    if (!userId) return;
    try {
      await fetch(` https://emo-gotchi.onrender.com/api/monster/${userId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isEgg: updatedMonster.isEgg,
          hatchTime: updatedMonster.hatchTime,
          negativeValue: updatedMonster.negativeValue,
          emotionLabel: updatedMonster.emotionLabel,
          conversationCount: updatedMonster.conversationCount,
          
          // 🔥 【核心修正】把外觀顏色與衣服配件也一起打包送出去！
          color: updatedMonster.color,             
          accessories: updatedMonster.accessories 
        })
      });
    } catch (err) {
      console.error("同步怪獸至雲端失敗：", err);
    }
  };

  // 登入成功處理
  const loginSuccess = (id: string, name: string, backendMonster: any) => {
    setUserId(id);
    setUsername(name);
    localStorage.setItem("userId", id);
    localStorage.setItem("username", name);

    if (backendMonster) {
      setMonster({
        ...DEFAULT_MONSTER,
        isEgg: backendMonster.isEgg,
        hatchTime: backendMonster.hatchTime,
        negativeValue: 100 - (backendMonster.moodScore || 50),
        emotionLabel: backendMonster.emotionLabel || "平靜",
        conversationCount: backendMonster.conversationCount || 0,
      });
    }
  };

  // 登出處理
  const logout = () => {
    setUserId(null);
    setUsername(null);
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    setMonster(DEFAULT_MONSTER);
  };

  // 聲音控制與通知系統
  useEffect(() => { import("../utils/audio").then(({ setAudioEnabled }) => { setAudioEnabled(soundEnabled); }); }, [soundEnabled]);
  const showToast = (message: string, subMessage?: string) => { const id = Math.random().toString(36).substring(2, 9); setToasts((prev) => [...prev, { id, message, subMessage }]); setTimeout(() => { removeToast(id); }, 4000); };
  const removeToast = (id: string) => { setToasts((prev) => prev.filter((t) => t.id !== id)); };
  
  // 配件換裝邏輯
  const equipAccessory = (acc: Accessory) => { 
    if (monster.accessories[acc.part] && monster.accessories[acc.part]!.id !== acc.id) { 
      // 如果該部位已經有衣服了，跳出選擇視窗
      setPendingAccessory(acc); 
    } else if (!monster.accessories[acc.part]) { 
      // 如果該部位是空的，直接穿上
      const nextMonster = { 
        ...monster, 
        accessories: { ...monster.accessories, [acc.part]: acc } 
      };
      
      setMonster(nextMonster); 
      syncMonsterToServer(nextMonster); // 🚀 【核心修正】立刻同步給後端資料庫！
      showToast("獲得新配件！", `小怪獸裝備了【${acc.name}】`); 
    } 
  };

  const resolveAccessoryChoice = (accept: boolean) => { 
    if (accept && pendingAccessory) { 
      const nextMonster = { 
        ...monster, 
        accessories: { ...monster.accessories, [pendingAccessory.part]: pendingAccessory } 
      };
      
      setMonster(nextMonster); 
      syncMonsterToServer(nextMonster); // 🚀 【核心修正】立刻同步給後端資料庫！
      showToast("更換配件成功！", `小怪獸換上了【${pendingAccessory.name}】`); 
    } 
    setPendingAccessory(null); 
  };
  
  const grantRandomAccessory = () => { if (currentRewards.length === 0) return; const randomAcc = currentRewards[Math.floor(Math.random() * currentRewards.length)]; setPendingAccessory(randomAcc); };
  const generateNewRewards = useCallback(() => { const pool = [...ACCESSORY_POOL]; for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; } setCurrentRewards(pool.slice(0, 3)); }, []);
  useEffect(() => { if (currentRewards.length === 0) { generateNewRewards(); } }, [generateNewRewards, currentRewards.length]);

  // ✅ 結算怪獸並放生存入雲端日記
  const resetMonster = async () => {
    if (monster.isEgg) {
      showToast("無法存入日記", "小怪獸還是一顆蛋喔！");
      return;
    }

    try {
      const response = await fetch(` https://emo-gotchi.onrender.com/api/diary/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monsterSnapshot: monster })
      });
      const data = await response.json();

      if (response.ok) {
        const formattedNewDiary = {
          id: data.newDiary._id,
          dateRange: data.newDiary.dateRange,
          emotionsStats: data.newDiary.emotionsStats,
          finalMonster: {
            ...DEFAULT_MONSTER,
            ...data.newDiary.finalMonster,
            accessories: data.newDiary.finalMonster?.accessories || { head: null, face: null, body: null },
            color: data.newDiary.finalMonster?.color || DEFAULT_MONSTER.color
          },
          feedback: data.newDiary.feedback
        };
        setDiaries((prev) => [formattedNewDiary, ...prev]);

        // 發放全新怪獸蛋數值
        setMonster({
          ...DEFAULT_MONSTER,
          isEgg: data.newMonster.isEgg,
          hatchTime: data.newMonster.hatchTime,
          negativeValue: 100 - data.newMonster.moodScore,
          emotionLabel: data.newMonster.emotionLabel,
          conversationCount: data.newMonster.conversationCount,
        });

        showToast("歸檔成功！", "小怪獸已珍藏進日記，新的蛋孵化囉！");
      } else {
        showToast("歸檔失敗", data.message);
      }
    } catch (error) {
      showToast("連線異常，無法存入日記");
    }
  };

  return (
    <AppContext.Provider
      value={{
        userId, username, loginSuccess, logout,
        activeTab, setActiveTab, monster, setMonster, tasks, setTasks, taskCooldownUntil, setTaskCooldownUntil, currentRewards, generateNewRewards, toasts, showToast, removeToast, diaries, communityPosts, setCommunityPosts, pendingAccessory, equipAccessory, resolveAccessoryChoice, grantRandomAccessory, resetMonster, soundEnabled, setSoundEnabled, syncMonsterToServer,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};