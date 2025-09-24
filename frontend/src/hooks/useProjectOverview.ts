import { useState, useCallback, useRef } from 'react';

interface ProjectOverview {
  serviceCoreElements: {
    title: string;
    description: string;
    keyFeatures: string[];
    targetUsers: string[];
    projectScale?: string;
    techComplexity?: string;
    estimatedDuration?: string;
    requiredTeam?: string[];
    techStack?: {
      frontend: string[];
      backend: string[];
      database: string[];
      infrastructure: string[];
    };
  };
  userJourney: {
    steps: Array<{
      step: number;
      title: string;
      description: string;
      userAction: string;
      systemResponse: string;
      estimatedHours?: string;
      requiredSkills?: string[];
    }>;
  };
  estimation?: {
    totalCost: string;
    breakdown: {
      development: string;
      design: string;
      testing: string;
      deployment: string;
    };
    timeline: {
      planning: string;
      development: string;
      testing: string;
      deployment: string;
    };
  };
}

interface ProjectInput {
  description: string;
  serviceType: string;
  uploadedFiles: File[];
}

interface ChatMessage {
  type: 'user' | 'ai' | 'system';
  content: string;
}

export const useProjectOverview = () => {
  const [overview, setOverview] = useState<ProjectOverview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastRequestHashRef = useRef<string>("");
  const [isRequestInProgress, setIsRequestInProgress] = useState(false);

  const generateOverview = useCallback(async (input: ProjectInput, messages: ChatMessage[] = []) => {
    // 중복 호출 방지: 요청 해시 생성
    const requestHash = JSON.stringify({ input, messages });
    console.log('요청 해시 비교:', { 
      requestHash: requestHash.substring(0, 100) + '...', 
      lastRequestHash: lastRequestHashRef.current.substring(0, 100) + '...', 
      isSame: requestHash === lastRequestHashRef.current 
    });
    
    // 이미 같은 요청이 진행 중이거나 완료된 경우 방지
    if (isRequestInProgress) {
      console.log('요청이 이미 진행 중이므로 건너뜀');
      return;
    }
    
    if (requestHash === lastRequestHashRef.current && overview) {
      console.log('중복 요청 방지:', requestHash.substring(0, 100) + '...');
      return;
    }

    console.log('새로운 API 호출 시작:', { input, messagesCount: messages.length });
    
    // 요청 시작 전에 즉시 상태 업데이트
    setIsRequestInProgress(true);
    setIsLoading(true);
    setError(null);
    lastRequestHashRef.current = requestHash; // ref로 즉시 업데이트
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'project_overview',
          input,
          messages
        })
      });
      
      console.log('API 응답 상태:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API 오류 응답:', errorData);
        throw new Error(`API Error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }
      
      const data = await response.json();
      console.log('API 응답 데이터:', data);
      console.log('=== useProjectOverview 훅에서 overview 설정 ===');
      console.log('설정할 overview 데이터:', data.overview);
      setOverview(data.overview);
      console.log('overview 상태 설정 완료');
      console.log('===============================================');
    } catch (err) {
      console.error('프로젝트 개요 생성 오류:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
      setIsRequestInProgress(false);
    }
  }, [overview, isRequestInProgress]);

  const updateOverview = useCallback(async (input: ProjectInput, messages: ChatMessage[]) => {
    // 채팅 메시지가 추가될 때마다 프로젝트 개요 업데이트
    await generateOverview(input, messages);
  }, [generateOverview]);

  return {
    overview,
    isLoading,
    error,
    generateOverview,
    updateOverview
  };
};
