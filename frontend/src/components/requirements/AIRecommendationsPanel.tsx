"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  category: string;
}

interface AIRecommendationsPanelProps {
  onAddRequirement: (requirement: Omit<any, "id">) => void;
}

export function AIRecommendationsPanel({
  onAddRequirement,
}: AIRecommendationsPanelProps) {
  const [recommendations] = useState<AIRecommendation[]>([
    {
      id: "1",
      title: "가격 & 할인 설정",
      description: "기본가·할인가·할인 기간을 관리",
      category: "product",
    },
    {
      id: "2",
      title: "검색/필터 태그 설정",
      description: "상품 검색·필터에 필요한 태그 키워드 등록",
      category: "product",
    },
    {
      id: "3",
      title: "상품 옵션 관리",
      description: "옵션(사이즈·맛 등) 추가/수정 및 가격·재고 관리",
      category: "product",
    },
    {
      id: "4",
      title: "재고 알림 설정",
      description: "재고가 부족할 때 자동 알림",
      category: "product",
    },
  ]);

  const handleAddRecommendation = (recommendation: AIRecommendation) => {
    onAddRequirement({
      title: recommendation.title,
      description: recommendation.description,
      category: recommendation.category,
      priority: "medium" as const,
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">추천 기능</h3>
          <Button
            variant="outline"
            size="sm"
            className="p-2"
            onClick={() => {
              // 새로고침 로직
              console.log("새로고침");
            }}
          >
            🔄
          </Button>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          AI가 추천하는 기능을 드래그해서 오른쪽에 추가하세요.
        </p>
      </div>

      {/* Recommendations List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {recommendations.map((recommendation) => (
          <div
            key={recommendation.id}
            className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow cursor-grab active:cursor-grabbing"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(
                "text/plain",
                JSON.stringify(recommendation)
              );
            }}
          >
            <div className="flex items-start space-x-3">
              {/* Drag Handle */}
              <div className="flex flex-col space-y-1 mt-1">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              </div>

              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">
                  {recommendation.title}
                </h4>
                <p className="text-sm text-gray-600">
                  {recommendation.description}
                </p>
              </div>

              {/* Add Button */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAddRecommendation(recommendation)}
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                +
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          변경사항은 자동 저장됩니다
        </p>
      </div>
    </div>
  );
}
