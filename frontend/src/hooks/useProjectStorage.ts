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

  const getProjectData = useCallback(async (projectId: string) => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      console.log('기존 프로젝트 데이터 가져오기:', projectId);

      // 프로젝트 기본 정보 가져오기
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) {
        console.error('프로젝트 데이터 조회 오류:', projectError);
        throw new Error(`프로젝트 조회 실패: ${projectError.message}`);
      }

      // 채팅 메시지 가져오기
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('채팅 메시지 조회 오류:', messagesError);
        throw new Error(`메시지 조회 실패: ${messagesError.message}`);
      }

      // 요구사항 데이터 가져오기
      const { data: requirementsData, error: requirementsError } = await supabase
        .from('requirements')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (requirementsError && requirementsError.code !== 'PGRST116') {
        console.error('요구사항 데이터 조회 오류:', requirementsError);
        throw new Error(`요구사항 조회 실패: ${requirementsError.message}`);
      }

      console.log('기존 프로젝트 데이터 로드 성공:', {
        project: projectData,
        messagesCount: messagesData?.length || 0,
        hasRequirements: !!requirementsData
      });

      const result = {
        project: projectData,
        messages: messagesData || [],
        requirements: requirementsData?.requirements_json || null,
      };

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
        savedProjectId: projectId,
        isSaved: true,
      }));

      return result;
    } catch (err) {
      console.error('기존 프로젝트 데이터 로드 실패:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        isSaved: false,
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

  const setSavedProjectId = useCallback((projectId: string | null) => {
    setState(prev => ({
      ...prev,
      savedProjectId: projectId,
      isSaved: !!projectId,
    }));
  }, []);

  return {
    ...state,
    saveProjectWithMessages,
    saveRequirements,
    updateProjectStatus,
    getProjectData,
    clearState,
    setSavedProjectId,
  };
};
