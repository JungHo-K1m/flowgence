"use client";

import { useState, useMemo, useEffect } from "react";
import { ExtractedRequirements, NonFunctionalRequirement } from "@/types/requirements";
import { generateRequirementsMarkdown } from "@/lib/requirementsMarkdownGenerator";
import { downloadMarkdownAsPDF } from "@/lib/pdfGenerator";
import { shareRequirementsToNotion } from "@/lib/notionService";
import { checkNotionSetup } from "@/lib/notionConfig";
import { getShareOptions, showNotionGuide } from "@/lib/shareAlternatives";
import { ShareOptionsModal } from "@/components/ui/ShareOptionsModal";
import { WireframeSpec } from "@/types/wireframe";
import { wireframeToImage } from "@/lib/wireframeImageGenerator";

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
  wireframe?: WireframeSpec | null;
}

export function RequirementsResultPanel({
  projectData,
  extractedRequirements,
  projectOverview,
  wireframe,
}: RequirementsResultPanelProps) {
  const [activeSection, setActiveSection] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareData, setShareData] = useState<any>(null);
  const [wireframeImageUrl, setWireframeImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

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
        excluded: [], // 제외 범위는 현재 AI가 생성하지 않음
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
                // 추가 필드
                requester: req.requester,
                initialRequestDate: req.initialRequestDate,
              })) || []
          ) || []
      ) || [
        {
          id: "FR-001",
          name: "기본 기능 1",
          description: "기본 기능 설명",
          priority: "필수",
          requester: undefined,
          initialRequestDate: undefined,
        },
      ],
      nonFunctionalRequirements: extractedRequirements?.nonFunctionalRequirements?.map(nfr => ({
        id: nfr.id,
        category: nfr.category,
        description: nfr.description,
        priority: nfr.priority,
        metrics: nfr.metrics,
      })) || [],
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

  // 와이어프레임을 이미지로 변환
  useEffect(() => {
    if (wireframe && wireframe.screens && wireframe.screens.length > 0) {
      console.log("와이어프레임 이미지 생성 시작:", {
        screenCount: wireframe.screens.length,
        hasWireframe: !!wireframe,
      });
      setIsGeneratingImage(true);
      setWireframeImageUrl(null); // 이전 이미지 초기화
      
      wireframeToImage(wireframe, 2)
        .then((imageUrl) => {
          console.log("와이어프레임 이미지 생성 성공:", {
            imageUrlLength: imageUrl?.length || 0,
            imageUrlPreview: imageUrl?.substring(0, 100),
            isValid: imageUrl?.startsWith("data:image/"),
          });
          
          if (imageUrl && imageUrl.startsWith("data:image/")) {
            setWireframeImageUrl(imageUrl);
          } else {
            console.error("생성된 이미지가 올바른 형식이 아닙니다:", imageUrl?.substring(0, 100));
          }
          setIsGeneratingImage(false);
        })
        .catch((error) => {
          console.error("와이어프레임 이미지 생성 실패:", error);
          setWireframeImageUrl(null);
          setIsGeneratingImage(false);
        });
    } else {
      console.log("와이어프레임이 없어서 이미지 생성 건너뜀:", {
        hasWireframe: !!wireframe,
        screenCount: wireframe?.screens?.length || 0,
      });
      setWireframeImageUrl(null);
    }
  }, [wireframe]);

  const sections = [
    { id: "overview", label: "개요" },
    { id: "scope", label: "범위" },
    { id: "functional", label: "기능 요구사항" },
    { id: "non-functional", label: "비기능 요구사항" },
    { id: "screens", label: "화면 목록" },
    { id: "wireframe", label: "화면 미리보기", hidden: !wireframe },
    { id: "data-model", label: "데이터 모델" },
  ];

  const handleExportPDF = async () => {
    try {
      // 와이어프레임이 있으면 고해상도 이미지로 변환
      // 이미 생성된 이미지가 있으면 재사용, 없으면 새로 생성
      let wireframeImage: string | undefined;
      if (wireframe) {
        try {
          // 이미 생성된 이미지가 있으면 재사용
          if (wireframeImageUrl) {
            wireframeImage = wireframeImageUrl;
            console.log("기존 와이어프레임 이미지 재사용");
          } else {
            console.log("와이어프레임을 이미지로 변환 중...", {
              screenCount: wireframe.screens?.length || 0,
            });
            wireframeImage = await wireframeToImage(wireframe, 2); // 2배 해상도
            
            // Base64 이미지 유효성 검사
            if (wireframeImage && !wireframeImage.startsWith('data:image/')) {
              console.warn("이미지가 올바른 Base64 형식이 아닙니다:", wireframeImage.substring(0, 50));
              wireframeImage = undefined;
            } else if (wireframeImage && wireframeImage.length > 10 * 1024 * 1024) {
              // 10MB 이상인 경우 경고
              console.warn("이미지가 너무 큽니다:", wireframeImage.length, "bytes");
            }
            
            console.log("와이어프레임 이미지 변환 완료", {
              imageLength: wireframeImage?.length || 0,
              imagePreview: wireframeImage?.substring(0, 100) + "...",
              isValidBase64: wireframeImage?.startsWith('data:image/'),
            });
          }
        } catch (imageError) {
          console.error("와이어프레임 이미지 변환 실패, HTML 렌더링 사용:", imageError);
          // 이미지 변환 실패 시 기존 HTML 렌더링 사용
        }
      }

      const markdown = generateRequirementsMarkdown(
        requirementsData,
        projectData,
        extractedRequirements,
        projectOverview,
        wireframe,
        wireframeImage // 고해상도 이미지 전달
      );

      // 디버깅: 마크다운에 이미지가 포함되었는지 확인
      if (wireframeImage) {
        const hasImageInMarkdown = markdown.includes(wireframeImage.substring(0, 50));
        console.log("마크다운에 이미지 포함 여부:", {
          hasImage: hasImageInMarkdown,
          markdownLength: markdown.length,
          imageInMarkdown: markdown.includes('<img'),
        });
      }

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
              projectOverview,
              wireframe
            ),
            html: generateRequirementsMarkdown(
              requirementsData,
              projectData,
              extractedRequirements,
              projectOverview,
              wireframe
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
        wireframe,
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
      projectOverview,
      wireframe
      ),
      html: generateRequirementsMarkdown(
        requirementsData,
        projectData,
        extractedRequirements,
      projectOverview,
      wireframe
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
        // requirements-content 클래스를 가진 스크롤 컨테이너 찾기
        const contentArea = document.querySelector('.requirements-content');
        if (contentArea) {
          // 컨테이너와 요소의 상대 위치를 getBoundingClientRect로 정확히 계산
          const containerRect = contentArea.getBoundingClientRect();
          const elementRect = element.getBoundingClientRect();
          
          // 현재 스크롤 위치 + 요소와 컨테이너 사이의 거리
          const scrollTop = contentArea.scrollTop + (elementRect.top - containerRect.top);
          
          // 스크롤 위치 설정 (상단 여백 20px 추가)
          contentArea.scrollTo({
            top: scrollTop - 20,
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
              {sections.filter((section) => !section.hidden).map((section) => (
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
                {requirementsData.scope.excluded.length > 0 && (
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
                )}
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        요구사항 ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        요구사항명
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        요구사항 내용
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        요청자
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        최초 요청 일자
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        중요도
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requirementsData.functionalRequirements.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {req.id}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900 max-w-[200px]">
                          <div className="line-clamp-2" title={req.name}>
                            {req.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-[300px]">
                          <div className="line-clamp-3" title={req.description}>
                            {req.description}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                          {req.requester || '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          {req.initialRequestDate 
                            ? new Date(req.initialRequestDate).toLocaleDateString('ko-KR')
                            : '-'
                          }
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
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
                {requirementsData.nonFunctionalRequirements.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    비기능 요구사항이 아직 정의되지 않았습니다.
                  </p>
                ) : (
                  requirementsData.nonFunctionalRequirements.map(
                    (req: any, index: number) => (
                      <div
                        key={req.id || index}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium text-gray-900">
                            {req.category}
                          </h3>
                          {req.priority && (
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                req.priority === 'high'
                                  ? 'bg-red-100 text-red-800'
                                  : req.priority === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {req.priority === 'high' ? '높음' : req.priority === 'medium' ? '중간' : '낮음'}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mb-2">{req.description}</p>
                        {req.metrics && (
                          <p className="text-sm text-gray-500 italic">
                            📊 측정 지표: {req.metrics}
                          </p>
                        )}
                      </div>
                    )
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

            {/* Wireframe Section */}
            {wireframe && (
              <section id="wireframe" className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  📱 화면 미리보기 (로파이 와이어프레임)
                </h2>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <span className="text-blue-600 text-xl">💡</span>
                    <div className="flex-1 text-sm text-blue-800">
                      <p className="font-medium mb-1">와이어프레임 정보</p>
                      <ul className="list-disc list-inside space-y-1 text-blue-700">
                        <li>이것은 <strong>로파이(저해상도) 와이어프레임</strong>입니다</li>
                        <li>화면 구조와 주요 요소 배치를 확인할 수 있습니다</li>
                        <li>실제 디자인은 개발 단계에서 세부적으로 진행됩니다</li>
                        <li>PDF 다운로드 시 동일한 이미지가 포함됩니다</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center bg-gray-50 rounded-lg p-8 border border-gray-200">
                  {isGeneratingImage ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                      <p className="text-gray-600">와이어프레임 이미지 생성 중...</p>
                    </div>
                  ) : wireframeImageUrl ? (
                    <div className="w-full max-w-4xl">
                      <img
                        src={wireframeImageUrl}
                        alt="와이어프레임 미리보기"
                        className="w-full h-auto border border-gray-300 rounded-lg shadow-lg"
                        style={{ maxWidth: "100%", height: "auto" }}
                        onLoad={() => {
                          console.log("와이어프레임 이미지 로드 완료");
                        }}
                        onError={(e) => {
                          console.error("와이어프레임 이미지 로드 실패:", e);
                          console.error("이미지 URL:", wireframeImageUrl.substring(0, 100));
                        }}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <p>와이어프레임을 불러올 수 없습니다.</p>
                      <p className="text-sm mt-2">콘솔을 확인해주세요.</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Data Model Section */}
            <section id="data-model" className="mb-24">
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
