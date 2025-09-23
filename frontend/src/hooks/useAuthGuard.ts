"use client";

import { useState, useCallback } from "react";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { useStatePersistence } from "./useStatePersistence";
import { useProjectStorage } from "./useProjectStorage";
import { useRequirementsExtraction } from "./useRequirementsExtraction";

export function useAuthGuard() {
  const { user, loading } = useAuthContext();
  const { saveState, tempState, restoreState, clearState } = useStatePersistence();
  const { saveProjectWithMessages, saveRequirements } = useProjectStorage();
  const { extractRequirements } = useRequirementsExtraction();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isProcessingLogin, setIsProcessingLogin] = useState(false);

  // 로그인 후 임시 상태를 실제 DB로 이전하는 함수
  const processLoginState = useCallback(async () => {
    if (!user || !tempState || isProcessingLogin) {
      return;
    }

    try {
      setIsProcessingLogin(true);
      console.log('로그인 후 상태 처리 시작:', tempState);

      const { projectData, targetStep } = tempState;
      
      if (!projectData) {
        console.log('저장된 프로젝트 데이터가 없습니다');
        clearState();
        return;
      }

      // 1. 프로젝트 데이터 저장
      const projectDataForSave = {
        title: projectData.description.substring(0, 100),
        description: projectData.description,
        serviceType: projectData.serviceType,
        project_overview: projectData.projectOverview || null, // 프로젝트 개요 포함
        uploadedFiles: projectData.uploadedFiles || [],
      };

      const messages = (projectData.chatMessages || []).map((msg: any) => ({
        role: msg.type === 'user' ? 'user' : 'assistant' as const,
        content: msg.content,
        metadata: {
          message_index: projectData.chatMessages.indexOf(msg),
          timestamp: new Date().toISOString()
        }
      }));

      console.log('프로젝트 저장 시작');
      const projectResult = await saveProjectWithMessages(projectDataForSave, messages);
      
      if (projectResult.status === 'success') {
        console.log('프로젝트 저장 성공:', projectResult.project_id);
        
        // 2. 요구사항 추출 및 저장 (채팅 메시지가 있는 경우)
        if (projectData.chatMessages && projectData.chatMessages.length > 0) {
          try {
            console.log('요구사항 추출 시작');
            const requirements = await extractRequirements(
              {
                description: projectData.description,
                serviceType: projectData.serviceType,
                uploadedFiles: projectData.uploadedFiles || [],
                projectOverview: projectData.projectOverview, // 프로젝트 개요 추가
              },
              projectData.chatMessages.map((msg: any) => ({
                type: msg.type === 'ai' ? 'ai' : msg.type,
                content: msg.content
              }))
            );

            if (requirements) {
              console.log('요구사항 저장 시작');
              const requirementsResult = await saveRequirements(projectResult.project_id, requirements);
              
              if (requirementsResult.status === 'success') {
                console.log('요구사항 저장 성공');
              } else {
                console.error('요구사항 저장 실패:', requirementsResult.message);
              }
            }
          } catch (error) {
            console.error('요구사항 추출/저장 중 오류:', error);
            // 요구사항 추출 실패해도 프로젝트는 저장되었으므로 계속 진행
          }
        }

        // 3. 임시 상태 정리
        clearState();
        
        // 4. 성공 콜백 호출 (페이지에서 상태 복원 및 단계 이동 처리)
        return {
          success: true,
          projectId: projectResult.project_id,
          targetStep: targetStep || 2,
          projectData: projectData
        };
      } else {
        console.error('프로젝트 저장 실패:', projectResult.message);
        return {
          success: false,
          error: projectResult.message
        };
      }
    } catch (error) {
      console.error('로그인 후 상태 처리 중 오류:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      setIsProcessingLogin(false);
    }
  }, [user, tempState, isProcessingLogin, saveProjectWithMessages, saveRequirements, extractRequirements, clearState]);

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
    processLoginState,
    isProcessingLogin,
    tempState,
    hasTempState: !!tempState,
  };
}
