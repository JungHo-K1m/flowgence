"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { LoginRequiredModal } from "@/components/auth/LoginRequiredModal";
import { useAuthGuard } from "@/hooks/useAuthGuard";

interface Requirement {
  id: string;
  title: string;
  description: string;
  category?: string;
  priority: "high" | "medium" | "low";
  needsClarification?: boolean;
  clarificationQuestions?: string[];
  status?: "draft" | "review" | "approved" | "rejected" | "implemented";
}

interface MajorCategory {
  majorCategory?: string;
  category?: string;
  subCategories?: SubCategory[];
}

interface SubCategory {
  subCategory?: string;
  subcategory?: string;
  requirements?: Requirement[];
}

interface ChatMessage {
  id?: string;
  type?: string;
  content?: string;
  timestamp?: string;
}

interface ProjectData {
  description?: string;
  serviceType?: string;
  uploadedFiles?: File[];
  chatMessages?: ChatMessage[];
}

interface RequirementsPanelProps {
  onNextStep?: () => void;
  onPrevStep?: () => void;
  currentStep?: number;
  projectData?: ProjectData; // 프로젝트 데이터 전달
  requirementsData?: unknown; // 요구사항 데이터 (editableRequirements || extractedRequirements)
  onOpenEditModal?: (category: string) => void; // 편집 모달 열기
  onDeleteCategory?: (categoryId: string) => void; // 중분류 삭제
  isNextButtonEnabled?: boolean; // 다음 단계 버튼 활성화 여부
  isLoading?: boolean; // API 응답 대기 중 여부
}

