import React, { useState } from "react";

// 👈 稍微修改了介面，多傳遞一個 backendMonster
export function LoginView({ onLoginSuccess }: { onLoginSuccess: (userId: string, username: string, backendMonster: any) => void }) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    try {
      const endpoint = isLoginMode ? "/api/auth/login" : "/api/auth/register";
      const response = await fetch(`https://rich-cobras-poke.loca.lt${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "發生錯誤，請稍後再試！");
      }

      if (!isLoginMode) {
        setIsLoginMode(true);
        setPassword("");
        alert("🎉 註冊成功！系統已經為你配發了一顆小怪獸蛋，請登入看看吧！");
        setIsLoading(false);
        return;
      }

      if (isLoginMode) {
        // 👈 把後端傳來的小怪獸一起丟給 AppContext！
        onLoginSuccess(data.user.id, data.user.username, data.monster);
      }

    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFAEC] p-4 relative overflow-hidden z-[100]">
      <div className="absolute inset-0 z-0 opacity-20 bg-[url('/home_bg.png')] bg-cover bg-center"></div>
      
      <div className="relative z-10 w-full max-w-sm bg-white border-4 border-[#5D4037] rounded-3xl p-8 shadow-[8px_8px_0px_#5D4037]">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto bg-[#FFB74D] border-4 border-[#5D4037] rounded-full flex items-center justify-center mb-4 shadow-[4px_4px_0px_#5D4037]">
            <span className="text-4xl">🥚</span>
          </div>
          <h2 className="text-2xl font-black text-[#5D4037]">
            {isLoginMode ? "歡迎回來" : "領養小怪獸"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-bold text-[#5D4037] mb-1">帳號</label>
            <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-[#FFFAEC] border-4 border-[#5D4037] rounded-xl px-4 py-3 font-bold text-[#5D4037] focus:outline-none focus:bg-white transition-colors" placeholder="輸入你的帳號" />
          </div>
          <div>
            <label className="block font-bold text-[#5D4037] mb-1">密碼</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#FFFAEC] border-4 border-[#5D4037] rounded-xl px-4 py-3 font-bold text-[#5D4037] focus:outline-none focus:bg-white transition-colors" placeholder="輸入密碼" />
          </div>

          {errorMsg && <div className="text-red-500 font-bold text-center text-sm">{errorMsg}</div>}

          <button type="submit" disabled={isLoading} className="w-full bg-[#FFB74D] border-4 border-[#5D4037] text-[#5D4037] font-black text-lg py-3 rounded-xl shadow-[4px_4px_0px_#5D4037] active:translate-y-1 active:shadow-none transition-all mt-4">
            {isLoading ? "連線中..." : (isLoginMode ? "登入" : "註冊帳號")}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button type="button" onClick={() => { setIsLoginMode(!isLoginMode); setErrorMsg(""); }} className="text-[#AF8A63] font-bold hover:text-[#5D4037]">
            {isLoginMode ? "還沒有小怪獸？點我註冊" : "已經有帳號了？點我登入"}
          </button>
        </div>
      </div>
    </div>
  );
}