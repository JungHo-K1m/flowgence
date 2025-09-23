"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ServiceTypeButtons } from "@/components/project/ServiceTypeButtons";
import { FileUpload } from "@/components/project/FileUpload";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { ProjectOverviewPanel } from "@/components/project/ProjectOverviewPanel";
import { RequirementsPanel } from "@/components/requirements/RequirementsPanel";
import { RequirementsLoading } from "@/components/requirements/RequirementsLoading";
import { ConfirmationPanel } from "@/components/project/ConfirmationPanel";
import { RequirementsResultPanel } from "@/components/project/RequirementsResultPanel";
import { FinalConfirmationModal } from "@/components/project/FinalConfirmationModal";
import { ProgressBar } from "@/components/layout/ProgressBar";
import { LoginRequiredModal } from "@/components/auth/LoginRequiredModal";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useStatePersistence } from "@/hooks/useStatePersistence";
import { SimpleRequirementModal } from "@/components/requirements/SimpleRequirementModal";
import { useProjectOverview } from "@/hooks/useProjectOverview";

interface Message {
  id: string;
  type: "system" | "ai" | "user";
  content: string;
  description?: string;
  icon?: string;
  options?: Array<{ id: string; label: string }>;
}

export default function HomePage() {
  const [projectDescription, setProjectDescription] = useState("");
  const [selectedServiceType, setSelectedServiceType] = useState<string>("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [showChatInterface, setShowChatInterface] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showRequirements, setShowRequirements] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showFinalResult, setShowFinalResult] = useState(false);
  const [showFinalModal, setShowFinalModal] = useState(false);
  const [isRequirementsLoading, setIsRequirementsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);

  // useProjectOverview 훅 사용
  const { overview, updateOverview } = useProjectOverview();

  // onProjectUpdate 콜백을 useCallback으로 감싸서 불필요한 리렌더링 방지
  const handleProjectUpdate = useCallback(
    (data: {
      description: string;
      serviceType: string;
      uploadedFiles: File[];
      messages: Message[];
    }) => {
      console.log("프로젝트 개요 업데이트 트리거:", data);
      console.log("updateOverview 함수 호출 시작");

      // updateOverview 함수 호출하여 실제 API 요청 실행
      updateOverview(
        {
          description: data.description,
          serviceType: data.serviceType,
          uploadedFiles: data.uploadedFiles,
        },
        data.messages
      );
      console.log("updateOverview 함수 호출 완료");
    },
    [updateOverview]
  );

  // 요구사항 편집 모달 상태
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string>("");

  // 프로젝트 개요 생성 함수 ref
  const generateOverviewRef = useRef<(() => void) | null>(null);

  // 프로젝트 개요 생성 함수
  const generateProjectOverview = useCallback(() => {
    if (generateOverviewRef.current) {
      generateOverviewRef.current();
    }
  }, []);

  // 인증 가드 및 상태 유지
  const { showLoginModal, requireAuth, closeLoginModal } = useAuthGuard();
  const { restoreState, clearState } = useStatePersistence();
  const searchParams = useSearchParams();
  const targetStep = searchParams.get("step");

  // 로그인 후 상태 복원 및 자동 단계 이동
  useEffect(() => {
    const savedState = restoreState();
    if (savedState?.projectData) {
      const { projectData, targetStep: savedTargetStep } = savedState;

      // 상태 복원
      setProjectDescription(projectData.description || "");
      setSelectedServiceType(projectData.serviceType || "");
      setUploadedFiles(projectData.uploadedFiles || []);
      setChatMessages(projectData.chatMessages || []);

      // 채팅 인터페이스가 활성화되어 있었다면 복원
      if (projectData.chatMessages?.length > 0) {
        setShowChatInterface(true);
      }

      // 자동 단계 이동 (URL 파라미터 또는 저장된 targetStep 사용)
      const stepToMove = targetStep || savedTargetStep;
      if (stepToMove === "2" || stepToMove === 2) {
        setShowRequirements(true);
        setIsRequirementsLoading(true);
        setCurrentStep(2);

        // 로딩 완료 (시간 단축)
        setTimeout(() => {
          setIsRequirementsLoading(false);
        }, 2000);
      } else if (stepToMove === "3" || stepToMove === 3) {
        setShowConfirmation(true);
        setCurrentStep(3);
      } else if (stepToMove === "4" || stepToMove === 4) {
        setShowFinalResult(true);
        setCurrentStep(4);
      }

      clearState(); // 복원 후 상태 초기화
    }
  }, [restoreState, clearState, targetStep]);

  const steps = [
    {
      id: 1,
      label: "프로젝트 개요",
      description: "Project Overview",
    },
    {
      id: 2,
      label: "요구사항 선택 + 대화",
      description: "Requirement Selection + Chat",
    },
    {
      id: 3,
      label: "기능 구성",
      description: "Feature Configuration",
    },
    {
      id: 4,
      label: "완료",
      description: "Complete",
    },
  ];

  const handleStart = () => {
    // 채팅 인터페이스와 프로젝트 개요 패널 표시
    setShowChatInterface(true);
    setCurrentStep(1); // 1단계 유지

    // 초기 메시지 설정 (중복 호출 방지)
    const initialMessages: Message[] = [
      {
        id: "initial-user-message",
        type: "user",
        content: projectDescription,
        icon: "👤",
      },
      {
        id: "1",
        type: "ai",
        content:
          "좋아요! 좀 더 구체적으로 이해하기 위해 몇 가지 질문을 드릴게요. 이 서비스는 사용자들이 어떤 문제를 해결하고 싶어하는지, 그리고 기존 서비스에서 어떤 불편함을 겪고 있는지 파악하는 것이 중요합니다. 또한 타겟 고객층의 특성과 니즈를 정확히 이해해야 더 나은 솔루션을 제안할 수 있습니다.",
        icon: "🤖",
      },
      {
        id: "2",
        type: "ai",
        content: "당신의 서비스는 어떤 문제를 해결하고 싶나요?",
        description: "아래 옵션을 선택하거나 직접 입력해주세요.",
        icon: "🤖",
        options: [
          { id: "price", label: "가격 문제" },
          { id: "convenience", label: "편리성 문제" },
          { id: "dissatisfaction", label: "기존 서비스 불만" },
          { id: "unknown", label: "잘 모르겠음" },
        ],
      },
    ];
    setChatMessages(initialMessages);

    // 프로젝트 개요 생성
    setTimeout(() => {
      generateProjectOverview();
    }, 100); // 컴포넌트 마운트 후 실행
  };

  const handleFileSelect = (files: File[]) => {
    setUploadedFiles(files);
    console.log("Selected files:", files);
  };

  const handleServiceTypeSelect = (serviceType: string) => {
    setSelectedServiceType(serviceType);
  };

  // 메시지 변경 핸들러 (useCallback으로 최적화)
  const handleMessagesChange = useCallback((newMessages: Message[]) => {
    setChatMessages(newMessages);
    // 프로젝트 개요 업데이트는 onProjectUpdate에서 처리하므로 여기서는 제거
  }, []);

  const handleNextStep = () => {
    if (currentStep === 1) {
      // 프로젝트 개요에서 요구사항 관리로 전환 (로그인 체크 없음)
      setShowRequirements(true);
      setIsRequirementsLoading(true);
      setCurrentStep(2);

      // 5초 후 로딩 완료
      setTimeout(() => {
        setIsRequirementsLoading(false);
      }, 5000);
    } else if (currentStep === 2) {
      // 요구사항 관리에서 기능 구성으로 전환
      const currentProjectData = {
        description: projectDescription,
        serviceType: selectedServiceType,
        uploadedFiles,
        chatMessages,
        requirements: [], // 요구사항은 아직 없음
      };

      requireAuth(() => {
        setShowRequirements(false);
        setShowConfirmation(true);
        setCurrentStep(3);
      }, currentProjectData);
    } else if (currentStep === 3) {
      // 3단계에서 최종 확인 모달 표시
      setShowFinalModal(true);
    } else {
      // 4단계 이후는 더 이상 진행하지 않음
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handleFinalConfirm = () => {
    setShowFinalModal(false);
    setShowConfirmation(false);
    setShowFinalResult(true);
    setCurrentStep(4);
  };

  const handlePrevStep = () => {
    if (currentStep === 2) {
      // 요구사항 관리에서 프로젝트 개요로 돌아가기
      setShowRequirements(false);
      setIsRequirementsLoading(false);
      setCurrentStep(1);
    } else if (currentStep === 3) {
      // 기능 구성에서 요구사항 관리로 돌아가기
      setShowConfirmation(false);
      setShowRequirements(true);
      setCurrentStep(2);
    } else if (currentStep === 4) {
      // 최종 결과에서 기능 구성으로 돌아가기
      setShowFinalResult(false);
      setShowConfirmation(true);
      setCurrentStep(3);
    } else {
      setCurrentStep((prev) => Math.max(prev - 1, 1));
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Progress Bar - Show when any interface is active */}
      {(showChatInterface ||
        showRequirements ||
        showConfirmation ||
        showFinalResult) && (
        <ProgressBar currentStep={currentStep} steps={steps} />
      )}

      {/* Initial Landing Page - Only show when no interface is active */}
      {!showChatInterface &&
        !showRequirements &&
        !showConfirmation &&
        !showFinalResult && (
          <div className="max-w-4xl mx-auto px-4 py-16">
            <div className="text-center">
              {/* Main Title */}
              <h1 className="text-[48px] font-bold text-black mb-4">
                당신이 만들고 싶은 서비스를 말하거나
                <br /> 자료를 업로드해보세요!
              </h1>

              {/* Subtitle */}
              <p className="text-[20px] text-[#4B5563] mb-12 max-w-2xl mx-auto">
                사업계획서 없이도 한 문장만 적어도 됩니다.
                <br />
                자료가 있다면 더 정확한 초안을 만들어 드려요.
              </p>

              {/* Text Input Section */}
              <div className="mb-8">
                <div className="relative max-w-[760px] w-full mx-auto mb-8 px-4 sm:px-0">
                  <div
                    className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:border-blue-500"
                    style={
                      {
                        "--tw-ring-color": "#6366F1",
                      } as React.CSSProperties
                    }
                  >
                    <input
                      type="text"
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      placeholder="예: 음식 배달 앱을 만들고 싶어요"
                      className="flex-1 px-6 py-4 bg-transparent border-0 focus:outline-none text-gray-700 placeholder-gray-500"
                    />
                    <button
                      onClick={handleStart}
                      className="bg-[#6366F1] text-white px-8 hover:bg-[#6366F1] transition-colors duration-200 font-medium m-2 rounded-lg h-[40px] flex items-center justify-center"
                    >
                      시작하기
                    </button>
                  </div>
                </div>

                {/* Service Type Buttons */}
                <ServiceTypeButtons
                  onSelect={handleServiceTypeSelect}
                  selectedType={selectedServiceType}
                />
              </div>

              {/* Separator */}
              <div className="flex items-center justify-center mb-8">
                <span className="text-gray-500 font-medium">또는</span>
              </div>

              {/* File Upload Section */}
              <div className="max-w-2xl mx-auto">
                <FileUpload onFileSelect={handleFileSelect} />
              </div>
            </div>
          </div>
        )}

      {/* Chat Interface with Slide Animation - Hide in confirmation and final result steps */}
      {!showConfirmation && !showFinalResult && (
        <div
          className={`transition-all duration-700 ease-in-out ${
            showChatInterface
              ? "opacity-100 translate-x-0"
              : "opacity-0 -translate-x-full pointer-events-none"
          }`}
        >
          <div className="flex h-screen">
            {/* Left Chat Interface */}
            <div
              className={`transition-all duration-700 ease-in-out ${
                showChatInterface ? "translate-x-0" : "-translate-x-full"
              } ${showRequirements ? "w-1/3" : "flex-1"}`}
            >
              <ChatInterface
                initialMessage=""
                serviceType={selectedServiceType}
                currentStep={currentStep}
                messages={chatMessages}
                onMessagesChange={handleMessagesChange}
                onProjectUpdate={handleProjectUpdate}
              />
            </div>

            {/* Right Panel - Project Overview or Requirements */}
            <div
              className={`border-l border-gray-200 transition-all duration-700 ease-in-out ${
                showChatInterface ? "translate-x-0" : "translate-x-full"
              } ${showRequirements ? "w-2/3" : "w-1/3"}`}
            >
              {showRequirements ? (
                isRequirementsLoading ? (
                  <RequirementsLoading />
                ) : (
                  <RequirementsPanel
                    onNextStep={handleNextStep}
                    onPrevStep={handlePrevStep}
                    currentStep={currentStep}
                    projectData={{
                      description: projectDescription,
                      serviceType: selectedServiceType,
                      uploadedFiles,
                      chatMessages,
                    }}
                    onOpenEditModal={(category) => {
                      setEditingCategory(category);
                      setShowEditModal(true);
                    }}
                  />
                )
              ) : (
                <ProjectOverviewPanel
                  projectDescription={projectDescription}
                  serviceType={selectedServiceType}
                  uploadedFiles={uploadedFiles}
                  onNextStep={handleNextStep}
                  currentStep={currentStep}
                  messages={chatMessages}
                  onGenerateOverview={generateOverviewRef}
                  realtimeOverview={overview || undefined}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Panel - Full Screen */}
      {showConfirmation && (
        <div className="h-screen">
          <ConfirmationPanel
            onNextStep={handleNextStep}
            onPrevStep={handlePrevStep}
            currentStep={currentStep}
            projectData={{
              description: projectDescription,
              serviceType: selectedServiceType,
              uploadedFiles,
              chatMessages,
            }}
          />
        </div>
      )}

      {/* Final Result Panel - Full Screen */}
      {showFinalResult && (
        <div className="h-screen">
          <RequirementsResultPanel
            projectData={{
              description: projectDescription,
              serviceType: selectedServiceType,
              uploadedFiles,
              chatMessages,
            }}
          />
        </div>
      )}

      {/* 로그인 안내 모달 */}
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={closeLoginModal}
        title="로그인이 필요한 서비스입니다"
        description="프로젝트 진행 및 요구사항 관리를 위해 로그인이 필요합니다. 로그인 후 계속 진행하시겠습니까?"
      />

      {/* 요구사항 편집 모달 */}
      <SimpleRequirementModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        requirements={[
          {
            id: "1",
            title: "상품 등록/수정",
            description: "상품 기본 정보 등록 및 옵션 관리",
            category: "product",
            priority: "high",
          },
          {
            id: "2",
            title: "성분/영양 관리",
            description: "성분 비교 필터, 알러지 태그 등록",
            category: "product",
            priority: "medium",
          },
          {
            id: "3",
            title: "재고 부족 알림",
            description: "재고 임계치 도달 시 자동 알림",
            category: "product",
            priority: "high",
          },
        ]}
        onRequirementsChange={(newRequirements) => {
          console.log("요구사항 업데이트:", newRequirements);
        }}
        categoryTitle={editingCategory === "product" ? "상품 관리" : "기타"}
        onCategoryTitleChange={(newTitle) => {
          console.log("카테고리 제목 변경:", newTitle);
        }}
      />

      {/* 최종 확인 모달 */}
      <FinalConfirmationModal
        isOpen={showFinalModal}
        onClose={() => setShowFinalModal(false)}
        onConfirm={handleFinalConfirm}
      />
    </div>
  );
}
