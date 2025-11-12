"use client";

import React, { useState } from "react";
import { WireframeSpec, WireElementType } from "@/types/wireframe";

interface Props {
  spec: WireframeSpec;
  scale?: number; // 확대/축소 비율 (기본 1)
}

// 타입별 스타일 매핑
const typeStyle: Record<WireElementType, { bg: string; border: string; text: string }> = {
  navbar: { bg: "bg-indigo-100", border: "border-indigo-300", text: "text-indigo-800" },
  footer: { bg: "bg-gray-100", border: "border-gray-300", text: "text-gray-700" },
  button: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700" },
  input: { bg: "bg-white", border: "border-gray-400", text: "text-gray-600" },
  list: { bg: "bg-gray-50", border: "border-gray-300", text: "text-gray-600" },
  card: { bg: "bg-white", border: "border-gray-300", text: "text-gray-700" },
  text: { bg: "bg-transparent", border: "border-transparent", text: "text-gray-800" },
  image: { bg: "bg-gray-200", border: "border-gray-400", text: "text-gray-500" },
  chip: { bg: "bg-purple-50", border: "border-purple-300", text: "text-purple-700" },
  checkbox: { bg: "bg-white", border: "border-gray-400", text: "text-gray-600" },
  radio: { bg: "bg-white", border: "border-gray-400", text: "text-gray-600" },
  select: { bg: "bg-white", border: "border-gray-400", text: "text-gray-600" },
  table: { bg: "bg-white", border: "border-gray-400", text: "text-gray-700" },
  divider: { bg: "bg-gray-300", border: "border-transparent", text: "text-transparent" },
  icon: { bg: "bg-gray-100", border: "border-gray-300", text: "text-gray-600" },
};

// 타입별 아이콘 (선택사항)
const typeIcon: Record<WireElementType, string> = {
  navbar: "≡",
  footer: "━",
  button: "▶",
  input: "⌨",
  list: "☰",
  card: "□",
  text: "T",
  image: "🖼",
  chip: "◎",
  checkbox: "☐",
  radio: "○",
  select: "▼",
  table: "⊞",
  divider: "─",
  icon: "★",
};

export function LoFiCanvas({ spec, scale = 1 }: Props) {
  const { viewport, screens } = spec;
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
  
  // 현재 선택된 화면
  const currentScreen = screens[currentScreenIndex];

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 화면 선택 탭 (여러 화면이 있는 경우만 표시) */}
      {screens.length > 1 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {screens.map((screen, index) => (
            <button
              key={screen.id}
              onClick={() => setCurrentScreenIndex(index)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentScreenIndex === index
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {screen.name}
            </button>
          ))}
        </div>
      )}

      {/* 화면 정보 */}
      <div className="text-sm text-gray-600">
        <span className="font-semibold">{currentScreen.name}</span>
        <span className="mx-2">•</span>
        <span>{viewport.device}</span>
        <span className="mx-2">•</span>
        <span>{viewport.width} × {viewport.height}px</span>
      </div>

      {/* 캔버스 */}
      <div
        className="relative border-4 border-gray-800 rounded-2xl shadow-2xl bg-white overflow-hidden"
        style={{
          width: viewport.width * scale,
          height: viewport.height * scale,
        }}
      >
        {/* 요소들 렌더링 */}
        {currentScreen.elements.map((el) => {
          const style = typeStyle[el.type] || typeStyle.card;
          const icon = typeIcon[el.type] || "";

          return (
            <div
              key={el.id}
              className={`absolute ${style.bg} ${style.border} ${style.text} border-2 flex items-center justify-center transition-all hover:ring-2 hover:ring-blue-500 cursor-pointer`}
              style={{
                left: el.x * scale,
                top: el.y * scale,
                width: el.w * scale,
                height: el.h * scale,
                fontSize: Math.max(10, 12 * scale),
              }}
              title={`${el.type}${el.label ? `: ${el.label}` : ""}`}
            >
              <div className="px-2 text-center truncate flex items-center gap-1">
                {icon && <span className="text-xs opacity-60">{icon}</span>}
                <span className="font-medium uppercase text-[10px]">
                  {el.type}
                </span>
                {el.label && (
                  <>
                    <span className="opacity-50">·</span>
                    <span className="text-xs">{el.label}</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 디바이스 프레임 효과 (선택사항) */}
      <div className="text-xs text-gray-400">
        {screens.length > 1 && <span>화면 {currentScreenIndex + 1}/{screens.length} • </span>}
        요소 {currentScreen.elements.length}개 • {currentScreen.layout.type} 레이아웃
      </div>
    </div>
  );
}

