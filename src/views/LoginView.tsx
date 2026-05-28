import React, { useState } from "react";

export function LoginView({ onLoginSuccess }: { onLoginSuccess: (userId: string, username: string, backendMonster: any) => void }) {
  // 模式切換：'login' | 'register' | 'forgot'
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    try {
      let endpoint = "/api/auth/login";
      // 宣告為 any 型別，避免 TypeScript 阻擋新密碼欄位變更
      let payload: any = { username, password };

      if (mode === 'register') {
        endpoint = "/api/auth/register";
      } else if (mode === 'forgot') {
        endpoint = "/api/auth/reset-password";
        payload = { username, newPassword: password }; 
      }

      // 👇 完美對接：這裡已經幫你替換成正式的雲端後端網址囉！
      const BASE_URL = "https://emo-gotchi.onrender.com";

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "發生錯誤，請稍後再試！");
      }

      if (mode === 'register') {
        setMode('login');
        setPassword("");
        alert("🎉 註冊成功！系統已經為你配發了一顆小怪獸蛋，請登入看看吧！");
        setIsLoading(false);
        return;
      }

      if (mode === 'forgot') {
        setMode('login');
        setPassword("");
        alert("🔒 密碼已成功修改！請使用新密碼重新登入。");
        setIsLoading(false);
        return;
      }

      if (mode === 'login') {
        onLoginSuccess(data.user.id, data.user.username, data.monster);
      }

    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 取得當前畫面的標題
  const getTitle = () => {
    if (mode === 'login') return "歡迎回來";
    if (mode === 'register') return "領養小怪獸";
    return "重設密碼";
  };

  // 取得當前按鈕的文字
  const getButtonText = () => {
    if (isLoading) return "連線中...";
    if (mode === 'login') return "登入";
    if (mode === 'register') return "註冊帳號";
    return "確認修改密碼";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFAEC] p-4 relative overflow-hidden z-[100]">
      <div className="absolute inset-0 z-0 opacity-20 bg-[url('/home_bg.png')] bg-cover bg-center"></div>
      
      <div className="relative z-10 w-full max-w-sm bg-white border-4 border-[#5D4037] rounded-3xl p-8 shadow-[8px_8px_0px_#5D4037]">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto bg-[#FFB74D] border-4 border-[#5D4037] rounded-full flex items-center justify-center mb-4 shadow-[4px_4px_0px_#5D4037]">
            <span className="text-4xl">
              {mode === 'forgot' ? "🔑" : "🥚"}
            </span>
          </div>
          <h2 className="text-2xl font-black text-[#5D4037]">
            {getTitle()}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-bold text-[#5D4037] mb-1">帳號</label>
            <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-[#FFFAEC] border-4 border-[#5D4037] rounded-xl px-4 py-3 font-bold text-[#5D4037] focus:outline-none focus:bg-white transition-colors" placeholder="輸入你的帳號" />
          </div>
          <div>
            <label className="block font-bold text-[#5D4037] mb-1">
              {mode === 'forgot' ? "新密碼" : "密碼"}
            </label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#FFFAEC] border-4 border-[#5D4037] rounded-xl px-4 py-3 font-bold text-[#5D4037] focus:outline-none focus:bg-white transition-colors" placeholder={mode === 'forgot' ? "輸入新密碼" : "輸入密碼"} />
          </div>

          {errorMsg && <div className="text-red-500 font-bold text-center text-sm">{errorMsg}</div>}

          <button type="submit" disabled={isLoading} className="w-full bg-[#FFB74D] border-4 border-[#5D4037] text-[#5D4037] font-black text-lg py-3 rounded-xl shadow-[4px_4px_0px_#5D4037] active:translate-y-1 active:shadow-none transition-all mt-4">
            {getButtonText()}
          </button>
        </form>

        {/* 底部的切換連結功能 */}
        <div className="mt-6 text-center space-y-2 flex flex-col items-center">
          {mode === 'login' && (
            <>
              <button type="button" onClick={() => { setMode('register'); setErrorMsg(""); }} className="text-[#AF8A63] font-bold hover:text-[#5D4037]">
                還沒有小怪獸？點我註冊
              </button>
              <button type="button" onClick={() => { setMode('forgot'); setErrorMsg(""); }} className="text-sm text-gray-400 font-medium hover:text-[#5D4037] underline decoration-dashed">
                忘記密碼？點我直接修改
              </button>
            </>
          )}

          {mode === 'register' && (
            <button type="button" onClick={() => { setMode('login'); setErrorMsg(""); }} className="text-[#AF8A63] font-bold hover:text-[#5D4037]">
              已經有帳號了？點我登入
            </button>
          )}

          {mode === 'forgot' && (
            <button type="button" onClick={() => { setMode('login'); setErrorMsg(""); }} className="text-[#AF8A63] font-bold hover:text-[#5D4037]">
              返回登入畫面
            </button>
          )}
        </div>
      </div>
    </div>
  );
}