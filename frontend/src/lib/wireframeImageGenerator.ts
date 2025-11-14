// 와이어프레임을 고해상도 이미지로 변환하는 유틸리티

import { WireframeSpec, Device, ViewportSpec } from "@/types/wireframe";
import { toPng } from "html-to-image";

// 타입별 스타일 매핑 (LoFiCanvas와 동일)
const typeStyle: Record<string, { bg: string; border: string; text: string }> = {
  navbar: { bg: "#e0e7ff", border: "#a5b4fc", text: "#3730a3" },
  footer: { bg: "#f3f4f6", border: "#d1d5db", text: "#374151" },
  button: { bg: "#dbeafe", border: "#93c5fd", text: "#1e40af" },
  input: { bg: "#ffffff", border: "#9ca3af", text: "#4b5563" },
  list: { bg: "#f9fafb", border: "#d1d5db", text: "#4b5563" },
  card: { bg: "#ffffff", border: "#d1d5db", text: "#374151" },
  text: { bg: "transparent", border: "transparent", text: "#1f2937" },
  image: { bg: "#e5e7eb", border: "#9ca3af", text: "#6b7280" },
  chip: { bg: "#fce7f3", border: "#f9a8d4", text: "#9f1239" },
  checkbox: { bg: "#ffffff", border: "#9ca3af", text: "#4b5563" },
  radio: { bg: "#ffffff", border: "#9ca3af", text: "#4b5563" },
  select: { bg: "#ffffff", border: "#9ca3af", text: "#4b5563" },
  table: { bg: "#ffffff", border: "#9ca3af", text: "#374151" },
  divider: { bg: "#d1d5db", border: "transparent", text: "transparent" },
  icon: { bg: "#f3f4f6", border: "#d1d5db", text: "#4b5563" },
};

