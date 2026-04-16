import { useState, useCallback, useRef } from 'react';
import {
  ExtractedRequirements,
  RequirementsUpdateRequest
} from '@/types/requirements';
import { API_BASE_URL } from '@/lib/constants';

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
      return existingRequirements;
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    lastRequestHashRef.current = requestHash;
    
    try {
      // Railway 백엔드로 직접 요청
      const response = await fetch(`${API_BASE_URL}/chat/requirements/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'temp-project-requirements',
          history: messages.map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
          })),
          existingRequirements
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }
      
      const data = await response.json();

      setState(prev => ({
        ...prev,
        lastUpdateTime: new Date().toISOString(),
        isLoading: false,
        error: null,
      }));

      return data;
    } catch (err) {
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