export function RequirementsPanel({
  onNextStep,
  onPrevStep,
  currentStep = 2,
  projectData,
  requirementsData,
  onOpenEditModal,
  onDeleteCategory,
  isNextButtonEnabled = false,
  isLoading = false,
}: RequirementsPanelProps) {
  // 디버깅: 요구사항 데이터 로그
  const data = requirementsData as any;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(
      data?.categories
        ? [
            data.categories[0]?.majorCategory
              ?.toLowerCase()
              ?.replace(/\s+/g, "_") || "product",
          ]
        : ["product"]
    )
  );

  // 인증 가드
  const { showLoginModal, requireAuth, closeLoginModal } = useAuthGuard();
  console.log("RequirementsPanel - requirementsData:", requirementsData);
  console.log(
    "RequirementsPanel - requirementsData?.categories:",
    data?.categories
  );
  console.log(
    "RequirementsPanel - requirementsData?.categories?.length:",
    data?.categories?.length
  );

  // 요구사항 데이터가 있으면 사용, 없으면 샘플 데이터 사용
  const allRequirements: Requirement[] = useMemo(() => {
    if (!data?.categories || data.categories.length === 0) {
      return [
        {
          id: "1",
          title: "상품 등록/수정",
          description: "상품 기본 정보 등록 및 옵션 관리",
          category: "product",
          priority: "high",
          needsClarification: false,
          clarificationQuestions: [],
        },
        {
          id: "2",
          title: "성분/영양 관리",
          description: "성분 비교 필터, 알러지 태그 등록",
          category: "product",
          priority: "medium",
          needsClarification: true,
          clarificationQuestions: [
            "어떤 성분 정보를 제공하나요?",
            "알러지 정보는 어떻게 관리하나요?",
          ],
        },
        {
          id: "3",
          title: "재고 부족 알림",
          description: "재고 임계치 도달 시 자동 알림",
          category: "product",
          priority: "high",
          needsClarification: false,
          clarificationQuestions: [],
        },
        {
          id: "4",
          title: "상품 카테고리 관리",
          description: "상품 분류 체계 및 카테고리 트리 관리",
          category: "product",
          priority: "medium",
          needsClarification: true,
          clarificationQuestions: ["카테고리 구조는 어떻게 구성하나요?"],
        },
      ];
    }

    return data.categories.flatMap((majorCategory: MajorCategory) => {
      // majorCategory가 undefined인 경우 빈 배열 반환
      if (!majorCategory || !majorCategory.subCategories) return [];

      return majorCategory.subCategories.flatMap((subCategory: SubCategory) => {
        // subCategory가 undefined인 경우 빈 배열 반환
        if (!subCategory || !subCategory.requirements) return [];

        return subCategory.requirements.map(
          (req: Requirement, index: number) => {
            // req가 undefined인 경우 안전하게 처리
            if (!req) {
              return {
                id: `empty-${index}`,
                title: "빈 요구사항",
                description: "요구사항 데이터가 없습니다",
                category: "unknown",
                priority: "low" as const,
                needsClarification: false,
                clarificationQuestions: [],
              };
            }

            // 편집된 요구사항의 경우 needsClarification을 false로 강제 설정
            const isEdited =
              req.status === "approved" || req.needsClarification === false;

            return {
              id:
                req.id ||
                `${majorCategory.majorCategory || majorCategory.category}-${
                  subCategory.subCategory || subCategory.subcategory
                }-${index}`,
              title: req.title || "제목 없음",
              description: req.description || "설명 없음",
              category:
                (majorCategory.majorCategory || majorCategory.category)
                  ?.toLowerCase()
                  ?.replace(/\s+/g, "_") || "unknown",
              priority:
                req.priority === "high"
                  ? ("high" as const)
                  : req.priority === "medium"
                  ? ("medium" as const)
                  : ("low" as const),
              needsClarification: isEdited
                ? false
                : req.needsClarification || false,
              clarificationQuestions: isEdited
                ? []
                : req.clarificationQuestions || [],
              status: req.status || "draft",
            };
          }
        );
      });
    });
  }, [data]);

  // 디버깅: allRequirements 로그
  useEffect(() => {
    console.log("RequirementsPanel - allRequirements:", allRequirements);
    console.log(
      "RequirementsPanel - allRequirements with needsClarification true:",
      allRequirements.filter((req) => req.needsClarification === true)
    );
    console.log(
      "RequirementsPanel - allRequirements with status approved:",
      allRequirements.filter((req) => req.status === "approved")
    );
  }, [allRequirements]);

  // needsClarification이 true인 요구사항들을 별도로 분리
  const needsClarificationRequirements = allRequirements.filter(
    (req) => req && req.needsClarification === true
  );

  // 카테고리 동적 생성 (결정이 필요한 요구사항을 최상위에 추가)
  const categories = data?.categories
    ? [
        { id: "all", name: "전체", count: allRequirements.length },
        ...(needsClarificationRequirements.length > 0
          ? [
              {
                id: "needs_clarification",
                name: "결정이 필요한 요구사항",
                count: needsClarificationRequirements.length,
              },
            ]
          : []),
        ...(data.categories || []).map((majorCategory: MajorCategory) => ({
          id:
            (majorCategory.majorCategory || majorCategory.category)
              ?.toLowerCase()
              ?.replace(/\s+/g, "_") || "unknown",
          name: majorCategory.majorCategory || majorCategory.category,
          count:
            majorCategory.subCategories?.reduce(
              (total: number, subCategory: SubCategory) =>
                total + (subCategory.requirements?.length || 0),
              0
            ) || 0,
        })),
      ]
    : [
        { id: "all", name: "전체", count: allRequirements.length },
        ...(needsClarificationRequirements.length > 0
          ? [
              {
                id: "needs_clarification",
                name: "결정이 필요한 요구사항",
                count: needsClarificationRequirements.length,
              },
            ]
          : []),
        { id: "product", name: "상품 관리", count: 4 },
        { id: "order", name: "주문&결제", count: 4 },
        { id: "delivery", name: "배송 관리", count: 4 },
      ];

  const toggleSection = (categoryId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedSections(newExpanded);
  };

  const filteredRequirements = allRequirements.filter((req) => {
    // req가 undefined인 경우 제외
    if (!req) return false;

    const matchesSearch =
      req.title?.toLowerCase()?.includes(searchTerm.toLowerCase()) || false;

    let matchesCategory = true;
    if (selectedCategory === "needs_clarification") {
      matchesCategory = req.needsClarification === true;
    } else if (selectedCategory !== "all") {
      matchesCategory = req.category === selectedCategory;
    }
    // selectedCategory === "all"일 때는 모든 요구사항 표시 (matchesCategory = true)

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {data ? "AI 추출 요구사항" : "요구사항 카드"}
          </h2>
          {data && (
            <div className="text-sm text-gray-600">
              총 {allRequirements.length}개 요구사항
              {needsClarificationRequirements.length > 0 && (
                <span className="ml-2 text-orange-600 font-medium">
                  ({needsClarificationRequirements.length}개 결정 필요)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Search and Filter */}
        <div className="flex space-x-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.count})
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Content - Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 동적 섹션 렌더링 */}
        {categories
          .filter((cat) => cat.id !== "all")
          .map((category) => {
            const categoryRequirements = filteredRequirements.filter((req) => {
              if (!req) return false; // req가 undefined인 경우 제외
              return category.id === "needs_clarification"
                ? req.needsClarification === true
                : req.category === category.id;
            });

            if (categoryRequirements.length === 0) return null;

            return (
              <div key={category.id} className="mb-6">
                <div
                  className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer ${
                    category.id === "needs_clarification"
                      ? "bg-orange-50 border border-orange-200 hover:bg-orange-100"
                      : "bg-gray-50"
                  }`}
                  onClick={() => toggleSection(category.id)}
                >
                  <div className="flex items-center space-x-3">
                    <Image
                      src={
                        expandedSections.has(category.id)
                          ? "/images/up-icon.png"
                          : "/images/down-icon.png"
                      }
                      alt={
                        expandedSections.has(category.id) ? "접기" : "펼치기"
                      }
                      width={14}
                      height={8}
                    />
                    <span
                      className={`font-medium ${
                        category.id === "needs_clarification"
                          ? "text-orange-800"
                          : "text-gray-900"
                      }`}
                    >
                      {category.name}
                    </span>
                    <span
                      className={`text-sm ${
                        category.id === "needs_clarification"
                          ? "text-orange-600"
                          : "text-gray-500"
                      }`}
                    >
                      ({categoryRequirements.length})
                    </span>
                    {category.id === "needs_clarification" && (
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-orange-200 text-orange-800">
                        우선 검토 필요
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* 새 요구사항 버튼 (드롭다운이 열렸을 때만 표시) */}
                    {expandedSections.has(category.id) &&
                      category.id !== "needs_clarification" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            requireAuth(() => {
                              console.log("새 요구사항 추가");
                            });
                          }}
                          className="px-3 py-1 text-sm font-medium text-[#4F46E5] rounded transition-colors"
                          title="새 요구사항 추가"
                        >
                          + 새 요구사항
                        </button>
                      )}
                  </div>
                </div>

                {expandedSections.has(category.id) && (
                  <div className="mt-3 space-y-3">
                    {categoryRequirements.map((req) => (
                      <div
                        key={req.id}
                        className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">
                              {req.title}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {req.description}
                            </p>
                            {req.needsClarification && (
                              <div className="mt-2">
                                <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                  결정 필요
                                </span>
                              </div>
                            )}
                            {req.needsClarification &&
                              req.clarificationQuestions &&
                              req.clarificationQuestions.length > 0 && (
                                <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                  <h5 className="text-sm font-medium text-orange-800 mb-2">
                                    명확화 질문:
                                  </h5>
                                  <ul className="text-sm text-orange-700 space-y-1">
                                    {req.clarificationQuestions.map(
                                      (question: string, index: number) => (
                                        <li
                                          key={index}
                                          className="flex items-start"
                                        >
                                          <span className="mr-2">•</span>
                                          <span>{question}</span>
                                        </li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              )}
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() =>
                                requireAuth(() => {
                                  onOpenEditModal?.(req.category || "unknown");
                                })
                              }
                              className="p-1 hover:opacity-70 transition-opacity"
                            >
                              <Image
                                src="/images/edit-icon.png"
                                alt="편집"
                                width={14}
                                height={14}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Footer - Navigation Buttons */}
      <div className="border-t border-gray-200 p-4 flex justify-between flex-shrink-0">
        <button
          onClick={onPrevStep}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          이전 단계
        </button>

        <button
          onClick={() => onNextStep?.()}
          disabled={currentStep >= 4 || !isNextButtonEnabled || isLoading}
          className={`px-6 py-3 rounded-lg transition-colors ${
            currentStep >= 4 || !isNextButtonEnabled || isLoading
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "text-white"
          }`}
          style={{
            backgroundColor:
              currentStep >= 4 || !isNextButtonEnabled || isLoading
                ? undefined
                : "#6366F1",
          }}
        >
          {isLoading ? "처리 중..." : currentStep >= 4 ? "완료" : "다음 단계"}
        </button>
      </div>

      {/* 로그인 안내 모달 */}
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={closeLoginModal}
        title="로그인이 필요한 서비스입니다"
        description="프로젝트 진행 및 요구사항 관리를 위해 로그인이 필요합니다. 로그인 후 계속 진행하시겠습니까?"
        targetStep={2}
        projectData={projectData}
      />
    </div>
  );
}
