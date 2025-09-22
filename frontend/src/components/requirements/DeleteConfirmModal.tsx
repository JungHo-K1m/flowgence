"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Requirement {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: "high" | "medium" | "low";
}

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  requirement: Requirement | null;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  requirement,
}: DeleteConfirmModalProps) {
  if (!requirement) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-600">요구사항 삭제</DialogTitle>
          <DialogDescription>
            다음 요구사항을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-medium text-gray-900 mb-2">
              {requirement.title}
            </h4>
            <p className="text-sm text-gray-600">{requirement.description}</p>
            <div className="mt-2">
              <span
                className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                  requirement.priority === "high"
                    ? "bg-red-100 text-red-800"
                    : requirement.priority === "medium"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {requirement.priority === "high"
                  ? "높음"
                  : requirement.priority === "medium"
                  ? "보통"
                  : "낮음"}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={onConfirm} className="bg-red-600 hover:bg-red-700">
            삭제
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
