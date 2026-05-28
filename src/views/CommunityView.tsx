import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useApp } from "../store/AppContext";
// ❌ 已經刪除假資料的 import
import { MonsterAvatar } from "../components/Monster";
import { Loader2, Heart, MessageCircle, Share2, Plus, X, Trash2, ArrowLeft, Send } from "lucide-react";
import { CommunityPost, MonsterState } from "../types";
import { soundEffects } from "../utils/audio";

export function CommunityView() {
  // ✅ 1. 多把 userId 和 username 拿出來用
  const { userId, username, communityPosts, setCommunityPosts, showToast, monster, diaries } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [viewTab, setViewTab] = useState<"explore" | "myposts">("explore");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [commentInput, setCommentInput] = useState("");

  const [publishSource, setPublishSource] = useState<"current" | "diary">("current");
  const [publishDiaryId, setPublishDiaryId] = useState<string>("");
  const [publishStory, setPublishStory] = useState("");
  const [showStory, setShowStory] = useState(true);
  const [showDaysOld, setShowDaysOld] = useState(true);

  // ✅ 2. 實作「拉取真實後端貼文」的函數
  const fetchPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('https://emo-gotchi.onrender.com/api/community/posts?page=1&limit=20');
      const data = await response.json();

      // 將後端的資料格式，轉換成前端畫面上需要的格式
      const formattedPosts: CommunityPost[] = data.posts.map((p: any) => ({
        id: p._id,
        authorAlias: p.username,
        story: p.story,
        likes: p.likes.length,
        likedByMe: p.likes.includes(userId),
        shares: 0,
        comments: (p.comments || []).map((c: any) => ({
          id: c._id,
          authorAlias: c.username, 
          content: c.content,
          createdAt: new Date(c.createdAt).getTime()
        })),
        monster: {
          isEgg: false, 
          hatchTime: new Date(p.createdAt).getTime(), 
          negativeValue: 100 - (p.monsterSnapshot?.moodScore || 50),
          emotionLabel: p.monsterSnapshot?.emotionLabel || '平靜',
          daysOld: 1,
          accessories: { head: null, face: null, body: null },
          conversationCount: p.monsterSnapshot?.conversationCount || 0
        },
        createdAt: new Date(p.createdAt).getTime(),
        isMyPost: p.userId === userId,
        showStory: p.showStory,
        showDaysOld: p.showDaysOld,
      }));

      setCommunityPosts(formattedPosts);
    } catch (error) {
      console.error("無法拉取貼文", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, setCommunityPosts]);

  // 初始化時自動拉取真實貼文
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // ✅ 3. 串接真實後端：防作弊按讚
  const handleLike = async (postId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    soundEffects.pop();

    // 樂觀更新：先讓畫面愛心亮起來（讓使用者覺得很快）
    setCommunityPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return { ...p, likes: p.likedByMe ? p.likes - 1 : p.likes + 1, likedByMe: !p.likedByMe };
        }
        return p;
      })
    );

    // 背景默默打 API 去後端修改真實資料庫
    try {
      await fetch(`https://emo-gotchi.onrender.com/api/community/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
    } catch (error) {
      showToast("連線異常，按讚狀態未同步");
    }
  };

  const handleShare = (postId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    soundEffects.click();
    setCommunityPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, shares: p.shares + 1 } : p)));
    navigator.clipboard.writeText(`https://monster-diary.app/post/${postId}`);
    showToast("已複製分享連結！", "快去分享給朋友吧");
  };

  const handleDelete = async (postId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    try {
      const response = await fetch(`https://emo-gotchi.onrender.com/api/community/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }) // 告訴後端是我要刪的
      });

      if (response.ok) {
        // 後端刪除成功後，才把畫面上的貼文移除
        setCommunityPosts((prev) => prev.filter((p) => p.id !== postId));
        if (selectedPostId === postId) {
          setSelectedPostId(null);
        }
        showToast("已徹底刪除貼文");
      } else {
        const data = await response.json();
        showToast("刪除失敗", data.message);
      }
    } catch (error) {
      showToast("連線異常，刪除失敗");
    }
  };

  const handleAddComment = async () => {
    if (!selectedPostId || !commentInput.trim()) return;

    try {
      const response = await fetch(`https://emo-gotchi.onrender.com/api/community/posts/${selectedPostId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username || "訪客", // 傳送當前登入者的真實名字
          content: commentInput.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        // 用後端資料庫回傳的最新、帶有真正留言 ID 的陣列，即時更新畫面狀態
        setCommunityPosts((prev) =>
          prev.map((p) => {
            if (p.id === selectedPostId) {
              return { ...p, comments: data.comments };
            }
            return p;
          })
        );
        setCommentInput("");
        showToast("留言發布成功");
      } else {
        showToast("留言失敗", data.message);
      }
    } catch (error) {
      showToast("連線異常，留言發表失敗");
    }
  };

  // ✅ 4. 串接真實後端：發布貼文與怪獸快照
  const handlePublish = async () => {
    if (publishSource === "current" && monster.isEgg) {
      showToast("無法發布", "小怪獸還沒孵化喔！");
      return;
    }

    try {
      const response = await fetch('https://emo-gotchi.onrender.com/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          story: publishStory,
          showStory,
          showDaysOld
        })
      });

      if (response.ok) {
        showToast("🎉 貼文發布成功！");
        setIsPublishOpen(false);
        setViewTab("myposts");
        setPublishStory("");
        // 發布完，立刻重新跟後端拉取最新牆面
        fetchPosts();
      } else {
        const data = await response.json();
        showToast("發布失敗", data.message);
      }
    } catch (error) {
      showToast("連線異常，發布失敗");
    }
  };

  const currentList = viewTab === "explore" ? communityPosts.filter((p) => !p.isMyPost) : communityPosts.filter((p) => p.isMyPost);
  const selectedPost = communityPosts.find((p) => p.id === selectedPostId);

