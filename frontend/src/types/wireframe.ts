/**
 * 와이어프레임 타입 정의
 * 로파이(저해상도) 와이어프레임을 위한 JSON 스키마
 */

export type Device = "mobile" | "tablet" | "desktop";

export interface ViewportSpec {
  width: number;
  height: number;
  device: Device;
}

export type WireElementType =
  | "text"
  | "button"
  | "input"
  | "image"
  | "card"
  | "list"
  | "navbar"
  | "footer"
  | "chip"
  | "checkbox"
  | "radio"
  | "select"
  | "table"
  | "divider"
  | "icon";

export interface WireElement {
  id: string;
  type: WireElementType;
  label?: string; // 표시할 텍스트
  x: number; // 좌표 (px)
  y: number;
  w: number; // 크기 (px)
  h: number;
  props?: Record<string, any>; // 추가 속성 (placeholder, count, icon 등)
}

export interface WireframeScreen {
  id: string;
  name: string;
  device?: Device;
  viewport?: ViewportSpec;
  layout: {
    type: "free" | "grid";
    columns?: number;
    gap?: number;
  };
  elements: WireElement[];
}

export interface WireframeSpec {
  viewport?: ViewportSpec;
  screens: WireframeScreen[]; // 여러 화면 지원 (이전: screen 단수)
}

// DB 저장용 타입
export interface WireframeRecord {
  id: string;
  project_id: string;
  version: number;
  spec: WireframeSpec;
  created_at: string;
}

