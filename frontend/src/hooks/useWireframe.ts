import { useState } from "react";
import { WireframeSpec } from "@/types/wireframe";

export function useWireframe() {
  const [wireframe, setWireframe] = useState<WireframeSpec | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateWireframe = async (projectId: string) => {
    setIsGenerating(true);
    setError(null);

    try {
      console.log("와이어프레임 생성 요청:", projectId);

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

      console.log("와이어프레임 생성 성공:", data.spec);
      setWireframe(data.spec);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류";
      console.error("와이어프레임 생성 오류:", errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  const clearWireframe = () => {
    setWireframe(null);
    setError(null);
  };

  return {
    wireframe,
    isGenerating,
    error,
    generateWireframe,
    clearWireframe,
  };
}

