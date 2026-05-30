import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import cors from 'cors';
import mongoose from 'mongoose';
import dns from 'dns';
import bcrypt from 'bcryptjs';
import Diary from './models/Diary.js'; 

// 引入所有資料庫模型
import User from './models/User.js';
import Monster from './models/Monster.js';
import Task from './models/Task.js';
import Post from './models/Post.js'; 

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('🎉 成功連線到 MongoDB 雲端資料庫！'))
  .catch((err) => console.error('資料庫連線失敗：', err));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
app.use(cors({ origin: '*' }));
app.use(express.json());

// ==========================================
// 4. 每日任務引擎 (Daily Quests Engine)
// ==========================================
function getTaiwanDateString() {
  const now = new Date();
  const twTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  return twTime.toISOString().split('T')[0];
}

const DEFAULT_TASK_POOL = [
  { taskId: 'chat_1', description: '跟小怪獸訴苦或聊天 1 次', targetProgress: 1 },
  { taskId: 'chat_3', description: '跟小怪獸深度對話 3 次', targetProgress: 3 },
  { taskId: 'keep_happy', description: '讓小怪獸的心情分數維持在 60 分以上', targetProgress: 1 },
  { taskId: 'feed_monster', description: '餵食小怪獸吃一頓美味的點心', targetProgress: 1 }
];

app.get('/api/tasks/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const todayStr = getTaiwanDateString();
    let userTaskDoc = await Task.findOne({ userId });

    if (!userTaskDoc) {
      userTaskDoc = new Task({
        userId,
        dailyTasks: DEFAULT_TASK_POOL.map(t => ({ ...t, currentProgress: 0, isCompleted: false, isRewardClaimed: false })),
        lastUpdatedDate: todayStr
      });
      await userTaskDoc.save();
    } 
    else if (userTaskDoc.lastUpdatedDate !== todayStr) {
      userTaskDoc.dailyTasks = DEFAULT_TASK_POOL.map(t => ({ ...t, currentProgress: 0, isCompleted: false, isRewardClaimed: false }));
      userTaskDoc.lastUpdatedDate = todayStr;
      await userTaskDoc.save();
    }

    res.json({ date: todayStr, tasks: userTaskDoc.dailyTasks });
  } catch (error) {
    res.status(500).json({ message: '無法獲取每日任務' });
  }
});

app.post('/api/tasks/:userId/claim', async (req, res) => {
  try {
    const { userId } = req.params;
    const { taskId } = req.body;
    const todayStr = getTaiwanDateString();
    const userTaskDoc = await Task.findOne({ userId, lastUpdatedDate: todayStr });

    if (!userTaskDoc) return res.status(404).json({ message: '找不到任務清單！' });
    const task = userTaskDoc.dailyTasks.find(t => t.taskId === taskId);
    if (!task) return res.status(404).json({ message: '找不到該任務！' });
    if (!task.isCompleted) return res.status(400).json({ message: '任務還沒完成喔！' });
    if (task.isRewardClaimed) return res.status(400).json({ message: '獎勵領過囉！' });

    task.isRewardClaimed = true;
    await userTaskDoc.save();

    const monster = await Monster.findOne({ userId, isReleased: false });
    if (monster) {
      monster.moodScore = Math.min(100, monster.moodScore + 15);
      await monster.save();
    }

    res.json({ message: `🎉 領取成功！`, updatedTasks: userTaskDoc.dailyTasks, updatedMonsterState: monster });
  } catch (error) {
    res.status(500).json({ message: '領獎失敗' });
  }
});


// ==========================================
// 1. 用戶與認證系統 (Authentication API)
// ==========================================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: '請輸入帳密！' });
    
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: '帳號重複囉！' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    // 💡【安全通關修正】先不要在程式碼裡手寫複雜的物件結構，直接給予最基本的欄位！
    // 讓 MongoDB 依照我們在 models/Monster.js 設定好的 default 預設值去自動生成結構
    // 這樣可以 100% 規避因為新舊格式打架導致的存檔失敗！
    const newMonster = new Monster({ 
      userId: newUser._id, 
      name: '神祕的蛋', 
      isEgg: true
    });
    await newMonster.save();

    console.log(`🎉 用戶 ${username} 註冊成功，並已成功催生初始怪獸蛋！`);
    res.status(201).json({ message: '註冊成功！', userId: newUser._id });
  } catch (error) {
    // 🕵️ 如果真的不幸又失敗，這行會在 Render 的 Logs 裡印出最真實殘酷的死因！
    console.error('❌ 雲端註冊機制發生核心爆炸，原因：', error);
    res.status(500).json({ message: '註冊失敗，伺服器存檔發生異常' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: '找不到帳號！' });
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) return res.status(400).json({ message: '密碼錯誤！' });

    let monster = await Monster.findOne({ userId: user._id, isReleased: false });
    if (!monster) {
      monster = new Monster({ 
        userId: user._id,
        accessories: { head: null, face: null, body: null, hand: null }
      });
      await monster.save();
    }
    res.json({ message: `歡迎回來！`, user: { id: user._id, username: user.username }, monster });
  } catch (error) {
    res.status(500).json({ message: '登入失敗' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { username, newPassword } = req.body;

    if (!username || !newPassword) {
      return res.status(400).json({ message: '請輸入帳號與新密碼！' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: '找不到該帳號，請確認是否輸入正確！' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: '🎉 密碼重設成功！請使用新密碼重新登入。' });
  } catch (error) {
    console.error('重設密碼失敗：', error);
    res.status(500).json({ message: '重設密碼失敗，伺服器出錯' });
  }
});

app.get('/api/monster/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const monster = await Monster.findOne({ userId, isReleased: false });
    
    if (!monster) {
      return res.status(404).json({ message: '找不到這隻小怪獸！' });
    }
    
    res.json(monster);
  } catch (error) {
    res.status(500).json({ message: '撈取怪獸狀態失敗' });
  }
});


