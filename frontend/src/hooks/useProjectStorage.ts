import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ProjectData, 
  ChatMessageData, 
  SaveProjectResponse, 
  SaveRequirementsResponse,
  ExtractedRequirements 
} from '@/types/requirements';

export const useProjectStorage = () => {
  const [state, setState] = useState({
    isLoading: false,
    error: null as string | null,
    savedProjectId: null as string | null,
    isSaved: false,
  });

  const saveProjectWithMessages = useCallback(async (
    projectData: ProjectData,
    messages: ChatMessageData[]
  ): Promise<SaveProjectResponse> => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      console.log('프로젝트와 메시지 저장 시작:', {
        title: projectData.title,
        messagesCount: messages.length
      });

      // Supabase 연결 상태 확인
      const { data: { user } } = await supabase.auth.getUser();
      console.log('현재 사용자:', user?.id);

      // Supabase 함수 호출
      const { data, error } = await supabase.rpc('save_project_with_messages', {
        project_data: {
          title: projectData.title,
          description: projectData.description,
          project_overview: projectData.project_overview
        },
        messages_data: messages
      });

      if (error) {
        console.error('프로젝트 저장 오류:', error);
        console.error('오류 상세 정보:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw new Error(`Database error: ${error.message}`);
      }

      console.log('프로젝트 저장 성공:', data);

      const result: SaveProjectResponse = {
        project_id: data.project_id,
        status: data.status,
        message: data.message
      };

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
        savedProjectId: data.project_id,
        isSaved: true,
      }));

      return result;
    } catch (err) {
      console.error('프로젝트 저장 실패:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        isSaved: false,
      }));

      return {
        project_id: '',
        status: 'error',
        message: errorMessage
      };
    }
  }, []);

  const saveRequirements = useCallback(async (
    projectId: string,
    requirements: ExtractedRequirements
  ): Promise<SaveRequirementsResponse> => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      console.log('요구사항 저장 시작:', {
        projectId,
        requirementsCount: requirements.totalCount
      });

      // Supabase 함수 호출
      const { data, error } = await supabase.rpc('save_requirements_dual', {
        project_id_param: projectId,
        requirements_json: requirements
      });

      if (error) {
        console.error('요구사항 저장 오류:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log('요구사항 저장 성공:', data);

      const result: SaveRequirementsResponse = {
        status: data.status,
        message: data.message
      };

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
      }));

      return result;
    } catch (err) {
      console.error('요구사항 저장 실패:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      return {
        status: 'error',
        message: errorMessage
      };
    }
  }, []);

  const updateProjectStatus = useCallback(async (
    projectId: string,
    newStatus: string
  ) => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      console.log('프로젝트 상태 업데이트:', { projectId, newStatus });

      const { data, error } = await supabase.rpc('update_project_status', {
        project_id_param: projectId,
        new_status: newStatus
      });

      if (error) {
        console.error('프로젝트 상태 업데이트 오류:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log('프로젝트 상태 업데이트 성공:', data);

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
      }));

      return data;
    } catch (err) {
      console.error('프로젝트 상태 업데이트 실패:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      throw err;
    }
  }, []);

  const clearState = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      savedProjectId: null,
      isSaved: false,
    });
  }, []);

  return {
    ...state,
    saveProjectWithMessages,
    saveRequirements,
    updateProjectStatus,
    clearState,
  };
};
