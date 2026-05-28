import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  username: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: { type: String, required: true }, // 發文者的名字
  story: { type: String, required: true },    // 故事內容
  
  // 隱私設定
  showStory: { type: Boolean, default: true },
  showDaysOld: { type: Boolean, default: true },

  // 【核心：怪獸外觀快照】發文當下怪獸的狀態定格
  monsterSnapshot: {
    name: String,
    emotionLabel: String,
    moodScore: Number,
    conversationCount: Number,
    accessories: [String] // 穿戴的配件
  },

  // 互動數據
  likes: {
    type: [String], // 存入按讚使用者的 userId，防止重複按讚
    default: []
  },
  comments: [commentSchema], // 巢狀留言板結構
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Post', postSchema);