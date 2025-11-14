"use client";

import { useMemo } from "react";
import { MermaidDiagram } from "@/components/ui/MermaidDiagram";
import {
  generateUserJourneyMermaidDefault,
  UserJourneyStep,
} from "@/lib/mermaidGenerator";

interface UserJourneyMermaidDiagramProps {
  steps: UserJourneyStep[];
}

/**
 * 사용자 여정을 Mermaid 다이어그램으로 표시하는 컴포넌트
 */
export function UserJourneyMermaidDiagram({
  steps,
}: UserJourneyMermaidDiagramProps) {
  const mermaidCode = useMemo(() => {
    if (!steps || steps.length === 0) {
      return "";
    }
    return generateUserJourneyMermaidDefault(steps);
  }, [steps]);

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
      />
    </div>
  );
}

