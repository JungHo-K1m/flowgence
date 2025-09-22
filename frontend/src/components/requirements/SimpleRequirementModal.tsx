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

interface SimpleRequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  requirements: Requirement[];
  onRequirementsChange: (requirements: Requirement[]) => void;
  categoryTitle: string;
  onCategoryTitleChange: (title: string) => void;
}

export function SimpleRequirementModal({
  isOpen,
  onClose,
  requirements,
  onRequirementsChange,
  categoryTitle,
  onCategoryTitleChange,
}: SimpleRequirementModalProps) {
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
      document.body.style.overflow = "hidden";
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
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          width: "100%",
          height: "100%",
          maxWidth: "1400px",
          maxHeight: "900px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "600",
              color: "#111827",
              margin: 0,
            }}
          >
            소분류 카드 관리
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            style={{ padding: "8px" }}
          >
            ✕
          </Button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            overflow: "hidden",
          }}
        >
          {/* Left Panel - AI Recommendations */}
          <div
            style={{
              width: "50%",
              borderRight: "1px solid #e5e7eb",
              overflow: "hidden",
            }}
          >
            <AIRecommendationsPanel onAddRequirement={handleAddRequirement} />
          </div>

          {/* Right Panel - Requirement Management */}
          <div
            style={{
              width: "50%",
              overflow: "hidden",
            }}
          >
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
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
          <Button
            onClick={onClose}
            style={{
              backgroundColor: "#6366F1",
              color: "white",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#5B5BD6";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#6366F1";
            }}
          >
            변경 완료
          </Button>
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
    </div>
  );
}
