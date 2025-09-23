"use client";

import { useState } from "react";
import { LoginRequiredModal } from "@/components/auth/LoginRequiredModal";
import { useAuthGuard } from "@/hooks/useAuthGuard";

interface Requirement {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: "high" | "medium" | "low";
  needsClarification?: boolean;
  clarificationQuestions?: string[];
}

interface RequirementsPanelProps {
  onNextStep?: () => void;
  onPrevStep?: () => void;
  currentStep?: number;
  projectData?: any; // 프로젝트 데이터 전달
  extractedRequirements?: any; // 추출된 요구사항 데이터
  onOpenEditModal?: (category: string) => void; // 편집 모달 열기
}

export function RequirementsPanel({
  onNextStep,
  onPrevStep,
  currentStep = 2,
  projectData,
  extractedRequirements,
  onOpenEditModal,
}: RequirementsPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(extractedRequirements?.categories 
      ? [extractedRequirements.categories[0]?.majorCategory.toLowerCase().replace(/\s+/g, '_') || "product"]
      : ["product"]
    )
  );

  // 인증 가드
  const { showLoginModal, requireAuth, closeLoginModal } = useAuthGuard();

  // 디버깅: 추출된 요구사항 로그
  console.log('RequirementsPanel - extractedRequirements:', extractedRequirements);

  // 추출된 요구사항이 있으면 사용, 없으면 샘플 데이터 사용
  const allRequirements: Requirement[] = extractedRequirements?.categories 
    ? extractedRequirements.categories.flatMap((majorCategory: any) => 
        majorCategory.subCategories.flatMap((subCategory: any) => 
          subCategory.requirements.map((req: any, index: number) => ({
            id: req.id || `${majorCategory.majorCategory}-${subCategory.subCategory}-${index}`,
            title: req.title,
            description: req.description,
            category: majorCategory.majorCategory.toLowerCase().replace(/\s+/g, '_'),
            priority: req.priority === 'high' ? 'high' as const : 
                     req.priority === 'medium' ? 'medium' as const : 'low' as const,
            needsClarification: req.needsClarification || false,
            clarificationQuestions: req.clarificationQuestions || [],
          }))
        )
      )
    : [
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
          clarificationQuestions: ["어떤 성분 정보를 제공하나요?", "알러지 정보는 어떻게 관리하나요?"],
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

  // needsClarification이 true인 요구사항들을 별도로 분리
  const needsClarificationRequirements = allRequirements.filter(req => req.needsClarification);
  const regularRequirements = allRequirements.filter(req => !req.needsClarification);

  // 카테고리 동적 생성 (결정이 필요한 요구사항을 최상위에 추가)
  const categories = extractedRequirements?.categories 
    ? [
        { id: "all", name: "전체", count: allRequirements.length },
        ...(needsClarificationRequirements.length > 0 ? [{
          id: "needs_clarification", 
          name: "결정이 필요한 요구사항", 
          count: needsClarificationRequirements.length
        }] : []),
        ...extractedRequirements.categories.map((majorCategory: any) => ({
          id: majorCategory.majorCategory.toLowerCase().replace(/\s+/g, '_'),
          name: majorCategory.majorCategory,
          count: majorCategory.subCategories.reduce((total: number, subCategory: any) => 
            total + subCategory.requirements.length, 0),
        }))
      ]
    : [
        { id: "all", name: "전체", count: allRequirements.length },
        ...(needsClarificationRequirements.length > 0 ? [{
          id: "needs_clarification", 
          name: "결정이 필요한 요구사항", 
          count: needsClarificationRequirements.length
        }] : []),
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
    const matchesSearch = req.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || 
      selectedCategory === "needs_clarification" ? req.needsClarification : req.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {extractedRequirements ? 'AI 추출 요구사항' : '요구사항 카드'}
          </h2>
          {extractedRequirements && (
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
        {categories.filter(cat => cat.id !== "all").map((category) => {
          const categoryRequirements = filteredRequirements.filter(
            (req) => category.id === "needs_clarification" ? req.needsClarification : req.category === category.id
          );
          
          if (categoryRequirements.length === 0) return null;
          
          return (
            <div key={category.id} className="mb-6">
              <button
                onClick={() => toggleSection(category.id)}
                className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition-colors ${
                  category.id === "needs_clarification" 
                    ? "bg-orange-50 border border-orange-200 hover:bg-orange-100" 
                    : "bg-gray-50"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className={`font-medium ${
                    category.id === "needs_clarification" ? "text-orange-800" : "text-gray-900"
                  }`}>
                    {category.name}
                  </span>
                  <span className={`text-sm ${
                    category.id === "needs_clarification" ? "text-orange-600" : "text-gray-500"
                  }`}>
                    ({categoryRequirements.length})
                  </span>
                  {category.id === "needs_clarification" && (
                    <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-orange-200 text-orange-800">
                      우선 검토 필요
                    </span>
                  )}
                </div>
                <span className="text-gray-400">
                  {expandedSections.has(category.id) ? "▲" : "▼"}
                </span>
              </button>

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
                          {req.needsClarification && req.clarificationQuestions && req.clarificationQuestions.length > 0 && (
                            <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                              <h5 className="text-sm font-medium text-orange-800 mb-2">명확화 질문:</h5>
                              <ul className="text-sm text-orange-700 space-y-1">
                                {req.clarificationQuestions.map((question: string, index: number) => (
                                  <li key={index} className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>{question}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() =>
                              requireAuth(() => {
                                onOpenEditModal?.(req.category);
                              })
                            }
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            📝
                          </button>
                          <button
                            onClick={() =>
                              requireAuth(() => {
                                // 삭제 로직
                                console.log("삭제:", req.title);
                              })
                            }
                            className="p-1 text-gray-400 hover:text-red-600"
                          >
                            🗑️
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
      <div className="border-t border-gray-200 p-4 flex justify-between">
        <button
          onClick={onPrevStep}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          이전 단계
        </button>

        <div className="flex items-center space-x-4">
          <button
            onClick={() =>
              requireAuth(() => {
                // 새 요구사항 추가 로직
                console.log("새 요구사항 추가");
              })
            }
            className="px-4 py-2 text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
          >
            + 새 요구사항
          </button>

          <button
            onClick={() => requireAuth(() => onNextStep?.())}
            disabled={currentStep >= 4}
            className={`px-6 py-3 rounded-lg transition-colors ${
              currentStep >= 4
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "text-white"
            }`}
            style={{
              backgroundColor: currentStep >= 4 ? undefined : "#6366F1",
            }}
          >
            {currentStep >= 4 ? "완료" : "다음 단계"}
          </button>
        </div>
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
