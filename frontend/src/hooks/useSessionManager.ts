"use client";

import { useEffect, useCallback, useRef } from "react";

export interface SessionData {
  sessionId: string;
  timestamp: number;
  lastUpdated: number;
  returnUrl: string;
  currentStep: number;
  projectDescription: string;
  userComment: string;
  fileNamesDisplay: string;
  selectedServiceType: string;
  uploadedFiles: Array<{
    name: string;
    size: number;
    type: string;
    lastModified: number;
  }>; // File 객체는 직렬화 불가이므로 메타데이터만 저장
  chatMessages: any[];
  editableRequirements: any;
  extractedRequirements: any;
  overview: any;
  showChatInterface: boolean;
  showRequirements: boolean;
  showConfirmation: boolean;
  showFinalResult: boolean;
  fileContents?: string; // 파일 내용도 세션에 포함 (재업로드 불필요)
}

const SESSION_STORAGE_KEY = "flowgence_active_session";
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24시간
const SESSION_UPDATE_INTERVAL_MS = 30 * 1000; // 30초마다 자동 저장

export function useSessionManager() {
  const sessionIdRef = useRef<string | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRestoringRef = useRef(false);

  // 고유 세션 ID 생성
  const generateSessionId = useCallback(() => {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }, []);

  // 현재 세션 ID 가져오기 또는 생성
  const getCurrentSessionId = useCallback(() => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = generateSessionId();
    }
    return sessionIdRef.current;
  }, [generateSessionId]);

  // 세션 데이터 저장
  const saveSession = useCallback(
    (data: Partial<SessionData>) => {
      try {
        // 현재 세션 ID 사용
        const sessionId = getCurrentSessionId();

        // 기존 세션 데이터 가져오기 (있다면)
        const existingSession = getSession(sessionId);

        // 새 세션 데이터 생성
        const sessionData: SessionData = {
          sessionId,
          timestamp: existingSession?.timestamp || Date.now(),
          lastUpdated: Date.now(),
          returnUrl: window.location.pathname + window.location.search,
          currentStep: data.currentStep ?? existingSession?.currentStep ?? 1,
          projectDescription: data.projectDescription ?? existingSession?.projectDescription ?? "",
          userComment: data.userComment ?? existingSession?.userComment ?? "",
          fileNamesDisplay: data.fileNamesDisplay ?? existingSession?.fileNamesDisplay ?? "",
          selectedServiceType: data.selectedServiceType ?? existingSession?.selectedServiceType ?? "",
          uploadedFiles: data.uploadedFiles ?? existingSession?.uploadedFiles ?? [],
          chatMessages: data.chatMessages ?? existingSession?.chatMessages ?? [],
          editableRequirements: data.editableRequirements ?? existingSession?.editableRequirements ?? null,
          extractedRequirements: data.extractedRequirements ?? existingSession?.extractedRequirements ?? null,
          overview: data.overview ?? existingSession?.overview ?? null,
          showChatInterface: data.showChatInterface ?? existingSession?.showChatInterface ?? false,
          showRequirements: data.showRequirements ?? existingSession?.showRequirements ?? false,
          showConfirmation: data.showConfirmation ?? existingSession?.showConfirmation ?? false,
          showFinalResult: data.showFinalResult ?? existingSession?.showFinalResult ?? false,
          fileContents: data.fileContents ?? existingSession?.fileContents,
        };

        // 세션 만료 확인
        if (Date.now() - sessionData.timestamp > SESSION_EXPIRY_MS) {
          console.log("세션이 만료되었습니다. 새 세션을 생성합니다.");
          clearSession(sessionId);
          sessionData.sessionId = generateSessionId();
          sessionData.timestamp = Date.now();
          sessionIdRef.current = sessionData.sessionId;
        }

        // localStorage에 저장
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
        console.log("세션 저장 완료:", sessionData.sessionId);

        return sessionData;
      } catch (error) {
        console.error("세션 저장 실패:", error);
        return null;
      }
    },
    [getCurrentSessionId, generateSessionId]
  );

  // 세션 데이터 가져오기
  const getSession = useCallback((sessionId?: string): SessionData | null => {
    try {
      const savedSession = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!savedSession) return null;

      const sessionData: SessionData = JSON.parse(savedSession);

      // 특정 세션 ID 요청 시 확인
      if (sessionId && sessionData.sessionId !== sessionId) {
        return null;
      }

      // 세션 만료 확인
      if (Date.now() - sessionData.timestamp > SESSION_EXPIRY_MS) {
        console.log("세션이 만료되었습니다.");
        clearSession(sessionData.sessionId);
        return null;
      }

      return sessionData;
    } catch (error) {
      console.error("세션 로드 실패:", error);
      return null;
    }
  }, []);

  // 현재 활성 세션 가져오기
  const getActiveSession = useCallback((): SessionData | null => {
    return getSession();
  }, [getSession]);

  // 세션 복원
  const restoreSession = useCallback((): SessionData | null => {
    const sessionData = getActiveSession();
    if (sessionData) {
      sessionIdRef.current = sessionData.sessionId;
      // console.log("세션 복원:", sessionData.sessionId);
    }
    return sessionData;
  }, [getActiveSession]);

  // 세션 삭제
  const clearSession = useCallback((sessionId?: string) => {
    try {
      if (sessionId) {
        const savedSession = localStorage.getItem(SESSION_STORAGE_KEY);
        if (savedSession) {
          const sessionData: SessionData = JSON.parse(savedSession);
          if (sessionData.sessionId === sessionId) {
            localStorage.removeItem(SESSION_STORAGE_KEY);
          }
        }
      } else {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
      sessionIdRef.current = null;
      console.log("세션 삭제 완료");
    } catch (error) {
      console.error("세션 삭제 실패:", error);
    }
  }, []);

  // 자동 저장 시작
  const startAutoSave = useCallback(
    (getCurrentState: () => Partial<SessionData>) => {
      // 기존 타이머 정리
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }

      // 주기적으로 상태 저장
      autoSaveTimerRef.current = setInterval(() => {
        if (!isRestoringRef.current) {
          const currentState = getCurrentState();
          saveSession(currentState);
        }
      }, SESSION_UPDATE_INTERVAL_MS);
    },
    [saveSession]
  );

  // 자동 저장 중지
  const stopAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
  }, []);

  // 페이지 언로드 시 저장
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // 세션 저장은 자동 저장 타이머에서 처리하므로 여기서는 특별히 할 일 없음
      // 필요시 추가 로직 구현 가능
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      stopAutoSave();
    };
  }, [stopAutoSave]);

  return {
    saveSession,
    getSession,
    getActiveSession,
    restoreSession,
    clearSession,
    startAutoSave,
    stopAutoSave,
    getCurrentSessionId,
    isRestoring: isRestoringRef,
  };
}

