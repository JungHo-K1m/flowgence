"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { useStatePersistence } from "./useStatePersistence";
import { useProjectStorage } from "./useProjectStorage";
import { useRequirementsExtraction } from "./useRequirementsExtraction";
import { ChatMessageData } from "@/types/chat";

export function useAuthGuard() {
  const { user, loading } = useAuthContext();
  const { saveState, tempState, clearState } = useStatePersistence();
  const { saveProjectWithMessages, saveRequirements } = useProjectStorage();
  const { extractRequirements } = useRequirementsExtraction();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isProcessingLogin, setIsProcessingLogin] = useState(false);

  // showLoginModal 상태 변경 감지
  // useEffect(() => {
  //   console.log("useAuthGuard - showLoginModal 상태 변경:", showLoginModal);
  // }, [showLoginModal]);

  // 로그인 후 임시 상태를 실제 DB로 이전하는 함수
  const processLoginState = useCallback(async () => {
    console.log('processLoginState 호출됨:', { user: !!user, tempState: !!tempState, isProcessingLogin });
    
    if (!user || !tempState) {
      console.log('processLoginState 조건 불만족:', { user: !!user, tempState: !!tempState, isProcessingLogin });
      return {
        success: false,
        error: '사용자 정보 또는 임시 상태가 없습니다'
      };
    }

    // 이미 처리 중이면 기다림
    if (isProcessingLogin) {
      console.log('이미 처리 중 - 대기');
      // 짧은 시간 대기 후 다시 시도
      await new Promise(resolve => setTimeout(resolve, 100));
      if (isProcessingLogin) {
        return {
          success: false,
          error: '이미 처리 중입니다'
        };
      }
    }

    try {
      setIsProcessingLogin(true);
      console.log('로그인 후 상태 처리 시작:', tempState);

      const { projectData, targetStep } = tempState;
      
      if (!projectData) {
        console.log('저장된 프로젝트 데이터가 없습니다');
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

      console.log('프로젝트 저장 시작');
      const projectResult = await saveProjectWithMessages(projectDataForSave, messages);
      
      if (projectResult.status === 'success') {
        console.log('프로젝트 저장 성공:', projectResult.project_id);
        
        // 2. 요구사항 추출 및 저장 (채팅 메시지가 있는 경우)
        let extractedRequirements = null;
        if (projectData.chatMessages && projectData.chatMessages.length > 0) {
          try {
            console.log('요구사항 추출 시작');
            extractedRequirements = await extractRequirements(
              {
                description: projectData.description,
                serviceType: projectData.serviceType,
                uploadedFiles: projectData.uploadedFiles || [],
                projectOverview: projectData.projectOverview, // 프로젝트 개요 추가
              },
              projectData.chatMessages.map((msg: { type: string; content: string }) => ({
                type: (msg.type === 'ai' ? 'ai' : msg.type === 'user' ? 'user' : 'system') as 'user' | 'ai' | 'system',
                content: msg.content
              }))
            );

            if (extractedRequirements) {
              console.log('요구사항 저장 시작');
              const requirementsResult = await saveRequirements(projectResult.project_id, extractedRequirements);
              
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
          projectData: projectData,
          extractedRequirements: extractedRequirements
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

  const requireAuth = (action: () => void, projectData?: { description: string; serviceType: string; chatMessages?: Array<{ type: string; content: string }>; uploadedFiles?: File[]; projectOverview?: string; requirements?: unknown[] }) => {
    console.log("requireAuth 호출됨:", { loading, user: !!user, projectData: !!projectData });
    
    if (loading) {
      console.log("로딩 중이므로 대기");
      return; // 로딩 중이면 대기
    }

    if (!user) {
      console.log("사용자 없음 - 로그인 모달 표시");
      // 프로젝트 데이터가 있으면 저장
      if (projectData) {
        console.log("프로젝트 데이터 저장:", projectData);
        const projectDataWithRequirements = {
          ...projectData,
          uploadedFiles: projectData.uploadedFiles || [],
          chatMessages: projectData.chatMessages || [],
          requirements: projectData.requirements || []
        };
        saveState(projectDataWithRequirements);
      }
      console.log("setShowLoginModal(true) 호출 전");
      setShowLoginModal(true);
      console.log("setShowLoginModal(true) 호출 후");
      return;
    }

    // 로그인된 사용자는 바로 액션 실행
    console.log("로그인된 사용자 - 액션 실행");
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
