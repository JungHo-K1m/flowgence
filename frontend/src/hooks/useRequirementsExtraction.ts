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
  projectOverview?: any; // 프로젝트 개요 추가
}

interface ChatMessage {
  type: 'user' | 'ai' | 'system';
  content: string;
}

export const useRequirementsExtraction = () => {
  const [state, setState] = useState<RequirementsExtractionState>({
    isLoading: false,
    error: null,
    extractedRequirements: null,
    lastExtractionTime: null,
  });

  const lastRequestHashRef = useRef<string>('');

  const extractRequirements = useCallback(async (
    input: ProjectInput, 
    messages: ChatMessage[] = []
  ) => {
    // 중복 호출 방지: 요청 해시 생성
    const requestHash = JSON.stringify({ input, messages });
    
    if (lastRequestHashRef.current === requestHash) {
      console.log('동일한 요청으로 인한 중복 호출 방지');
      return;
    }

    if (state.isLoading) {
      console.log('이미 요구사항 추출 중입니다');
      return;
    }

    console.log('요구사항 추출 시작:', { 
      description: input.description, 
      serviceType: input.serviceType,
      messagesCount: messages.length 
    });

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    lastRequestHashRef.current = requestHash;
    
    try {
      // Railway 백엔드로 직접 요청
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${backendUrl}/chat/requirements/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'temp-project-requirements',
          history: messages.map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
          }))
        })
      });
      
      console.log('요구사항 추출 API 응답 상태:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('요구사항 추출 API 오류 응답:', errorData);
        throw new Error(`API Error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }
      
      const data = await response.json();
      console.log('요구사항 추출 API 응답 데이터:', data);
      
      setState(prev => ({
        ...prev,
        extractedRequirements: data,
        lastExtractionTime: new Date().toISOString(),
        isLoading: false,
        error: null,
      }));

      return data;
    } catch (err) {
      console.error('요구사항 추출 오류:', err);
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Unknown error',
        isLoading: false,
      }));
      throw err;
    }
  }, [state.isLoading]);

  const clearRequirements = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      extractedRequirements: null,
      lastExtractionTime: null,
    });
    lastRequestHashRef.current = '';
  }, []);

  const retryExtraction = useCallback(async (
    input: ProjectInput, 
    messages: ChatMessage[]
  ) => {
    lastRequestHashRef.current = ''; // 해시 초기화하여 재시도 허용
    return await extractRequirements(input, messages);
  }, [extractRequirements]);

  return {
    ...state,
    extractRequirements,
    clearRequirements,
    retryExtraction,
  };
};