// ==========================================
// 5. 社群照片牆與互動 (Community Features)
// ==========================================

app.post('/api/community/posts', async (req, res) => {
  try {
    const { userId, story, showStory, showDaysOld } = req.body;
    const user = await User.findById(userId);
    const monster = await Monster.findOne({ userId, isReleased: false });

    if (!user || !monster) {
      return res.status(404).json({ message: '找不到使用者或活著的小怪獸，無法發文！' });
    }

    // 🛠️ 檢查點：貼文快照直接同步繼承 monster.accessories，手持道具完美合流
    const monsterSnapshot = {
      name: monster.name,
      color: monster.color || '#FFD54F',
      isEgg: monster.isEgg,
      emotionLabel: monster.emotionLabel,
      moodScore: monster.moodScore,
      conversationCount: monster.conversationCount,
      accessories: monster.accessories || { head: null, face: null, body: null, hand: null }
    };

    const newPost = new Post({
      userId,
      username: user.username,
      story,
      showStory: showStory !== false,
      showDaysOld: showDaysOld !== false,
      monsterSnapshot
    });

    await newPost.save();
    res.status(201).json({ message: '🎉 貼文成功發布到照片牆囉！', post: newPost });
  } catch (error) {
    console.error('發布貼文失敗：', error);
    res.status(500).json({ message: '發文失敗，伺服器可能有點累了。' });
  }
});

app.get('/api/community/posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skipIndex = (page - 1) * limit;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skipIndex);

    const totalPosts = await Post.countDocuments();

    res.json({
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts,
      posts
    });
  } catch (error) {
    res.status(500).json({ message: '撈取社群貼文失敗' });
  }
});

app.post('/api/community/posts/:postId/like', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: '找不到這篇貼文！' });

    const likeIndex = post.likes.indexOf(userId);

    if (likeIndex === -1) {
      post.likes.push(userId);
      await post.save();
      res.json({ message: '👍 按讚成功！', likesCount: post.likes.length, isLiked: true });
    } else {
      post.likes.splice(likeIndex, 1);
      await post.save();
      res.json({ message: '↩️ 已收回讚', likesCount: post.likes.length, isLiked: false });
    }
  } catch (error) {
    res.status(500).json({ message: '按讚處理失敗' });
  }
});

app.post('/api/community/posts/:postId/comment', async (req, res) => {
  try {
    const { postId } = req.params;
    const { username, content } = req.body; 

    if (!content || !content.trim()) {
      return res.status(400).json({ message: '留言內容不能留空喔！' });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: '找不到這篇貼文！' });

    const newComment = {
      username: username || "神祕怪獸",
      content: content.trim(),
      createdAt: new Date()
    };

    post.comments.push(newComment);
    await post.save();

    const formattedComments = post.comments.map(c => ({
      id: c._id,
      authorAlias: c.username,
      content: c.content,
      createdAt: new Date(c.createdAt).getTime()
    }));

    res.status(201).json({ message: '💬 留言成功發表！', comments: formattedComments });
  } catch (error) {
    console.error('留言失敗：', error);
    res.status(500).json({ message: '留言處理失敗' });
  }
});

app.delete('/api/community/posts/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body; 

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: '找不到這篇貼文！' });

    if (post.userId.toString() !== userId) {
      return res.status(403).json({ message: '你沒有權限刪除這篇貼文喔！' });
    }

    await Post.findByIdAndDelete(postId);
    res.json({ message: '🗑️ 貼文已徹底刪除！' });
  } catch (error) {
    console.error('刪除貼文失敗：', error);
    res.status(500).json({ message: '刪除貼文失敗，伺服器出錯' });
  }
});


