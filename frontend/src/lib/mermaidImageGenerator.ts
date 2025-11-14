/**
 * Mermaid 다이어그램을 이미지로 변환하는 유틸리티
 */

import mermaid from "mermaid";

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

    // Mermaid를 SVG로 렌더링
    const { svg } = await mermaid.render(diagramId, mermaidCode);

    // SVG를 이미지로 변환
    const imageDataUrl = await svgToImage(svg, {
      backgroundColor,
      scale,
    });

    return imageDataUrl;
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

