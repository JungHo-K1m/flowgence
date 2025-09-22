"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@/components/providers/AuthProvider";

interface TempState {
  timestamp: number;
  returnUrl: string;
  targetStep?: number;
  projectData?: {
    description: string;
    serviceType: string;
    uploadedFiles: File[];
    chatMessages: any[];
    requirements: any[];
  };
}

export function useStatePersistence() {
  const { user } = useAuthContext();
  const [tempState, setTempState] = useState<TempState | null>(null);

  // 로그인 후 임시 상태 복원
  useEffect(() => {
    if (user && !tempState) {
      const savedState = localStorage.getItem('flowgence_temp_state');
      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState);
          // 1시간 이내의 상태만 복원
          if (Date.now() - parsedState.timestamp < 60 * 60 * 1000) {
            setTempState(parsedState);
          } else {
            localStorage.removeItem('flowgence_temp_state');
          }
        } catch (error) {
          console.error('Error parsing saved state:', error);
          localStorage.removeItem('flowgence_temp_state');
        }
      }
    }
  }, [user, tempState]);

  // 상태 저장
  const saveState = (projectData: TempState['projectData']) => {
    const state: TempState = {
      timestamp: Date.now(),
      returnUrl: window.location.pathname,
      projectData,
    };
    localStorage.setItem('flowgence_temp_state', JSON.stringify(state));
  };

  // 상태 복원
  const restoreState = () => {
    if (tempState) {
      localStorage.removeItem('flowgence_temp_state');
      return tempState;
    }
    return null;
  };

  // 상태 초기화
  const clearState = () => {
    localStorage.removeItem('flowgence_temp_state');
    setTempState(null);
  };

  return {
    tempState,
    saveState,
    restoreState,
    clearState,
    hasTempState: !!tempState,
  };
}
