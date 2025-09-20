"use client";

import { useState } from "react";

interface Requirement {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: "high" | "medium" | "low";
}

interface RequirementsPanelProps {
  onNextStep?: () => void;
  onPrevStep?: () => void;
  currentStep?: number;
}

export function RequirementsPanel({
  onNextStep,
  onPrevStep,
  currentStep = 2,
}: RequirementsPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["product"])
  );

  // 샘플 요구사항 데이터
  const requirements: Requirement[] = [
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
    {
      id: "4",
      title: "상품 카테고리 관리",
      description: "상품 분류 체계 및 카테고리 트리 관리",
      category: "product",
      priority: "medium",
    },
  ];

  const categories = [
    { id: "all", name: "전체", count: requirements.length },
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

  const filteredRequirements = requirements.filter((req) => {
    const matchesSearch = req.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || req.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          요구사항 카드
        </h2>

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
        {/* 상품 관리 섹션 */}
        <div className="mb-6">
          <button
            onClick={() => toggleSection("product")}
            className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">📦</span>
              <span className="font-medium text-gray-900">상품 관리</span>
              <span className="text-sm text-gray-500">(4)</span>
            </div>
            <span className="text-gray-400">
              {expandedSections.has("product") ? "▲" : "▼"}
            </span>
          </button>

          {expandedSections.has("product") && (
            <div className="mt-3 space-y-3">
              {filteredRequirements
                .filter((req) => req.category === "product")
                .map((req) => (
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
                        <div className="mt-2">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              req.priority === "high"
                                ? "bg-red-100 text-red-800"
                                : req.priority === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {req.priority === "high"
                              ? "높음"
                              : req.priority === "medium"
                              ? "보통"
                              : "낮음"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          📝
                        </button>
                        <button className="p-1 text-gray-400 hover:text-red-600">
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* 주문&결제 섹션 */}
        <div className="mb-6">
          <button
            onClick={() => toggleSection("order")}
            className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">💳</span>
              <span className="font-medium text-gray-900">주문&결제</span>
              <span className="text-sm text-gray-500">(4)</span>
            </div>
            <span className="text-gray-400">
              {expandedSections.has("order") ? "▲" : "▼"}
            </span>
          </button>

          {expandedSections.has("order") && (
            <div className="mt-3 space-y-3">
              <div className="p-4 bg-white border border-gray-200 rounded-lg">
                <div className="text-center text-gray-500 py-8">
                  요구사항 로딩 중...
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 배송 관리 섹션 */}
        <div className="mb-6">
          <button
            onClick={() => toggleSection("delivery")}
            className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">🚚</span>
              <span className="font-medium text-gray-900">배송 관리</span>
              <span className="text-sm text-gray-500">(4)</span>
            </div>
            <span className="text-gray-400">
              {expandedSections.has("delivery") ? "▲" : "▼"}
            </span>
          </button>

          {expandedSections.has("delivery") && (
            <div className="mt-3 space-y-3">
              <div className="p-4 bg-white border border-gray-200 rounded-lg">
                <div className="text-center text-gray-500 py-8">
                  요구사항 로딩 중...
                </div>
              </div>
            </div>
          )}
        </div>
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
          <button className="px-4 py-2 text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 transition-colors">
            + 새 요구사항
          </button>

          <button
            onClick={onNextStep}
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
    </div>
  );
}
