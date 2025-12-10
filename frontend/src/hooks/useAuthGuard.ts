"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { useStatePersistence } from "./useStatePersistence";
import { useProjectStorage } from "./useProjectStorage";
import { useRequirementsExtraction } from "./useRequirementsExtraction";
import { ChatMessageData } from "@/types/chat";

export function useAuthGuard() {
  const { user, loading } = useAuthContext();
  const { saveState, tempState, clearState } = useStatePersistence();
  const { saveProjectWithMessages, saveRequirements, getProjectData } = useProjectStorage();
  const { extractRequirements } = useRequirementsExtraction();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isProcessingLogin, setIsProcessingLogin] = useState(false);
  const processingRef = useRef(false);

  // showLoginModal 상태 변경 감지
  // useEffect(() => {
  //   console.log("useAuthGuard - showLoginModal 상태 변경:", showLoginModal);
  // }, [showLoginModal]);

  // 로그인 후 임시 상태를 실제 DB로 이전하는 함수
  const processLoginState = useCallback(async () => {
    if (!user || !tempState) {
      return {
        success: false,
        error: '사용자 정보 또는 임시 상태가 없습니다'
      };
    }

    // 이미 처리 중이면 실패
    if (processingRef.current) {
      return {
        success: false,
        error: '이미 처리 중입니다'
      };
    }

    try {
      processingRef.current = true;
      setIsProcessingLogin(true);

      const { projectData, targetStep } = tempState;

      if (!projectData) {
        clearState();
        return {
          success: false,
          error: '저장된 프로젝트 데이터가 없습니다'
        };
      }

      // 1. 프로젝트 데이터 저장
      const projectDataForSave = {
        title: projectData.description.substring(0, 100),
        description: projectData.description,
        serviceType: projectData.serviceType,
        project_overview: projectData.projectOverview || null, // 프로젝트 개요 포함
        uploadedFiles: projectData.uploadedFiles || [],
      };

      const messages: ChatMessageData[] = (projectData.chatMessages || []).map((msg: { type: string; content: string }) => ({
        role: msg.type === 'user' ? 'user' : 'assistant' as const,
        content: msg.content,
        metadata: {
          message_index: projectData.chatMessages.indexOf(msg),
          timestamp: new Date().toISOString()
        }
      }));

      const projectResult = await saveProjectWithMessages(projectDataForSave, messages);

      if (projectResult.status === 'success') {
        // 2. 기존 프로젝트 데이터가 있는지 확인하고 가져오기
        let existingProjectData = null;
        try {
          existingProjectData = await getProjectData(projectResult.project_id);
        } catch (error) {
          // 기존 데이터가 없으면 새로 추출
          if (projectData.chatMessages && projectData.chatMessages.length > 0) {
            try {
              const extractedRequirements = await extractRequirements(
                {
                  description: projectData.description,
                  serviceType: projectData.serviceType,
                  uploadedFiles: projectData.uploadedFiles || [],
                  projectOverview: projectData.projectOverview,
                },
                projectData.chatMessages.map((msg: { type: string; content: string }) => ({
                  type: (msg.type === 'ai' ? 'ai' : msg.type === 'user' ? 'user' : 'system') as 'user' | 'ai' | 'system',
                  content: msg.content
                }))
              );

              if (extractedRequirements) {
                await saveRequirements(projectResult.project_id, extractedRequirements);
              }
            } catch (extractError) {
              // 요구사항 추출/저장 중 오류 발생
            }
          }
        }

        // 3. 임시 상태 정리
        clearState();
        
        // 4. 성공 콜백 호출 (페이지에서 상태 복원 및 단계 이동 처리)
        return {
          success: true,
          projectId: projectResult.project_id,
          targetStep: targetStep || 2,
          projectData: projectData,
          existingProjectData: existingProjectData
        };
      } else {
        return {
          success: false,
          error: projectResult.message
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      processingRef.current = false;
      setIsProcessingLogin(false);
    }
  }, [user, tempState, isProcessingLogin, saveProjectWithMessages, saveRequirements, extractRequirements, clearState]);

  const requireAuth = (action: () => void, projectData?: { description: string; serviceType: string; chatMessages?: Array<{ type: string; content: string }>; uploadedFiles?: File[]; projectOverview?: string; requirements?: unknown[] }) => {
    if (loading) {
      return; // 로딩 중이면 대기
    }

    if (!user) {
      // 프로젝트 데이터가 있으면 저장
      if (projectData) {
        const projectDataWithRequirements = {
          ...projectData,
          uploadedFiles: projectData.uploadedFiles || [],
          chatMessages: projectData.chatMessages || [],
          requirements: projectData.requirements || []
        };
        saveState(projectDataWithRequirements);
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
    processLoginState,
    isProcessingLogin,
    tempState,
    hasTempState: !!tempState,
  };
}