// ==========================================
// 3. AI 大語言模型對接 (/api/chat)
// ==========================================
app.get('/api/ping', (req, res) => {
  res.json({ message: '太棒了！後端伺服器成功運作中！' });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, userId } = req.body;
    if (!message) return res.status(400).json({ message: '心情不能留空喔！' });

    console.log(`收到用戶 (${userId || '未登入匿名'}) 的心情：「${message}」，正在呼叫 AI...`);

    const prompt = `
      你是一隻陪伴用戶的療癒小怪獸。用戶剛剛說：「${message}」
      請分析這句話的情緒，並嚴格按照以下 JSON 格式回傳（不可包含任何 Markdown 標記或其他文字）：
      {
        "llm_data": {
          "emotion_analysis": {
            "primary": "開心", 
            "intensity": 5, 
            "mood_delta": 10,
            "diary_summary": "簡短總結用戶的心情"
          },
          "visual_commands": {
            "base_color": "#FFD93D",
            "added_features": [],
            "extracted_accessories": []
          },
          "image_ai_prompt": "A cute round monster with long legs...",
          "monster_response": "用溫慢、同理心的語氣回應一句話"
        },
        "mapped_accessory": null
      }
    `;

    let resultJson;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      resultJson = JSON.parse(response.text);
      console.log('✨ Gemini AI 正常響應！內容：', resultJson.llm_data.monster_response);

    } catch (aiError) {
      console.warn('⚠️ 偵測到 Gemini API 額度超限或異常，自動啟動「在地模擬大腦」繼續通關！');
      
      resultJson = {
        "llm_data": {
          "emotion_analysis": {
            "primary": "溫暖", 
            "intensity": 5, 
            "mood_delta": 20, 
            "diary_summary": `用戶分享了心情：${message}`
          },
          "visual_commands": {
            "base_color": "#FFD54F", 
            "added_features": [],
            "extracted_accessories": []
          },
          "image_ai_prompt": "A cute round monster...",
          "monster_response": `【守護模式】我聽見你說「${message}」囉！雖然我現在跟雲端太空總署暫時斷訊，但我依然在基地裡陪著你，沒事的！`
        },
        "mapped_accessory": null
      };
    }

    if (userId) {
      const monster = await Monster.findOne({ userId, isReleased: false });
      if (monster) {
        monster.conversationCount += 1;
        const delta = resultJson.llm_data.emotion_analysis.mood_delta || 0;
        monster.moodScore = Math.max(0, Math.min(100, monster.moodScore + delta));
        monster.emotionLabel = resultJson.llm_data.emotion_analysis.primary || '平靜';

        if (monster.isEgg && monster.conversationCount >= 3) {
          monster.isEgg = false;
          monster.name = '初生的小怪獸';
          monster.hatchTime = new Date();
        }
        await monster.save();

        const todayStr = getTaiwanDateString();
        const userTaskDoc = await Task.findOne({ userId, lastUpdatedDate: todayStr });
        if (userTaskDoc) {
          userTaskDoc.dailyTasks.forEach(task => {
            if (task.taskId === 'chat_1' || task.taskId === 'chat_3') {
              if (task.currentProgress < task.targetProgress) {
                task.currentProgress += 1;
                if (task.currentProgress >= task.targetProgress) task.isCompleted = true;
              }
            }
          });
          await userTaskDoc.save();
        }
        resultJson.updatedMonsterState = monster;
      }
    }
    
    res.json(resultJson);

  } catch (error) {
    console.error('❌ 聊天通道發生真正的嚴重死當：', error);
    res.status(500).json({ message: '系統通道故障' });
  }
});

app.get('/api/diary/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const diaries = await Diary.find({ userId }).sort({ createdAt: -1 });
    res.json(diaries);
  } catch (error) {
    res.status(500).json({ message: '撈取日記失敗' });
  }
});

