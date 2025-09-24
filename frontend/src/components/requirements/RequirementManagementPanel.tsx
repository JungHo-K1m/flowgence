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
  needsClarification?: boolean;
  clarificationQuestions?: string[];
  status?: "approved" | "rejected" | "draft";
}

interface RequirementManagementPanelProps {
  requirements: Requirement[];
  categoryTitle: string;
  onCategoryTitleChange: (title: string) => Promise<void>;
  onUpdateRequirement: (requirement: Requirement) => Promise<void>;
  onDeleteRequirement: (requirement: Requirement) => Promise<void>;
  onAddNew: () => void;
  onRequirementStatusChange?: (
    requirementId: string,
    status: "approved" | "rejected" | "draft"
  ) => Promise<void>;
  isSaving?: boolean;
  saveError?: string | null;
}

export function RequirementManagementPanel({
  requirements,
  categoryTitle,
  onCategoryTitleChange,
  onUpdateRequirement,
  onDeleteRequirement,
  onAddNew,
  onRequirementStatusChange,
  isSaving = false,
  saveError = null,
}: RequirementManagementPanelProps) {
  const [editingRequirement, setEditingRequirement] = useState<string | null>(
    null
  );
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});
  const [errorStates, setErrorStates] = useState<Record<string, string | null>>(
    {}
  );

  const handleTitleEdit = async (
    requirement: Requirement,
    newTitle: string
  ) => {
    const requirementId = `${requirement.id}-title`;
    setSavingStates((prev) => ({ ...prev, [requirementId]: true }));
    setErrorStates((prev) => ({ ...prev, [requirementId]: null }));

    try {
      // 편집 시 자동 승인
      const updatedRequirement = {
        ...requirement,
        title: newTitle,
        status: "approved" as const,
        needsClarification: false,
        clarificationQuestions: [],
      };
      await onUpdateRequirement(updatedRequirement);
      setEditingRequirement(null);
    } catch (error) {
      setErrorStates((prev) => ({
        ...prev,
        [requirementId]:
          error instanceof Error ? error.message : "저장에 실패했습니다",
      }));
    } finally {
      setSavingStates((prev) => ({ ...prev, [requirementId]: false }));
    }
  };

  const handleDescriptionEdit = async (
    requirement: Requirement,
    newDescription: string
  ) => {
    const requirementId = `${requirement.id}-description`;
    setSavingStates((prev) => ({ ...prev, [requirementId]: true }));
    setErrorStates((prev) => ({ ...prev, [requirementId]: null }));

    try {
      // 편집 시 자동 승인
      const updatedRequirement = {
        ...requirement,
        description: newDescription,
        status: "approved" as const,
        needsClarification: false,
        clarificationQuestions: [],
      };
      await onUpdateRequirement(updatedRequirement);
      setEditingRequirement(null);
    } catch (error) {
      setErrorStates((prev) => ({
        ...prev,
        [requirementId]:
          error instanceof Error ? error.message : "저장에 실패했습니다",
      }));
    } finally {
      setSavingStates((prev) => ({ ...prev, [requirementId]: false }));
    }
  };

  const handleCategoryTitleEdit = async (newTitle: string) => {
    try {
      await onCategoryTitleChange(newTitle);
    } catch (error) {
      console.error("카테고리 제목 저장 실패:", error);
      throw error;
    }
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
            onSave={handleCategoryTitleEdit}
            className="text-lg font-semibold text-gray-900"
            placeholder="카테고리 제목"
            isSaving={isSaving}
            saveError={saveError}
          />
          <div className="flex items-center space-x-2">
            {isSaving && (
              <div className="flex items-center text-blue-600 text-sm">
                <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                저장중...
              </div>
            )}
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
                    <InlineEditInput
                      value={requirement.title}
                      onSave={(newTitle) =>
                        handleTitleEdit(requirement, newTitle)
                      }
                      className="font-medium text-gray-900"
                      placeholder="요구사항 제목"
                      isSaving={savingStates[`${requirement.id}-title`]}
                      saveError={errorStates[`${requirement.id}-title`]}
                    />
                  </div>

                  {/* Description */}
                  <div className="mb-3">
                    <InlineEditInput
                      value={requirement.description}
                      onSave={(newDescription) =>
                        handleDescriptionEdit(requirement, newDescription)
                      }
                      className="text-sm text-gray-600"
                      placeholder="요구사항 설명"
                      multiline
                      isSaving={savingStates[`${requirement.id}-description`]}
                      saveError={errorStates[`${requirement.id}-description`]}
                    />
                  </div>

                  {/* Priority Badge and Status */}
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                        requirement.priority
                      )}`}
                    >
                      {getPriorityText(requirement.priority)}
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        requirement.needsClarification
                          ? "bg-orange-100 text-orange-800"
                          : requirement.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {requirement.needsClarification
                        ? "결정 필요"
                        : requirement.status === "approved"
                        ? "승인됨"
                        : "검토중"}
                    </span>
                  </div>

                  {/* 명확화 질문 표시 */}
                  {requirement.needsClarification &&
                    requirement.clarificationQuestions &&
                    requirement.clarificationQuestions.length > 0 && (
                      <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <h5 className="text-sm font-medium text-orange-800 mb-2">
                          명확화 질문:
                        </h5>
                        <ul className="text-sm text-orange-700 space-y-1">
                          {requirement.clarificationQuestions.map(
                            (question: string, index: number) => (
                              <li key={index} className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>{question}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-6 ml-8">
                  {/* Status Change Button */}
                  {requirement.needsClarification &&
                    onRequirementStatusChange && (
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            await onRequirementStatusChange(
                              requirement.id,
                              "approved"
                            );
                          } catch (error) {
                            console.error("상태 변경 실패:", error);
                          }
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-xs"
                        disabled={
                          savingStates[`${requirement.id}-title`] ||
                          savingStates[`${requirement.id}-description`]
                        }
                      >
                        ✓ 승인
                      </Button>
                    )}

                  {/* Delete Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        await onDeleteRequirement(requirement);
                      } catch (error) {
                        console.error("삭제 실패:", error);
                      }
                    }}
                    className="p-1 text-gray-400 hover:text-red-600"
                    disabled={
                      savingStates[`${requirement.id}-title`] ||
                      savingStates[`${requirement.id}-description`]
                    }
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
