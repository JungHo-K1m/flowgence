"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useProjectOverview } from "@/hooks/useProjectOverview";
import React from "react";
import { UserJourneyMermaidDiagram } from "./UserJourneyMermaidDiagram";
import { isDevelopmentMode } from "@/lib/dummyData";

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
  aiAnalysis?: {
    insights: Array<{
      type: "strength" | "suggestion" | "warning";
      icon: string;
      message: string;
    }>;
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
    setOverviewDirectly,
  } = useProjectOverview();

  // 내부와 외부 로딩 상태를 병합
  const isLoading = internalIsLoading || externalIsLoading;

  // 실시간 업데이트된 개요가 있으면 우선 사용
  // 내부 훅의 overview도 함께 확인 (두 훅이 독립적인 상태를 가지므로)
  const displayOverview = realtimeOverview || overview;

  // 버튼 활성화를 위한 상태 (displayOverview가 있으면 활성화)
  const isButtonEnabled = !!displayOverview && !isLoading;

  // 스트리밍 효과를 위한 상태
  const prevOverviewRef = useRef<typeof displayOverview>(null);
  const [streamingData, setStreamingData] = useState<{
    type:
      | "targetUsers"
      | "keyFeatures"
      | "coreProblem"
      | "revenueModel"
      | "aiAnalysis"
      | null;
    data: string | null;
  }>({ type: null, data: null });
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamingQueueRef = useRef<
    Array<{
      type:
        | "targetUsers"
        | "keyFeatures"
        | "coreProblem"
        | "revenueModel"
        | "aiAnalysis";
      data: string;
    }>
  >([]);
  const [streamingQueue, setStreamingQueue] = useState<
    Array<{
      type:
        | "targetUsers"
        | "keyFeatures"
        | "coreProblem"
        | "revenueModel"
        | "aiAnalysis";
      data: string;
    }>
  >([]);


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

  // 스트리밍 큐 처리 함수
  const processStreamingQueue = useCallback(() => {
    if (streamingQueueRef.current.length === 0) return;

    const item = streamingQueueRef.current.shift();
    if (!item) return;

    // 큐에서 제거되었음을 반영
    setStreamingQueue([...streamingQueueRef.current]);

    setStreamingData({
      type: item.type,
      data: "",
    });

    let currentIndex = 0;
    typingIntervalRef.current = setInterval(() => {
      if (currentIndex < item.data.length) {
        setStreamingData({
          type: item.type,
          data: item.data.substring(0, currentIndex + 1),
        });
        currentIndex++;
      } else {
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
        // 타이핑 완료 후 다음 큐 처리
        setTimeout(() => {
          setStreamingData({ type: null, data: null });
          // 다음 항목 처리
          if (streamingQueueRef.current.length > 0) {
            processStreamingQueue();
          } else {
            // 큐가 모두 비었으므로 상태 초기화
            setStreamingQueue([]);
          }
        }, 500);
      }
    }, 30);
  }, []);

  // overview 변경 감지 및 스트리밍 효과 적용
  useEffect(() => {
    // 이전 interval 정리
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }

    // overview가 변경되었는지 확인
    if (!displayOverview) return;

    // 개발 모드에서는 스트리밍 효과 건너뛰기
    if (isDevelopmentMode()) {
      prevOverviewRef.current = displayOverview;
      return;
    }

    // 모바일에서는 스트리밍 효과 건너뛰기 (렌더링 문제 방지)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    if (isMobile) {
      prevOverviewRef.current = displayOverview;
      return;
    }

    // 초기 로딩 체크
    const isInitialLoad = !prevOverviewRef.current;

    if (isInitialLoad && displayOverview) {
      // 초기 로딩: 첫 데이터에도 스트리밍 적용
      const curr = displayOverview.serviceCoreElements;

      // 모든 변경된 영역을 큐에 추가
      const changes: Array<{
        type:
          | "targetUsers"
          | "keyFeatures"
          | "coreProblem"
          | "revenueModel"
          | "aiAnalysis";
        data: string;
      }> = [];

      if (curr?.targetUsers && curr.targetUsers.length > 0) {
        changes.push({
          type: "targetUsers" as const,
          data: curr.targetUsers.map((user) => `• ${user}\n`).join(""),
        });
      }

      if (curr?.keyFeatures && curr.keyFeatures.length > 0) {
        changes.push({
          type: "keyFeatures" as const,
          data: curr.keyFeatures.map((feature) => `• ${feature}\n`).join(""),
        });
      }

      if (curr?.description && curr.description.length > 0) {
        changes.push({
          type: "coreProblem" as const,
          data: curr.description,
        });
      }

      if (
        curr?.businessModel?.revenueStreams &&
        curr.businessModel.revenueStreams.length > 0
      ) {
        changes.push({
          type: "revenueModel" as const,
          data: curr.businessModel.revenueStreams
            .map((stream) => `• ${stream}\n`)
            .join(""),
        });
      }

      if (
        displayOverview?.aiAnalysis?.insights &&
        displayOverview.aiAnalysis.insights.length > 0
      ) {
        // AI 분석 insights를 문자열로 변환
        const aiAnalysisText = displayOverview.aiAnalysis.insights
          .map((insight) => `${insight.icon} ${insight.message}\n`)
          .join("");
        changes.push({
          type: "aiAnalysis" as const,
          data: aiAnalysisText,
        });
      }

      // 큐에 추가된 항목들을 순차적으로 처리
      if (changes.length > 0) {
        streamingQueueRef.current = changes;
        setStreamingQueue(changes);
        processStreamingQueue();
      }

      prevOverviewRef.current = displayOverview;
      return;
    }

    // 이후 업데이트
    if (!prevOverviewRef.current) return;

    const prev = prevOverviewRef.current.serviceCoreElements;
    const curr = displayOverview.serviceCoreElements;

    // 모든 변경된 영역을 큐에 추가하여 순차적으로 처리
    const changes: Array<{
      type:
        | "targetUsers"
        | "keyFeatures"
        | "coreProblem"
        | "revenueModel"
        | "aiAnalysis";
      data: string;
    }> = [];

    // 타겟 고객이 변경되었는지 확인
    if (
      prev &&
      curr &&
      JSON.stringify(prev.targetUsers) !== JSON.stringify(curr.targetUsers) &&
      curr.targetUsers
    ) {
      changes.push({
        type: "targetUsers" as const,
        data: curr.targetUsers.map((user) => `• ${user}\n`).join(""),
      });
    }

    // 핵심 기능이 변경되었는지 확인
    if (
      prev &&
      curr &&
      JSON.stringify(prev.keyFeatures) !== JSON.stringify(curr.keyFeatures) &&
      curr.keyFeatures
    ) {
      changes.push({
        type: "keyFeatures" as const,
        data: curr.keyFeatures.map((feature) => `• ${feature}\n`).join(""),
      });
    }

    // 핵심 문제가 변경되었는지 확인
    if (
      prev &&
      curr &&
      prev.description !== curr.description &&
      curr.description
    ) {
      changes.push({
        type: "coreProblem" as const,
        data: curr.description,
      });
    }

    // 수익 모델이 변경되었는지 확인
    if (
      prev &&
      curr &&
      JSON.stringify(prev.businessModel?.revenueStreams) !==
        JSON.stringify(curr.businessModel?.revenueStreams) &&
      curr.businessModel?.revenueStreams
    ) {
      changes.push({
        type: "revenueModel" as const,
        data: curr.businessModel.revenueStreams
          .map((stream) => `• ${stream}\n`)
          .join(""),
      });
    }

    // AI 분석이 변경되었는지 확인
    const prevAnalysis = prevOverviewRef.current?.aiAnalysis?.insights;
    const currAnalysis = displayOverview?.aiAnalysis?.insights;
    if (
      prevAnalysis &&
      currAnalysis &&
      JSON.stringify(prevAnalysis) !== JSON.stringify(currAnalysis) &&
      currAnalysis.length > 0
    ) {
      const aiAnalysisText = currAnalysis
        .map((insight) => `${insight.icon} ${insight.message}\n`)
        .join("");
      changes.push({
        type: "aiAnalysis" as const,
        data: aiAnalysisText,
      });
    }

    // 큐에 추가된 항목들을 순차적으로 처리
    if (changes.length > 0) {
      streamingQueueRef.current = changes;
      setStreamingQueue(changes);
      processStreamingQueue();
    }

    prevOverviewRef.current = displayOverview;

    // cleanup 함수로 interval 정리
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
    };
  }, [displayOverview, processStreamingQueue]);

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

  // 텍스트 스트리밍 로딩 컴포넌트
  const LoadingSpinner = () => {
    const [currentMessage, setCurrentMessage] = useState(0);

    const loadingMessages = [
      "프로젝트를 분석하고 있습니다",
      "핵심 요소를 추출하고 있습니다",
      "서비스 구조를 설계하고 있습니다",
      "최종 검토를 진행하고 있습니다",
    ];

    useEffect(() => {
      if (!isLoading) return;

      const interval = setInterval(() => {
        setCurrentMessage((prev) => (prev + 1) % loadingMessages.length);
      }, 2000); // 2초마다 메시지 변경

      return () => clearInterval(interval);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading]); // loadingMessages는 컴포넌트 내부 상수이므로 의존성에서 제외

    return (
      <div className="flex flex-col items-center justify-center py-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
        <span className="text-sm text-gray-600 animate-pulse">
          {loadingMessages[currentMessage]}
        </span>
        <span className="text-xs text-gray-400 mt-1 animate-pulse">
          잠시만 기다려주세요...
        </span>
      </div>
    );
  };

  return (
    <div className="h-full bg-white flex flex-col overflow-hidden">
      {/* Tab Header */}
      <div className="border-b border-gray-200 flex-shrink-0">
        <div className="flex">
          <button
            onClick={() => setActiveTab("elements")}
            className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium ${
              activeTab === "elements"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            서비스 핵심요소
          </button>
          <button
            onClick={() => setActiveTab("journey")}
            className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium ${
              activeTab === "journey"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            사용자 여정
          </button>
        </div>
      </div>

      {/* Tab Content - Scrollable Area with Fixed Height */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 min-h-0">
        {isLoading && !displayOverview ? (
          <div className="space-y-3 sm:space-y-4">
            <LoadingSpinner />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                  <Image
                    src="/images/target-client.png"
                    alt="타겟 고객"
                    width={30}
                    height={24}
                    className="w-6 h-5 sm:w-[30px] sm:h-6"
                  />
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">타겟 고객</h3>
                </div>
                <LoadingSkeleton />
              </div>
              <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                  <Image
                    src="/images/question-mark.png"
                    alt="핵심 문제"
                    width={24}
                    height={24}
                    className="w-5 h-5 sm:w-6 sm:h-6"
                  />
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">핵심 문제</h3>
                </div>
                <LoadingSkeleton />
              </div>
              <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                  <Image
                    src="/images/core-feature.png"
                    alt="핵심 기능"
                    width={24}
                    height={24}
                    className="w-5 h-5 sm:w-6 sm:h-6"
                  />
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">핵심 기능</h3>
                </div>
                <LoadingSkeleton />
              </div>
              <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                  <Image
                    src="/images/bm.png"
                    alt="수익 모델"
                    width={19}
                    height={25}
                    className="w-4 h-5 sm:w-[19px] sm:h-[25px]"
                  />
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">수익 모델</h3>
                </div>
                <LoadingSkeleton />
              </div>
            </div>
            {/* 실시간 AI 분석 로딩 */}
            <div className="mt-4 sm:mt-6">
              <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-purple-200">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-3">
                  <span className="text-xl sm:text-2xl">🤖</span>
                  <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                    실시간 AI 분석
                  </h4>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mt-1"></div>
                    <p className="text-sm text-gray-600">
                      AI가 프로젝트를 분석하고 있습니다...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === "elements" ? (
          <div className="space-y-3 sm:space-y-4">
            {/* 2x2 Grid Layout - 1 column on mobile, 2 columns on tablet+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Target Customer */}
              <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                  <Image
                    src="/images/target-client.png"
                    alt="타겟 고객"
                    width={30}
                    height={24}
                    className="w-6 h-5 sm:w-[30px] sm:h-6"
                  />
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">타겟 고객</h3>
                </div>
                {displayOverview?.serviceCoreElements?.targetUsers &&
                displayOverview.serviceCoreElements.targetUsers.length > 0 ? (
                  <div className="space-y-2">
                    {displayOverview.serviceCoreElements.targetUsers.map(
                      (user: string, index: number) => (
                        <p key={index} className="text-sm text-gray-600">
                          • {user}
                        </p>
                      )
                    )}
                  </div>
                ) : isLoading ? (
                  <LoadingSkeleton />
                ) : (
                  <p className="text-sm text-gray-600">
                    {serviceType
                      ? serviceTypeMap[serviceType] || serviceType
                      : "분석 중..."}
                  </p>
                )}
              </div>

              {/* Core Problem */}
              <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                  <Image
                    src="/images/question-mark.png"
                    alt="핵심 문제"
                    width={24}
                    height={24}
                    className="w-5 h-5 sm:w-6 sm:h-6"
                  />
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">핵심 문제</h3>
                </div>
                {displayOverview?.serviceCoreElements?.description ? (
                  <p className="text-sm text-gray-600">
                    {displayOverview.serviceCoreElements.description}
                  </p>
                ) : isLoading ? (
                  <LoadingSkeleton />
                ) : (
                  <p className="text-sm text-gray-600">
                    {projectDescription || "사용자 입력 대기 중..."}
                  </p>
                )}
              </div>

              {/* Core Feature */}
              <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                  <Image
                    src="/images/core-feature.png"
                    alt="핵심 기능"
                    width={24}
                    height={24}
                    className="w-5 h-5 sm:w-6 sm:h-6"
                  />
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">핵심 기능</h3>
                </div>
                {displayOverview?.serviceCoreElements?.keyFeatures &&
                displayOverview.serviceCoreElements.keyFeatures.length > 0 ? (
                  <div className="space-y-2">
                    {displayOverview.serviceCoreElements.keyFeatures.map(
                      (feature: string, index: number) => (
                        <p key={index} className="text-sm text-gray-600">
                          • {feature}
                        </p>
                      )
                    )}
                  </div>
                ) : isLoading ? (
                  <LoadingSkeleton />
                ) : (
                  <p className="text-sm text-gray-600">AI 기반 자동화</p>
                )}
              </div>

              {/* Revenue Model */}
              <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                  <Image
                    src="/images/bm.png"
                    alt="수익 모델"
                    width={19}
                    height={25}
                    className="w-4 h-5 sm:w-[19px] sm:h-[25px]"
                  />
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">수익 모델</h3>
                </div>
                {displayOverview?.serviceCoreElements?.businessModel?.revenueStreams &&
                displayOverview.serviceCoreElements.businessModel.revenueStreams.length > 0 ? (
                  <div className="space-y-2">
                    {displayOverview.serviceCoreElements.businessModel.revenueStreams.map(
                      (stream: string, index: number) => (
                        <p key={index} className="text-sm text-gray-600">
                          • {stream}
                        </p>
                      )
                    )}
                  </div>
                ) : isLoading ? (
                  <LoadingSkeleton />
                ) : (
                  <>
                    <p className="text-sm text-gray-600">• 사료 판매 수수료</p>
                    <p className="text-sm text-gray-600">• 프리미엄 구독</p>
                  </>
                )}
              </div>
            </div>

            {/* Real-time AI Analysis */}
            <div className="mt-4 sm:mt-6">
              <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-purple-200">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-3">
                  <span className="text-xl sm:text-2xl">🤖</span>
                  <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                    실시간 AI 분석
                  </h4>
                </div>
                <div>
                  {error ? (
                    <div className="space-y-3">
                      <div className="flex items-start space-x-2">
                        <span className="text-red-500 text-lg">❌</span>
                        <p className="text-sm text-red-600">
                          분석 중 오류가 발생했습니다: {error}
                        </p>
                      </div>
                    </div>
                  ) : displayOverview?.aiAnalysis?.insights &&
                    displayOverview.aiAnalysis.insights.length > 0 ? (
                    <div className="space-y-3">
                      {displayOverview.aiAnalysis.insights.map(
                        (insight, index) => (
                          <div
                            key={index}
                            className="flex items-start space-x-2"
                          >
                            <span
                              className={`text-lg ${
                                insight.type === "strength"
                                  ? "text-green-500"
                                  : insight.type === "suggestion"
                                  ? "text-yellow-500"
                                  : "text-orange-500"
                              }`}
                            >
                              {insight.icon}
                            </span>
                            <p className="text-sm text-gray-600">
                              {insight.message}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  ) : isLoading ? (
                    <div className="space-y-3">
                      <div className="flex items-start space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mt-1"></div>
                        <p className="text-sm text-gray-600">
                          AI가 프로젝트를 분석하고 있습니다...
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-start space-x-2">
                        <span className="text-green-500 text-lg">✔</span>
                        <p className="text-sm text-gray-600">
                          프로젝트 분석 중...
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {isLoading && !displayOverview?.userJourney?.steps?.length ? (
              <LoadingSpinner />
            ) : displayOverview?.userJourney?.steps &&
              displayOverview.userJourney.steps.length > 0 ? (
              <>
                {/* Mermaid 다이어그램 - 모바일에서는 숨기거나 간소화 */}
                <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 mb-4 sm:mb-6">
                  <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                    <span className="text-xl sm:text-2xl">📊</span>
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                      사용자 여정 다이어그램
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <UserJourneyMermaidDiagram
                      steps={displayOverview.userJourney.steps}
                      autoGenerateImage={true}
                      onImageGenerated={(imageUrl) => {
                        // 이미지 생성 완료 시 프로젝트 개요에 저장
                        if (displayOverview && setOverviewDirectly) {
                          const updatedOverview = {
                            ...displayOverview,
                            mermaidImage: imageUrl, // 이미지 URL을 프로젝트 개요에 추가
                          };
                          // 프로젝트 개요 state 업데이트 (이미지 포함)
                          setOverviewDirectly(updatedOverview);
                        }
                      }}
                    />
                  </div>
                </div>

                {/* 사용자 여정 단계별 상세 정보 */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 text-lg mb-4">
                    단계별 상세 정보
                  </h3>
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
                </div>

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
      </div>

      {/* Next Step Button */}
      <div className="border-t border-gray-200 p-3 sm:p-4 flex justify-end flex-shrink-0">
        <button
          onClick={onNextStep}
          disabled={currentStep >= 4 || !isButtonEnabled || isLoading}
          className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base rounded-lg transition-colors duration-200 ${
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
