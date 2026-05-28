import mongoose from 'mongoose';

const diarySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dateRange: { type: String, required: true }, // 陪伴的時間區間
  emotionsStats: [
    {
      name: String,  // "正面情緒" 或 "負面情緒"
      value: Number, // 分數比例
      color: String  // 圓餅圖顏色
    }
  ],
  // 🔥【核心修正】改成 Mixed 型態！允許儲存任何來自前端的完整怪獸外觀、配件、膚色快照
  finalMonster: { 
    type: mongoose.Schema.Types.Mixed, 
    required: true 
  },
  feedback: { type: String, required: true }, // 小怪獸留給玩家的道別感言
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Diary', diarySchema);