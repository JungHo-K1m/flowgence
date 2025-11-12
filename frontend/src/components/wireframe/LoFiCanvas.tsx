"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Device,
  ViewportSpec,
  WireElementType,
  WireframeSpec,
} from "@/types/wireframe";

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

const DEFAULT_VIEWPORT: ViewportSpec = {
  width: 390,
  height: 844,
  device: "mobile",
};

const DEVICE_LABEL: Record<Device, string> = {
  mobile: "📲 모바일",
  tablet: "📱 태블릿",
  desktop: "💻 웹",
};

function resolveViewport(
  screenViewport?: ViewportSpec,
  fallbackViewport?: ViewportSpec,
): ViewportSpec {
  if (screenViewport) {
    return screenViewport;
  }
  if (fallbackViewport) {
    return fallbackViewport;
  }
  return DEFAULT_VIEWPORT;
}

export function LoFiCanvas({ spec, scale = 1 }: Props) {
  const screens = spec.screens ?? [];

  const devices = useMemo(() => {
    if (!screens.length) {
      return [spec.viewport?.device ?? DEFAULT_VIEWPORT.device];
    }
    const set = new Set<Device>();
    screens.forEach((screen) => {
      const device =
        screen.viewport?.device ||
        screen.device ||
        spec.viewport?.device ||
        DEFAULT_VIEWPORT.device;
      set.add(device);
    });
    return Array.from(set);
  }, [screens, spec.viewport?.device]);

  const [currentDevice, setCurrentDevice] = useState<Device>(
    devices[0] ?? DEFAULT_VIEWPORT.device,
  );
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);

  useEffect(() => {
    if (!devices.includes(currentDevice) && devices.length > 0) {
      setCurrentDevice(devices[0]);
    }
  }, [devices, currentDevice]);

  const screensForDevice = useMemo(() => {
    if (!screens.length) {
      return [];
    }
    return screens.filter((screen) => {
      const device =
        screen.viewport?.device ||
        screen.device ||
        spec.viewport?.device ||
        DEFAULT_VIEWPORT.device;
      return device === currentDevice;
    });
  }, [screens, currentDevice, spec.viewport?.device]);

  useEffect(() => {
    setCurrentScreenIndex(0);
  }, [currentDevice]);

  const renderedScreens =
    screensForDevice.length > 0
      ? screensForDevice
      : screens.length > 0
      ? screens
      : [
          {
            id: "placeholder",
            name: "화면",
            layout: { type: "free" as const },
            elements: [],
          },
        ];

  const currentScreen =
    renderedScreens[currentScreenIndex] ?? renderedScreens[0];
  const currentViewport = resolveViewport(
    currentScreen?.viewport,
    spec.viewport,
  );

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 디바이스 탭 */}
      {devices.length > 1 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {devices.map((device) => (
            <button
              key={device}
              onClick={() => setCurrentDevice(device)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                currentDevice === device
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {DEVICE_LABEL[device]}
            </button>
          ))}
        </div>
      )}

      {/* 화면 선택 탭 */}
      {renderedScreens.length > 1 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {renderedScreens.map((screen, index) => (
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
        <span className="font-semibold">
          {currentScreen?.name ?? "화면"}
        </span>
        <span className="mx-2">•</span>
        <span>{DEVICE_LABEL[currentViewport.device]}</span>
        <span className="mx-2">•</span>
        <span>
          {currentViewport.width} × {currentViewport.height}px
        </span>
      </div>

      {/* 캔버스 */}
      <div
        className="relative border-4 border-gray-800 rounded-2xl shadow-2xl bg-white overflow-hidden"
        style={{
          width: currentViewport.width * scale,
          height: currentViewport.height * scale,
        }}
      >
        {(currentScreen?.elements ?? []).map((el) => {
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

      {/* 화면/레이아웃 정보 */}
      <div className="text-xs text-gray-400">
        {renderedScreens.length > 1 && (
          <span>
            화면 {currentScreenIndex + 1}/{renderedScreens.length} •{" "}
          </span>
        )}
        요소 {currentScreen?.elements?.length ?? 0}개 •{" "}
        {currentScreen?.layout?.type ?? "free"} 레이아웃
      </div>
    </div>
  );
}