// 타입별 아이콘
const typeIcon: Record<string, string> = {
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

/**
 * 와이어프레임 스펙을 HTML 요소로 렌더링
 */
function renderWireframeToHTML(wireframe: WireframeSpec, scale: number = 2): string {
  const screens = wireframe.screens ?? [];
  const defaultViewport = wireframe.viewport ?? DEFAULT_VIEWPORT;

  if (screens.length === 0) {
    return "";
  }

  // 디바이스별로 그룹화
  const deviceMap = new Map<Device, Array<{ screen: typeof screens[0]; index: number }>>();
  
  screens.forEach((screen, index) => {
    const viewport = resolveViewport(screen.viewport, defaultViewport);
    const device = viewport.device;
    if (!deviceMap.has(device)) {
      deviceMap.set(device, []);
    }
    deviceMap.get(device)?.push({ screen, index });
  });

  const deviceSections = Array.from(deviceMap.entries())
    .map(([device, screens]) => {
      const deviceLabel = device === "mobile" ? "📲 모바일" : 
                         device === "tablet" ? "📱 태블릿" : "💻 웹";
      
      const screenItems = screens
        .map(({ screen, index }) => {
          const viewport = resolveViewport(screen.viewport, defaultViewport);
          const viewportWidth = viewport.width * scale;
          const viewportHeight = viewport.height * scale;

          const elementsHtml = (screen.elements || [])
            .map((element) => {
              const style = typeStyle[element.type] || typeStyle.card;
              const icon = typeIcon[element.type] || "";
              
              const left = element.x * scale;
              const top = element.y * scale;
              const width = Math.max(element.w * scale, 12);
              const height = Math.max(element.h * scale, 12);
              const fontSize = Math.max(10, 12 * scale);
              
              const label = element.label ? ` • ${element.label}` : "";
              
              return `
                <div 
                  style="
                    position: absolute;
                    left: ${left}px;
                    top: ${top}px;
                    width: ${width}px;
                    height: ${height}px;
                    background-color: ${style.bg};
                    border: 2px solid ${style.border};
                    color: ${style.text};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: ${fontSize}px;
                    font-weight: 600;
                    text-transform: uppercase;
                    border-radius: 12px;
                    box-shadow: 0 2px 8px rgba(15,23,42,0.12);
                    padding: 4px;
                    box-sizing: border-box;
                  "
                >
                  <div style="display: flex; align-items: center; gap: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${icon ? `<span style="opacity: 0.6; font-size: ${fontSize}px;">${icon}</span>` : ""}
                    <span>${element.type}${label}</span>
                  </div>
                </div>
              `;
            })
            .join("");

          return `
            <div style="
              border: 1px solid #e5e7eb;
              border-radius: 16px;
              padding: 16px;
              margin-bottom: 24px;
              background: linear-gradient(135deg, rgba(238,242,255,0.6), rgba(236,253,245,0.6));
              box-shadow: 0 8px 24px rgba(15,23,42,0.08);
            ">
              <div style="
                display: flex;
                justify-content: space-between;
                align-items: baseline;
                margin-bottom: 12px;
              ">
                <div style="
                  font-size: 16px;
                  font-weight: 700;
                  color: #1f2937;
                  letter-spacing: 0.3px;
                ">
                  ${String(index + 1).padStart(2, "0")}. ${screen.name}
                </div>
                <div style="
                  font-size: 12px;
                  color: #6b7280;
                  font-weight: 500;
                ">
                  ${deviceLabel} • ${viewport.width} × ${viewport.height}px
                </div>
              </div>
              <div style="
                display: flex;
                justify-content: center;
                padding: 16px;
                background: white;
                border-radius: 12px;
                border: 1px dashed rgba(99,102,241,0.3);
              ">
                <div style="
                  position: relative;
                  width: ${viewportWidth}px;
                  height: ${viewportHeight}px;
                  border: 6px solid #0f172a;
                  border-radius: 24px;
                  background: #fff;
                  box-shadow: 0 12px 35px rgba(15,23,42,0.15);
                  overflow: hidden;
                ">
                  ${elementsHtml}
                </div>
              </div>
            </div>
          `;
        })
        .join("");

      return `
        <div style="margin-bottom: 32px;">
          <h3 style="
            font-size: 18px;
            font-weight: 700;
            color: #1f2937;
            margin: 0 0 16px 0;
          ">
            ${deviceLabel} (${screens.length}개 화면)
          </h3>
          ${screenItems}
        </div>
      `;
    })
    .join("");

  return `
    <div style="
      display: flex;
      flex-direction: column;
      gap: 24px;
      margin: 24px 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    ">
      ${deviceSections}
    </div>
  `;
}

/**
 * 와이어프레임을 고해상도 PNG 이미지로 변환
 * @param wireframe - 와이어프레임 스펙
 * @param scale - 확대 비율 (기본 2배, 고해상도용)
 * @returns Base64 인코딩된 PNG 이미지
 */
export async function wireframeToImage(
  wireframe: WireframeSpec,
  scale: number = 2,
): Promise<string> {
  try {
    console.log("와이어프레임 이미지 변환 시작:", {
      screenCount: wireframe.screens?.length || 0,
      scale,
    });

    // 와이어프레임을 HTML로 렌더링
    const wireframeHTML = renderWireframeToHTML(wireframe, scale);
    console.log("와이어프레임 HTML 생성 완료:", {
      htmlLength: wireframeHTML.length,
      htmlPreview: wireframeHTML.substring(0, 200),
    });

    // 임시 DOM 요소 생성
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "-9999px";
    container.style.width = "1200px"; // 충분한 너비 (고해상도용)
    container.style.maxWidth = "1200px";
    container.style.backgroundColor = "white";
    container.style.padding = "24px";
    container.style.boxSizing = "border-box";
    container.innerHTML = wireframeHTML;

    // DOM에 추가 (렌더링을 위해 필요)
    document.body.appendChild(container);
    console.log("DOM 컨테이너 추가 완료");

    // DOM이 완전히 렌더링될 때까지 대기
    // requestAnimationFrame을 여러 번 호출하여 렌더링 완료 보장
    await new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve(undefined);
          });
        });
      });
    });

    // 추가 대기 시간 (폰트 및 스타일 적용)
    await new Promise((resolve) => setTimeout(resolve, 300));

    // 컨테이너 크기 확인 및 최소 크기 보장
    const computedStyle = window.getComputedStyle(container);
    let containerWidth = container.scrollWidth || container.offsetWidth || 1200;
    let containerHeight = container.scrollHeight || container.offsetHeight || 800;

    // 최소 크기 보장
    if (containerWidth < 100) {
      containerWidth = 1200;
      container.style.width = `${containerWidth}px`;
    }
    if (containerHeight < 100) {
      containerHeight = 800;
      container.style.height = `${containerHeight}px`;
    }

    console.log("컨테이너 크기:", {
      width: containerWidth,
      height: containerHeight,
      scrollWidth: container.scrollWidth,
      scrollHeight: container.scrollHeight,
      offsetWidth: container.offsetWidth,
      offsetHeight: container.offsetHeight,
      computedWidth: computedStyle.width,
      computedHeight: computedStyle.height,
    });

    // 컨테이너 내부 요소 확인
    const childElements = container.querySelectorAll('*');
    console.log("컨테이너 내부 요소 개수:", childElements.length);

    // 이미지로 변환 (고해상도)
    console.log("이미지 변환 시작...");
    
    // 컨테이너가 실제로 렌더링되었는지 확인
    const hasContent = container.scrollHeight > 0 && container.scrollWidth > 0;
    if (!hasContent) {
      console.warn("컨테이너에 콘텐츠가 없습니다. 강제로 크기 설정...");
      container.style.minHeight = "800px";
      container.style.minWidth = "1200px";
      // 다시 한 번 렌더링 대기
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    const dataUrl = await toPng(container, {
      quality: 1.0,
      pixelRatio: Math.max(scale, 2), // 최소 2배 해상도 (고해상도)
      backgroundColor: "white",
      cacheBust: true, // 캐시 무효화
      useCORS: true, // CORS 사용
      // width와 height를 지정하지 않으면 컨테이너의 자연스러운 크기 사용
    });

    console.log("이미지 변환 완료:", {
      dataUrlLength: dataUrl.length,
      dataUrlPreview: dataUrl.substring(0, 100),
      isValid: dataUrl.startsWith("data:image/png"),
    });

    // DOM에서 제거
    if (container.parentNode) {
      document.body.removeChild(container);
    }

    if (!dataUrl || !dataUrl.startsWith("data:image/")) {
      throw new Error("이미지 변환 결과가 올바르지 않습니다.");
    }

    return dataUrl;
  } catch (error) {
    console.error("와이어프레임 이미지 변환 실패:", error);
    throw new Error(`와이어프레임을 이미지로 변환하는데 실패했습니다: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 와이어프레임을 여러 개의 이미지로 변환 (화면별로)
 * @param wireframe - 와이어프레임 스펙
 * @param scale - 확대 비율 (기본 2배)
 * @returns Base64 인코딩된 PNG 이미지 배열
 */
export async function wireframeToImages(
  wireframe: WireframeSpec,
  scale: number = 2,
): Promise<string[]> {
  const screens = wireframe.screens ?? [];
  const defaultViewport = wireframe.viewport ?? DEFAULT_VIEWPORT;

  if (screens.length === 0) {
    return [];
  }

  const images: string[] = [];

  for (const screen of screens) {
    try {
      const viewport = resolveViewport(screen.viewport, defaultViewport);
      const viewportWidth = viewport.width * scale;
      const viewportHeight = viewport.height * scale;

      // 개별 화면 HTML 생성
      const screenHTML = `
        <div style="
          position: relative;
          width: ${viewportWidth}px;
          height: ${viewportHeight}px;
          border: 6px solid #0f172a;
          border-radius: 24px;
          background: #fff;
          box-shadow: 0 12px 35px rgba(15,23,42,0.15);
          overflow: hidden;
        ">
          ${(screen.elements || [])
            .map((element) => {
              const style = typeStyle[element.type] || typeStyle.card;
              const icon = typeIcon[element.type] || "";
              
              const left = element.x * scale;
              const top = element.y * scale;
              const width = Math.max(element.w * scale, 12);
              const height = Math.max(element.h * scale, 12);
              const fontSize = Math.max(10, 12 * scale);
              
              const label = element.label ? ` • ${element.label}` : "";
              
              return `
                <div 
                  style="
                    position: absolute;
                    left: ${left}px;
                    top: ${top}px;
                    width: ${width}px;
                    height: ${height}px;
                    background-color: ${style.bg};
                    border: 2px solid ${style.border};
                    color: ${style.text};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: ${fontSize}px;
                    font-weight: 600;
                    text-transform: uppercase;
                    border-radius: 12px;
                    box-shadow: 0 2px 8px rgba(15,23,42,0.12);
                    padding: 4px;
                    box-sizing: border-box;
                  "
                >
                  <div style="display: flex; align-items: center; gap: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${icon ? `<span style="opacity: 0.6; font-size: ${fontSize}px;">${icon}</span>` : ""}
                    <span>${element.type}${label}</span>
                  </div>
                </div>
              `;
            })
            .join("")}
        </div>
      `;

      // 임시 DOM 요소 생성
      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.top = "-9999px";
      container.style.width = `${viewportWidth + 32}px`;
      container.style.height = `${viewportHeight + 32}px`;
      container.style.backgroundColor = "white";
      container.style.padding = "16px";
      container.innerHTML = screenHTML;

      // DOM에 추가
      document.body.appendChild(container);

      // 이미지로 변환
      const dataUrl = await toPng(container, {
        quality: 1.0,
        pixelRatio: scale,
        backgroundColor: "white",
        width: container.scrollWidth,
        height: container.scrollHeight,
      });

      // DOM에서 제거
      document.body.removeChild(container);

      images.push(dataUrl);
    } catch (error) {
      console.error(`화면 ${screen.name} 이미지 변환 실패:`, error);
      // 실패해도 계속 진행
    }
  }

  return images;
}

