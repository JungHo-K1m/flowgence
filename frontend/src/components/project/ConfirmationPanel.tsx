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
}

export function ConfirmationPanel({
  onNextStep,
  onPrevStep,
  currentStep,
  projectData,
  extractedRequirements,
  projectOverview,
}: ConfirmationPanelProps) {
  const [activeTab, setActiveTab] = useState<"requirements" | "estimate">(
    "requirements"
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(
    new Set([0])
  ); // 첫 번째 카테고리만 기본으로 확장
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

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

    const totalCount = extractedRequirements.totalCount;
    const mandatory = extractedRequirements.categories.reduce(
      (acc, category) =>
        acc +
        category.subCategories.reduce(
          (subAcc, subCategory) =>
            subAcc +
            subCategory.requirements.filter((req) => req.priority === "high")
              .length,
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
            subCategory.requirements.filter((req) => req.priority === "medium")
              .length,
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
            subCategory.requirements.filter((req) => req.priority === "low")
              .length,
          0
        ),
      0
    );

    return {
      total: totalCount,
      mandatory,
      recommended,
      optional,
      projectType:
        projectOverview?.serviceCoreElements?.title ||
        projectData.serviceType ||
        "프로젝트",
      estimatedUsers:
        projectOverview?.serviceCoreElements?.targetUsers?.join(", ") || "미정",
      duration:
        projectOverview?.serviceCoreElements?.estimatedDuration ||
        projectOverview?.estimation?.timeline?.development ||
        "미정",
    };
  }, [extractedRequirements, projectData.serviceType, projectOverview]);

  // 실제 데이터 기반 견적 정보
  const estimateData = useMemo(() => {
    const baseEstimate = projectOverview?.estimation?.totalCost
      ? parseInt(projectOverview.estimation.totalCost.replace(/[^0-9]/g, "")) ||
        85000000
      : 85000000;

    const stages = [
      {
        name: "요구사항 분석 및 설계",
        duration: projectOverview?.estimation?.timeline?.planning || "2주",
        percentage: 20,
        cost: Math.round(baseEstimate * 0.2),
      },
      {
        name: "개발",
        duration: projectOverview?.estimation?.timeline?.development || "6주",
        percentage: 50,
        cost: Math.round(baseEstimate * 0.5),
      },
      {
        name: "통합 테스트 및 QA",
        duration: projectOverview?.estimation?.timeline?.testing || "2주",
        percentage: 15,
        cost: Math.round(baseEstimate * 0.15),
      },
      {
        name: "배포 및 안정화",
        duration: projectOverview?.estimation?.timeline?.deployment || "2주",
        percentage: 15,
        cost: Math.round(baseEstimate * 0.15),
      },
    ];

    const payments = [
      {
        stage: "계약 시",
        percentage: 30,
        amount: Math.round(baseEstimate * 0.3),
      },
      {
        stage: "중간 검수",
        percentage: 40,
        amount: Math.round(baseEstimate * 0.4),
      },
      {
        stage: "최종 납품",
        percentage: 30,
        amount: Math.round(baseEstimate * 0.3),
      },
    ];

    const teamSize =
      projectOverview?.serviceCoreElements?.requiredTeam?.length || 6;
    const teamBreakdown =
      projectOverview?.serviceCoreElements?.requiredTeam?.join(", ") ||
      "개발자 4명, 디자이너 1명, PM 1명";

    return {
      baseEstimate,
      discount: 0,
      finalEstimate: baseEstimate,
      stages,
      payments,
      projectOverview: {
        duration:
          projectOverview?.serviceCoreElements?.estimatedDuration || "12주",
        period: "2025년 1월~4월", // 실제 날짜 계산 로직 추가 가능
        personnel: teamSize,
        breakdown: teamBreakdown,
        warranty: "1년",
        warrantyDetail: "무상 유지보수",
      },
    };
  }, [projectOverview]);

  // 실제 요구사항 데이터를 기반으로 한 상세 내역
  const requirementsDetails = useMemo(() => {
    if (!extractedRequirements) {
      return [];
    }

    return extractedRequirements.categories.map((category, categoryIndex) => {
      const allRequirements = category.subCategories.flatMap(
        (subCategory) => subCategory.requirements
      );
      const totalCost = allRequirements.length * 1000000; // 기본 견적: 요구사항당 100만원

      return {
        category: category.majorCategory,
        count: allRequirements.length,
        expanded: expandedCategories.has(categoryIndex),
        items: allRequirements.map((requirement, reqIndex) => ({
          id: `REQ-${categoryIndex + 1}-${reqIndex + 1}`,
          title: requirement.title,
          description: requirement.description,
          effort:
            requirement.priority === "high"
              ? "5일"
              : requirement.priority === "medium"
              ? "3일"
              : "2일",
          cost:
            requirement.priority === "high"
              ? 1500000
              : requirement.priority === "medium"
              ? 1000000
              : 500000,
        })),
      };
    });
  }, [extractedRequirements, expandedCategories]);

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
      console.error("PDF 다운로드 실패:", error);
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
      console.error("마크다운 다운로드 실패:", error);
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
      console.error("HTML 다운로드 실패:", error);
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
      console.error("Notion 공유 실패:", error);
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
                    {requirementsData.total}개
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
        ) : (
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
                {/* Estimate Summary */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-purple-900 mb-4">
                        견적 요약
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-purple-700">기본 견적</span>
                          <span className="font-semibold text-purple-900">
                            {formatCurrency(estimateData.baseEstimate)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-purple-700">할인</span>
                          <span className="font-semibold text-purple-900">
                            - {formatCurrency(estimateData.discount)}
                          </span>
                        </div>
                        <div className="border-t border-purple-200 pt-2 mt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-semibold text-purple-900">
                              최종 견적
                            </span>
                            <span className="text-xl font-bold text-purple-900">
                              = {formatCurrency(estimateData.finalEstimate)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
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
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - Stages and Payments */}
                  <div className="lg:col-span-2 space-y-6">
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
        )}
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
