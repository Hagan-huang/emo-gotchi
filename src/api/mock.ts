import {
  ApiChatResponse,
  ApiTaskItem,
  ApiDiaryEntry,
  CommunityPost,
  MonsterState,
} from "../types";

/**
 * 模擬網路延遲
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * POST /api/chat
 * 模擬用戶發送抱怨後，後端回傳的 JSON
 */
export async function mockPostChat(message: string): Promise<ApiChatResponse> {
  await delay(1200); // 模擬 LLM 思考時間

  // 模擬 LLM 關鍵詞萃取與情緒判斷
  if (message.includes("老師") || message.includes("討厭")) {
    return {
      llm_data: {
        emotion_analysis: {
          primary: "生氣",
          intensity: 8,
          mood_delta: -30, // 心情變差
          diary_summary: "遇到討厭的事情",
        },
        visual_commands: {
          base_color: "#FF6B6B",
          added_features: ["紅角"],
          extracted_accessories: [],
        },
        image_ai_prompt:
          "A cute round monster with long legs, colored in #FF6B6B, with small red horns, simple background.",
        monster_response: "聽起來受了不少氣呢！把這份壓力交給我！",
      },
      mapped_accessory: null,
    };
  }

  if (
    message.includes("學校") ||
    message.includes("考試") ||
    message.includes("作業")
  ) {
    return {
      llm_data: {
        emotion_analysis: {
          primary: "平靜",
          intensity: 5,
          mood_delta: 0,
          diary_summary: "提到了學校",
        },
        visual_commands: {
          base_color: "#FFD93D",
          added_features: [],
          extracted_accessories: [{ keyword: "學校", item: "書包" }],
        },
        image_ai_prompt:
          "A cute round monster with long legs, colored in #FFD93D, carrying a school backpack, simple background.",
        monster_response:
          "學校的事情辛苦啦，我來幫你背著書包，稍微放鬆一下吧！",
      },
      mapped_accessory: {
        part: "body",
        id: "backpack",
        name: "書包",
        icon: "🎒",
      },
    };
  }

  if (
    message.includes("自由") ||
    message.includes("飛") ||
    message.includes("翅膀")
  ) {
    return {
      llm_data: {
        emotion_analysis: {
          primary: "期待",
          intensity: 7,
          mood_delta: 20, // 心情變好
          diary_summary: "渴望自由的心情",
        },
        visual_commands: {
          base_color: "#FFEAA7",
          added_features: ["飛行姿態"],
          extracted_accessories: [{ keyword: "翅膀", item: "羽翼" }],
        },
        image_ai_prompt:
          "A cute round monster with long legs, colored in #FFEAA7, with beautiful wings on its back, feeling free, simple background.",
        monster_response:
          "感覺你的心想要飛出去了！給你一雙小翅膀，我們一起翱翔！",
      },
      mapped_accessory: {
        part: "body",
        id: "wings",
        name: "小翅膀",
        icon: "🪽",
      },
    };
  }

  if (
    message.includes("難過") ||
    message.includes("憂鬱") ||
    message.includes("想哭")
  ) {
    return {
      llm_data: {
        emotion_analysis: {
          primary: "憂鬱",
          intensity: 6,
          mood_delta: -20,
          diary_summary: "感到難過想哭",
        },
        visual_commands: {
          base_color: "#4D96FF",
          added_features: ["眼淚"],
          extracted_accessories: [{ keyword: "難過", item: "雨雲" }],
        },
        image_ai_prompt:
          "A cute round monster with long legs, colored in #4D96FF, crying with tears, a small rain cloud above its head, simple background.",
        monster_response:
          "想哭的話就哭出來吧，我在這裡陪你，眼淚會把難過帶走的。你的頭上好像都長出小烏雲了呢。",
      },
      mapped_accessory: {
        part: "head",
        id: "rain-cloud",
        name: "小雨雲",
        icon: "🌧️",
      },
    };
  }

  if (
    message.includes("開心") ||
    message.includes("好棒") ||
    message.includes("謝謝")
  ) {
    return {
      llm_data: {
        emotion_analysis: {
          primary: "開心",
          intensity: 9,
          mood_delta: 30, // 心情大好
          diary_summary: "開心的一天",
        },
        visual_commands: {
          base_color: "#A8E6CF",
          added_features: ["微笑"],
          extracted_accessories: [{ keyword: "開心", item: "幸運草" }],
        },
        image_ai_prompt:
          "A cute round monster with long legs, colored in #A8E6CF, smiling happily, with a clover sprout on its head, bright simple background.",
        monster_response: "太好了！我也跟著你一起開心起來了！",
      },
      mapped_accessory: {
        part: "head",
        id: "sprout",
        name: "開心小草",
        icon: "🍀",
      },
    };
  }

  return {
    llm_data: {
      emotion_analysis: {
        primary: "平靜",
        intensity: 5,
        mood_delta: 0,
        diary_summary: "平靜的日常",
      },
      visual_commands: {
        base_color: "#FFD93D",
        added_features: [],
        extracted_accessories: [],
      },
      image_ai_prompt:
        "A cute round monster with long legs, colored in #FFD93D, neutral expression, calm, simple background.",
      monster_response: "我聽著呢，謝謝你跟我分享這些。",
    },
    mapped_accessory: null,
  };
}

