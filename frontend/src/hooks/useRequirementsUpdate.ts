import { useState, useCallback, useRef } from 'react';
import { 
  ExtractedRequirements, 
  RequirementsExtractionState,
  RequirementsExtractionRequest 
} from '@/types/requirements';

interface ProjectInput {
  description: string;
  serviceType: string;
  uploadedFiles: File[];
  projectOverview?: any;
}

interface ChatMessage {
  type: 'user' | 'ai' | 'system';
  content: string;
}

interface RequirementsUpdateState {
  isLoading: boolean;
  error: string | null;
  lastUpdateTime: string | null;
}

export const useRequirementsUpdate = () => {
  const [state, setState] = useState<RequirementsUpdateState>({
    isLoading: false,
    error: null,
    lastUpdateTime: null,
  });

  const lastRequestHashRef = useRef<string>('');

  const updateRequirements = useCallback(async (
    input: ProjectInput, 
    messages: ChatMessage[],
    existingRequirements: ExtractedRequirements
  ) => {
    // 중복 호출 방지: 요청 해시 생성
    const requestHash = JSON.stringify({ input, messages, existingRequirements });
    if (lastRequestHashRef.current === requestHash || state.isLoading) {
      console.log('중복 요구사항 업데이트 요청 무시');
      return existingRequirements;
    }

    console.log('요구사항 업데이트 시작:', {
      description: input.description,
      messagesCount: messages.length,
      existingRequirementsCount: existingRequirements?.totalCount || 0
    });

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    lastRequestHashRef.current = requestHash;
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'requirements_update',
          input,
          messages,
          existingRequirements
        } as RequirementsExtractionRequest)
      });
      
      console.log('요구사항 업데이트 API 응답 상태:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('요구사항 업데이트 API 오류 응답:', errorData);
        throw new Error(`API Error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }
      
      const data = await response.json();
      console.log('요구사항 업데이트 API 응답 데이터:', data);
      
      setState(prev => ({
        ...prev,
        lastUpdateTime: new Date().toISOString(),
        isLoading: false,
        error: null,
      }));

      return data.requirements;
    } catch (err) {
      console.error('요구사항 업데이트 오류:', err);
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Unknown error',
        isLoading: false,
      }));
      throw err;
    }
  }, [state.isLoading]);

  const retryUpdate = useCallback(async (
    input: ProjectInput, 
    messages: ChatMessage[],
    existingRequirements: ExtractedRequirements
  ) => {
    lastRequestHashRef.current = ''; // 해시 초기화하여 재시도 허용
    return await updateRequirements(input, messages, existingRequirements);
  }, [updateRequirements]);

  return {
    ...state,
    updateRequirements,
    retryUpdate,
  };
};
