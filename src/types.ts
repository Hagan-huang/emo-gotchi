export type AccessoryPart = "head" | "face" | "body";

export interface Accessory {
  part: AccessoryPart;
  id: string;
  name: string;
  icon: string;
}

export interface MonsterState {
  isEgg: boolean;
  hatchTime: number | null;
  negativeValue: number; // 0 to 100, 50 is neutral
  color: string;
  emotionLabel: string;
  accessories: Record<AccessoryPart, Accessory | null>;
  daysOld: number;
  conversationCount: number;
}

// ============================================
// API 交接規格 (Developer B 實作對接標準)
// ============================================

export interface ApiChatRequest {
  message: string;
}

// POST /api/chat 回傳的 JSON 結構
export interface ApiChatResponse {
  // 1. LLM 原始輸出的結構，後端照實傳給前端，或儲存在 DB 後回傳
  llm_data: {
    emotion_analysis: {
      primary: string;
      intensity: number; // 1 - 10
      mood_delta: number; // 負值為心情變差, 正值為變好
      diary_summary: string;
    };
    visual_commands: {
      base_color: string;
      added_features: string[];
      extracted_accessories: Array<{
        keyword: string;
        item: string;
      }>;
    };
    image_ai_prompt: string;
    monster_response: string;
  };

  // 2. 後端將 LLM 抓出的 accessory 對應到我們預設的配件庫，傳給前端實作
  mapped_accessory: Accessory | null;
}

// GET /api/tasks 回傳的 JSON 結構 (陣列)
export interface ApiTaskItem {
  id: string;
  title: string;
  completed: boolean;
  moodBenefit: number;
}

// GET /api/diary 回傳的 JSON 結構 (陣列)
export interface ApiDiaryEntry {
  id: string;
  dateRange: string;
  emotionsStats: {
    name: string;
    value: number; // 百分比
    color: string;
  }[];
  finalMonster: MonsterState;
  feedback: string;
}

export interface CommunityComment {
  id: string;
  authorAlias: string;
  content: string;
  createdAt: number;
}

// GET /api/community 回傳的 JSON 結構 (陣列)
export interface CommunityPost {
  id: string;
  authorAlias: string;
  story: string;
  likes: number;
  likedByMe: boolean;
  shares: number;
  comments: CommunityComment[];
  monster: MonsterState;
  createdAt: number;
  isMyPost: boolean;
  showStory: boolean;
  showDaysOld: boolean;
}
