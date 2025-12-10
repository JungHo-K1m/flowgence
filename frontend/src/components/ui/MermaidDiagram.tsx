"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

interface MermaidDiagramProps {
  chart: string;
  id?: string;
  className?: string;
  theme?: "default" | "dark" | "forest" | "neutral";
}

/**
 * Mermaid 다이어그램을 렌더링하는 컴포넌트
 */
export function MermaidDiagram({
  chart,
  id,
  className = "",
  theme = "default",
}: MermaidDiagramProps) {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [isRendered, setIsRendered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const diagramId = id || `mermaid-${Math.random().toString(36).substring(7)}`;

  useEffect(() => {
    if (!chart || !mermaidRef.current) {
      return;
    }

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

    // 기존 내용 제거
    mermaidRef.current.innerHTML = "";

    // 다이어그램 렌더링
    const renderDiagram = async () => {
      try {
        setError(null);
        setIsRendered(false);

        // Mermaid가 다이어그램을 렌더링하도록 요청
        const { svg } = await mermaid.render(diagramId, chart);
        
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = svg;
          setIsRendered(true);
        }
      } catch (err) {
        console.error("Mermaid 렌더링 오류:", err);
        setError(
          err instanceof Error
            ? err.message
            : "다이어그램을 렌더링할 수 없습니다."
        );
      }
    };

    renderDiagram();
  }, [chart, diagramId, theme]);

  if (!chart) {
    return (
      <div className={`text-gray-500 text-sm p-4 ${className}`}>
        다이어그램 데이터가 없습니다.
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <p className="text-red-800 text-sm font-medium">다이어그램 렌더링 오류</p>
        <p className="text-red-600 text-xs mt-1">{error}</p>
        <details className="mt-2">
          <summary className="text-red-600 text-xs cursor-pointer">원본 코드 보기</summary>
          <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto max-h-40">
            {chart}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div className={`mermaid-container ${className}`}>
      <div
        ref={mermaidRef}
        className="mermaid-diagram flex justify-center items-center min-h-[200px]"
        style={{
          overflow: "auto",
          minWidth: "100%",
          width: "100%",
        }}
      />
      {!isRendered && (
        <div className="text-center py-8 text-gray-500 text-sm">
          다이어그램 로딩 중...
        </div>
      )}
    </div>
  );
}

