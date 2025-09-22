"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InlineEditInput } from "./InlineEditInput";

interface Requirement {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: "high" | "medium" | "low";
}

interface RequirementManagementPanelProps {
  requirements: Requirement[];
  categoryTitle: string;
  onCategoryTitleChange: (title: string) => void;
  onUpdateRequirement: (requirement: Requirement) => void;
  onDeleteRequirement: (requirement: Requirement) => void;
  onAddNew: () => void;
}

export function RequirementManagementPanel({
  requirements,
  categoryTitle,
  onCategoryTitleChange,
  onUpdateRequirement,
  onDeleteRequirement,
  onAddNew,
}: RequirementManagementPanelProps) {
  const [editingRequirement, setEditingRequirement] = useState<string | null>(
    null
  );

  const handleTitleEdit = (requirement: Requirement, newTitle: string) => {
    onUpdateRequirement({ ...requirement, title: newTitle });
    setEditingRequirement(null);
  };

  const handleDescriptionEdit = (
    requirement: Requirement,
    newDescription: string
  ) => {
    onUpdateRequirement({ ...requirement, description: newDescription });
    setEditingRequirement(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "high":
        return "높음";
      case "medium":
        return "보통";
      case "low":
        return "낮음";
      default:
        return priority;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <InlineEditInput
            value={categoryTitle}
            onSave={onCategoryTitleChange}
            className="text-lg font-semibold text-gray-900"
            placeholder="카테고리 제목"
          />
          <Button
            variant="outline"
            size="sm"
            className="p-2"
            onClick={() => {
              // 편집 모드 토글 로직
              console.log("편집 모드");
            }}
          >
            ✏️
          </Button>
        </div>
      </div>

      {/* Requirements List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {requirements.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="mb-4">아직 추가된 요구사항이 없습니다.</p>
            <p className="text-sm">
              왼쪽에서 추천 기능을 추가하거나 새 카드를 만들어보세요.
            </p>
          </div>
        ) : (
          requirements.map((requirement) => (
            <div
              key={requirement.id}
              className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Title */}
                  <div className="mb-2">
                    {editingRequirement === `${requirement.id}-title` ? (
                      <InlineEditInput
                        value={requirement.title}
                        onSave={(newTitle) =>
                          handleTitleEdit(requirement, newTitle)
                        }
                        onCancel={() => setEditingRequirement(null)}
                        className="font-medium text-gray-900"
                        placeholder="요구사항 제목"
                      />
                    ) : (
                      <h4
                        className="font-medium text-gray-900 cursor-pointer hover:text-blue-600"
                        onClick={() =>
                          setEditingRequirement(`${requirement.id}-title`)
                        }
                      >
                        {requirement.title}
                      </h4>
                    )}
                  </div>

                  {/* Description */}
                  <div className="mb-3">
                    {editingRequirement === `${requirement.id}-description` ? (
                      <InlineEditInput
                        value={requirement.description}
                        onSave={(newDescription) =>
                          handleDescriptionEdit(requirement, newDescription)
                        }
                        onCancel={() => setEditingRequirement(null)}
                        className="text-sm text-gray-600"
                        placeholder="요구사항 설명"
                        multiline
                      />
                    ) : (
                      <p
                        className="text-sm text-gray-600 cursor-pointer hover:text-blue-600"
                        onClick={() =>
                          setEditingRequirement(`${requirement.id}-description`)
                        }
                      >
                        {requirement.description}
                      </p>
                    )}
                  </div>

                  {/* Priority Badge */}
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                      requirement.priority
                    )}`}
                  >
                    {getPriorityText(requirement.priority)}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setEditingRequirement(`${requirement.id}-title`)
                    }
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    ✏️
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDeleteRequirement(requirement)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    🗑️
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200">
        <Button
          onClick={onAddNew}
          className="w-full bg-[#6366F1] hover:bg-[#5B5BD6] text-white"
        >
          + 새 소분류 카드
        </Button>
      </div>
    </div>
  );
}
