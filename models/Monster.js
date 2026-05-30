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
  
  // 🛠️ 【核心修正】強烈建議改成 Mixed（混合型別），並預留好手持道具（hand）的欄位！
  // 這樣不論什麼自訂配件格式，MongoDB 通通都會張開雙臂無條件接受，再也不會裝不上去！
  accessories: { 
    type: mongoose.Schema.Types.Mixed, 
    default: { head: null, face: null, body: null, hand: null } 
  },
  
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
monsterSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next(); // 💡 加上 next() 確保 Mongoose 中介軟體順暢執行不卡死
});

export default mongoose.model('Monster', monsterSchema);