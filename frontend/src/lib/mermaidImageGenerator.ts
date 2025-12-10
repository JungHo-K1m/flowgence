/**
 * Mermaid 다이어그램을 이미지로 변환하는 유틸리티
 */

import mermaid from "mermaid";
import { toPng } from "html-to-image";

/**
 * Mermaid 코드를 이미지(Base64 PNG)로 변환
 * @param mermaidCode Mermaid 다이어그램 코드
 * @param options 변환 옵션
 * @returns Base64 인코딩된 PNG 이미지 데이터 URL
 */
export async function mermaidToImage(
  mermaidCode: string,
  options: {
    theme?: "default" | "dark" | "forest" | "neutral";
    backgroundColor?: string;
    scale?: number;
  } = {}
): Promise<string> {
  const {
    theme = "default",
    backgroundColor = "white",
    scale = 2,
  } = options;

  if (!mermaidCode || !mermaidCode.trim()) {
    throw new Error("Mermaid 코드가 비어있습니다.");
  }

  // 함수 스코프에 선언 (에러 핸들러에서도 접근 가능하도록)
  const diagramId = `mermaid-diagram-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  let container: HTMLDivElement | null = null;

  try {
    console.log("Mermaid 이미지 변환 시작:", {
      codeLength: mermaidCode.length,
      theme,
      scale,
    });

    // Mermaid 초기화
    mermaid.initialize({
      startOnLoad: false,
      theme: theme,
      securityLevel: "loose",
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: "basis",
      },
      sequence: {
        diagramMarginX: 50,
        diagramMarginY: 10,
        actorMargin: 50,
        width: 150,
        height: 65,
        boxMargin: 10,
        boxTextMargin: 5,
        noteMargin: 10,
        messageMargin: 35,
        mirrorActors: true,
        bottomMarginAdj: 1,
        useMaxWidth: true,
        rightAngles: false,
        showSequenceNumbers: false,
      },
      journey: {
        useMaxWidth: true,
      },
    });

    // 임시 DOM 컨테이너 생성
    container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px"; // 화면 밖으로 이동 (모바일에서 안정적)
    container.style.top = "0";
    container.style.width = "1200px"; // 충분한 너비
    container.style.minWidth = "1200px"; // 최소 너비 보장
    container.style.maxWidth = "none"; // 최대 너비 제한 제거
    container.style.backgroundColor = backgroundColor;
    container.style.padding = "24px";
    container.style.boxSizing = "border-box";
    container.style.zIndex = "9999"; // 앞으로 (렌더링 보장)
    container.style.opacity = "1"; // 완전히 보이게 (html-to-image가 visibility:hidden을 캡처 못함)
    container.style.pointerEvents = "none"; // 클릭 방지
    container.style.overflow = "visible";
    container.id = diagramId;

    // DOM에 추가 (렌더링을 위해 필요)
    document.body.appendChild(container);

    // Mermaid를 SVG로 렌더링
    let svg: string;
    try {
      const renderResult = await mermaid.render(diagramId, mermaidCode);
      svg = renderResult.svg;
      
      if (!svg || !svg.trim()) {
        throw new Error("Mermaid SVG 렌더링 결과가 비어있습니다.");
      }
      
    } catch (renderError) {
      console.error("Mermaid SVG 렌더링 실패:", renderError);
      // DOM 정리
      if (container && container.parentNode) {
        document.body.removeChild(container);
      }
      throw new Error(`Mermaid SVG 렌더링 실패: ${renderError instanceof Error ? renderError.message : String(renderError)}`);
    }
    
    // container가 null이면 에러
    if (!container) {
      throw new Error("컨테이너 생성 실패");
    }

    // SVG를 컨테이너에 삽입
    container.innerHTML = svg;
    
    // SVG가 실제로 삽입되었는지 확인
    const insertedSvg = container.querySelector('svg');
    if (!insertedSvg) {
      console.warn("SVG가 컨테이너에 삽입되지 않았습니다. innerHTML 확인:", container.innerHTML.substring(0, 200));
    } else {
    }

    // DOM이 완전히 렌더링될 때까지 대기
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
    await new Promise((resolve) => setTimeout(resolve, 500));

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

    // 컨테이너 내부 요소 확인
    const childElements = container.querySelectorAll('*');

    // 컨테이너가 실제로 렌더링되었는지 확인
    const hasContent = container.scrollHeight > 0 && container.scrollWidth > 0;

    if (!hasContent) {
      console.warn("Mermaid 컨테이너에 콘텐츠가 없습니다. 강제로 크기 설정...");
      container.style.minHeight = "800px";
      container.style.minWidth = "1200px";
      // 다시 한 번 렌더링 대기
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // 실제 렌더링된 크기 사용
    const finalWidth = Math.max(container.scrollWidth, container.offsetWidth, 1200);
    const finalHeight = Math.max(container.scrollHeight, container.offsetHeight, 800);

    // html-to-image로 이미지 변환 (와이어프레임과 동일한 방식)
    const dataUrl = await toPng(container, {
      quality: 1.0,
      pixelRatio: Math.max(scale, 2), // 최소 2배 해상도
      backgroundColor: backgroundColor,
      cacheBust: true, // 캐시 무효화
      width: finalWidth,
      height: finalHeight,
    });


    // DOM에서 제거
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }

    if (!dataUrl || !dataUrl.startsWith("data:image/")) {
      console.error("❌ Mermaid 이미지 변환 결과가 올바르지 않습니다:", {
        hasDataUrl: !!dataUrl,
        dataUrlType: dataUrl?.substring(0, 20) || "없음",
        startsWithDataImage: dataUrl?.startsWith("data:image") || false,
      });
      throw new Error("이미지 변환 결과가 올바르지 않습니다.");
    }

    return dataUrl;
  } catch (error) {
    console.error("❌ Mermaid 이미지 변환 오류:", error);
    if (error instanceof Error) {
      console.error("에러 상세 정보:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    }
    
    // DOM 정리 (에러 발생 시에도)
    try {
      if (container && container.parentNode) {
        document.body.removeChild(container);
      }
    } catch (cleanupError) {
      console.warn("DOM 정리 중 오류:", cleanupError);
    }
    
    throw new Error(
      `Mermaid 다이어그램을 이미지로 변환하는데 실패했습니다: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * SVG를 이미지(Base64 PNG)로 변환
 * @param svg SVG 문자열
 * @param options 변환 옵션
 * @returns Base64 인코딩된 PNG 이미지 데이터 URL
 */
async function svgToImage(
  svg: string,
  options: {
    backgroundColor?: string;
    scale?: number;
  } = {}
): Promise<string> {
  const { backgroundColor = "white", scale = 2 } = options;

  return new Promise((resolve, reject) => {
    try {
      // SVG를 Blob으로 변환
      const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      // Image 객체 생성
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        try {
          // Canvas 생성
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            throw new Error("Canvas context를 가져올 수 없습니다.");
          }

          // Canvas 크기 설정 (스케일 적용)
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;

          // 배경색 채우기
          if (backgroundColor && backgroundColor !== "transparent") {
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          // 이미지 그리기 (고해상도)
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Canvas를 Base64 이미지로 변환
          const dataUrl = canvas.toDataURL("image/png", 1.0);

          // 메모리 정리
          URL.revokeObjectURL(url);

          resolve(dataUrl);
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      };

      img.onerror = (error) => {
        URL.revokeObjectURL(url);
        reject(new Error("SVG 이미지 로드 실패"));
      };

      img.src = url;
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 여러 Mermaid 다이어그램을 이미지로 변환
 * @param mermaidCodes Mermaid 코드 배열
 * @param options 변환 옵션
 * @returns Base64 인코딩된 PNG 이미지 데이터 URL 배열
 */
export async function mermaidToImages(
  mermaidCodes: string[],
  options: {
    theme?: "default" | "dark" | "forest" | "neutral";
    backgroundColor?: string;
    scale?: number;
  } = {}
): Promise<string[]> {
  const results = await Promise.all(
    mermaidCodes.map((code) => mermaidToImage(code, options))
  );
  return results;
}

