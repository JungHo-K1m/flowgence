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
    businessModel?: {
      revenueStreams: string[];
      monetizationStrategy: string;
      pricingModel: string;
      targetMarketSize: string;
      competitiveAdvantage: string;
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
  aiAnalysis?: {
    insights: Array<{
      type: "strength" | "suggestion" | "warning";
      icon: string;
      message: string;
    }>;
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
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const lastAiMessageRef = useRef<string | null>(null);

  const generateOverview = useCallback(async (input: ProjectInput, messages: ChatMessage[] = []) => {
    // 중복 호출 방지: 요청 해시 생성
    const requestHash = JSON.stringify({ input, messages });
    console.log('요청 해시 비교:', { 
      requestHash: requestHash.substring(0, 100) + '...', 
      lastRequestHash: lastRequestHashRef.current.substring(0, 100) + '...', 
      isSame: requestHash === lastRequestHashRef.current,
      isRequestInProgress
    });
    
    // 이미 같은 요청이 완료된 경우 방지
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
      // Railway 백엔드로 직접 요청
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const requestUrl = `${backendUrl}/chat/message`;
      
      console.log('=== API 요청 시작 ===');
      console.log('요청 URL:', requestUrl);
      console.log('Origin:', window.location.origin);
      console.log('Request Headers:', { 'Content-Type': 'application/json' });
      
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'temp-project-overview',
          message: `프로젝트 개요 생성: ${input.description}`,
          metadata: {
            type: 'project_overview',
            serviceType: input.serviceType,
            uploadedFiles: input.uploadedFiles?.length || 0
          },
          history: messages.map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
          }))
        })
      });
      
      console.log('=== API 응답 수신 ===');
      console.log('응답 상태:', response.status);
      console.log('응답 Headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API 오류 응답:', errorData);
        throw new Error(`API Error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }
      
      const data = await response.json();
      console.log('API 응답 데이터:', data);
      console.log('=== useProjectOverview 훅에서 overview 설정 ===');
      console.log('설정할 overview 데이터:', data.projectOverview);
      console.log('projectOverview 타입:', typeof data.projectOverview);
      console.log('projectOverview가 null인가?', data.projectOverview === null);
      
      // 백엔드 응답 구조를 프론트엔드 구조로 변환
      let processedOverview = data.projectOverview;
      
      // 백엔드에서 직접 serviceCoreElements를 보내지 않는 경우 변환
      if (processedOverview && !processedOverview.serviceCoreElements) {
        processedOverview = {
          serviceCoreElements: {
            title: processedOverview.title || '프로젝트 제목',
            description: processedOverview.description || '프로젝트 설명',
            keyFeatures: processedOverview.keyFeatures || ['AI 기반 자동화'],
            targetUsers: processedOverview.targetUsers || ['일반 사용자'],
            projectScale: processedOverview.projectScale || '중규모',
            techComplexity: processedOverview.techComplexity || '보통',
            estimatedDuration: processedOverview.estimatedDuration || '2-3개월',
            requiredTeam: processedOverview.requiredTeam || ['프론트엔드 개발자', '백엔드 개발자'],
            techStack: processedOverview.techStack || {
              frontend: ['React', 'Next.js'],
              backend: ['Node.js', 'NestJS'],
              database: ['PostgreSQL'],
              infrastructure: ['AWS', 'Vercel']
            },
            businessModel: processedOverview.businessModel || {
              revenueStreams: ['구독료', '수수료'],
              monetizationStrategy: '구독 기반 수익 모델',
              pricingModel: '월 구독',
              targetMarketSize: '중소기업',
              competitiveAdvantage: 'AI 기반 자동화'
            }
          },
          userJourney: processedOverview.userJourney || {
            steps: [
              {
                step: 1,
                title: '프로젝트 개요 수집',
                description: '사용자 요구사항 수집',
                userAction: '프로젝트 설명 입력',
                systemResponse: 'AI 분석 및 개요 생성',
                estimatedHours: '2-4시간',
                requiredSkills: ['프론트엔드 개발']
              }
            ]
          }
        };
      }
      
      setOverview(processedOverview);
      
      // AI 메시지 설정 (중복 방지)
      if (data.aiMessage?.content && data.aiMessage.content !== lastAiMessageRef.current) {
        setAiMessage(data.aiMessage.content);
        lastAiMessageRef.current = data.aiMessage.content;
      }
      
      console.log('overview 상태 설정 완료');
      console.log('===============================================');
    } catch (err) {
      console.error('프로젝트 개요 생성 오류:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // 백엔드 연결 실패인 경우 특별한 메시지 표시
      if (errorMessage.includes('Backend service unavailable') || errorMessage.includes('503')) {
        setError('백엔드 서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.');
      } else if (errorMessage.includes('Backend API error')) {
        setError('백엔드 API 호출에 실패했습니다. 서버 상태를 확인해주세요.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
      setIsRequestInProgress(false);
    }
  }, [overview]);

  const updateOverview = useCallback(async (input: ProjectInput, messages: ChatMessage[]) => {
    // AI 메시지 초기화 (새로운 요청 시작 시)
    setAiMessage(null);
    lastAiMessageRef.current = null;
    
    // 채팅 메시지가 추가될 때마다 프로젝트 개요 업데이트
    await generateOverview(input, messages);
  }, [generateOverview]);

  return {
    overview,
    isLoading,
    error,
    generateOverview,
    updateOverview,
    aiMessage
  };
};
