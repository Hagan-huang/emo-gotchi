import React from "react";
import { MonsterState } from "../types";

interface MonsterProps {
  state: MonsterState;
  className?: string;
  isInteractive?: boolean;
  onInteract?: () => void;
}

export function MonsterAvatar({
  state,
  className = "",
  isInteractive = false,
  onInteract,
}: MonsterProps) {
  // 從 state 解構出外觀狀態
  const { color, emotionLabel, accessories, negativeValue, isEgg: rawIsEgg } = state;

  // 🛠️【終極破殼發動射線】
  // 只要對話次數大於等於 3 次，或者身上有穿戴任何一件配飾（頭、臉、身體、手）
  // 就代表牠「絕對不可能再是顆蛋」，我們在這裡強制將 isEgg 修正為 false，強制牠脫殼變形！
  const hasAnyAccessory = !!(accessories?.head || accessories?.face || accessories?.body || (accessories as any)?.hand);
  const conversationCount = state.conversationCount || 0;
  
  const isEgg = (conversationCount >= 3 || hasAnyAccessory) ? false : rawIsEgg;

  // 決定表情變化
  const isAngry = negativeValue >= 70;
  const isSad = negativeValue >= 60 && emotionLabel === "憂鬱";
  const isHappy = negativeValue <= 40;

  return (
    <div
      className={`relative inline-flex justify-center items-center w-full h-full max-w-[250px] max-h-[250px] ${isInteractive ? "cursor-pointer hover:scale-105 transition-transform" : ""} ${className}`}
      onClick={onInteract}
    >
      {/* 怪獸本體 SVG */}
      <svg
        viewBox="-50 -50 300 300"
        className="relative z-10 w-full h-full drop-shadow-2xl transition-all duration-700 ease-in-out overflow-visible animate-bounce-slow"
      >
        {/* === 位於身體後方的配飾 (Body Accessories) === */}
        {!isEgg && accessories.body && (
          <g className="pointer-events-none">
            {accessories.body.id === "wings" ? (
              <>
                <text
                  x="25"
                  y="100"
                  fontSize="60"
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{
                    transformOrigin: "25px 100px",
                    transform: "scale(-1, 1) rotate(-15deg)",
                  }}
                  className="animate-pulse drop-shadow-md"
                >
                  {accessories.body.icon}
                </text>
                <text
                  x="175"
                  y="100"
                  fontSize="60"
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{
                    transformOrigin: "175px 100px",
                    transform: "rotate(15deg)",
                  }}
                  className="animate-pulse drop-shadow-md"
                >
                  {accessories.body.icon}
                </text>
              </>
            ) : accessories.body.id === "backpack" ? (
              <text
                x="180"
                y="120"
                fontSize="60"
                textAnchor="middle"
                dominantBaseline="central"
                style={{
                  transformOrigin: "180px 120px",
                  transform: "rotate(15deg)",
                }}
                className="animate-bounce-slow drop-shadow-lg"
              >
                {accessories.body.icon}
              </text>
            ) : (
              <text
                x="100"
                y="70"
                fontSize="90"
                textAnchor="middle"
                dominantBaseline="central"
                className="animate-pulse drop-shadow-lg"
              >
                {accessories.body.icon}
              </text>
            )}
          </g>
        )}

        {/* 生氣時長出紅角背景 */}
        {!isEgg && isAngry && (
          <path
            d="M 60 50 L 40 10 L 80 40 Z M 140 50 L 160 10 L 120 40 Z"
            fill="#b91c1c"
            className="transition-opacity duration-500"
          />
        )}

        {/* 柔軟的有機體 (Blob) - 根據上面修正後的 isEgg 連動變形！ */}
        <g fill={color}>
          {isEgg ? (
            <path
              d="M100 20 C60 20 40 80 40 130 C40 180 70 190 100 190 C130 190 160 180 160 130 C160 80 140 20 100 20 Z"
              stroke="#5D4037"
              strokeWidth="6"
              className="transition-all duration-1000 ease-in-out"
            />
          ) : isAngry ? (
            <path
              d="M100 20 C20 0 0 80 10 130 C20 180 40 190 100 190 C160 190 180 180 190 130 C200 80 180 0 100 20 Z"
              stroke="#5D4037"
              strokeWidth="6"
              strokeLinejoin="round"
              className="transition-all duration-700 ease-in-out"
            />
          ) : isSad ? (
            <path
              d="M100 40 C50 40 30 90 30 140 C30 190 50 180 100 180 C150 180 170 190 170 140 C170 90 150 40 100 40 Z"
              stroke="#5D4037"
              strokeWidth="6"
              strokeLinejoin="round"
              className="transition-all duration-700 ease-in-out"
            />
          ) : isHappy ? (
            <path
              d="M100 10 C30 10 20 60 20 120 C20 190 40 170 100 170 C160 170 180 190 180 120 C180 60 170 10 100 10 Z"
              stroke="#5D4037"
              strokeWidth="6"
              strokeLinejoin="round"
              className="transition-all duration-700 ease-in-out"
            />
          ) : (
            <path
              d="M100 20 C40 20 20 60 20 120 C20 180 40 180 100 180 C160 180 180 180 180 120 C180 60 160 20 100 20 Z"
              stroke="#5D4037"
              strokeWidth="6"
              strokeLinejoin="round"
              className="transition-all duration-700 ease-in-out"
            />
          )}
        </g>

        {/* 背帶線條 */}
        {!isEgg && accessories.body?.id === "backpack" && (
          <g>
            <path
              d="M 60 70 Q 55 100 65 140"
              stroke="#8B4513"
              strokeWidth="8"
              fill="none"
              className="opacity-80"
              strokeDasharray="4 2"
            />
            <path
              d="M 140 70 Q 145 100 135 140"
              stroke="#8B4513"
              strokeWidth="8"
              fill="none"
              className="opacity-80"
              strokeDasharray="4 2"
            />
          </g>
        )}

        {/* 眼睛與嘴巴 */}
        {!isEgg && (
          <g>
            <circle
              cx="65"
              cy="85"
              r="8"
              fill="#333333"
              className="transition-opacity duration-700"
            />
            <circle
              cx="135"
              cy="85"
              r="8"
              fill="#333333"
              className="transition-opacity duration-700"
            />

            {/* 嘴巴動態變化 */}
            {isAngry ? (
              <path
                d="M 85 110 Q 100 100 115 110"
                stroke="#333333"
                fill="none"
                strokeWidth="4"
                strokeLinecap="round"
              />
            ) : isSad ? (
              <path
                d="M 85 115 Q 100 105 115 115"
                stroke="#333333"
                fill="none"
                strokeWidth="4"
                strokeLinecap="round"
              />
            ) : isHappy ? (
              <path
                d="M 85 110 Q 100 130 115 110"
                stroke="#333333"
                fill="none"
                strokeWidth="4"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M 95 115 Q 100 120 105 115"
                stroke="#333333"
                fill="none"
                strokeWidth="4"
                strokeLinecap="round"
              />
            )}
          </g>
        )}

        {/* === 位於身體前方的配飾 (Face, Head and Hand Accessories) === */}
        {/* 2. 臉部配飾 */}
        {!isEgg && accessories.face && (
          <text
            x="100"
            y="105"
            fontSize="70"
            textAnchor="middle"
            dominantBaseline="central"
            className="pointer-events-none drop-shadow-sm"
          >
            {accessories.face.icon}
          </text>
        )}

        {/* 1. 頭部配飾 */}
        {!isEgg && accessories.head && (
          <text
            x="100"
            y="15"
            fontSize="60"
            textAnchor="middle"
            dominantBaseline="central"
            className="animate-bounce-slow pointer-events-none drop-shadow-md"
          >
            {accessories.head.icon}
          </text>
        )}

        {/* 手持道具 (hand) 圖層定位 */}
        {!isEgg && (accessories as any).hand && (
          <text
            x="185" 
            y="145" 
            fontSize="55"
            textAnchor="middle"
            dominantBaseline="central"
            style={{
              transformOrigin: "185px 145px",
              transform: "rotate(10deg)", 
            }}
            className="pointer-events-none drop-shadow-lg animate-bounce-slow"
          >
            {(accessories as any).hand.icon}
          </text>
        )}
      </svg>
    </div>
  );
}