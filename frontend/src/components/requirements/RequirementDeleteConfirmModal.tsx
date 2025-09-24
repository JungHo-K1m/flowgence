import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface RequirementDeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  requirementTitle: string;
  requirementDescription: string;
}

export function RequirementDeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  requirementTitle,
  requirementDescription,
}: RequirementDeleteConfirmModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" style={{ zIndex: 100000 }}>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">
            요구사항 삭제 확인
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            정말로 이 요구사항을 삭제하시겠습니까?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center mb-2">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
              <span className="font-medium text-red-800">삭제할 요구사항</span>
            </div>
            <p className="text-red-700 font-medium">{requirementTitle}</p>
            <p className="text-red-600 text-sm mt-1 line-clamp-2">
              {requirementDescription}
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
              <span className="font-medium text-yellow-800">주의사항</span>
            </div>
            <ul className="text-yellow-700 text-sm space-y-1">
              <li>• 요구사항이 완전히 삭제됩니다</li>
              <li>• 삭제된 데이터는 복구할 수 없습니다</li>
              <li>• 변경사항은 즉시 저장됩니다</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose} className="px-6">
            취소
          </Button>
          <Button
            onClick={onConfirm}
            className="px-6 bg-red-600 hover:bg-red-700 text-white"
          >
            삭제
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
