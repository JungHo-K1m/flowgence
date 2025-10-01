import { useCallback } from "react";

/**
 * 프로젝트 데이터를 메인 페이지 상태로 복원하는 공통 유틸리티 훅
 */
export function useProjectRestore() {
  /**
   * 프로젝트 데이터를 UI 상태로 복원
   */
  const restoreProjectState = useCallback(
    (
      projectData: {
        description?: string;
        serviceType?: string;
        overview?: any;
        chatMessages?: any[];
        requirements?: any;
        extractedRequirements?: any;
      },
      step: number,
      setState: {
        setProjectDescription: (value: string) => void;
        setSelectedServiceType: (value: string) => void;
        setChatMessages: (messages: any[]) => void;
        setCurrentStep: (step: number) => void;
        setShowChatInterface: (show: boolean) => void;
        setShowRequirements: (show: boolean) => void;
        setShowConfirmation: (show: boolean) => void;
        setShowFinalResult: (show: boolean) => void;
        updateOverview?: (input: any, messages: any[]) => void;
        updateExtractedRequirements?: (requirements: any) => void;
        setEditableRequirements?: (requirements: any) => void;
      }
    ) => {
      console.log("프로젝트 상태 복원 시작:", { step, hasData: !!projectData });

      // 1. 프로젝트 기본 정보 복원
      if (projectData.description) {
        setState.setProjectDescription(projectData.description);
      }
      if (projectData.serviceType) {
        setState.setSelectedServiceType(projectData.serviceType);
      }

      // 2. 프로젝트 개요 복원
      if (projectData.overview && setState.updateOverview) {
        setState.updateOverview(
          {
            description: projectData.description || "",
            serviceType: projectData.serviceType || "",
            uploadedFiles: [],
          },
          []
        );
      }

      // 3. 채팅 메시지 복원
      if (projectData.chatMessages && projectData.chatMessages.length > 0) {
        const formattedMessages = projectData.chatMessages.map(
          (msg: any, index: number) => ({
            id: msg.id || `msg-${Date.now()}-${index}`,
            type: msg.type || "ai",
            content: msg.content || "",
          })
        );
        setState.setChatMessages(formattedMessages);
      }

      // 4. 요구사항 복원
      const requirements = projectData.requirements || projectData.extractedRequirements;
      if (requirements) {
        if (setState.updateExtractedRequirements) {
          setState.updateExtractedRequirements(requirements);
        }
        if (setState.setEditableRequirements) {
          setState.setEditableRequirements(requirements);
        }
      }

      // 5. 단계별 UI 상태 설정
      setState.setCurrentStep(step);
      setUIStateForStep(step, setState);

      console.log("프로젝트 상태 복원 완료:", { step });
    },
    []
  );

  /**
   * 단계에 따른 UI 상태 설정
   */
  const setUIStateForStep = (
    step: number,
    setState: {
      setShowChatInterface: (show: boolean) => void;
      setShowRequirements: (show: boolean) => void;
      setShowConfirmation: (show: boolean) => void;
      setShowFinalResult: (show: boolean) => void;
    }
  ) => {
    switch (step) {
      case 1:
        // 1단계: 프로젝트 개요
        setState.setShowChatInterface(true);
        setState.setShowRequirements(false);
        setState.setShowConfirmation(false);
        setState.setShowFinalResult(false);
        break;
      case 2:
        // 2단계: 요구사항
        setState.setShowChatInterface(true);
        setState.setShowRequirements(true);
        setState.setShowConfirmation(false);
        setState.setShowFinalResult(false);
        break;
      case 3:
        // 3단계: 견적
        setState.setShowChatInterface(false);
        setState.setShowRequirements(false);
        setState.setShowConfirmation(true);
        setState.setShowFinalResult(false);
        break;
      case 4:
        // 4단계: 완료
        setState.setShowChatInterface(false);
        setState.setShowRequirements(false);
        setState.setShowConfirmation(false);
        setState.setShowFinalResult(true);
        break;
      default:
        // 기본값: 1단계
        setState.setShowChatInterface(true);
        setState.setShowRequirements(false);
        setState.setShowConfirmation(false);
        setState.setShowFinalResult(false);
    }
  };

  /**
   * 프로젝트 상태에서 단계 번호로 변환
   */
  const getStepFromStatus = useCallback((status: string): number => {
    switch (status) {
      case "draft":
        return 1; // 프로젝트 개요 입력 단계
      case "requirements_review":
      case "requirements_extraction":
        return 2; // 요구사항 선택 + 대화 단계
      case "estimation":
        return 3; // 기능 구성 (견적) 단계
      case "contract":
      case "in_progress":
        return 4; // 완료 단계
      case "completed":
        return 4; // 완료된 프로젝트 (결과 확인)
      default:
        return 1; // 기본값: 1단계부터 시작
    }
  }, []);

  return {
    restoreProjectState,
    getStepFromStatus,
  };
}

