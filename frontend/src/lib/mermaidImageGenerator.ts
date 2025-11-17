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

    // 고유 ID 생성
    const diagramId = `mermaid-diagram-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // 임시 DOM 컨테이너 생성
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "0";
    container.style.top = "0";
    container.style.width = "1200px"; // 충분한 너비
    container.style.maxWidth = "1200px";
    container.style.backgroundColor = backgroundColor;
    container.style.padding = "24px";
    container.style.boxSizing = "border-box";
    container.style.zIndex = "-9999"; // 뒤로 보내기
    container.style.opacity = "0"; // 투명하게
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
      
      console.log("Mermaid SVG 렌더링 완료:", {
        svgLength: svg.length,
        svgPreview: svg.substring(0, 200),
        hasSvgTag: svg.includes('<svg'),
      });
    } catch (renderError) {
      console.error("Mermaid SVG 렌더링 실패:", renderError);
      // DOM 정리
      if (container.parentNode) {
        document.body.removeChild(container);
      }
      throw new Error(`Mermaid SVG 렌더링 실패: ${renderError instanceof Error ? renderError.message : String(renderError)}`);
    }
    
    // SVG를 컨테이너에 삽입
    container.innerHTML = svg;
    
    // SVG가 실제로 삽입되었는지 확인
    const insertedSvg = container.querySelector('svg');
    if (!insertedSvg) {
      console.warn("SVG가 컨테이너에 삽입되지 않았습니다. innerHTML 확인:", container.innerHTML.substring(0, 200));
    } else {
      console.log("SVG 삽입 확인:", {
        svgWidth: insertedSvg.getAttribute('width'),
        svgHeight: insertedSvg.getAttribute('height'),
        viewBox: insertedSvg.getAttribute('viewBox'),
      });
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

    console.log("Mermaid 컨테이너 크기:", {
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
    console.log("Mermaid 컨테이너 내부 요소 개수:", childElements.length);

    // 컨테이너가 실제로 렌더링되었는지 확인
    const hasContent = container.scrollHeight > 0 && container.scrollWidth > 0;
    console.log("Mermaid 컨테이너 콘텐츠 확인:", {
      hasContent,
      scrollHeight: container.scrollHeight,
      scrollWidth: container.scrollWidth,
      offsetHeight: container.offsetHeight,
      offsetWidth: container.offsetWidth,
      innerHTML: container.innerHTML.substring(0, 200),
    });

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

    console.log("Mermaid 최종 이미지 크기:", {
      width: finalWidth,
      height: finalHeight,
    });

    // html-to-image로 이미지 변환 (와이어프레임과 동일한 방식)
    console.log("Mermaid 이미지 변환 시작...");
    const dataUrl = await toPng(container, {
      quality: 1.0,
      pixelRatio: Math.max(scale, 2), // 최소 2배 해상도
      backgroundColor: backgroundColor,
      cacheBust: true, // 캐시 무효화
      width: finalWidth,
      height: finalHeight,
    });

    console.log("Mermaid 이미지 변환 완료:", {
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
    console.error("Mermaid 이미지 변환 오류:", error);
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

