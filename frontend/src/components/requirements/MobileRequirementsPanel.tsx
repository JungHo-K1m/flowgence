"use client";

import { useState, useMemo } from "react";

interface Requirement {
  id: string;
  title: string;
  description: string;
  category?: string;
  priority: "high" | "medium" | "low";
  needsClarification?: boolean;
}

interface MobileRequirementsPanelProps {
  requirementsData: any;
  onNextStep?: () => void;
  onOpenEditModal?: (category: string) => void;
  isNextButtonEnabled?: boolean;
  isLoading?: boolean;
}

type FilterType = "all" | "functional" | "non_functional" | "clarification";

export function MobileRequirementsPanel({
  requirementsData,
  onNextStep,
  onOpenEditModal,
  isNextButtonEnabled = false,
  isLoading = false,
}: MobileRequirementsPanelProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const data = requirementsData as any;

  // ID 정규화 함수
  const normalizeId = (name: string | undefined | null) => {
    if (!name) return "";
    return name.toLowerCase().replace(/\s+/g, "_");
  };

  // 모든 요구사항 추출
  const allRequirements = useMemo(() => {
    if (!data?.categories) return [];

    const reqs: (Requirement & { majorCategory?: string; majorCategoryId?: string })[] = [];
    data.categories.forEach((cat: any) => {
      const majorCat = cat.majorCategory || cat.category;
      const majorCatId = normalizeId(majorCat);
      cat.subCategories?.forEach((sub: any) => {
        sub.requirements?.forEach((req: any) => {
          reqs.push({
            ...req,
            category: sub.subCategory || sub.subcategory || majorCat,
            majorCategory: majorCat,
            majorCategoryId: majorCatId,
          });
        });
      });
    });
    return reqs;
  }, [data]);

  // 비기능 요구사항
  const nonFunctionalRequirements = useMemo(() => {
    return data?.nonFunctionalRequirements || [];
  }, [data]);

  // 필터링된 요구사항
  const filteredRequirements = useMemo(() => {
    let filtered: any[] = [];

    if (activeFilter === "all" || activeFilter === "functional") {
      filtered = [...allRequirements];
    }
    if (activeFilter === "all" || activeFilter === "non_functional") {
      filtered = [...filtered, ...nonFunctionalRequirements.map((nfr: any) => ({
        ...nfr,
        isNFR: true,
        title: nfr.category,
        description: nfr.description,
      }))];
    }
    if (activeFilter === "clarification") {
      filtered = allRequirements.filter((req) => req.needsClarification);
    }

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(
        (req) =>
          req.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [allRequirements, nonFunctionalRequirements, activeFilter, searchTerm]);

  // 결정 필요 개수
  const clarificationCount = allRequirements.filter((r) => r.needsClarification).length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-400";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "높음";
      case "medium":
        return "중간";
      case "low":
        return "낮음";
      default:
        return "";
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 p-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">
            요구사항 ({filteredRequirements.length})
          </h2>
          {clarificationCount > 0 && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
              {clarificationCount}개 결정 필요
            </span>
          )}
        </div>

        {/* 검색 */}
        <div className="relative mb-3">
          <input
            type="text"
            placeholder="요구사항 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 pl-9 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* 필터 칩 */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {[
            { id: "all", label: "전체" },
            { id: "functional", label: "기능" },
            { id: "non_functional", label: "비기능" },
            { id: "clarification", label: `결정필요 (${clarificationCount})` },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as FilterType)}
              className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                activeFilter === filter.id
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* 요구사항 리스트 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredRequirements.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-sm">요구사항이 없습니다</p>
          </div>
        ) : (
          filteredRequirements.map((req, index) => (
            <div
              key={req.id || index}
              className={`bg-white rounded-lg border p-3 ${
                req.needsClarification
                  ? "border-orange-200 bg-orange-50/50"
                  : "border-gray-200"
              }`}
            >
              {/* 상단: 우선순위 + 카테고리 */}
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`w-2 h-2 rounded-full ${getPriorityColor(req.priority)}`}
                />
                <span className="text-xs text-gray-500 truncate flex-1">
                  {req.category || (req.isNFR ? "비기능" : "기능")}
                </span>
                {req.needsClarification && (
                  <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">
                    결정필요
                  </span>
                )}
                {req.isNFR && (
                  <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">
                    비기능
                  </span>
                )}
              </div>

              {/* 제목 */}
              <h3 className="font-medium text-gray-900 text-sm mb-1">
                {req.title}
              </h3>

              {/* 설명 */}
              <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                {req.description}
              </p>

              {/* 하단: 우선순위 라벨 + 편집 버튼 */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    req.priority === "high"
                      ? "bg-red-100 text-red-700"
                      : req.priority === "medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {getPriorityLabel(req.priority)}
                </span>
                <button
                  onClick={() => onOpenEditModal?.(req.majorCategoryId || req.category || "")}
                  className="text-xs text-indigo-600 font-medium px-2 py-1 hover:bg-indigo-50 rounded transition-colors"
                >
                  편집
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 하단 고정 버튼 */}
      <div className="bg-white border-t border-gray-200 p-3 flex-shrink-0">
        <button
          onClick={onNextStep}
          disabled={!isNextButtonEnabled || isLoading}
          className={`w-full py-3 rounded-lg font-medium text-sm transition-colors ${
            isNextButtonEnabled && !isLoading
              ? "bg-indigo-600 text-white hover:bg-indigo-700"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {isLoading ? "처리 중..." : "다음 단계"}
        </button>
      </div>
    </div>
  );
}
