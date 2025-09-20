"use client";

import { useState } from "react";

interface ProjectOverviewPanelProps {
  projectDescription: string;
  serviceType: string;
  uploadedFiles: File[];
  onNextStep?: () => void;
  currentStep?: number;
}

export function ProjectOverviewPanel({
  projectDescription,
  serviceType,
  uploadedFiles,
  onNextStep,
  currentStep = 1,
}: ProjectOverviewPanelProps) {
  const [activeTab, setActiveTab] = useState<"elements" | "journey">(
    "elements"
  );

  const serviceTypeMap: Record<string, string> = {
    "food-delivery": "음식 배달 앱",
    "real-estate": "부동산 플랫폼",
    "work-management": "업무 관리 도구",
    "online-education": "온라인 교육",
    "shopping-mall": "쇼핑몰",
  };

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Tab Header */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab("elements")}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeTab === "elements"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            서비스 핵심요소
          </button>
          <button
            onClick={() => setActiveTab("journey")}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeTab === "journey"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            사용자 여정
          </button>
        </div>
      </div>

      {/* Tab Content - Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "elements" ? (
          <div className="space-y-4">
            {/* Target Customer */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-2xl">👥</span>
                <h3 className="font-semibold text-gray-900">타겟 고객</h3>
              </div>
              <p className="text-sm text-gray-600">
                {serviceType
                  ? serviceTypeMap[serviceType] || serviceType
                  : "분석 중..."}
              </p>
            </div>

            {/* Core Problem */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-2xl">❓</span>
                <h3 className="font-semibold text-gray-900">핵심 문제</h3>
              </div>
              <p className="text-sm text-gray-600">
                {projectDescription || "사용자 입력 대기 중..."}
              </p>
            </div>

            {/* Core Feature */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-2xl">🎯</span>
                <h3 className="font-semibold text-gray-900">핵심 기능</h3>
              </div>
              <p className="text-sm text-gray-600">AI 기반 자동화</p>
            </div>

            {/* Revenue Model */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-2xl">💰</span>
                <h3 className="font-semibold text-gray-900">수익 모델</h3>
              </div>
              <p className="text-sm text-gray-600">구독 기반 서비스</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center text-gray-500 py-8">
              사용자 여정 분석 중...
            </div>
          </div>
        )}

        {/* Real-time AI Analysis */}
        <div className="mt-6 border-t border-gray-200 pt-4">
          <h4 className="font-semibold text-gray-900 mb-3">실시간 AI 분석</h4>
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <span className="text-green-500">✅</span>
              <p className="text-sm text-gray-600">
                타겟이 명확해요! {serviceTypeMap[serviceType] || "해당"} 시장은
                충성도가 높아요
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-yellow-500">💡</span>
              <p className="text-sm text-gray-600">
                제안: 사용자 경험 개선 기능도 고려해보세요
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-red-500">⚠️</span>
              <p className="text-sm text-gray-600">
                고려: 확장성 있는 아키텍처가 핵심 성공요소입니다
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Next Step Button */}
      <div className="absolute bottom-4 right-4">
        <button
          onClick={onNextStep}
          disabled={currentStep >= 4}
          className={`px-6 py-3 rounded-lg transition-colors duration-200 ${
            currentStep >= 4
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "text-white"
          }`}
          style={{
            backgroundColor: currentStep >= 4 ? undefined : "#6366F1",
          }}
        >
          {currentStep >= 4 ? "완료" : "다음 단계"}
        </button>
      </div>
    </div>
  );
}
