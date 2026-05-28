import mongoose from 'mongoose';

const monsterSchema = new mongoose.Schema({
  // 強關聯：這隻怪獸是屬於哪一個使用者的
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    default: '小蛋蛋'
  },
  isEgg: {
    type: Boolean,
    default: true // 初始狀態是一顆蛋
  },
  hatchTime: {
    type: Date,
    default: null // 孵化的時間戳
  },
  emotionLabel: {
    type: String,
    default: '平靜'
  },
  moodScore: {
    type: Number,
    default: 50 // 心情分數，由後端邏輯核算
  },
  conversationCount: {
    type: Number,
    default: 0 // 對話次數，累計到一定次數可以孵化
  },
  // 持久化保存用戶的配件裝備狀態
  accessories: { type: Object, default: { head: null, face: null, body: null } },
  color: { type: String, default: '#FFEAA7' },
  isReleased: {
    type: Boolean,
    default: false // 是否已經被放生封存
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 每次存檔時自動更新時間
// ⭕ 修正後的寫法
monsterSchema.pre('save', function() {
  this.updatedAt = new Date();
});

export default mongoose.model('Monster', monsterSchema);