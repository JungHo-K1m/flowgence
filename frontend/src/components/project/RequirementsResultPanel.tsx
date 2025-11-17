"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { ExtractedRequirements, NonFunctionalRequirement } from "@/types/requirements";
import { generateRequirementsMarkdown } from "@/lib/requirementsMarkdownGenerator";
import { downloadMarkdownAsPDF } from "@/lib/pdfGenerator";
import { shareRequirementsToNotion } from "@/lib/notionService";
import { checkNotionSetup } from "@/lib/notionConfig";
import { getShareOptions, showNotionGuide } from "@/lib/shareAlternatives";
import { getNotionConnection, startNotionOAuth } from "@/lib/notionOAuth";
import { ShareOptionsModal } from "@/components/ui/ShareOptionsModal";
import { WireframeSpec } from "@/types/wireframe";
import { LoFiCanvas } from "@/components/wireframe/LoFiCanvas";
import { toPng } from "html-to-image";
import { UserJourneyMermaidDiagram } from "./UserJourneyMermaidDiagram";
import { mermaidToImage } from "@/lib/mermaidImageGenerator";
import { generateUserJourneyMermaidDefault } from "@/lib/mermaidGenerator";

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
  mermaidImage?: string; // Mermaid 다이어그램 이미지 (Base64)
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
  const wireframeContainerRef = useRef<HTMLDivElement>(null);

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

  // 와이어프레임을 이미지로 변환 (실제 렌더링된 컴포넌트 캡처)
  useEffect(() => {
    if (!wireframe || !wireframe.screens || wireframe.screens.length === 0) {
      setWireframeImageUrl(null);
      setIsGeneratingImage(false);
      return;
    }

    // ref가 설정될 때까지 대기하는 함수
    const waitForRefAndCapture = () => {
      if (!wireframeContainerRef.current) {
        // ref가 아직 설정되지 않았으면 100ms 후 다시 시도
        setTimeout(waitForRefAndCapture, 100);
        return;
      }

      // ref가 설정되었으면 이미지 생성 시작
      
      setIsGeneratingImage(true);
      setWireframeImageUrl(null); // 이전 이미지 초기화
      
      // 실제 렌더링된 컴포넌트를 이미지로 변환
      const captureImage = async () => {
        let loadingOverlay: HTMLElement | null = null;
        try {
          const container = wireframeContainerRef.current;
          if (!container) {
            throw new Error("컨테이너를 찾을 수 없습니다");
          }

          // DOM이 완전히 렌더링될 때까지 대기
          await new Promise((resolve) => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  resolve(undefined);
                });
              });
            });
          });

          // 추가 대기 시간 (모든 화면이 렌더링될 때까지)
          await new Promise((resolve) => setTimeout(resolve, 800));

          // 로딩 오버레이 제거 (이미지 캡처 전)
          loadingOverlay = container.parentElement?.querySelector('.loading-overlay') as HTMLElement | null;
          if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
          }

          // 컨테이너 크기 확인
          const width = container.scrollWidth || container.offsetWidth || 1200;
          const height = container.scrollHeight || container.offsetHeight || 800;

          // 이미지로 변환
          const dataUrl = await toPng(container, {
            quality: 1.0,
            pixelRatio: 2, // 2배 해상도
            backgroundColor: "white",
            cacheBust: true,
            width: width,
            height: height,
          });


          // 로딩 오버레이 복원 (캡처 후)
          if (loadingOverlay) {
            loadingOverlay.style.display = '';
          }

          if (dataUrl && dataUrl.startsWith("data:image/")) {
            setWireframeImageUrl(dataUrl);
            setIsGeneratingImage(false); // 성공 시 즉시 false로 설정
          } else {
            console.error("생성된 이미지가 올바른 형식이 아닙니다:", dataUrl?.substring(0, 100));
            setIsGeneratingImage(false);
          }
        } catch (error) {
          console.error("와이어프레임 이미지 생성 실패:", error);
          setWireframeImageUrl(null);
          setIsGeneratingImage(false);
          
          // 에러 발생 시에도 로딩 오버레이 복원
          if (loadingOverlay) {
            loadingOverlay.style.display = '';
          }
        }
      };

      // 약간의 지연 후 캡처 (컴포넌트가 완전히 렌더링된 후)
      setTimeout(captureImage, 500);
    };

    // 초기 체크 시작
    waitForRefAndCapture();
  }, [wireframe]);

  const sections = [
    { id: "overview", label: "개요" },
    { id: "scope", label: "범위" },
    { id: "functional", label: "기능 요구사항" },
    { id: "non-functional", label: "비기능 요구사항" },
    { id: "screens", label: "화면 목록" },
    { 
      id: "user-journey", 
      label: "사용자 여정", 
      hidden: !projectOverview?.userJourney?.steps || projectOverview.userJourney.steps.length === 0 
    },
    { id: "wireframe", label: "화면 미리보기", hidden: !wireframe },
    { id: "data-model", label: "데이터 모델" },
  ];

  const handleExportPDF = async () => {
    try {
      // 와이어프레임 이미지 사용 (이미 생성된 이미지가 있으면 재사용)
      let wireframeImage: string | undefined;
      if (wireframe && wireframeImageUrl) {
        wireframeImage = wireframeImageUrl;
      }

      // Mermaid 다이어그램 이미지 변환 (저장된 이미지 우선 사용)
      let mermaidImage: string | undefined;
      
      // 프로젝트 개요에 저장된 이미지가 있으면 사용
      if (projectOverview?.mermaidImage && projectOverview.mermaidImage.startsWith('data:image')) {
        mermaidImage = projectOverview.mermaidImage;
      } else if (projectOverview?.userJourney?.steps && projectOverview.userJourney.steps.length > 0) {
        // 저장된 이미지가 없으면 새로 생성
        const mermaidCode = generateUserJourneyMermaidDefault(projectOverview.userJourney.steps);
        
        if (mermaidCode && mermaidCode.trim()) {
          // 최대 3번 재시도
          let retryCount = 0;
          const maxRetries = 3;
          
          while (retryCount <= maxRetries && !mermaidImage) {
            try {
              mermaidImage = await mermaidToImage(mermaidCode, {
                theme: "default",
                backgroundColor: "white",
                scale: 2, // 고해상도
              });
              
              if (mermaidImage && mermaidImage.startsWith('data:image')) {
                break; // 성공하면 루프 종료
              } else {
                mermaidImage = undefined; // 유효하지 않은 이미지는 undefined로 설정
              }
            } catch (mermaidError) {
              console.error(`PDF 생성 - Mermaid 다이어그램 이미지 변환 실패 (시도 ${retryCount + 1}):`, mermaidError);
              mermaidImage = undefined;
            }
            
            retryCount++;
            
            // 재시도 전 대기
            if (retryCount <= maxRetries && !mermaidImage) {
              await new Promise((resolve) => setTimeout(resolve, retryCount * 500));
            }
          }
        }
      }

      // TODO: 나중에 다시 확인 - PDF에 이미지 표시 부분 주석처리
      const markdown = generateRequirementsMarkdown(
        requirementsData,
        projectData,
        extractedRequirements,
        projectOverview,
        wireframe,
        undefined, // wireframeImage - PDF 표시 주석처리 (나중에 다시 확인)
        undefined // mermaidImage - PDF 표시 주석처리 (나중에 다시 확인)
      );

      // TODO: 나중에 다시 확인 - 이미지 디버깅 로그 주석처리
      // 디버깅: 마크다운에 이미지가 포함되었는지 확인
      // if (wireframeImage) {
      //   const hasImageInMarkdown = markdown.includes(wireframeImage.substring(0, 50));
      //   console.log("마크다운에 와이어프레임 이미지 포함 여부:", {
      //     hasImage: hasImageInMarkdown,
      //     markdownLength: markdown.length,
      //     imageInMarkdown: markdown.includes('<img'),
      //   });
      // }
      
      // if (mermaidImage) {
      //   // 이미지가 마크다운에 포함되었는지 여러 방법으로 확인
      //   const imageStart = mermaidImage.substring(0, 50);
      //   const imageEnd = mermaidImage.substring(mermaidImage.length - 50);
      //   const hasMermaidImageInMarkdown = markdown.includes(imageStart) || markdown.includes(imageEnd);
      //   const hasImgTag = markdown.includes('<img');
      //   const hasMermaidPreview = markdown.includes('mermaid-preview');
      //   const hasDataImage = markdown.includes('data:image');
        
      //   console.log("마크다운에 Mermaid 이미지 포함 여부:", {
      //     hasImage: hasMermaidImageInMarkdown,
      //     hasImgTag,
      //     hasMermaidPreview,
      //     hasDataImage,
      //     imageInMarkdown: hasMermaidImageInMarkdown || hasImgTag || hasDataImage,
      //     mermaidImageLength: mermaidImage.length,
      //     markdownLength: markdown.length,
      //     imageStartInMarkdown: markdown.includes(imageStart),
      //     imageEndInMarkdown: markdown.includes(imageEnd),
      //   });
        
      //   // 이미지가 포함되지 않았다면 경고
      //   if (!hasMermaidImageInMarkdown && !hasImgTag && !hasDataImage) {
      //     console.error("⚠️ Mermaid 이미지가 마크다운에 포함되지 않았습니다!");
      //     console.log("마크다운 샘플:", markdown.substring(markdown.indexOf('사용자 여정'), markdown.indexOf('사용자 여정') + 500));
      //   }
      // } else {
      //   console.log("마크다운에 Mermaid 코드 블록 포함 여부:", {
      //     hasMermaidCode: markdown.includes('```mermaid'),
      //     hasMermaidPreview: markdown.includes('mermaid-preview'),
      //   });
      // }

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
      // 사용자별 Notion 연결 확인
      const connection = await getNotionConnection();

      if (!connection.connected) {
        // Notion 계정이 연결되지 않은 경우
        const shouldConnect = confirm(
          "Notion 계정이 연결되지 않았습니다.\n\n" +
          "Notion 계정을 연결하시겠습니까?\n\n" +
          "확인: Notion 계정 연결하기\n" +
          "취소: 취소"
        );

        if (shouldConnect) {
          // OAuth 인증 시작
          await startNotionOAuth();
          return; // 리디렉션되므로 여기까지 도달하지 않음
        } else {
          return; // 취소
        }
      }

      // 로딩 상태 표시
      const button = document.querySelector(
        "[data-notion-share]"
      ) as HTMLButtonElement;
      if (button) {
        button.textContent = "Notion에 공유 중...";
        button.disabled = true;
      }

      // 마크다운 생성
      const markdown = generateRequirementsMarkdown(
        requirementsData,
        projectData,
        extractedRequirements,
        projectOverview,
        wireframe
      );

      // 백엔드 API를 통해 Notion에 공유
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}/notion/share/requirements`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          title: `${requirementsData.projectName} - 요구사항 명세서`,
          description: `프로젝트 요구사항 명세서 (${projectData.serviceType})`,
          projectType: projectData.serviceType,
          markdown: markdown,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Notion 공유 실패');
      }

      const result = await response.json();

      // 성공 메시지 표시
      alert(
        `Notion에 성공적으로 공유되었습니다!\n\n페이지 URL: ${result.pageUrl}\n\n브라우저에서 열어보시겠습니까?`
      );

      // 브라우저에서 열기
      if (confirm("브라우저에서 Notion 페이지를 열어보시겠습니까?")) {
        window.open(result.pageUrl, "_blank");
      }
    } catch (error) {
      console.error("Notion 공유 실패:", error);
      alert(error instanceof Error ? error.message : "Notion 공유에 실패했습니다. 다시 시도해주세요.");
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

            {/* User Journey Section */}
            {projectOverview?.userJourney?.steps && projectOverview.userJourney.steps.length > 0 && (
              <section id="user-journey" className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  🗺️ 사용자 여정 (User Journey)
                </h2>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <span className="text-blue-600 text-xl">💡</span>
                    <div className="flex-1 text-sm text-blue-800">
                      <p className="font-medium mb-1">사용자 여정 다이어그램</p>
                      <ul className="list-disc list-inside space-y-1 text-blue-700">
                        <li>사용자가 서비스를 이용하는 전체 흐름을 시각화합니다</li>
                        <li>각 단계별 사용자 행동과 시스템 응답을 확인할 수 있습니다</li>
                        <li>PDF 다운로드 시 다이어그램이 포함됩니다</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6">
                  {/* 저장된 이미지가 있으면 이미지 표시, 없으면 다이어그램 렌더링 */}
                  {projectOverview?.mermaidImage && projectOverview.mermaidImage.startsWith('data:image') ? (
                    <div className="w-full">
                      <img 
                        src={projectOverview.mermaidImage} 
                        alt="사용자 여정 다이어그램" 
                        className="w-full h-auto rounded-lg border border-gray-200"
                      />
                    </div>
                  ) : (
                    <UserJourneyMermaidDiagram
                      steps={projectOverview.userJourney.steps}
                    />
                  )}
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 text-lg mb-4">
                    단계별 상세 정보
                  </h3>
                  {projectOverview.userJourney.steps.map((step, index) => (
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
                            <strong>예상 소요시간:</strong> {step.estimatedHours}
                          </p>
                        )}
                        {step.requiredSkills && step.requiredSkills.length > 0 && (
                          <p>
                            <strong>필요 기술:</strong> {step.requiredSkills.join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

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
                <div className="flex justify-center bg-gray-50 rounded-lg p-8 border border-gray-200 relative">
                  {wireframe ? (
                    <>
                      {/* 모든 화면을 한 번에 렌더링 (ref로 참조하여 캡처) */}
                      {(!wireframeImageUrl || isGeneratingImage) && (
                        <>
                          {/* 와이어프레임 컨테이너 (캡처 대상) */}
                          <div 
                            ref={wireframeContainerRef}
                            className="w-full flex flex-col items-center gap-8"
                          >
                            {/* 모든 화면을 세로로 나열 */}
                            {wireframe.screens?.map((screen, index) => {
                              const viewport = screen.viewport || wireframe.viewport || { width: 390, height: 844, device: "mobile" as const };
                              const deviceLabel = viewport.device === "mobile" ? "📲 모바일" : 
                                                 viewport.device === "tablet" ? "📱 태블릿" : "💻 웹";
                              
                              return (
                                <div key={screen.id || index} className="flex flex-col items-center gap-2">
                                  <div className="text-sm text-gray-600 font-medium">
                                    {index + 1}. {screen.name} • {deviceLabel} • {viewport.width} × {viewport.height}px
                                  </div>
                                  <div
                                    className="relative border-4 border-gray-800 rounded-2xl shadow-2xl bg-white overflow-hidden"
                                    style={{
                                      width: viewport.width * 0.8,
                                      height: viewport.height * 0.8,
                                    }}
                                  >
                                    {(screen.elements || []).map((el) => {
                                      const style = {
                                        navbar: { bg: "#e0e7ff", border: "#a5b4fc", text: "#3730a3" },
                                        footer: { bg: "#f3f4f6", border: "#d1d5db", text: "#374151" },
                                        button: { bg: "#dbeafe", border: "#93c5fd", text: "#1e40af" },
                                        input: { bg: "#ffffff", border: "#9ca3af", text: "#4b5563" },
                                        list: { bg: "#f9fafb", border: "#d1d5db", text: "#4b5563" },
                                        card: { bg: "#ffffff", border: "#d1d5db", text: "#374151" },
                                        text: { bg: "transparent", border: "transparent", text: "#1f2937" },
                                        image: { bg: "#e5e7eb", border: "#9ca3af", text: "#6b7280" },
                                        chip: { bg: "#fce7f3", border: "#f9a8d4", text: "#9f1239" },
                                        checkbox: { bg: "#ffffff", border: "#9ca3af", text: "#4b5563" },
                                        radio: { bg: "#ffffff", border: "#9ca3af", text: "#4b5563" },
                                        select: { bg: "#ffffff", border: "#9ca3af", text: "#4b5563" },
                                        table: { bg: "#ffffff", border: "#9ca3af", text: "#374151" },
                                        divider: { bg: "#d1d5db", border: "transparent", text: "transparent" },
                                        icon: { bg: "#f3f4f6", border: "#d1d5db", text: "#4b5563" },
                                      }[el.type] || { bg: "#ffffff", border: "#d1d5db", text: "#374151" };
                                      
                                      const icon = {
                                        navbar: "≡", footer: "━", button: "▶", input: "⌨", list: "☰",
                                        card: "□", text: "T", image: "🖼", chip: "◎", checkbox: "☐",
                                        radio: "○", select: "▼", table: "⊞", divider: "─", icon: "★",
                                      }[el.type] || "■";

                                      return (
                                        <div
                                          key={el.id}
                                          className="absolute flex items-center justify-center border-2 rounded-lg"
                                          style={{
                                            left: el.x * 0.8,
                                            top: el.y * 0.8,
                                            width: Math.max(el.w * 0.8, 12),
                                            height: Math.max(el.h * 0.8, 12),
                                            backgroundColor: style.bg,
                                            borderColor: style.border,
                                            color: style.text,
                                            fontSize: Math.max(10, 12 * 0.8),
                                            padding: "4px",
                                          }}
                                        >
                                          <div className="flex items-center gap-1 text-center truncate">
                                            <span className="text-xs opacity-60">{icon}</span>
                                            <span className="font-medium uppercase text-[10px]">{el.type}</span>
                                            {el.label && (
                                              <>
                                                <span className="opacity-50">·</span>
                                                <span className="text-xs">{el.label}</span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {/* 로딩 오버레이 (캡처 대상에서 제외) */}
                          {isGeneratingImage && (
                            <div className="loading-overlay absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-90 rounded-lg pointer-events-none">
                              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                              <p className="text-gray-600 font-medium">이미지 생성 중...</p>
                              <p className="text-sm text-gray-500 mt-1">잠시만 기다려 주세요.</p>
                            </div>
                          )}
                        </>
                      )}
                      {/* 이미지가 생성되면 이미지 표시 */}
                      {wireframeImageUrl && !isGeneratingImage && (
                        <div className="w-full max-w-4xl">
                          <img
                            src={wireframeImageUrl}
                            alt="와이어프레임 미리보기"
                            className="w-full h-auto border border-gray-300 rounded-lg shadow-lg"
                            style={{ maxWidth: "100%", height: "auto", display: "block" }}
                            onLoad={() => {
                              // 이미지 로드 완료
                            }}
                            onError={(e) => {
                              console.error("와이어프레임 이미지 로드 실패:", e);
                              console.error("이미지 URL 길이:", wireframeImageUrl.length);
                              console.error("이미지 URL 시작:", wireframeImageUrl.substring(0, 100));
                              // 이미지 로드 실패 시 fallback으로 LoFiCanvas 표시
                              setWireframeImageUrl(null);
                            }}
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <p>와이어프레임을 불러올 수 없습니다.</p>
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
