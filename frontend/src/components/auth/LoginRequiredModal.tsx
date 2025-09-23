"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  targetStep?: number; // 로그인 후 이동할 단계
  projectData?: any; // 프로젝트 데이터
  isProcessing?: boolean; // 로그인 후 처리 중 상태
}

export function LoginRequiredModal({
  isOpen,
  onClose,
  title = "로그인이 필요한 서비스입니다",
  description = "이 기능을 사용하려면 로그인이 필요합니다. 로그인 후 계속 진행하시겠습니까?",
  targetStep = 2,
  projectData,
  isProcessing = false,
}: LoginRequiredModalProps) {
  const router = useRouter();

  const handleLogin = () => {
    // 현재 상태를 localStorage에 저장 (targetStep과 projectData 포함)
    const currentState = {
      timestamp: Date.now(),
      returnUrl: window.location.pathname,
      targetStep,
      projectData,
    };
    localStorage.setItem("flowgence_temp_state", JSON.stringify(currentState));

    // 로그인 페이지로 이동 (리다이렉트 정보 포함)
    router.push(`/auth/login?redirect=/&step=${targetStep}`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">
            {title}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 sm:flex-none"
            disabled={isProcessing}
          >
            취소
          </Button>
          <Button
            onClick={handleLogin}
            className="flex-1 sm:flex-none bg-[#6366F1] hover:bg-[#5B5BD6]"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>처리 중...</span>
              </div>
            ) : (
              "로그인 진행"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
