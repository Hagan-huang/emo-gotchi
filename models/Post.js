import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  story: { type: String, default: '' },
  showStory: { type: Boolean, default: true },
  showDaysOld: { type: Boolean, default: true },
  likes: { type: [String], default: [] },
  comments: [
    {
      username: String,
      content: String,
      createdAt: { type: Date, default: Date.now }
    }
  ],
  // 👇 核心修正：讓資料庫模型允許儲存 color 與 isEgg
  monsterSnapshot: {
    name: String,
    color: { type: String, default: '#FFD54F' }, // 🎨 允許儲存皮膚顏色
    isEgg: { type: Boolean, default: false },    // 🥚 允許儲存蛋的狀態
    emotionLabel: String,
    moodScore: Number,
    conversationCount: Number,
    accessories: { type: mongoose.Schema.Types.Mixed, default: { head: null, face: null, body: null } }
  }
}, { timestamps: true });

export default mongoose.model('Post', postSchema);