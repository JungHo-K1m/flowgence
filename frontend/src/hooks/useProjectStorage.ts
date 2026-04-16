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
      // Supabase 연결 상태 확인
      const { data: { user } } = await supabase.auth.getUser();

      // Supabase 함수 호출
      const { data, error } = await supabase.rpc('save_project_with_messages', {
        project_data: {
          title: projectData.title,
          description: projectData.description,
          project_overview: projectData.project_overview || null // null이면 명시적으로 null 전달
        },
        messages_data: messages
      });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

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
      // Supabase 함수 호출
      const { data, error } = await supabase.rpc('save_requirements_dual', {
        project_id_param: projectId,
        requirements_json: requirements
      });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

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
      const { data, error } = await supabase.rpc('update_project_status', {
        project_id_param: projectId,
        new_status: newStatus
      });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
      }));

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      throw err;
    }
  }, []);

  const updateProjectOverview = useCallback(async (
    projectId: string,
    overview: any
  ) => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const { data, error } = await supabase
        .from('projects')
        .update({ project_overview: overview })
        .eq('id', projectId)
        .select()
        .single();
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
      }));

      return data;
    } catch (err) {
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
      // 프로젝트 기본 정보 가져오기
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) {
        throw new Error(`프로젝트 조회 실패: ${projectError.message}`);
      }

      if (!projectData) {
        throw new Error('프로젝트 데이터를 찾을 수 없습니다');
      }

      // 채팅 메시지 가져오기
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        throw new Error(`메시지 조회 실패: ${messagesError.message}`);
      }

      // 요구사항 데이터 가져오기
      // requirements 테이블은 JSONB 필드가 없으므로 projects 테이블의 requirements JSONB 필드 사용
      // requirements 테이블은 정규화된 개별 요구사항이므로, 여기서는 projects.requirements JSONB 사용
      const requirementsFromProject = projectData?.requirements || null;

      const result = {
        project: projectData || {},
        messages: messagesData || [],
        requirements: requirementsFromProject,
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
    updateProjectOverview,
    getProjectData,
    clearState,
    setSavedProjectId,
  };
};
