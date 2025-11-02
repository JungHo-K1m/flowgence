"use client";

import { useState, useMemo } from "react";
import { ExtractedRequirements } from "@/types/requirements";
import { generateRequirementsMarkdown } from "@/lib/requirementsMarkdownGenerator";
import { downloadMarkdownAsPDF } from "@/lib/pdfGenerator";
import { shareRequirementsToNotion } from "@/lib/notionService";
import { checkNotionSetup } from "@/lib/notionConfig";
import { getShareOptions, showNotionGuide } from "@/lib/shareAlternatives";
import { ShareOptionsModal } from "@/components/ui/ShareOptionsModal";

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

interface RequirementsResultPanelProps {
  projectData: {
    description: string;
    serviceType: string;
    uploadedFiles: File[];
    chatMessages: any[];
  };
  extractedRequirements?: ExtractedRequirements | null;
  projectOverview?: ProjectOverview | null;
}

export function RequirementsResultPanel({
  projectData,
  extractedRequirements,
  projectOverview,
}: RequirementsResultPanelProps) {
  const [activeSection, setActiveSection] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareData, setShareData] = useState<any>(null);

  // 실제 데이터 기반 요구사항 결과
  const requirementsData = useMemo(() => {
    const projectName =
      projectOverview?.serviceCoreElements?.title ||
      projectData.serviceType ||
      "프로젝트";

    const goal =
      projectOverview?.serviceCoreElements?.description ||
      projectData.description ||
      "프로젝트 목표가 설정되지 않았습니다.";

    const valueProposition =
      projectOverview?.serviceCoreElements?.keyFeatures?.join(", ") ||
      "핵심 기능이 정의되지 않았습니다.";

    return {
      projectName,
      overview: {
        goal,
        valueProposition,
      },
      scope: {
        included: extractedRequirements?.categories?.flatMap(
          (category) =>
            category.subCategories?.flatMap(
              (subCategory) =>
                subCategory.requirements?.map((req) => req.title) || []
            ) || []
        ) || ["기본 기능 1", "기본 기능 2", "기본 기능 3"],
        excluded: [
          "오프라인 매장 POS, 복잡한 WMS/OMS 고도화 (기초 재고/출고 연동만)",
          "커뮤니티형 SNS (피드·팔로우 등), 다국가 멀티 통화 완전 대응 (추후 단계)",
          "수의사 상담/처방전 검증 (링크 수준 가이드만 제공)",
        ],
      },
      functionalRequirements: extractedRequirements?.categories?.flatMap(
        (category, categoryIndex) =>
          category.subCategories?.flatMap(
            (subCategory, subIndex) =>
              subCategory.requirements?.map((req, reqIndex) => ({
                id: `FR-${categoryIndex + 1}-${subIndex + 1}-${reqIndex + 1}`,
                name: req.title,
                description: req.description,
                priority:
                  req.priority === "high"
                    ? "필수"
                    : req.priority === "medium"
                    ? "권장"
                    : "선택",
              })) || []
          ) || []
      ) || [
        {
          id: "FR-001",
          name: "기본 기능 1",
          description: "기본 기능 설명",
          priority: "필수",
        },
      ],
      nonFunctionalRequirements: [
        {
          category: "성능",
          description: "모든 페이지는 3초 이내에 로드되어야 한다.",
        },
        {
          category: "보안",
          description: "사용자 비밀번호는 암호화하여 저장해야 한다.",
        },
        {
          category: "사용성",
          description:
            "직관적인 UI/UX를 제공하여 사용자가 쉽게 사용할 수 있어야 한다.",
        },
        {
          category: "호환성",
          description:
            "최신 버전의 Chrome, Firefox, Safari 브라우저와 호환되어야 한다.",
        },
      ],
      screenList: projectOverview?.userJourney?.steps?.map(
        (step) => step.title
      ) || [
        "메인 페이지",
        "로그인 / 회원가입 페이지",
        "상품 상세 페이지",
        "장바구니 페이지",
        "주문/결제 페이지",
        "마이페이지 (프로필·반려동물·주소록)",
      ],
      dataModel: projectOverview?.serviceCoreElements?.techStack
        ? {
            frontend:
              projectOverview.serviceCoreElements.techStack.frontend || [],
            backend:
              projectOverview.serviceCoreElements.techStack.backend || [],
            database:
              projectOverview.serviceCoreElements.techStack.database || [],
            infrastructure:
              projectOverview.serviceCoreElements.techStack.infrastructure ||
              [],
          }
        : {
            frontend: ["React", "Next.js", "TypeScript"],
            backend: ["Node.js", "Express", "PostgreSQL"],
            database: ["PostgreSQL", "Redis"],
            infrastructure: ["AWS", "Docker", "Kubernetes"],
          },
    };
  }, [projectData, extractedRequirements, projectOverview]);

  const sections = [
    { id: "overview", label: "개요" },
    { id: "scope", label: "범위" },
    { id: "functional", label: "기능 요구사항" },
    { id: "non-functional", label: "비기능 요구사항" },
    { id: "screens", label: "화면 목록" },
    { id: "data-model", label: "데이터 모델" },
  ];

  const handleExportPDF = async () => {
    try {
      const markdown = generateRequirementsMarkdown(
        requirementsData,
        projectData,
        extractedRequirements,
        projectOverview
      );

      await downloadMarkdownAsPDF(markdown, {
        filename: `요구사항명세서_${projectData.serviceType}_${
          new Date().toISOString().split("T")[0]
        }.pdf`,
        title: `${projectData.serviceType} 프로젝트 요구사항 명세서`,
        author: "Flowgence",
        subject: "프로젝트 요구사항 명세서",
      });
    } catch (error) {
      console.error("PDF 다운로드 실패:", error);
      alert("PDF 다운로드에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleShareNotion = async () => {
    try {
      // Notion 설정 확인
      const notionSetup = checkNotionSetup();

      if (!notionSetup.isConfigured) {
        // Notion 설정이 안 되어 있는 경우 대안 제공
        const choice = prompt(
          `Notion 공유를 위해서는 설정이 필요합니다.\n\n` +
            `다음 중 선택하세요:\n\n` +
            `1. Notion 사용 가이드 보기\n` +
            `2. 수동으로 Notion에 공유 (클립보드 복사)\n` +
            `3. 다른 방법으로 공유\n\n` +
            `번호를 입력하세요 (1-3):`
        );

        if (choice === "1") {
          showNotionGuide();
          return;
        } else if (choice === "2") {
          // 수동 Notion 공유
          const { shareToNotionManually } = await import(
            "@/lib/shareAlternatives"
          );
          const data = {
            title: `${requirementsData.projectName} - 요구사항 명세서`,
            content: `프로젝트: ${requirementsData.projectName}\n서비스 유형: ${projectData.serviceType}\n\n${requirementsData.overview.goal}`,
            markdown: generateRequirementsMarkdown(
              requirementsData,
              projectData,
              extractedRequirements,
              projectOverview
            ),
            html: generateRequirementsMarkdown(
              requirementsData,
              projectData,
              extractedRequirements,
              projectOverview
            ).replace(/\n/g, "<br>"),
          };
          shareToNotionManually(data);
          return;
        } else if (choice === "3") {
          // 대안 공유 방법 제공
          handleAlternativeShare();
          return;
        } else {
          return; // 취소
        }
      }

      // 로딩 상태 표시
      const originalText = "Notion으로 공유";
      const button = document.querySelector(
        "[data-notion-share]"
      ) as HTMLButtonElement;
      if (button) {
        button.textContent = "Notion에 공유 중...";
        button.disabled = true;
      }

      // Notion에 공유
      const notionUrl = await shareRequirementsToNotion(
        requirementsData,
        projectData,
        extractedRequirements,
        projectOverview,
        notionSetup.config!
      );

      // 성공 메시지 표시
      alert(
        `Notion에 성공적으로 공유되었습니다!\n\n페이지 URL: ${notionUrl}\n\n브라우저에서 열어보시겠습니까?`
      );

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
        "[data-notion-share]"
      ) as HTMLButtonElement;
      if (button) {
        button.textContent = "Notion으로 공유";
        button.disabled = false;
      }
    }
  };

  const handleAlternativeShare = () => {
    // 공유 데이터 준비
    const data = {
      title: `${requirementsData.projectName} - 요구사항 명세서`,
      content: `프로젝트: ${requirementsData.projectName}\n서비스 유형: ${projectData.serviceType}\n\n${requirementsData.overview.goal}`,
      markdown: generateRequirementsMarkdown(
        requirementsData,
        projectData,
        extractedRequirements,
        projectOverview
      ),
      html: generateRequirementsMarkdown(
        requirementsData,
        projectData,
        extractedRequirements,
        projectOverview
      ).replace(/\n/g, "<br>"),
    };

    setShareData(data);
    setShowShareModal(true);
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    // 약간의 지연을 두어 DOM이 업데이트된 후 스크롤
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        // 컨텐츠 영역 내에서 스크롤
        const contentArea = element.closest(".flex-1.overflow-y-auto");
        if (contentArea) {
          const rect = element.getBoundingClientRect();
          const absoluteElementTop = rect.top + window.pageYOffset;
          const absoluteContentTop =
            (contentArea as HTMLElement).getBoundingClientRect().top +
            window.pageYOffset;
          const relativeTop = absoluteElementTop - absoluteContentTop;

          (contentArea as HTMLElement).scrollTo({
            top: relativeTop - 20,
            behavior: "smooth",
          });
        }
      }
    }, 100);
  };

  return (
    <>
      <style jsx>{`
        .requirements-content::-webkit-scrollbar {
          width: 8px;
        }
        .requirements-content::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .requirements-content::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        .requirements-content::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
      <div className="h-full bg-white flex">
        {/* Left Sidebar */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
          {/* Project Selection */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                {requirementsData.projectName}
              </h2>
              <svg
                className="w-4 h-4 text-gray-500"
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
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="flex-1 p-4">
            <nav className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeSection === section.id
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col mb-4">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  요구사항 결과 페이지
                </h1>
                <p className="text-gray-600 mt-1">
                  프로젝트 요구사항 및 견적 결과
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleExportPDF}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
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
                  PDF로 내보내기
                </button>
                <button
                  onClick={handleShareNotion}
                  data-notion-share
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
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
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                    />
                  </svg>
                  Notion으로 공유
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="mt-4">
              <input
                type="text"
                placeholder="검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 max-h-[calc(100vh-200px)] requirements-content">
            {/* Overview Section */}
            <section id="overview" className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">개요</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">목표</h3>
                  <p className="text-gray-600">
                    {requirementsData.overview.goal}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">가치 제안</h3>
                  <p className="text-gray-600">
                    {requirementsData.overview.valueProposition}
                  </p>
                </div>
              </div>
            </section>

            {/* Scope Section */}
            <section id="scope" className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">범위</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">
                    포함 범위 (Included Scope)
                  </h3>
                  <ul className="space-y-2">
                    {requirementsData.scope.included.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-2 mt-1">•</span>
                        <span className="text-gray-600">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">
                    제외 범위 (Excluded Scope)
                  </h3>
                  <ul className="space-y-2">
                    {requirementsData.scope.excluded.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-red-500 mr-2 mt-1">•</span>
                        <span className="text-gray-600">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Functional Requirements Section */}
            <section id="functional" className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                기능 요구사항
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        요구사항명
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        설명
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        우선순위
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requirementsData.functionalRequirements.map((req) => (
                      <tr key={req.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {req.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {req.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {req.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              req.priority === "필수"
                                ? "bg-red-100 text-red-800"
                                : req.priority === "권장"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {req.priority}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Non-functional Requirements Section */}
            <section id="non-functional" className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                비기능 요구사항
              </h2>
              <div className="space-y-4">
                {requirementsData.nonFunctionalRequirements.map(
                  (req, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <h3 className="font-medium text-gray-900 mb-2">
                        {req.category}
                      </h3>
                      <p className="text-gray-600">{req.description}</p>
                    </div>
                  )
                )}
              </div>
            </section>

            {/* Screen List Section */}
            <section id="screens" className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                화면 목록
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {requirementsData.screenList.map((screen, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 text-center"
                  >
                    <span className="text-gray-900">{screen}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Data Model Section */}
            <section id="data-model" className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                기술 스택 및 데이터 모델
              </h2>
              {requirementsData.dataModel ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      프론트엔드
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {requirementsData.dataModel.frontend.map(
                        (tech, index) => (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full"
                          >
                            {tech}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">백엔드</h3>
                    <div className="flex flex-wrap gap-2">
                      {requirementsData.dataModel.backend.map((tech, index) => (
                        <span
                          key={index}
                          className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      데이터베이스
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {requirementsData.dataModel.database.map(
                        (tech, index) => (
                          <span
                            key={index}
                            className="bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full"
                          >
                            {tech}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">인프라</h3>
                    <div className="flex flex-wrap gap-2">
                      {requirementsData.dataModel.infrastructure.map(
                        (tech, index) => (
                          <span
                            key={index}
                            className="bg-orange-100 text-orange-800 text-sm px-3 py-1 rounded-full"
                          >
                            {tech}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>기술 스택 정보가 아직 설정되지 않았습니다.</p>
                  <p className="text-sm mt-2">
                    프로젝트 개요에서 기술 스택을 먼저 설정해주세요.
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* Share Options Modal */}
      {shareData && (
        <ShareOptionsModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          shareData={shareData}
          shareOptions={getShareOptions(shareData)}
        />
      )}
    </>
  );
}
