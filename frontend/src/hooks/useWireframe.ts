import { useState } from "react";
import { WireframeSpec } from "@/types/wireframe";

export function useWireframe() {
  const [wireframe, setWireframe] = useState<WireframeSpec | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateWireframe = async (projectId: string) => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/wireframes/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectId }),
      });

      const data = await response.json();

      if (data.status === "error") {
        throw new Error(data.message || "와이어프레임 생성 실패");
      }

      setWireframe(data.spec);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류";
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  const applyEdit = async (projectId: string, prompt: string) => {
    setIsApplying(true);
    setError(null);

    try {
      const response = await fetch("/api/wireframes/apply-edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectId, prompt }),
      });

      const data = await response.json();

      if (data.status === "error") {
        throw new Error(data.message || "AI 편집 실패");
      }

      setWireframe(data.spec);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류";
      setError(errorMessage);
      throw err;
    } finally {
      setIsApplying(false);
    }
  };

  const clearWireframe = () => {
    setWireframe(null);
    setError(null);
  };

  return {
    wireframe,
    isGenerating,
    isApplying,
    error,
    generateWireframe,
    applyEdit,
    clearWireframe,
    setWireframe, // 프로젝트 복원 시 사용
  };
}

