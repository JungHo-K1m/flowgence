"use client";

import { useState, useEffect } from "react";

interface AIVerificationLoadingSimpleProps {
  message?: string;
}

export function AIVerificationLoadingSimple({
  message = "AI가 요구사항을 검증하고 있습니다...",
}: AIVerificationLoadingSimpleProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const messages = [
    "요구사항 일관성을 확인하고 있습니다",
    "누락된 항목을 검토하고 있습니다",
    "우선순위를 분석하고 있습니다",
  ];

  const [currentMessage, setCurrentMessage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-white bg-opacity-95 z-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4 text-center">
        {/* 스피너 */}
        <div className="flex justify-center mb-6">
          <div
            className="animate-spin rounded-full h-20 w-20 border-4 border-t-transparent"
            style={{ borderColor: "#6366F1", borderTopColor: "transparent" }}
          />
        </div>

        {/* 메인 메시지 */}
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          🤖 AI 검증 중{dots}
        </h2>

        {/* 서브 메시지 (애니메이션) */}
        <p className="text-gray-600 mb-8 min-h-[24px] transition-opacity duration-300">
          {messages[currentMessage]}
        </p>

        {/* 인포 카드 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 inline-block">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">💡 Tip:</span> AI가 요구사항의
            일관성과 완성도를 확인하고 있습니다
          </p>
        </div>
      </div>
    </div>
  );
}