// ==========================================
// 👇 下方的 return ( ... ) UI 畫面完全不用動它！
// ==========================================

  return (
    <div className="flex flex-col h-full fade-in w-full max-w-4xl mx-auto pb-4 relative">
      {/* Header */}
      {!selectedPostId && (
        <div className="flex flex-col gap-4 mb-4 shrink-0">
          <div className="flex justify-between items-center bg-[#FFFAEC] border-[4px] border-[#5D4037] p-2 rounded-2xl shadow-[4px_4px_0px_#5D4037]">
            <div className="flex gap-2">
              <button
                onClick={() => setViewTab("explore")}
                className={`py-2 px-6 rounded-xl font-extrabold text-[#5D4037] transition-all ${
                  viewTab === "explore"
                    ? "bg-[#FFCC80] border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037]"
                    : "hover:bg-[#EFEBE0]"
                }`}
              >
                社群牆
              </button>
              <button
                onClick={() => setViewTab("myposts")}
                className={`py-2 px-6 rounded-xl font-extrabold text-[#5D4037] transition-all ${
                  viewTab === "myposts"
                    ? "bg-[#FFCC80] border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037]"
                    : "hover:bg-[#EFEBE0]"
                }`}
              >
                我的貼文
              </button>
            </div>

            <button
              onClick={() => setIsPublishOpen(true)}
              className="bg-[#5D4037] text-white py-2 px-4 rounded-xl flex items-center gap-2 font-extrabold shadow-[2px_2px_0px_#AF8A63] hover:bg-[#4E342E] active:translate-y-[2px] active:shadow-none transition-all"
            >
              <Plus size={20} strokeWidth={3} />
              發布貼文
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex-1 flex justify-center items-center">
          <Loader2 className="w-10 h-10 text-[#FF8A65] animate-spin" />
        </div>
      ) : selectedPostId && selectedPost ? (
        // Expanded Post View
        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row fade-in gap-6">
          <div className="w-full md:w-1/2 p-6 flex flex-col relative shrink-0">
            <button
              onClick={() => setSelectedPostId(null)}
              className="absolute top-4 left-4 p-2 bg-white border-2 border-[#5D4037] rounded-xl hover:bg-[#EFEBE0] shadow-[2px_2px_0px_#5D4037] z-10"
            >
              <ArrowLeft strokeWidth={3} className="text-[#5D4037]" />
            </button>

            <div className="mt-12 flex justify-center items-center h-48 sm:h-64 mb-6">
              <MonsterAvatar
                state={selectedPost.monster}
                className="w-64 h-64 drop-shadow-xl"
              />
            </div>

            <div className="bg-[#EFEBE0] border-[4px] border-[#5D4037] rounded-2xl p-4 shadow-[4px_4px_0px_#5D4037] mt-auto">
              <div className="flex justify-between items-center mb-2">
                <span className="font-extrabold text-[#5D4037]">
                  {selectedPost.authorAlias}
                </span>
                {selectedPost.showDaysOld ? (
                  <span className="bg-[#FFB74D] text-[#5D4037] text-xs font-bold px-2 py-1 rounded-md border-2 border-[#5D4037]">
                    陪伴{" "}
                    {Math.max(
                      1,
                      Math.floor(
                        (Date.now() -
                          (selectedPost.monster.hatchTime || Date.now())) /
                          (1000 * 60 * 60 * 24),
                      ),
                    )}{" "}
                    天
                  </span>
                ) : (
                  <span className="bg-[#B0BEC5] text-[#5D4037] text-xs font-bold px-2 py-1 rounded-md border-2 border-[#5D4037]">
                    天數隱藏
                  </span>
                )}
              </div>
              {selectedPost.showStory ? (
                <p className="text-[#5D4037] font-bold text-sm leading-relaxed">
                  {selectedPost.story}
                </p>
              ) : (
                <p className="text-[#9E937F] font-bold text-sm italic">
                  故事已隱藏
                </p>
              )}
            </div>

            <div className="flex justify-between items-center mt-6 px-6 py-3 bg-white border-[3px] border-[#5D4037] rounded-2xl shadow-[2px_2px_0px_#5D4037]">
              <button
                onClick={(e) => handleLike(selectedPost.id, e)}
                className="flex items-center gap-2 group hover:scale-105 active:scale-95 transition-transform"
              >
                <Heart
                  className={`w-7 h-7 transition-all ${selectedPost.likedByMe ? "fill-[#FF6B6B] text-[#FF6B6B] scale-110" : "text-[#AF8A63] group-hover:text-[#FF6B6B]"}`}
                  strokeWidth={selectedPost.likedByMe ? 0 : 2}
                />
                <span
                  className={`font-extrabold text-lg ${selectedPost.likedByMe ? "text-[#FF6B6B]" : "text-[#AF8A63]"}`}
                >
                  {selectedPost.likes}
                </span>
              </button>
              <div className="flex items-center gap-2">
                <MessageCircle
                  className="w-7 h-7 text-[#AF8A63]"
                  strokeWidth={2}
                />
                <span className="font-extrabold text-lg text-[#AF8A63]">
                  {selectedPost.comments.length}
                </span>
              </div>
              <button
                onClick={(e) => handleShare(selectedPost.id, e)}
                className="flex items-center gap-2 group hover:scale-105 active:scale-95 transition-transform"
              >
                <Share2
                  className="w-7 h-7 text-[#AF8A63] group-hover:text-[#4D96FF] transition-colors"
                  strokeWidth={2}
                />
                <span className="font-extrabold text-lg text-[#AF8A63] group-hover:text-[#4D96FF]">
                  {selectedPost.shares}
                </span>
              </button>
            </div>
          </div>

          <div className="w-full md:w-1/2 flex flex-col bg-white/80 rounded-[2rem] border-[4px] border-[#5D4037] shadow-[4px_4px_0px_#5D4037] overflow-hidden">
            <div className="p-4 border-b-[4px] border-[#5D4037]">
              <h3 className="font-extrabold text-[#5D4037] text-xl">評論區</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedPost.comments.length === 0 ? (
                <div className="text-center text-[#AF8A63] font-bold mt-10">
                  還沒有人留言，快來搶頭香吧！
                </div>
              ) : (
                selectedPost.comments.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white border-2 border-[#5D4037] p-3 rounded-xl shadow-[2px_2px_0px_#C7BBA2]"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-extrabold text-sm text-[#5D4037]">
                        {c.authorAlias}
                      </span>
                      <span className="text-xs font-bold text-[#AF8A63]">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[#5D4037] font-bold text-sm">
                      {c.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t-[4px] border-[#5D4037] flex gap-2 shrink-0">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                placeholder="寫下友善的留言..."
                className="flex-1 bg-white border-2 border-[#5D4037] rounded-xl px-4 py-2 font-bold text-[#5D4037] focus:outline-none focus:ring-2 focus:ring-[#FFB74D]"
              />
              <button
                onClick={handleAddComment}
                className="bg-[#FFB74D] border-2 border-[#5D4037] p-3 rounded-xl text-[#5D4037] shadow-[2px_2px_0px_#5D4037] hover:bg-[#FFA726] active:translate-y-[1px] active:shadow-none"
              >
                <Send size={20} strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Grid View
        <div className="flex-1 overflow-y-auto pr-2 gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 lg:px-12 content-start pb-4">
          {currentList.length === 0 ? (
            <div className="col-span-full h-[400px] bg-[#FFECCC] border-[6px] border-[#5D4037] border-dashed rounded-[2rem] flex flex-col justify-center items-center text-center font-bold text-[#AF8A63] relative overflow-hidden group hover:bg-[#FFFAEC] transition-colors duration-500 shadow-inner">
              <div className="mb-6 relative group-hover:-translate-y-3 transition-transform duration-500">
                <div className="w-24 h-24 bg-white border-[4px] border-[#5D4037] rounded-[2rem] rotate-12 flex justify-center items-center absolute top-2 left-2 shadow-[2px_2px_0px_#5D4037]" />
                <div className="w-24 h-24 bg-[#FFB74D] border-[4px] border-[#5D4037] rounded-[2rem] -rotate-6 flex justify-center items-center relative shadow-[4px_4px_0px_#5D4037]">
                  <span className="text-4xl">🌱</span>
                </div>
                <div className="absolute -top-6 -right-6 text-3xl animate-bounce">
                  ✨
                </div>
              </div>
              <h3 className="text-2xl font-extrabold text-[#5D4037] mb-2">
                社群還是一片荒蕪
              </h3>
              <p className="text-lg">這裡空空如也，來發布第一篇貼文吧！</p>
            </div>
          ) : (
            currentList.map((post) => (
              <div
                key={post.id}
                className="bg-[#FFF8E7] border-[4px] border-[#C7BBA2] rounded-[2rem] p-4 flex flex-col gap-3 shadow-none hover:-translate-y-1 transition-all group relative h-[250px]"
              >
                {post.isMyPost && (
                  <button
                    onClick={(e) => handleDelete(post.id, e)}
                    className="absolute top-3 right-3 text-[#AF8A63] hover:text-[#FF6B6B] z-10"
                  >
                    <Trash2 size={24} strokeWidth={2.5} />
                  </button>
                )}

                <div
                  className="cursor-pointer flex flex-col gap-3 h-full"
                  onClick={() => setSelectedPostId(post.id)}
                >
                  <div className="flex gap-4 h-full">
                    <div className="w-28 h-28 shrink-0 flex justify-center items-center pointer-events-none mt-2">
                      <MonsterAvatar
                        state={post.monster}
                        className="w-full h-full"
                      />
                    </div>

                    <div className="flex-1 flex flex-col py-2">
                      <h4 className="font-extrabold text-[#5D4037] text-lg leading-tight truncate pr-8 cursor-pointer pointer-events-auto">
                        {post.authorAlias}
                      </h4>
                      <p className="text-[#AF8A63] font-bold text-xs mt-1">
                        {post.showDaysOld
                          ? `養育天數：${post.monster.hatchTime ? Math.max(1, Math.floor((Date.now() - post.monster.hatchTime) / (1000 * 60 * 60 * 24))) : 1} 天`
                          : "天數未公開"}
                      </p>

                      {post.showStory ? (
                        <p className="text-[#5D4037] font-bold text-sm line-clamp-3 mt-2 pointer-events-none flex-1">
                          {post.story || "這隻小怪獸默默無語..."}
                        </p>
                      ) : (
                        <p className="text-[#9E937F] font-bold text-sm italic mt-2 pointer-events-none flex-1">
                          故事已設定隱藏
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t-[3px] border-[#EFEBE0] z-10 mt-auto">
                  <div className="flex gap-4">
                    <button
                      onClick={(e) => handleLike(post.id, e)}
                      className={`flex items-center gap-1 group/btn hover:scale-105 active:scale-95 transition-transform ${post.likedByMe ? "text-[#FF6B6B]" : "text-[#AF8A63]"}`}
                    >
                      <Heart
                        size={18}
                        className={
                          post.likedByMe
                            ? "fill-current"
                            : "group-hover/btn:text-[#FF6B6B] transition-colors"
                        }
                        strokeWidth={post.likedByMe ? 0 : 2}
                      />
                      <span className="font-extrabold text-sm">
                        {post.likes}
                      </span>
                    </button>
                    <button
                      onClick={() => setSelectedPostId(post.id)}
                      className="flex items-center gap-1 text-[#AF8A63] hover:text-[#4FC3F7] hover:scale-105 active:scale-95 transition-transform group/btn"
                    >
                      <MessageCircle
                        size={18}
                        className="group-hover/btn:text-[#4FC3F7] transition-colors"
                        strokeWidth={2}
                      />
                      <span className="font-extrabold text-sm">
                        {post.comments.length}
                      </span>
                    </button>
                  </div>
                  <button
                    onClick={(e) => handleShare(post.id, e)}
                    className="flex items-center gap-1 text-[#AF8A63] hover:text-[#4D96FF] hover:scale-105 active:scale-95 transition-transform group/btn"
                  >
                    <Share2
                      size={18}
                      className="group-hover/btn:text-[#4D96FF] transition-colors"
                      strokeWidth={2}
                    />
                    <span className="font-extrabold text-sm">
                      {post.shares}
                    </span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Publish Modal */}
      {isPublishOpen && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FFFAEC] border-[6px] border-[#5D4037] rounded-3xl w-full max-w-lg shadow-[8px_8px_0px_#5D4037] flex flex-col max-h-[90vh]">
            <div className="p-4 border-b-[4px] border-[#5D4037] flex justify-between items-center bg-[#FFF8E7] rounded-t-[1.5rem] shrink-0">
              <h3 className="text-2xl font-extrabold text-[#5D4037]">
                發布到社群牆
              </h3>
              <button
                onClick={() => setIsPublishOpen(false)}
                className="text-[#5D4037] hover:bg-[#EFEBE0] p-1 rounded-xl"
              >
                <X size={28} strokeWidth={3} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6 hidden-scrollbar">
              <div className="space-y-2">
                <label className="font-extrabold text-[#5D4037]">
                  選擇要公開的怪獸
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPublishSource("current")}
                    className={`flex-1 py-3 border-[3px] rounded-xl font-extrabold transition-all ${
                      publishSource === "current"
                        ? "bg-[#FFCC80] border-[#5D4037] shadow-[inset_2px_2px_0px_rgba(0,0,0,0.1)]"
                        : "bg-white border-[#C7BBA2] text-[#9E937F] hover:bg-[#EFEBE0]"
                    }`}
                  >
                    目前養育的怪獸
                  </button>
                  <button
                    onClick={() => setPublishSource("diary")}
                    className={`flex-1 py-3 border-[3px] rounded-xl font-extrabold transition-all ${
                      publishSource === "diary"
                        ? "bg-[#FFCC80] border-[#5D4037] shadow-[inset_2px_2px_0px_rgba(0,0,0,0.1)]"
                        : "bg-white border-[#C7BBA2] text-[#9E937F] hover:bg-[#EFEBE0]"
                    }`}
                  >
                    從歷史日記選擇
                  </button>
                </div>
                {publishSource === "diary" && (
                  <select
                    value={publishDiaryId}
                    onChange={(e) => setPublishDiaryId(e.target.value)}
                    className="w-full mt-2 p-3 bg-white border-[3px] border-[#5D4037] rounded-xl font-bold text-[#5D4037] focus:outline-none focus:ring-2 focus:ring-[#FFB74D]"
                  >
                    <option value="" disabled>
                      請選擇一隻歷史怪獸...
                    </option>
                    {diaries.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.dateRange} (最終情緒: {d.finalMonster.emotionLabel})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-2">
                <label className="font-extrabold text-[#5D4037]">
                  想說些什麼故事嗎？
                </label>
                <textarea
                  value={publishStory}
                  onChange={(e) => setPublishStory(e.target.value)}
                  placeholder="寫下這隻怪獸的小故事，或是你最近的心情..."
                  className="w-full h-32 p-3 bg-white border-[3px] border-[#5D4037] rounded-xl font-bold text-[#5D4037] resize-none focus:outline-none focus:ring-2 focus:ring-[#FFB74D]"
                />
              </div>

              <div className="bg-[#EFEBE0] p-4 rounded-2xl border-2 border-[#C7BBA2] space-y-3">
                <span className="font-extrabold text-[#5D4037] block mb-2 text-sm">
                  隱私設定選項
                </span>

                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="font-bold text-[#5D4037]">公開故事內容</span>
                  <div
                    className={`w-12 h-6 rounded-full border-2 border-[#5D4037] relative transition-colors ${showStory ? "bg-[#A8E6CF]" : "bg-white"}`}
                  >
                    <div
                      className={`absolute top-[2px] w-4 h-4 rounded-full bg-[#5D4037] transition-transform ${showStory ? "translate-x-6" : "translate-x-0"}`}
                    />
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={showStory}
                    onChange={() => setShowStory(!showStory)}
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="font-bold text-[#5D4037]">公開養育天數</span>
                  <div
                    className={`w-12 h-6 rounded-full border-2 border-[#5D4037] relative transition-colors ${showDaysOld ? "bg-[#FFD3B6]" : "bg-white"}`}
                  >
                    <div
                      className={`absolute top-[2px] w-4 h-4 rounded-full bg-[#5D4037] transition-transform ${showDaysOld ? "translate-x-6" : "translate-x-0"}`}
                    />
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={showDaysOld}
                    onChange={() => setShowDaysOld(!showDaysOld)}
                  />
                </label>
              </div>
            </div>

            <div className="p-4 border-t-[4px] border-[#5D4037] bg-[#FFF8E7] rounded-b-[1.5rem] shrink-0">
              <button
                onClick={handlePublish}
                className="w-full py-4 bg-[#5D4037] text-white font-extrabold text-lg rounded-xl shadow-[4px_4px_0px_#FFCC80] active:translate-y-[2px] active:shadow-none hover:bg-[#4E342E] transition-all"
              >
                發布至牆上
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
