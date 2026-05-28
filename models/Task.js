import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // 記錄使用者今天拿到的任務清單
  dailyTasks: [
    {
      taskId: { type: String, required: true }, // 例如: 'chat_3_times', 'mood_high'
      description: { type: String, required: true }, // 任務敘述
      targetProgress: { type: Number, required: true }, // 目標次數（例如 3 次）
      currentProgress: { type: Number, default: 0 }, // 目前進度
      isCompleted: { type: Boolean, default: false }, // 是否已完成
      isRewardClaimed: { type: Boolean, default: false } // 是否已領取獎勵
    }
  ],
  // 【核心欄位】記錄這組任務是哪一天產生的，用來判斷跨日
  lastUpdatedDate: {
    type: String, // 格式用 'YYYY-MM-DD'，最容易比對，完全不受時區飄移影響！
    required: true
  }
});

export default mongoose.model('Task', taskSchema);