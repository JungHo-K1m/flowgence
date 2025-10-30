"use client";

import { useState, useEffect } from "react";

interface RequirementsLoadingProps {
  stage?: "extracting" | "updating" | "saving" | "processing";
}

export function RequirementsLoading({
  stage = "processing",
}: RequirementsLoadingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const getStageSteps = () => {
    switch (stage) {
      case "extracting":
        return [
          "프로젝트 내용을 분석하고 있습니다...",
          "핵심 기능을 파악하고 있습니다...",
          "타겟 사용자를 정의하고 있습니다...",
          "요구사항을 분류하고 있습니다...",
          "최종 검토 중입니다...",
        ];
      case "updating":
        return [
          "새로운 채팅 내용을 분석하고 있습니다...",
          "기존 요구사항과 비교 중입니다...",
          "업데이트할 항목을 찾고 있습니다...",
          "요구사항을 수정하고 있습니다...",
          "최종 확인 중입니다...",
        ];
      case "saving":
        return [
          "데이터를 준비하고 있습니다...",
          "프로젝트 정보를 저장하고 있습니다...",
          "요구사항을 데이터베이스에 기록하고 있습니다...",
          "검증 중입니다...",
          "저장 완료!",
        ];
      default:
        return [
          "프로젝트를 분석하고 있습니다...",
          "요구사항을 도출하고 있습니다...",
          "카테고리별로 정리하고 있습니다...",
          "최종 확인 중입니다...",
        ];
    }
  };

  const steps = getStageSteps();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev; // 마지막 단계에서 멈춤
      });
    }, 1500); // 1.5초마다 다음 단계로 이동

    return () => clearInterval(interval);
  }, [steps.length]);

  const getStageInfo = () => {
    switch (stage) {
      case "extracting":
        return {
          title: "요구사항을 추출하고 있습니다",
          icon: "🧠",
          color: "purple",
        };
      case "updating":
        return {
          title: "요구사항을 업데이트하고 있습니다",
          icon: "🔄",
          color: "green",
        };
      case "saving":
        return {
          title: "데이터를 저장하고 있습니다",
          icon: "💾",
          color: "blue",
        };
      default:
        return {
          title: "요구사항을 처리하고 있습니다",
          icon: "📋",
          color: "purple",
        };
    }
  };

  const stageInfo = getStageInfo();
  const colorClasses = {
    purple: {
      border: "border-purple-200 border-t-purple-600",
      bg: "bg-purple-600",
      text: "text-purple-700",
      bgLight: "bg-purple-100",
    },
    green: {
      border: "border-green-200 border-t-green-600",
      bg: "bg-green-600",
      text: "text-green-700",
      bgLight: "bg-green-100",
    },
    blue: {
      border: "border-blue-200 border-t-blue-600",
      bg: "bg-blue-600",
      text: "text-blue-700",
      bgLight: "bg-blue-100",
    },
  };

  const colors = colorClasses[stageInfo.color as keyof typeof colorClasses];

  return (
    <div className="h-full bg-white flex flex-col max-h-screen">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 flex-shrink-0">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          요구사항 카드
        </h2>

        {/* Search and Filter - Disabled during loading */}
        <div className="flex space-x-4 opacity-50">
          <select
            disabled
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100"
          >
            <option>전체 (0)</option>
          </select>

          <input
            type="text"
            placeholder="검색..."
            disabled
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100"
          />
        </div>
      </div>

      {/* Loading Content */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        <div className="flex flex-col items-center justify-center h-full">
          <div className="relative mb-8">
            {/* Spinning Circle */}
            <div
              className={`w-16 h-16 border-4 ${colors.border} rounded-full animate-spin`}
            ></div>

            {/* Center Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">{stageInfo.icon}</span>
            </div>
          </div>

          <div className="w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-6 text-center">
              {stageInfo.title}
            </h3>

            {/* Step Progress */}
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg transition-all duration-500 ${
                    index <= currentStep
                      ? `${colors.bgLight} ${colors.text} font-medium`
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {/* Checkmark or Circle */}
                    <div className="flex-shrink-0">
                      {index < currentStep ? (
                        <span className="text-lg">✓</span>
                      ) : index === currentStep ? (
                        <div
                          className={`w-5 h-5 border-2 ${colors.border} rounded-full animate-spin`}
                        ></div>
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                      )}
                    </div>

                    {/* Step Text */}
                    <p className="text-sm flex-1">{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Disabled during loading */}
      <div className="border-t border-gray-200 p-4 flex justify-between flex-shrink-0">
        <button
          disabled
          className="px-6 py-3 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
        >
          이전 단계
        </button>

        <div className="flex items-center space-x-4">
          <button
            disabled
            className="px-4 py-2 text-gray-400 border border-gray-300 rounded-lg cursor-not-allowed"
          >
            + 새 요구사항
          </button>

          <button
            disabled
            className="px-6 py-3 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
          >
            처리 중...
          </button>
        </div>
      </div>
    </div>
  );
}
