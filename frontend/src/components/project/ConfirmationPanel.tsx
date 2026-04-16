"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  ExtractedRequirements,
  RequirementCategory,
  Requirement,
} from "@/types/requirements";
import { generateEstimateMarkdown } from "@/lib/estimateGenerator";
import {
  downloadMarkdownAsPDF,
  downloadMarkdownAsFile,
  downloadHTMLAsFile,
} from "@/lib/pdfGenerator";
import { shareEstimateToNotion } from "@/lib/notionService";
import { checkNotionSetup } from "@/lib/notionConfig";
import { getShareOptions, showNotionGuide } from "@/lib/shareAlternatives";
import { WireframeSpec } from "@/types/wireframe";
import { LoFiCanvas } from "@/components/wireframe/LoFiCanvas";
import { WireframeEditor } from "@/components/wireframe/WireframeEditor";
import { calculateEstimation, formatCurrency as formatEstimationCurrency } from "@/lib/estimationCalculator";
import { DEFAULT_ROLE_RATES, getAllRates, updateRoleRate, type RoleRates } from "@/lib/estimationRates";

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

interface ConfirmationPanelProps {
  onNextStep: () => void;
  onPrevStep: () => void;
  currentStep: number;
  projectData: {
    description: string;
    serviceType: string;
    uploadedFiles: File[];
    chatMessages: unknown[];
  };
  extractedRequirements?: ExtractedRequirements | null;
  projectOverview?: ProjectOverview | null;
  // 와이어프레임 관련
  wireframe?: WireframeSpec | null;
  isGeneratingWireframe?: boolean;
  isApplyingEdit?: boolean;
  wireframeError?: string | null;
  onGenerateWireframe?: () => void;
  onRegenerateWireframe?: () => void;
  onApplyEdit?: (prompt: string) => Promise<void>;
  savedProjectId?: string;
}