// ==========================================
// 💾 【完全體 API】怪獸結算放生，並存入心情日記
// ==========================================
app.post('/api/diary/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { monsterSnapshot } = req.body; 

    if (!monsterSnapshot) {
      return res.status(400).json({ message: '放生失敗，缺少怪獸快照資料！' });
    }

    const activeMonster = await Monster.findOne({ userId, isReleased: false });
    if (!activeMonster) {
      return res.status(404).json({ message: '找不到可以放生歸檔的小怪獸！' });
    }

    const hatchDate = activeMonster.hatchTime ? new Date(activeMonster.hatchTime) : new Date();
    const today = new Date();
    const formatDate = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
    const dateRangeStr = `${formatDate(hatchDate)} - ${formatDate(today)}`;

    const currentMoodScore = activeMonster.moodScore || 50; 
    const emotionsStatsArray = [
      { name: '正面情緒', value: currentMoodScore, color: '#FFD54F' }, 
      { name: '負面情緒', value: 100 - currentMoodScore, color: '#90A4AE' } 
    ];

    let finalFeedback = monsterSnapshot.feedback || activeMonster.feedback || "";

    if (!finalFeedback || finalFeedback.trim() === "") {
      const mood = activeMonster.emotionLabel || "平靜";
      if (currentMoodScore >= 70) {
        finalFeedback = `【${mood}的小怪獸】留在回憶裡的話：\n謝謝你這幾天帶給我這麼多快樂和正面能量！待在你身邊的每一天都像在探險，你開心的笑容是我最珍規的寶藏。以後也要常常保持微笑喔！`;
      } else if (currentMoodScore <= 35) {
        finalFeedback = `【${mood}的小怪獸】留在回憶裡的話：\n這幾天看你過得有點累、有點悶，我也跟著好心疼...。不過沒關係，我把你的煩惱和淚水通通吃進肚子裡帶走囉！累了就好好休息，你已經非常努力了！`;
      } else {
        finalFeedback = `【${mood}的小怪獸】留在回憶裡的話：\n能默默陪著你度過這段平靜又日常的時光，就是我最幸福的事。雖然我要回怪獸花園了，但只要你一寫日記，我隨時都會在回憶裡給你大大的擁抱！`;
      }
    }

    // 🛠️ 檢查點：放生留存的心情日記 finalMonster，完美納入手持道具欄位
    const newDiary = new Diary({
      userId,
      dateRange: dateRangeStr,
      emotionsStats: emotionsStatsArray,
      finalMonster: {
        isEgg: false,
        name: activeMonster.name || '珍藏的小怪獸',
        color: activeMonster.color || '#FFD54F',
        emotionLabel: activeMonster.emotionLabel || '平靜',
        conversationCount: activeMonster.conversationCount || 0,
        accessories: activeMonster.accessories || { head: null, face: null, body: null, hand: null } // 👈 這裡補上 hand
      },
      feedback: finalFeedback 
    });

    await newDiary.save();

    activeMonster.isReleased = true;
    await activeMonster.save();

    // 🛠️ 檢查點：催生下一代蛋時，也幫牠預留好乾淨的 4 部位結構
    const newMonsterEgg = new Monster({
      userId,
      isEgg: true,
      hatchTime: null,
      moodScore: 50,
      emotionLabel: '未知',
      conversationCount: 0,
      color: '#FFEAA7',
      accessories: { head: null, face: null, body: null, hand: null } // 👈 這裡補上 hand
    });
    await newMonsterEgg.save();

    res.json({
      message: '🎉 小怪獸順利歸檔至回憶日記！',
      newDiary,
      newMonster: newMonsterEgg
    });

  } catch (error) {
    console.error('❌ 放生歸檔 API 發生慘劇：', error);
    res.status(500).json({ message: '伺服器放生機制故障' });
  }
});

app.post('/api/monster/:userId/update', async (req, res) => {
  try {
    const { userId } = req.params;
    const { isEgg, hatchTime, negativeValue, emotionLabel, conversationCount, color, accessories } = req.body;

    const monster = await Monster.findOne({ userId, isReleased: false });
    if (!monster) return res.status(404).json({ message: '找不到可以同步的小怪獸！' });

    if (isEgg !== undefined) monster.isEgg = isEgg;
    if (hatchTime !== undefined) monster.hatchTime = hatchTime;
    if (negativeValue !== undefined) monster.moodScore = 100 - negativeValue; 
    if (emotionLabel !== undefined) monster.emotionLabel = emotionLabel;
    if (conversationCount !== undefined) monster.conversationCount = conversationCount;

    if (color !== undefined) monster.color = color;
    if (accessories !== undefined) {
      monster.accessories = accessories;
      monster.markModified('accessories'); 
    }

    await monster.save();
    res.json({ message: '✨ 怪獸雲端狀態已即時同步！', monster });

  } catch (error) {
    console.error('即時同步怪獸失敗：', error);
    res.status(500).json({ message: '伺服器同步發生錯誤' });
  }
});

app.listen(port, () => {
  console.log(`伺服器已經在 http://localhost:${port} 启动囉！`);
});

app.post('/api/monster/:userId/time-travel', async (req, res) => {
  try {
    const { userId } = req.params;
    const monster = await Monster.findOne({ userId, isReleased: false });

    if (!monster) return res.status(404).json({ message: '找不到活著的小怪獸！' });
    if (monster.isEgg) return res.status(400).json({ message: '牠還是一顆蛋，無法穿越時光！請先聊天孵化牠。' });

    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    monster.hatchTime = threeDaysAgo;
    
    await monster.save();
    res.json({ message: '⏳ 時光機發動成功！小怪獸瞬間老了 3 天！', monster });
  } catch (error) {
    res.status(500).json({ message: '時光機故障' });
  }
});