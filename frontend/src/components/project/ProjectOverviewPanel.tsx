"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useProjectOverview } from "@/hooks/useProjectOverview";
import React from "react";

interface ChatMessage {
  type: "user" | "ai" | "system";
  content: string;
}

interface ProjectOverview {
  serviceCoreElements: {
    title: string;
    description: string;
    keyFeatures: string[];
    targetUsers: string[];
    projectScale?: string;
    techComplexity?: string;
    estimatedDuration?: string;
    requiredTeam?: string[];
    techStack?: {
      frontend: string[];
      backend: string[];
      database: string[];
      infrastructure: string[];
    };
    businessModel?: {
      revenueStreams: string[];
      monetizationStrategy: string;
      pricingModel: string;
      targetMarketSize: string;
      competitiveAdvantage: string;
    };
  };
  userJourney: {
    steps: Array<{
      step: number;
      title: string;
      description: string;
      userAction: string;
      systemResponse: string;
      estimatedHours?: string;
      requiredSkills?: string[];
    }>;
  };
  estimation?: {
    totalCost: string;
    breakdown: {
      development: string;
      design: string;
      testing: string;
      deployment: string;
    };
    timeline: {
      planning: string;
      development: string;
      testing: string;
      deployment: string;
    };
  };
}

interface ProjectOverviewPanelProps {
  projectDescription: string;
  serviceType: string;
  uploadedFiles: File[];
  onNextStep?: () => void;
  currentStep?: number;
  messages?: ChatMessage[];
  onGenerateOverview?: React.MutableRefObject<(() => void) | null>;
  realtimeOverview?: ProjectOverview;
  isLoading?: boolean;
}

