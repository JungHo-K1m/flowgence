"use client";

import { useMemo, useEffect, useRef } from "react";
import { MermaidDiagram } from "@/components/ui/MermaidDiagram";
import {
  generateUserJourneyMermaidDefault,
  UserJourneyStep,
} from "@/lib/mermaidGenerator";
import { mermaidToImage } from "@/lib/mermaidImageGenerator";

interface UserJourneyMermaidDiagramProps {
  steps: UserJourneyStep[];
  onImageGenerated?: (imageUrl: string) => void; // 이미지 생성 완료 콜백
  autoGenerateImage?: boolean; // 자동으로 이미지 생성할지 여부
}

/**
 * 사용자 여정을 Mermaid 다이어그램으로 표시하는 컴포넌트
 */
export function UserJourneyMermaidDiagram({
  steps,
  onImageGenerated,
  autoGenerateImage = false,
}: UserJourneyMermaidDiagramProps) {
  const mermaidCode = useMemo(() => {
    if (!steps || steps.length === 0) {
      return "";
    }
    return generateUserJourneyMermaidDefault(steps);
  }, [steps]);

  const imageGeneratedRef = useRef(false);
  const diagramIdRef = useRef<string | null>(null);

  // Mermaid 다이어그램이 렌더링된 후 이미지 생성
  useEffect(() => {
    if (
      !autoGenerateImage ||
      !mermaidCode ||
      !onImageGenerated ||
      imageGeneratedRef.current
    ) {
      return;
    }

    // 모바일 환경 체크 (이미지 생성 건너뛰기)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    // 다이어그램이 렌더링될 시간을 주기 위해 약간의 지연
    const timer = setTimeout(async () => {
      try {
        // 모바일에서는 이미지 생성 건너뛰기 (렌더링 문제 방지)
        if (isMobile) {
          console.log("UserJourneyMermaidDiagram - 모바일 환경, 이미지 생성 건너뜀");
          imageGeneratedRef.current = true;
          return;
        }

        const imageUrl = await mermaidToImage(mermaidCode, {
          theme: "default",
          backgroundColor: "white",
          scale: 2,
        });

        if (imageUrl && imageUrl.startsWith("data:image")) {
          imageGeneratedRef.current = true;
          onImageGenerated(imageUrl);
        } else {
          console.warn("UserJourneyMermaidDiagram - 이미지 생성 실패: 유효하지 않은 이미지");
          imageGeneratedRef.current = true; // 재시도 방지
        }
      } catch (error) {
        console.error("UserJourneyMermaidDiagram - 이미지 생성 오류:", error);
        imageGeneratedRef.current = true; // 에러 시에도 재시도 방지
      }
    }, 2000); // 2초 후 이미지 생성 (다이어그램 렌더링 완료 대기)

    return () => clearTimeout(timer);
  }, [mermaidCode, autoGenerateImage, onImageGenerated]);

  if (!mermaidCode) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        사용자 여정 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="w-full">
      <MermaidDiagram
        chart={mermaidCode}
        className="bg-gray-50 rounded-lg p-4 border border-gray-200"
        theme="default"
        id={diagramIdRef.current || undefined}
      />
    </div>
  );
}

