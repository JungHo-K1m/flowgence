"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AIRecommendationsPanel } from "./AIRecommendationsPanel";
import { RequirementManagementPanel } from "./RequirementManagementPanel";
import { AddRequirementModal } from "./AddRequirementModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { RequirementDeleteConfirmModal } from "./RequirementDeleteConfirmModal";

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

interface SimpleRequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  requirements: Requirement[];
  onRequirementsChange: (requirements: Requirement[]) => Promise<void>;
  categoryTitle: string;
  onCategoryTitleChange: (title: string) => Promise<void>;
  onRequirementStatusChange?: (
    requirementId: string,
    status: "approved" | "rejected" | "draft"
  ) => Promise<void>;
  isSaving?: boolean;
  saveError?: string | null;
}

export function SimpleRequirementModal({
  isOpen,
  onClose,
  requirements,
  onRequirementsChange,
  categoryTitle,
  onCategoryTitleChange,
  onRequirementStatusChange,
  isSaving = false,
  saveError = null,
}: SimpleRequirementModalProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [requirementToDelete, setRequirementToDelete] =
    useState<Requirement | null>(null);

  // 소분류 삭제 확인 모달 상태
  const [showRequirementDeleteModal, setShowRequirementDeleteModal] =
    useState(false);
  const [requirementToDeleteConfirm, setRequirementToDeleteConfirm] =
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

  const handleAddRequirement = async (
    newRequirement: Omit<Requirement, "id">
  ) => {
    const requirement: Requirement = {
      ...newRequirement,
      id: Date.now().toString(),
    };
    await onRequirementsChange([...requirements, requirement]);
    setShowAddModal(false);
  };

  const handleDeleteRequirement = (requirement: Requirement) => {
    setRequirementToDeleteConfirm(requirement);
    setShowRequirementDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (requirementToDelete) {
      const updatedRequirements = requirements.filter(
        (req) => req.id !== requirementToDelete.id
      );
      await onRequirementsChange(updatedRequirements);
      setRequirementToDelete(null);
    }
    setShowDeleteModal(false);
  };

  const confirmRequirementDelete = async () => {
    if (requirementToDeleteConfirm) {
      const updatedRequirements = requirements.filter(
        (req) => req.id !== requirementToDeleteConfirm.id
      );
      await onRequirementsChange(updatedRequirements);
      setRequirementToDeleteConfirm(null);
    }
    setShowRequirementDeleteModal(false);
  };

  const handleUpdateRequirement = async (updatedRequirement: Requirement) => {
    const updatedRequirements = requirements.map((req) =>
      req.id === updatedRequirement.id ? updatedRequirement : req
    );
    await onRequirementsChange(updatedRequirements);
  };

  if (!isOpen) return null;

  return (
    <>
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
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
                width: "33.33%",
                borderRight: "1px solid #e5e7eb",
                overflow: "hidden",
              }}
            >
              <AIRecommendationsPanel onAddRequirement={handleAddRequirement} />
            </div>

            {/* Right Panel - Requirement Management */}
            <div
              style={{
                width: "66.67%",
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
                onRequirementStatusChange={onRequirementStatusChange}
                isSaving={isSaving}
                saveError={saveError}
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
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <div style={{ fontSize: "14px", color: "#6b7280" }}>
                변경사항은 자동 저장됩니다
              </div>
              {isSaving && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "#6366F1",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <div
                    style={{
                      width: "12px",
                      height: "12px",
                      border: "2px solid #e5e7eb",
                      borderTop: "2px solid #6366F1",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  ></div>
                  저장 중...
                </div>
              )}
              {saveError && (
                <div style={{ fontSize: "12px", color: "#ef4444" }}>
                  저장 실패: {saveError}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <Button variant="outline" onClick={onClose} disabled={isSaving}>
                닫기
              </Button>
              <Button
                onClick={onClose}
                disabled={isSaving}
                style={{
                  backgroundColor: isSaving ? "#9ca3af" : "#6366F1",
                  color: "white",
                  border: "none",
                }}
                onMouseEnter={(e) => {
                  if (!isSaving)
                    e.currentTarget.style.backgroundColor = "#5B5BD6";
                }}
                onMouseLeave={(e) => {
                  if (!isSaving)
                    e.currentTarget.style.backgroundColor = "#6366F1";
                }}
              >
                {isSaving ? "저장 중..." : "변경 완료"}
              </Button>
            </div>
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

      {/* 소분류 삭제 확인 모달 */}
      <RequirementDeleteConfirmModal
        isOpen={showRequirementDeleteModal}
        onClose={() => {
          setShowRequirementDeleteModal(false);
          setRequirementToDeleteConfirm(null);
        }}
        onConfirm={confirmRequirementDelete}
        requirementTitle={requirementToDeleteConfirm?.title || ""}
        requirementDescription={requirementToDeleteConfirm?.description || ""}
      />
    </>
  );
}