export function ProjectOverviewPanel({
  projectDescription,
  serviceType,
  uploadedFiles,
  onNextStep,
  currentStep = 1,
  messages = [],
  onGenerateOverview,
  realtimeOverview,
  isLoading: externalIsLoading,
}: ProjectOverviewPanelProps) {
  const [activeTab, setActiveTab] = useState<"elements" | "journey">(
    "elements"
  );

  const {
    overview,
    isLoading: internalIsLoading,
    error,
    updateOverview,
  } = useProjectOverview();

  // 내부와 외부 로딩 상태를 병합
  const isLoading = internalIsLoading || externalIsLoading;

  // 실시간 업데이트된 개요가 있으면 우선 사용
  const displayOverview = realtimeOverview || overview;

  // 버튼 활성화를 위한 상태 (realtimeOverview가 있으면 즉시 활성화)
  const isButtonEnabled = realtimeOverview ? true : !!overview && !isLoading;

  // console.log("=== ProjectOverviewPanel 버튼 활성화 상태 ===");
  // console.log("realtimeOverview:", !!realtimeOverview);
  // console.log("overview:", !!overview);
  // console.log("isLoading:", isLoading);
  // console.log("isButtonEnabled:", isButtonEnabled);
  // console.log("=============================================");

  // 수동으로 프로젝트 개요 생성하는 함수 (useCallback으로 최적화)
  const handleGenerateOverview = useCallback(() => {
    if (
      messages.length > 0 &&
      projectDescription &&
      projectDescription.trim().length >= 3
    ) {
      const input = {
        description: projectDescription,
        serviceType,
        uploadedFiles,
      };
      updateOverview(input, messages);
    }
  }, [
    messages,
    projectDescription,
    serviceType,
    uploadedFiles,
    updateOverview,
  ]);

  // 외부에서 호출할 수 있도록 함수 노출
  useEffect(() => {
    if (onGenerateOverview) {
      onGenerateOverview.current = handleGenerateOverview;
    }
  }, [onGenerateOverview, handleGenerateOverview]);

  const serviceTypeMap: Record<string, string> = {
    "food-delivery": "음식 배달 앱",
    "real-estate": "부동산 플랫폼",
    "work-management": "업무 관리 도구",
    "online-education": "온라인 교육",
    "shopping-mall": "쇼핑몰",
  };

  // 로딩 애니메이션 컴포넌트
  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
    </div>
  );

  // 로딩 스피너 컴포넌트
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-2 text-sm text-gray-600">AI가 분석 중입니다...</span>
    </div>
  );

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
        {isLoading && !displayOverview ? (
          <div className="space-y-4">
            <LoadingSpinner />
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center space-x-3 mb-2">
                  <Image
                    src="/images/target-client.png"
                    alt="타겟 고객"
                    width={30}
                    height={24}
                  />
                  <h3 className="font-semibold text-gray-900">타겟 고객</h3>
                </div>
                <LoadingSkeleton />
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center space-x-3 mb-2">
                  <Image
                    src="/images/question-mark.png"
                    alt="핵심 문제"
                    width={24}
                    height={24}
                  />
                  <h3 className="font-semibold text-gray-900">핵심 문제</h3>
                </div>
                <LoadingSkeleton />
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center space-x-3 mb-2">
                  <Image
                    src="/images/core-feature.png"
                    alt="핵심 기능"
                    width={24}
                    height={24}
                  />
                  <h3 className="font-semibold text-gray-900">핵심 기능</h3>
                </div>
                <LoadingSkeleton />
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center space-x-3 mb-2">
                  <Image
                    src="/images/bm.png"
                    alt="수익 모델"
                    width={19}
                    height={25}
                  />
                  <h3 className="font-semibold text-gray-900">수익 모델</h3>
                </div>
                <LoadingSkeleton />
              </div>
            </div>
          </div>
        ) : activeTab === "elements" ? (
          <div className="space-y-4">
            {/* 2x2 Grid Layout */}
            <div className="grid grid-cols-2 gap-4">
              {/* Target Customer */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center space-x-3 mb-2">
                  <Image
                    src="/images/target-client.png"
                    alt="타겟 고객"
                    width={30}
                    height={24}
                  />
                  <h3 className="font-semibold text-gray-900">타겟 고객</h3>
                </div>
                {isLoading ? (
                  <LoadingSkeleton />
                ) : (
                  <div className="space-y-2">
                    {displayOverview?.serviceCoreElements?.targetUsers?.map(
                      (user: string, index: number) => (
                        <p key={index} className="text-sm text-gray-600">
                          • {user}
                        </p>
                      )
                    ) || (
                      <p className="text-sm text-gray-600">
                        {serviceType
                          ? serviceTypeMap[serviceType] || serviceType
                          : "분석 중..."}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Core Problem */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center space-x-3 mb-2">
                  <Image
                    src="/images/question-mark.png"
                    alt="핵심 문제"
                    width={24}
                    height={24}
                  />
                  <h3 className="font-semibold text-gray-900">핵심 문제</h3>
                </div>
                {isLoading ? (
                  <LoadingSkeleton />
                ) : (
                  <div className="space-y-2">
                    {displayOverview?.serviceCoreElements?.description ? (
                      <p className="text-sm text-gray-600">
                        {displayOverview.serviceCoreElements.description}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-600">
                        {projectDescription || "사용자 입력 대기 중..."}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Core Feature */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center space-x-3 mb-2">
                  <Image
                    src="/images/core-feature.png"
                    alt="핵심 기능"
                    width={24}
                    height={24}
                  />
                  <h3 className="font-semibold text-gray-900">핵심 기능</h3>
                </div>
                {isLoading ? (
                  <LoadingSkeleton />
                ) : (
                  <div className="space-y-2">
                    {displayOverview?.serviceCoreElements?.keyFeatures?.map(
                      (feature: string, index: number) => (
                        <p key={index} className="text-sm text-gray-600">
                          • {feature}
                        </p>
                      )
                    ) || (
                      <p className="text-sm text-gray-600">AI 기반 자동화</p>
                    )}
                  </div>
                )}
              </div>

              {/* Revenue Model */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center space-x-3 mb-2">
                  <Image
                    src="/images/bm.png"
                    alt="수익 모델"
                    width={19}
                    height={25}
                  />
                  <h3 className="font-semibold text-gray-900">수익 모델</h3>
                </div>
                {isLoading ? (
                  <LoadingSkeleton />
                ) : (
                  <div className="space-y-2">
                    {displayOverview?.serviceCoreElements?.businessModel?.revenueStreams?.map(
                      (stream: string, index: number) => (
                        <p key={index} className="text-sm text-gray-600">
                          • {stream}
                        </p>
                      )
                    ) || (
                      <>
                        <p className="text-sm text-gray-600">
                          • 사료 판매 수수료
                        </p>
                        <p className="text-sm text-gray-600">• 프리미엄 구독</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {isLoading ? (
              <LoadingSpinner />
            ) : displayOverview?.userJourney?.steps &&
              displayOverview.userJourney.steps.length > 0 ? (
              <>
                {displayOverview?.userJourney?.steps?.map(
                  (
                    step: {
                      step: number;
                      title: string;
                      description: string;
                      userAction: string;
                      systemResponse: string;
                      estimatedHours?: string;
                      requiredSkills?: string[];
                    },
                    index: number
                  ) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-2xl">🔄</span>
                        <h3 className="font-semibold text-gray-900">
                          단계 {step.step}
                        </h3>
                      </div>
                      <h4 className="font-medium text-gray-800 mb-2">
                        {step.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {step.description}
                      </p>
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>
                          <strong>사용자 행동:</strong> {step.userAction}
                        </p>
                        <p>
                          <strong>시스템 응답:</strong> {step.systemResponse}
                        </p>
                        {step.estimatedHours && (
                          <p>
                            <strong>예상 소요시간:</strong>{" "}
                            {step.estimatedHours}
                          </p>
                        )}
                        {step.requiredSkills &&
                          step.requiredSkills.length > 0 && (
                            <p>
                              <strong>필요 기술:</strong>{" "}
                              {step.requiredSkills.join(", ")}
                            </p>
                          )}
                      </div>
                    </div>
                  )
                )}

                {/* 견적 정보 */}
                {overview?.estimation && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="text-2xl">💰</span>
                      <h3 className="font-semibold text-blue-900">예상 견적</h3>
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-bold text-blue-800">
                        총 비용: {displayOverview?.estimation?.totalCost}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <p>
                          <strong>개발비:</strong>{" "}
                          {displayOverview?.estimation?.breakdown?.development}
                        </p>
                        <p>
                          <strong>디자인비:</strong>{" "}
                          {displayOverview?.estimation?.breakdown?.design}
                        </p>
                        <p>
                          <strong>테스트비:</strong>{" "}
                          {displayOverview?.estimation?.breakdown?.testing}
                        </p>
                        <p>
                          <strong>배포비:</strong>{" "}
                          {displayOverview?.estimation?.breakdown?.deployment}
                        </p>
                      </div>
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <h4 className="font-medium text-blue-800 mb-2">
                          개발 일정
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <p>
                            <strong>기획/설계:</strong>{" "}
                            {displayOverview?.estimation?.timeline?.planning}
                          </p>
                          <p>
                            <strong>개발:</strong>{" "}
                            {displayOverview?.estimation?.timeline?.development}
                          </p>
                          <p>
                            <strong>테스트:</strong>{" "}
                            {displayOverview?.estimation?.timeline?.testing}
                          </p>
                          <p>
                            <strong>배포:</strong>{" "}
                            {displayOverview?.estimation?.timeline?.deployment}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-gray-500 py-8">
                사용자 여정 분석 중...
              </div>
            )}
          </div>
        )}

        {/* Real-time AI Analysis */}
        <div className="mt-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-purple-200">
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-2xl">🤖</span>
              <h4 className="font-semibold text-gray-900">실시간 AI 분석</h4>
            </div>
            {isLoading ? (
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mt-1"></div>
                  <p className="text-sm text-gray-600">
                    AI가 프로젝트를 분석하고 있습니다...
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <span className="text-red-500 text-lg">❌</span>
                  <p className="text-sm text-red-600">
                    분석 중 오류가 발생했습니다: {error}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <span className="text-green-500 text-lg">✔</span>
                  <p className="text-sm text-gray-600">
                    타겟이 명확해요! 멀티펫 시장은 충성도가 높아요
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-yellow-500 text-lg">💡</span>
                  <p className="text-sm text-gray-600">
                    제안: 펫 건강 관리 기능도 고려해보세요
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-orange-500 text-lg">⚠</span>
                  <p className="text-sm text-gray-600">
                    고려: 배송 물류 시스템이 핵심 성공요소입니다
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Next Step Button */}
      <div className="absolute bottom-4 right-4">
        <button
          onClick={onNextStep}
          disabled={currentStep >= 4 || !isButtonEnabled || isLoading}
          className={`px-6 py-3 rounded-lg transition-colors duration-200 ${
            currentStep >= 4 || !isButtonEnabled || isLoading
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "text-white"
          }`}
          style={{
            backgroundColor:
              currentStep >= 4 || !isButtonEnabled || isLoading
                ? undefined
                : "#6366F1",
          }}
        >
          {isLoading ? "처리 중..." : currentStep >= 4 ? "완료" : "다음 단계"}
        </button>
      </div>
    </div>
  );
}
