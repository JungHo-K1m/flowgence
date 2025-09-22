"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface RequirementEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  requirements: Requirement[];
  onRequirementsChange: (requirements: Requirement[]) => void;
  categoryTitle: string;
  onCategoryTitleChange: (title: string) => void;
}

export function RequirementEditModal({
  isOpen,
  onClose,
  requirements,
  onRequirementsChange,
  categoryTitle,
  onCategoryTitleChange,
}: RequirementEditModalProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [requirementToDelete, setRequirementToDelete] =
    useState<Requirement | null>(null);

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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-none w-[95vw] h-[90vh] p-0 m-4">
          <DialogHeader className="px-4 py-3 border-b">
            <DialogTitle className="text-xl font-semibold">
              소분류 카드 관리
            </DialogTitle>
          </DialogHeader>

          <div className="flex h-full px-2">
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
          <div className="px-4 py-3 border-t flex justify-between">
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
        </DialogContent>
      </Dialog>

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