/**
 * GET /api/tasks
 * 根據負面值動態給予 1-2 或 4-5 個任務
 */
export async function mockGetTasks(
  negativeValue: number,
): Promise<ApiTaskItem[]> {
  await delay(500);

  const allTasks: ApiTaskItem[] = [
    {
      id: "task-1",
      title: "跟著節奏深呼吸 5 次",
      completed: false,
      moodBenefit: 10,
    },
    {
      id: "task-2",
      title: "溫柔摸摸怪獸的頭",
      completed: false,
      moodBenefit: 5,
    },
    {
      id: "task-3",
      title: "寫下 3 件今天的感恩小事",
      completed: false,
      moodBenefit: 15,
    },
    { id: "task-4", title: "喝一大杯溫水", completed: false, moodBenefit: 5 },
    {
      id: "task-5",
      title: "在紙上畫一張心情塗鴉",
      completed: false,
      moodBenefit: 20,
    },
    {
      id: "task-6",
      title: "到戶外走走，吹吹風 10 分鐘",
      completed: false,
      moodBenefit: 25,
    },
    {
      id: "task-7",
      title: "放下手機，閉上眼睛休息 5 分鐘",
      completed: false,
      moodBenefit: 15,
    },
    {
      id: "task-8",
      title: "聽一首自己最喜歡的歌",
      completed: false,
      moodBenefit: 10,
    },
    {
      id: "task-9",
      title: "對著鏡子對自己微笑 10 秒",
      completed: false,
      moodBenefit: 15,
    },
  ];

  // 隨機打亂任務
  const shuffled = allTasks.sort(() => 0.5 - Math.random());

  if (negativeValue <= 50) {
    // 負面值低於五成，只需 2-3 個輕度任務
    return shuffled.slice(0, 3);
  }

  // 負面值超過五成，顯示 4-5 個任務
  return shuffled.slice(0, 5);
}

/**
 * GET /api/community
 * 取得社群分享區卡片
 */
export async function mockGetCommunity(): Promise<
  import("../types").CommunityPost[]
> {
  await delay(700);
  return [
    {
      id: "p-1",
      authorAlias: "M-1029",
      story:
        "這週專案瘋狂大改需求，每天都加班到九點，覺得快撐不住了...還好有小怪獸聽我發牢騷。",
      likes: 124,
      likedByMe: false,
      shares: 15,
      createdAt: Date.now() - 3600000,
      isMyPost: false,
      showStory: true,
      showDaysOld: true,
      comments: [
        {
          id: "com-1",
          authorAlias: "A-2894",
          content: "拍拍你，慢慢來會好的！",
          createdAt: Date.now() - 1800000,
        },
      ],
      monster: {
        isEgg: false,
        hatchTime: Date.now() - 5 * 24 * 60 * 60 * 1000,
        negativeValue: 80,
        color: "#FF6B6B",
        emotionLabel: "生氣",
        daysOld: 5,
        conversationCount: 0,
        accessories: {
          head: null,
          face: { part: "face", id: "glasses", name: "黑框眼鏡", icon: "👓" },
          body: { part: "body", id: "backpack", name: "沉重背包", icon: "🎒" },
        },
      },
    },
    {
      id: "p-2",
      authorAlias: "S-7734",
      story:
        "今天和好朋友因為小事吵架了，心裡有點難過，希望明天能鼓起勇氣和好。",
      likes: 89,
      likedByMe: true,
      shares: 3,
      createdAt: Date.now() - 86400000,
      isMyPost: false,
      showStory: true,
      showDaysOld: true,
      comments: [],
      monster: {
        isEgg: false,
        hatchTime: Date.now() - 2 * 24 * 60 * 60 * 1000,
        negativeValue: 65,
        color: "#4D96FF",
        emotionLabel: "憂鬱",
        daysOld: 2,
        conversationCount: 0,
        accessories: {
          head: { part: "head", id: "ears", name: "貓耳", icon: "🐱" },
          face: null,
          body: null,
        },
      },
    },
  ];
}