export function ConfirmationPanel({
  onNextStep,
  onPrevStep,
  currentStep,
  projectData,
  extractedRequirements,
  projectOverview,
  wireframe,
  isGeneratingWireframe,
  isApplyingEdit,
  wireframeError,
  onGenerateWireframe,
  onRegenerateWireframe,
  onApplyEdit,
  savedProjectId,
}: ConfirmationPanelProps) {
  const [activeTab, setActiveTab] = useState<"requirements" | "estimate" | "wireframe">(
    "requirements"
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(
    new Set([0])
  ); // 첫 번째 카테고리만 기본으로 확장
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  const [customRates, setCustomRates] = useState<RoleRates>(DEFAULT_ROLE_RATES);
  const [showRateSettings, setShowRateSettings] = useState(false);

  // 드롭다운 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        downloadMenuRef.current &&
        !downloadMenuRef.current.contains(event.target as Node)
      ) {
        setShowDownloadMenu(false);
      }
    };

    if (showDownloadMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDownloadMenu]);

  // 실제 데이터 기반 요구사항 요약
  const requirementsData = useMemo(() => {
    if (!extractedRequirements) {
      return {
        total: 0,
        mandatory: 0,
        recommended: 0,
        optional: 0,
        projectType: projectData.serviceType || "프로젝트",
        estimatedUsers: "미정",
        duration: "미정",
      };
    }

    // 실제 요구사항 개수를 직접 계산
    const calculatedTotal = extractedRequirements.categories.reduce(
      (acc, category) =>
        acc +
        category.subCategories.reduce(
          (subAcc, subCategory) =>
            subAcc + (subCategory.requirements?.length || 0),
          0
        ),
      0
    );
    
    // totalCount가 있으면 사용하고, 없으면 계산된 값 사용
    const totalCount = extractedRequirements.totalCount || calculatedTotal;
    
    const mandatory = extractedRequirements.categories.reduce(
      (acc, category) =>
        acc +
        category.subCategories.reduce(
          (subAcc, subCategory) =>
            subAcc +
            (subCategory.requirements?.filter((req) => req.priority === "high")
              .length || 0),
          0
        ),
      0
    );
    const recommended = extractedRequirements.categories.reduce(
      (acc, category) =>
        acc +
        category.subCategories.reduce(
          (subAcc, subCategory) =>
            subAcc +
            (subCategory.requirements?.filter((req) => req.priority === "medium")
              .length || 0),
          0
        ),
      0
    );
    const optional = extractedRequirements.categories.reduce(
      (acc, category) =>
        acc +
        category.subCategories.reduce(
          (subAcc, subCategory) =>
            subAcc +
            (subCategory.requirements?.filter((req) => req.priority === "low")
              .length || 0),
          0
        ),
      0
    );

    // 예상 사용자 값 추출 (빈 배열 체크 포함, '미정' 필터링)
    const targetUsers = projectOverview?.serviceCoreElements?.targetUsers;
    let estimatedUsersValue = "미정";
    if (targetUsers && Array.isArray(targetUsers) && targetUsers.length > 0) {
      // '미정'을 제외한 실제 값만 추출
      const validUsers = targetUsers.filter((user: string) => user && user.trim() !== "미정" && user.trim() !== "");
      if (validUsers.length > 0) {
        estimatedUsersValue = validUsers.join(", ");
      }
    }

    // 프로젝트 기간 값 추출 ('미정' 필터링 및 요구사항 기반 추정)
    const estimatedDuration = projectOverview?.serviceCoreElements?.estimatedDuration;
    const timelineDevelopment = projectOverview?.estimation?.timeline?.development;
    
    let durationValue = "미정";
    
    // '미정'이 아닌 실제 값이 있는지 확인
    if (estimatedDuration && estimatedDuration.trim() !== "미정" && estimatedDuration.trim() !== "") {
      durationValue = estimatedDuration;
    } else if (timelineDevelopment && timelineDevelopment.trim() !== "미정" && timelineDevelopment.trim() !== "") {
      durationValue = timelineDevelopment;
    } else if (extractedRequirements && extractedRequirements.categories) {
      // 요구사항 기반으로 추정: 각 카테고리의 요구사항 수를 기반으로 기간 추정
      const totalRequirements = extractedRequirements.totalCount || 0;
      const mandatoryCount = extractedRequirements.categories.reduce((total: number, cat: RequirementCategory) => {
        return total + (cat.subCategories?.reduce((subTotal: number, sub: { requirements?: Requirement[] }) => {
          return subTotal + (sub.requirements?.filter((r: Requirement) => r.priority === 'high').length || 0);
        }, 0) || 0);
      }, 0);
      
      // 필수 요구사항 1개당 약 1주일, 전체 요구사항을 고려하여 추정
      if (totalRequirements > 0) {
        const estimatedWeeks = Math.max(4, Math.ceil(mandatoryCount * 1.5 + (totalRequirements - mandatoryCount) * 0.5));
        durationValue = `${estimatedWeeks}주`;
      }
    }

    return {
      total: totalCount,
      mandatory,
      recommended,
      optional,
      projectType:
        projectOverview?.serviceCoreElements?.title ||
        projectData.serviceType ||
        "프로젝트",
      estimatedUsers: estimatedUsersValue,
      duration: durationValue,
    };
  }, [extractedRequirements, projectData.serviceType, projectOverview]);

  // 새로운 견적 계산 로직 (요구사항 기반)
  const estimationResult = useMemo(() => {
    if (!extractedRequirements) {
      // 요구사항이 없으면 기본값 반환
      const baseEstimate = projectOverview?.estimation?.totalCost
        ? parseInt(projectOverview.estimation.totalCost.replace(/[^0-9]/g, "")) || 85000000
        : 85000000;
      
      return {
        totalRequirements: 0,
        totalDays: 60,
        totalHours: 480,
        totalCost: baseEstimate,
        categoryEstimates: [],
        roleBreakdown: [],
        stageBreakdown: [
          {
            stage: "요구사항 분석 및 설계",
            percentage: 20,
            days: 12,
            hours: 96,
            cost: Math.round(baseEstimate * 0.2),
          },
          {
            stage: "개발",
            percentage: 50,
            days: 30,
            hours: 240,
            cost: Math.round(baseEstimate * 0.5),
          },
          {
            stage: "통합 테스트 및 QA",
            percentage: 15,
            days: 9,
            hours: 72,
            cost: Math.round(baseEstimate * 0.15),
          },
          {
            stage: "배포 및 안정화",
            percentage: 15,
            days: 9,
            hours: 72,
            cost: Math.round(baseEstimate * 0.15),
          },
        ],
        paymentSchedule: [
          { stage: "계약 시", percentage: 30, amount: Math.round(baseEstimate * 0.3) },
          { stage: "중간 검수", percentage: 40, amount: Math.round(baseEstimate * 0.4) },
          { stage: "최종 납품", percentage: 30, amount: Math.round(baseEstimate * 0.3) },
        ],
        estimatedDuration: projectOverview?.serviceCoreElements?.estimatedDuration || "12주",
        estimatedWeeks: 12,
        teamSize: projectOverview?.serviceCoreElements?.requiredTeam?.length || 6,
        teamBreakdown: projectOverview?.serviceCoreElements?.requiredTeam?.join(", ") || "개발자 4명, 디자이너 1명, PM 1명",
      };
    }
    
    // 요구사항 기반 견적 계산
    return calculateEstimation(extractedRequirements, customRates);
  }, [extractedRequirements, customRates, projectOverview]);

  // 기존 estimateData 형식으로 변환 (호환성 유지)
  const estimateData = useMemo(() => {
    const baseEstimate = estimationResult.totalCost;
    const stages = estimationResult.stageBreakdown?.map((stage) => ({
      name: stage.stage,
      duration: `${Math.round(stage.days / 5)}주`, // 일을 주로 변환
      percentage: stage.percentage,
      cost: stage.cost,
    })) || [
      {
        name: "요구사항 분석 및 설계",
        duration: "2주",
        percentage: 20,
        cost: Math.round(baseEstimate * 0.2),
      },
      {
        name: "개발",
        duration: "6주",
        percentage: 50,
        cost: Math.round(baseEstimate * 0.5),
      },
      {
        name: "통합 테스트 및 QA",
        duration: "2주",
        percentage: 15,
        cost: Math.round(baseEstimate * 0.15),
      },
      {
        name: "배포 및 안정화",
        duration: "2주",
        percentage: 15,
        cost: Math.round(baseEstimate * 0.15),
      },
    ];

    const payments = estimationResult.paymentSchedule || [
      { stage: "계약 시", percentage: 30, amount: Math.round(baseEstimate * 0.3) },
      { stage: "중간 검수", percentage: 40, amount: Math.round(baseEstimate * 0.4) },
      { stage: "최종 납품", percentage: 30, amount: Math.round(baseEstimate * 0.3) },
    ];

    return {
      baseEstimate,
      discount: 0,
      finalEstimate: baseEstimate,
      stages,
      payments,
      projectOverview: {
        duration: estimationResult.estimatedDuration || "12주",
        period: "2025년 1월~4월",
        personnel: estimationResult.teamSize || 6,
        breakdown: estimationResult.teamBreakdown || "개발자 4명, 디자이너 1명, PM 1명",
        warranty: "1년",
        warrantyDetail: "무상 유지보수",
      },
    };
  }, [estimationResult]);

  // 실제 요구사항 데이터를 기반으로 한 상세 내역 (새로운 계산 로직 사용)
  const requirementsDetails = useMemo(() => {
    if (!extractedRequirements || !estimationResult.categoryEstimates) {
      return [];
    }

    return estimationResult.categoryEstimates.map((categoryEstimate, categoryIndex) => {
      return {
        category: categoryEstimate.category,
        count: categoryEstimate.requirementCount,
        expanded: expandedCategories.has(categoryIndex),
        items: categoryEstimate.requirements.map((reqEffort, reqIndex) => ({
          id: `REQ-${categoryIndex + 1}-${reqIndex + 1}`,
          title: reqEffort.requirement.title,
          description: reqEffort.requirement.description,
          effort: `${Math.round(reqEffort.adjustedDays)}일`,
          cost: reqEffort.cost,
        })),
      };
    });
  }, [estimationResult, expandedCategories]);

  const toggleCategory = (categoryIndex: number) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryIndex)) {
        newSet.delete(categoryIndex);
      } else {
        newSet.add(categoryIndex);
      }
      return newSet;
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR").format(amount) + "원";
  };

  // 견적서 다운로드 함수들
  const handleDownloadPDF = async () => {
    try {
      setShowDownloadMenu(false);
      const markdown = generateEstimateMarkdown(
        estimateData,
        requirementsData,
        projectData,
        projectOverview,
        extractedRequirements
      );

      await downloadMarkdownAsPDF(markdown, {
        filename: `견적서_${projectData.serviceType}_${
          new Date().toISOString().split("T")[0]
        }.pdf`,
        title: `${projectData.serviceType} 프로젝트 견적서`,
        author: "Flowgence",
        subject: "프로젝트 견적서",
      });
    } catch (error) {
      alert("PDF 다운로드에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleDownloadMarkdown = () => {
    try {
      setShowDownloadMenu(false);
      const markdown = generateEstimateMarkdown(
        estimateData,
        requirementsData,
        projectData,
        projectOverview,
        extractedRequirements
      );

      downloadMarkdownAsFile(
        markdown,
        `견적서_${projectData.serviceType}_${
          new Date().toISOString().split("T")[0]
        }.md`
      );
    } catch (error) {
      alert("마크다운 다운로드에 실패했습니다.");
    }
  };

  const handleDownloadHTML = () => {
    try {
      setShowDownloadMenu(false);
      const markdown = generateEstimateMarkdown(
        estimateData,
        requirementsData,
        projectData,
        projectOverview,
        extractedRequirements
      );

      // HTML로 변환
      const html = markdown
        .replace(/^# (.*$)/gim, "<h1>$1</h1>")
        .replace(/^## (.*$)/gim, "<h2>$1</h2>")
        .replace(/^### (.*$)/gim, "<h3>$1</h3>")
        .replace(/^#### (.*$)/gim, "<h4>$1</h4>")
        .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/gim, "<em>$1</em>")
        .replace(/^\- (.*$)/gim, "<li>$1</li>")
        .replace(/^\| (.+) \|$/gim, (match, content) => {
          const cells = content
            .split(" | ")
            .map((cell: string) => `<td>${cell.trim()}</td>`)
            .join("");
          return `<tr>${cells}</tr>`;
        })
        .replace(/\n/gim, "<br>");

      downloadHTMLAsFile(
        html,
        `견적서_${projectData.serviceType}_${
          new Date().toISOString().split("T")[0]
        }.html`
      );
    } catch (error) {
      alert("HTML 다운로드에 실패했습니다.");
    }
  };

  const handleShareToNotion = async () => {
    try {
      setShowDownloadMenu(false);

      // Notion 설정 확인
      const notionSetup = checkNotionSetup();

      if (!notionSetup.isConfigured) {
        // Notion 설정이 안 되어 있는 경우 - 수동 공유로 바로 진행
        const { shareToNotionManually } = await import(
          "@/lib/shareAlternatives"
        );
        const data = {
          title: `${projectData.serviceType} - 프로젝트 견적서`,
          content: `프로젝트: ${
            projectData.serviceType
          }\n총 견적: ${estimateData.finalEstimate.toLocaleString(
            "ko-KR"
          )}원\n\n${projectData.description}`,
          markdown: generateEstimateMarkdown(
            estimateData,
            requirementsData,
            projectData,
            projectOverview,
            extractedRequirements
          ),
          html: generateEstimateMarkdown(
            estimateData,
            requirementsData,
            projectData,
            projectOverview,
            extractedRequirements
          ).replace(/\n/g, "<br>"),
        };
        shareToNotionManually(data);
        return;
      }

      // 로딩 상태 표시
      const button = document.querySelector(
        "[data-notion-share-estimate]"
      ) as HTMLButtonElement;
      if (button) {
        button.textContent = "Notion에 공유 중...";
        button.disabled = true;
      }

      // Notion에 공유
      const notionUrl = await shareEstimateToNotion(
        estimateData,
        requirementsData,
        projectData,
        projectOverview,
        notionSetup.config!,
        extractedRequirements
      );

      // 성공 메시지 표시
      alert(
        `✨ 견적서가 Notion에 성공적으로 공유되었습니다!\n\n페이지 URL: ${notionUrl}\n\n마크다운을 복사하여 다른 페이지에 붙여넣고 싶으신가요?`
      );

      // 마크다운 복사 옵션 제공
      if (confirm("마크다운을 클립보드에 복사하시겠습니까?")) {
        const { copyToClipboard } = await import("@/lib/shareAlternatives");
        const markdown = generateEstimateMarkdown(
          estimateData,
          requirementsData,
          projectData,
          projectOverview,
          extractedRequirements
        );
        const fullMarkdown = `# ${projectData.serviceType} - 프로젝트 견적서\n\n${markdown}`;
        
        const success = await copyToClipboard(fullMarkdown);
        if (success) {
          alert("✅ 마크다운이 클립보드에 복사되었습니다!");
        } else {
          alert("⚠️ 클립보드 복사에 실패했습니다.");
        }
      }

      // 브라우저에서 열기
      if (confirm("브라우저에서 Notion 페이지를 열어보시겠습니까?")) {
        window.open(notionUrl, "_blank");
      }
    } catch (error) {
      alert("Notion 공유에 실패했습니다. 다시 시도해주세요.");
    } finally {
      // 버튼 상태 복원
      const button = document.querySelector(
        "[data-notion-share-estimate]"
      ) as HTMLButtonElement;
      if (button) {
        button.textContent = "Notion으로 공유";
        button.disabled = false;
      }
    }
  };

  const handleAlternativeShare = () => {
    // 공유 데이터 준비
    const shareData = {
      title: `${projectData.serviceType} - 프로젝트 견적서`,
      content: `프로젝트: ${
        projectData.serviceType
      }\n총 견적: ${estimateData.finalEstimate.toLocaleString("ko-KR")}원\n\n${
        projectData.description
      }`,
      markdown: generateEstimateMarkdown(
        estimateData,
        requirementsData,
        projectData,
        projectOverview,
        extractedRequirements
      ),
      html: generateEstimateMarkdown(
        estimateData,
        requirementsData,
        projectData,
        projectOverview,
        extractedRequirements
      ).replace(/\n/g, "<br>"),
    };

    // 공유 옵션 목록 생성
    const shareOptions = getShareOptions(shareData);

    // 공유 옵션 선택 다이얼로그
    const optionNames = shareOptions.map(
      (option) => `${option.icon} ${option.name}`
    );
    const selectedIndex = prompt(
      `다음 중 공유 방법을 선택하세요:\n\n` +
        shareOptions
          .map(
            (option, index) =>
              `${index + 1}. ${option.icon} ${option.name} - ${
                option.description
              }`
          )
          .join("\n") +
        `\n\n번호를 입력하세요 (1-${shareOptions.length}):`
    );

    if (selectedIndex) {
      const index = parseInt(selectedIndex) - 1;
      if (index >= 0 && index < shareOptions.length) {
        shareOptions[index].action();
      } else {
        alert("올바른 번호를 입력해주세요.");
      }
    }
  };

  return (
    <>
      <style jsx>{`
        .confirmation-content::-webkit-scrollbar {
          width: 8px;
        }
        .confirmation-content::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .confirmation-content::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        .confirmation-content::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
      <div className="h-full bg-white flex flex-col">
        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab("requirements")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "requirements"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            확정 요구사항
          </button>
          <button
            onClick={() => setActiveTab("estimate")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "estimate"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            상세 견적
          </button>
          <button
            onClick={() => setActiveTab("wireframe")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "wireframe"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            📱 화면 미리보기
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-250px)] confirmation-content">
        {activeTab === "requirements" ? (
          <div className="p-6">
            {/* Confirmation Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    요구사항이 확정되었습니다
                  </h3>
                  <p className="text-sm text-blue-600 mt-1">
                    확정된 요구사항은 수정할 수 없으며, 변경이 필요한 경우
                    담당자에게 문의하세요.
                  </p>
                </div>
              </div>
            </div>

            {/* Project Summary Cards */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                확정된 프로젝트 요구사항
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">
                    총 요구사항
                  </h3>
                  <div className="text-2xl font-bold text-blue-600">
                    {requirementsData.total || 0}개
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    필수 {requirementsData.mandatory} · 권장{" "}
                    {requirementsData.recommended} · 선택{" "}
                    {requirementsData.optional}
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">
                    프로젝트 유형
                  </h3>
                  <div className="text-lg font-semibold text-gray-900">
                    {requirementsData.projectType}
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">
                    예상 사용자
                  </h3>
                  <div className="text-lg font-semibold text-gray-900">
                    {requirementsData.estimatedUsers}
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">
                    프로젝트 기간
                  </h3>
                  <div className="text-lg font-semibold text-gray-900">
                    {requirementsData.duration}
                  </div>
                </div>
              </div>
            </div>

            {/* Requirements Details */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                요구사항 상세 내역
              </h2>
              {requirementsDetails.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>요구사항이 아직 추출되지 않았습니다.</p>
                  <p className="text-sm mt-2">
                    2단계에서 요구사항을 먼저 추출해주세요.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requirementsDetails.map((category, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg"
                    >
                      <div
                        className="px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => toggleCategory(index)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="text-gray-500 mr-2">
                              {category.expanded ? "▲" : "▼"}
                            </span>
                            <span className="font-medium text-gray-900">
                              {category.category}
                            </span>
                            <span className="ml-2 bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                              {category.count}
                            </span>
                          </div>
                        </div>
                      </div>
                      {category.expanded && (
                        <div className="p-4">
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ID
                                  </th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    요구사항
                                  </th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    공수(M/D)
                                  </th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    견적 금액
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {category.items.map((item, itemIndex) => (
                                  <tr key={itemIndex}>
                                    <td className="px-3 py-3 text-sm font-medium text-gray-900">
                                      {item.id}
                                    </td>
                                    <td className="px-3 py-3 text-sm text-gray-900">
                                      <div>
                                        <div className="font-medium">
                                          {item.title}
                                        </div>
                                        <div className="text-gray-500 text-xs mt-1">
                                          {item.description}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-3 py-3 text-sm text-gray-900">
                                      {item.effort}
                                    </td>
                                    <td className="px-3 py-3 text-sm font-medium text-gray-900">
                                      {formatCurrency(item.cost)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : activeTab === "estimate" ? (
          <div className="p-6">
            {!projectOverview ? (
              <div className="text-center py-8 text-gray-500">
                <p>프로젝트 개요가 아직 생성되지 않았습니다.</p>
                <p className="text-sm mt-2">
                  1단계에서 프로젝트 개요를 먼저 생성해주세요.
                </p>
              </div>
            ) : (
              <>
                {/* 다운로드 버튼 및 단가 설정 */}
                <div className="mb-4 flex justify-end space-x-2">
                  <button
                    onClick={() => setShowRateSettings(!showRateSettings)}
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    {showRateSettings ? "단가 설정 닫기" : "⚙️ 단가 설정"}
                  </button>
                  <div className="relative" ref={downloadMenuRef}>
                      <button
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                        onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        견적서 다운로드
                        <svg
                          className="w-4 h-4 ml-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>

                      {showDownloadMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                          <div className="py-1">
                            <button
                              onClick={handleDownloadPDF}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            >
                              <svg
                                className="w-4 h-4 mr-2 text-red-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              PDF로 다운로드
                            </button>
                            <button
                              onClick={handleDownloadMarkdown}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            >
                              <svg
                                className="w-4 h-4 mr-2 text-blue-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Markdown으로 다운로드
                            </button>
                            <button
                              onClick={handleDownloadHTML}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            >
                              <svg
                                className="w-4 h-4 mr-2 text-green-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              HTML로 다운로드
                            </button>
                            <button
                              onClick={handleShareToNotion}
                              data-notion-share-estimate
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            >
                              <svg
                                className="w-4 h-4 mr-2 text-purple-500"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Notion으로 공유
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                {/* 단가 설정 패널 */}
                {showRateSettings && (
                  <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">
                      역할별 시간당 단가 설정 (원/시간)
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(customRates).map(([role, rate]) => (
                        <div key={role} className="flex items-center space-x-2">
                          <label className="text-sm text-gray-700 w-32 truncate">
                            {role}:
                          </label>
                          <input
                            type="number"
                            value={rate}
                            onChange={(e) => {
                              const newRate = parseInt(e.target.value) || 0;
                              setCustomRates((prev) => ({
                                ...prev,
                                [role]: newRate,
                              }));
                            }}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="0"
                            step="1000"
                          />
                          <span className="text-xs text-gray-500">원</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex justify-end space-x-2">
                      <button
                        onClick={() => setCustomRates(DEFAULT_ROLE_RATES)}
                        className="px-3 py-1 text-sm text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50"
                      >
                        기본값으로 초기화
                      </button>
                    </div>
                  </div>
                )}

                {/* 견적 요약 카드 */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-sm text-blue-600 mb-1">총 견적 금액</div>
                    <div className="text-2xl font-bold text-blue-900">
                      {formatCurrency(estimationResult.totalCost)}
                    </div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-sm text-green-600 mb-1">총 공수</div>
                    <div className="text-2xl font-bold text-green-900">
                      {estimationResult.totalDays}일 ({estimationResult.totalHours}시간)
                    </div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="text-sm text-purple-600 mb-1">예상 기간</div>
                    <div className="text-2xl font-bold text-purple-900">
                      {estimationResult.estimatedDuration}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Stages and Payments */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* 역할별 상세 */}
                    {estimationResult.roleBreakdown && estimationResult.roleBreakdown.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          역할별 상세 내역
                        </h3>
                        <div className="space-y-3">
                          {estimationResult.roleBreakdown.map((role, index) => (
                            <div
                              key={index}
                              className="border border-gray-200 rounded-lg p-4"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {role.role}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {Math.round(role.totalHours)}시간
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm text-gray-500">
                                    {role.percentage.toFixed(1)}%
                                  </div>
                                  <div className="font-semibold text-gray-900">
                                    {formatCurrency(role.totalCost)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Stages */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        단계별 상세 내역
                      </h3>
                      <div className="space-y-3">
                        {estimateData.stages.map((stage, index) => (
                          <div
                            key={index}
                            className="border border-gray-200 rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <span className="text-gray-500 mr-3">
                                  {">"}
                                </span>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {stage.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {stage.duration}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-gray-500">
                                  {stage.percentage}%
                                </div>
                                <div className="font-semibold text-gray-900">
                                  {formatCurrency(stage.cost)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Payment Conditions */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        지불 조건
                      </h3>
                      <div className="space-y-3">
                        {estimateData.payments.map((payment, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between py-2 border-b border-gray-100"
                          >
                            <span className="text-gray-700">
                              {payment.stage}
                            </span>
                            <div className="text-right">
                              <span className="text-sm text-gray-500">
                                {payment.percentage}%
                              </span>
                              <span className="ml-2 font-medium text-gray-900">
                                {formatCurrency(payment.amount)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Project Overview */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      프로젝트 개요
                    </h3>

                    {/* Development Period */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <svg
                          className="w-5 h-5 text-gray-500 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="font-medium text-gray-900">
                          개발 기간
                        </span>
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        {estimateData.projectOverview.duration}
                      </div>
                      <div className="text-sm text-gray-500">
                        {estimateData.projectOverview.period}
                      </div>
                    </div>

                    {/* Personnel */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <svg
                          className="w-5 h-5 text-gray-500 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        <span className="font-medium text-gray-900">
                          투입 인력
                        </span>
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        {estimateData.projectOverview.personnel}명
                      </div>
                      <div className="text-sm text-gray-500">
                        {estimateData.projectOverview.breakdown}
                      </div>
                    </div>

                    {/* Quality Assurance */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <svg
                          className="w-5 h-5 text-gray-500 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                          />
                        </svg>
                        <span className="font-medium text-gray-900">
                          품질 보증
                        </span>
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        {estimateData.projectOverview.warranty}
                      </div>
                      <div className="text-sm text-gray-500">
                        {estimateData.projectOverview.warrantyDetail}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : activeTab === "wireframe" ? (
          <div className="p-6">
            <div className="space-y-6">
              {/* 안내 메시지 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-blue-600 text-xl">📱</span>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-blue-800 mb-1">
                      화면 미리보기 (로파이 와이어프레임)
                    </h3>
                    <p className="text-sm text-blue-600">
                      AI가 요구사항을 기반으로 메인 화면의 구조를 자동으로 생성합니다.
                      실제 디자인은 개발 단계에서 세부적으로 진행됩니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* 초기 상태: 생성 버튼 */}
              {!wireframe && !isGeneratingWireframe && !wireframeError && (
                <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-6xl mb-4">🎨</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    AI가 화면을 자동으로 그려드립니다
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    요구사항을 분석하여 최적의 레이아웃을 구성합니다
                  </p>
                  <button
                    onClick={onGenerateWireframe}
                    disabled={!savedProjectId}
                    className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    와이어프레임 생성하기
                  </button>
                  {!savedProjectId && (
                    <p className="text-sm text-red-600 mt-3">
                      ⚠️ 프로젝트를 먼저 저장해주세요
                    </p>
                  )}
                </div>
              )}

              {/* 로딩 상태 */}
              {isGeneratingWireframe && (
                <div className="flex flex-col items-center justify-center py-20 gap-6">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-24 w-24 border-4 border-t-transparent border-indigo-600"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl">📱</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xl text-gray-800 font-semibold mb-2">
                      AI가 화면을 그리고 있습니다...
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      요구사항을 분석하고 최적의 레이아웃을 구성하고 있습니다
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      예상 소요 시간: 10-15초
                    </p>
                  </div>
                </div>
              )}

              {/* 에러 상태 */}
              {wireframeError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
                  <div className="text-5xl mb-4">⚠️</div>
                  <p className="text-red-800 font-medium mb-2 text-lg">
                    와이어프레임 생성 실패
                  </p>
                  <p className="text-sm text-red-600 mb-6">{wireframeError}</p>
                  <button
                    onClick={onGenerateWireframe}
                    className="px-6 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
                  >
                    다시 시도
                  </button>
                </div>
              )}

              {/* 완료 상태: 와이어프레임 표시 및 편집 */}
              {wireframe && !isGeneratingWireframe && savedProjectId && onApplyEdit && (
                <div className="space-y-6">
                  {/* 다시 생성 버튼 */}
                  <div className="flex justify-end">
                    <button
                      onClick={onRegenerateWireframe}
                      className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                    >
                      <span>🔄</span>
                      <span>다시 생성</span>
                    </button>
                  </div>

                  {/* 와이어프레임 편집기 */}
                  <WireframeEditor
                    wireframe={wireframe}
                    projectId={savedProjectId}
                    isApplying={isApplyingEdit || false}
                    onApplyEdit={onApplyEdit}
                  />

                  {/* 정보 패널 */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-blue-600 text-xl">💡</span>
                      <div className="flex-1 text-sm text-blue-800">
                        <p className="font-medium mb-2">와이어프레임 정보</p>
                        <ul className="list-disc list-inside space-y-1 text-blue-700">
                          <li>
                            이것은 <strong>로파이(저해상도) 와이어프레임</strong>입니다
                          </li>
                          <li>화면 구조와 주요 요소 배치를 확인할 수 있습니다</li>
                          <li>
                            실제 디자인은 개발 단계에서 세부적으로 진행됩니다
                          </li>
                          <li>
                            만족스럽지 않다면 &quot;다시 생성&quot; 버튼을 눌러주세요
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
        <div className="flex justify-between">
          <button
            onClick={onPrevStep}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            이전 단계
          </button>
          <button
            onClick={onNextStep}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            최종 승인 및 계약
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
