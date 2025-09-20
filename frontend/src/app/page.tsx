"use client";

import { useState } from "react";
import { ServiceTypeButtons } from "@/components/project/ServiceTypeButtons";
import { FileUpload } from "@/components/project/FileUpload";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { ProjectOverviewPanel } from "@/components/project/ProjectOverviewPanel";
import { RequirementsPanel } from "@/components/requirements/RequirementsPanel";
import { RequirementsLoading } from "@/components/requirements/RequirementsLoading";
import { ProgressBar } from "@/components/layout/ProgressBar";

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
  const [isRequirementsLoading, setIsRequirementsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);

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
  };

  const handleFileSelect = (files: File[]) => {
    setUploadedFiles(files);
    console.log("Selected files:", files);
  };

  const handleServiceTypeSelect = (serviceType: string) => {
    setSelectedServiceType(serviceType);
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      // 프로젝트 개요에서 요구사항 관리로 전환
      setShowRequirements(true);
      setIsRequirementsLoading(true);
      setCurrentStep(2);

      // 5초 후 로딩 완료
      setTimeout(() => {
        setIsRequirementsLoading(false);
      }, 5000);
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 2) {
      // 요구사항 관리에서 프로젝트 개요로 돌아가기
      setShowRequirements(false);
      setIsRequirementsLoading(false);
      setCurrentStep(1);
    } else {
      setCurrentStep((prev) => Math.max(prev - 1, 1));
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Progress Bar - Show only when chat interface is active */}
      {showChatInterface && (
        <ProgressBar currentStep={currentStep} steps={steps} />
      )}

      {/* Initial Landing Page */}
      {!showChatInterface && (
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

      {/* Chat Interface with Slide Animation */}
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
              initialMessage={projectDescription}
              serviceType={selectedServiceType}
              onNextStep={handleNextStep}
              currentStep={currentStep}
              messages={chatMessages}
              onMessagesChange={setChatMessages}
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
                />
              )
            ) : (
              <ProjectOverviewPanel
                projectDescription={projectDescription}
                serviceType={selectedServiceType}
                uploadedFiles={uploadedFiles}
                onNextStep={handleNextStep}
                currentStep={currentStep}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
