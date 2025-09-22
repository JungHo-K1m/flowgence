"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AIRecommendationsPanel } from "./AIRecommendationsPanel";
import { RequirementManagementPanel } from "./RequirementManagementPanel";
import { AddRequirementModal } from "./AddRequirementModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal";

interface Requirement {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: "high" | "medium" | "low";
}

interface CustomRequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  requirements: Requirement[];
  onRequirementsChange: (requirements: Requirement[]) => void;
  categoryTitle: string;
  onCategoryTitleChange: (title: string) => void;
}

export function CustomRequirementModal({
  isOpen,
  onClose,
  requirements,
  onRequirementsChange,
  categoryTitle,
  onCategoryTitleChange,
}: CustomRequirementModalProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [requirementToDelete, setRequirementToDelete] =
    useState<Requirement | null>(null);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden"; // 스크롤 방지
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleAddRequirement = (newRequirement: Omit<Requirement, "id">) => {
    const requirement: Requirement = {
      ...newRequirement,
      id: Date.now().toString(),
    };
    onRequirementsChange([...requirements, requirement]);
    setShowAddModal(false);
  };

  const handleDeleteRequirement = (requirement: Requirement) => {
    setRequirementToDelete(requirement);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (requirementToDelete) {
      onRequirementsChange(
        requirements.filter((req) => req.id !== requirementToDelete.id)
      );
      setRequirementToDelete(null);
    }
    setShowDeleteModal(false);
  };

  const handleUpdateRequirement = (updatedRequirement: Requirement) => {
    onRequirementsChange(
      requirements.map((req) =>
        req.id === updatedRequirement.id ? updatedRequirement : req
      )
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-[9998]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-none flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              소분류 카드 관리
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2 hover:bg-gray-100"
            >
              ✕
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel - AI Recommendations */}
            <div className="w-1/2 border-r border-gray-200">
              <AIRecommendationsPanel onAddRequirement={handleAddRequirement} />
            </div>

            {/* Right Panel - Requirement Management */}
            <div className="w-1/2">
              <RequirementManagementPanel
                requirements={requirements}
                categoryTitle={categoryTitle}
                onCategoryTitleChange={onCategoryTitleChange}
                onUpdateRequirement={handleUpdateRequirement}
                onDeleteRequirement={handleDeleteRequirement}
                onAddNew={() => setShowAddModal(true)}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200 flex justify-between">
            <Button variant="outline" onClick={onClose}>
              닫기
            </Button>
            <Button
              onClick={onClose}
              className="bg-[#6366F1] hover:bg-[#5B5BD6]"
            >
              변경 완료
            </Button>
          </div>
        </div>
      </div>

      {/* Add Requirement Modal */}
      <AddRequirementModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddRequirement}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        requirement={requirementToDelete}
      />
    </>
  );
}
