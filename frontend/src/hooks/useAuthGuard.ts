"use client";

import { useState } from "react";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { useStatePersistence } from "./useStatePersistence";

export function useAuthGuard() {
  const { user, loading } = useAuthContext();
  const { saveState } = useStatePersistence();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const requireAuth = (action: () => void, projectData?: any) => {
    if (loading) {
      return; // 로딩 중이면 대기
    }

    if (!user) {
      // 프로젝트 데이터가 있으면 저장
      if (projectData) {
        saveState(projectData);
      }
      setShowLoginModal(true);
      return;
    }

    // 로그인된 사용자는 바로 액션 실행
    action();
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
  };

  return {
    user,
    loading,
    showLoginModal,
    requireAuth,
    closeLoginModal,
  };
}
