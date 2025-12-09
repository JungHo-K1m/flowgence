import { useState, useCallback, useRef, useEffect } from 'react';
import { isDevelopmentMode, DUMMY_PROJECT_OVERVIEW } from '@/lib/dummyData';

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
  mermaidImage?: string; // Mermaid 다이어그램 이미지 (Base64)
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
  const hasInitializedDevMode = useRef(false);

  // 개발 모드일 때 자동으로 더미 데이터 설정
  useEffect(() => {
    // 이미 overview가 있거나 초기화했으면 건너뛰기
    if (overview || hasInitializedDevMode.current) return;

    // 개발 모드가 아니면 건너뛰기
    if (!isDevelopmentMode()) return;

    // 즉시 더미 데이터 설정
    console.log('[DEV MODE] 자동으로 더미 프로젝트 개요 데이터 설정');
    hasInitializedDevMode.current = true;
    setOverview(DUMMY_PROJECT_OVERVIEW as ProjectOverview);
    setAiMessage("프로젝트 개요가 분석되었습니다. (개발 모드)");
  }, [overview]);

  const generateOverview = useCallback(async (input: ProjectInput, messages: ChatMessage[] = []) => {
    // 중복 호출 방지: 요청 해시 생성
    const requestHash = JSON.stringify({ input, messages });
    
    // 이미 같은 요청이 완료된 경우 방지
    if (requestHash === lastRequestHashRef.current && overview) {
      return;
    }
    
    // 요청 시작 전에 즉시 상태 업데이트
    setIsRequestInProgress(true);
    setIsLoading(true);
    setError(null);
    lastRequestHashRef.current = requestHash; // ref로 즉시 업데이트

    try {
      // 개발 모드: 더미 데이터 반환
      if (isDevelopmentMode()) {
        console.log('[DEV MODE] 더미 프로젝트 개요 데이터 사용');
        await new Promise(resolve => setTimeout(resolve, 300)); // 짧은 로딩 시뮬레이션

        setOverview(DUMMY_PROJECT_OVERVIEW as ProjectOverview);
        setAiMessage("프로젝트 개요가 분석되었습니다. (개발 모드)");
        setIsLoading(false);
        setIsRequestInProgress(false);
        hasInitializedDevMode.current = true;
        return;
      }

      // Railway 백엔드로 직접 요청
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const requestUrl = `${backendUrl}/chat/message`;
      
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
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API 오류 응답:', errorData);
        throw new Error(`API Error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }
      
      const data = await response.json();
      
      // projectOverview가 빈 객체인 경우 null로 처리
      if (data.projectOverview && typeof data.projectOverview === 'object' && 
          Object.keys(data.projectOverview).length === 0) {
        data.projectOverview = null;
      }
      
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
    } catch (err) {
      console.error('프로젝트 개요 생성 오류:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // Claude API 529 (Overloaded) 에러 처리
      if (errorMessage.includes('529') || errorMessage.includes('Overloaded')) {
        alert('현재 사용량이 많아 서비스가 일시적으로 지연되고 있습니다. 잠시 후 다시 시도해주세요.');
        // 메인 페이지로 이동
        window.location.href = '/';
        return;
      }
      
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

  // overview를 직접 설정하는 함수 (복원 시 사용)
  const setOverviewDirectly = useCallback((overviewData: ProjectOverview | null) => {
    setOverview(overviewData);
  }, []);

  return {
    overview,
    isLoading,
    error,
    generateOverview,
    updateOverview,
    setOverviewDirectly,
    aiMessage
  };
};
