"use client";

import { useState, useEffect } from "react";

interface VerificationStep {
  id: string;
  label: string;
  duration: number; // ms
}

export function AIVerificationLoading() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps: VerificationStep[] = [
    { id: "consistency", label: "요구사항 일관성 검토", duration: 3000 },
    { id: "missing", label: "누락된 항목 확인", duration: 3000 },
    { id: "priority", label: "우선순위 검증", duration: 2500 },
    { id: "final", label: "최종 검토", duration: 2000 },
  ];

  useEffect(() => {
    if (currentStepIndex >= steps.length) return;

    const timer = setTimeout(() => {
      setCurrentStepIndex((prev) => Math.min(prev + 1, steps.length));
    }, steps[currentStepIndex].duration);

    return () => clearTimeout(timer);
  }, [currentStepIndex, steps]);

  const getStepIcon = (index: number) => {
    if (index < currentStepIndex) return "✓";
    if (index === currentStepIndex) return "⟳";
    return "○";
  };

  const getStepColor = (index: number) => {
    if (index < currentStepIndex) return "text-green-600";
    if (index === currentStepIndex) return "text-blue-600 animate-pulse";
    return "text-gray-400";
  };

  const getStepText = (step: VerificationStep, index: number) => {
    if (index < currentStepIndex) return `${step.label} 완료`;
    if (index === currentStepIndex) return `${step.label} 중...`;
    return `${step.label} 예정`;
  };

  return (
    <div className="fixed inset-0 bg-white bg-opacity-95 z-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        {/* 스피너 */}
        <div className="flex justify-center mb-6">
          <div
            className="animate-spin rounded-full h-16 w-16 border-4 border-t-transparent"
            style={{ borderColor: "#6366F1", borderTopColor: "transparent" }}
          />
        </div>

        {/* 메인 타이틀 */}
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
          AI가 요구사항을 검증하고 있습니다
        </h2>
        <p className="text-center text-gray-500 mb-8">
          편집하신 내용을 확인하고 최적화하고 있습니다
        </p>

        {/* 검증 단계 */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-3">
                <span
                  className={`text-2xl ${getStepColor(index)} transition-colors duration-300`}
                >
                  {getStepIcon(index)}
                </span>
                <span
                  className={`text-base ${
                    index === currentStepIndex
                      ? "font-semibold text-gray-900"
                      : index < currentStepIndex
                      ? "text-gray-600"
                      : "text-gray-400"
                  } transition-all duration-300`}
                >
                  {getStepText(step, index)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 예상 시간 */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            <span className="inline-block animate-pulse mr-2">⏱️</span>
            예상 소요 시간: 10-15초
          </p>
        </div>

        {/* 프로그레스 바 */}
        <div className="mt-6">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${Math.min(
                  ((currentStepIndex + 1) / steps.length) * 100,
                  100
                )}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

