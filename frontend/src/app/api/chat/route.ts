import { NextRequest, NextResponse } from 'next/server';

// 백엔드 연결 상태 확인 함수
const checkBackendHealth = async () => {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  
  try {
    const response = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      console.log('백엔드 연결 상태: 정상');
      return true;
    } else {
      console.error('백엔드 헬스체크 실패:', response.status);
      return false;
    }
  } catch (error) {
    console.error('백엔드 연결 실패:', error);
    return false;
  }
};

// Railway 백엔드로 요청 전달하는 함수
const callBackendAPI = async (endpoint: string, requestBody: any) => {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  
  console.log('백엔드 API 호출:', `${backendUrl}${endpoint}`);
  console.log('요청 본문:', JSON.stringify(requestBody, null, 2));
  
  try {
    const response = await fetch(`${backendUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('백엔드 응답 상태:', response.status);
    console.log('백엔드 응답 헤더:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      let errorText;
      let errorJson;
      try {
        errorText = await response.text();
        console.error('백엔드 에러 응답 (텍스트):', errorText);
        
        // JSON 파싱 시도
        try {
          errorJson = JSON.parse(errorText);
          console.error('백엔드 에러 응답 (JSON):', errorJson);
        } catch (parseError) {
          // JSON 파싱 실패 시 텍스트로 처리
        }
        
        // 529 (Overloaded) 또는 503 에러 처리
        if (response.status === 503 || response.status === 529 || 
            (errorJson && errorJson.type === 'overloaded_error') ||
            (errorText && (errorText.includes('529') || errorText.includes('Overloaded') || errorText.includes('사용량이 많아')))) {
          const overloadError: any = new Error('현재 사용량이 많아 서비스가 일시적으로 지연되고 있습니다. 잠시 후 다시 시도해주세요.');
          overloadError.type = 'overloaded_error';
          overloadError.status = response.status;
          throw overloadError;
        }
        
        throw new Error(`Backend API error: ${response.status} - ${errorJson ? JSON.stringify(errorJson) : errorText}`);
      } catch (textError: any) {
        // 이미 처리된 에러는 다시 던지기
        if (textError.type === 'overloaded_error') {
          throw textError;
        }
        console.error('에러 응답 읽기 실패:', textError);
        throw new Error(`Backend API error: ${response.status} - Failed to read error response`);
      }
    }

    const data = await response.json();
    console.log('Backend API 응답:', data);
    
    return data;
  } catch (error) {
    console.error('백엔드 API 호출 실패:', error);
    throw error;
  }
};

// 프로젝트 개요 생성 함수 - Railway 백엔드로 요청 전달
const generateProjectOverview = async (input: ProjectInput, messages: ChatMessage[]) => {
  console.log('=== 프로젝트 개요 생성 요청 ===');
  console.log('입력 데이터:', { 
    description: input.description, 
    serviceType: input.serviceType,
    messagesCount: messages.length 
  });

  try {
    // 백엔드가 기대하는 형식으로 요청 변환
    const lastMessage = messages[messages.length - 1];
    const projectDescription = input.description || lastMessage?.content || '';
    
    const response = await callBackendAPI('/chat/message', {
      projectId: 'temp-project-overview', // 임시 프로젝트 ID
      message: `프로젝트 개요 생성: ${projectDescription}`,
      metadata: {
        type: 'project_overview',
        serviceType: input.serviceType,
        uploadedFiles: input.uploadedFiles?.length || 0
      },
      history: messages.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
    });
    
    console.log('백엔드 응답 (프로젝트 개요):', response);
    return response.projectOverview || response.overview;
  } catch (error) {
    console.error('프로젝트 개요 생성 오류:', error);
    throw error;
  }
};

// 요구사항 추출 함수 - Railway 백엔드로 요청 전달
const extractRequirements = async (input: ProjectInput, messages: ChatMessage[]) => {
  console.log('=== 요구사항 추출 요청 ===');
  console.log('입력 데이터:', { 
    description: input.description, 
    serviceType: input.serviceType,
    messagesCount: messages.length,
    hasProjectOverview: !!input.projectOverview
  });

  try {
    const response = await callBackendAPI('/chat/requirements/extract', {
      projectId: 'temp-project-requirements', // 임시 프로젝트 ID
      history: messages.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
    });
    
    console.log('백엔드 응답 (요구사항 추출):', response);
    return response.requirements;
  } catch (error) {
    console.error('요구사항 추출 오류:', error);
    throw error;
  }
};

// 요구사항 업데이트 함수 - Railway 백엔드로 요청 전달
const updateRequirements = async (input: ProjectInput, messages: ChatMessage[], existingRequirements: any) => {
  console.log('=== 요구사항 업데이트 요청 ===');
  console.log('기존 요구사항 개수:', existingRequirements?.totalCount || 0);
  console.log('새 대화 메시지 개수:', messages.length);

  try {
    const response = await callBackendAPI('/chat/requirements/update', {
      projectId: 'temp-project-update', // 임시 프로젝트 ID
      existingRequirements,
      history: messages.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
    });
    
    console.log('백엔드 응답 (요구사항 업데이트):', response);
    return response.requirements;
  } catch (error) {
    console.error('요구사항 업데이트 오류:', error);
    throw error;
  }
};

interface ProjectInput {
  description: string;
  serviceType: string;
  uploadedFiles: File[];
  projectOverview?: Record<string, unknown>;
}

interface ChatMessage {
  type: 'user' | 'ai' | 'system';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('API 호출 시작');
    
    // 백엔드 연결 상태 확인
    const isBackendHealthy = await checkBackendHealth();
    if (!isBackendHealthy) {
      console.error('백엔드 연결 실패 - 요청 거부');
      return NextResponse.json({ 
        error: 'Backend service unavailable', 
        details: 'Railway backend is not responding',
        type: 'backend_unavailable'
      }, { status: 503 });
    }
    
    const requestBody = await request.json();
    const { type, input, messages, existingRequirements } = requestBody;
    console.log('요청 데이터:', { type, input: input?.description, messagesCount: messages?.length });
    
    if (type === 'project_overview') {
      console.log('프로젝트 개요 생성 시작');
      const overview = await generateProjectOverview(input, messages);
      console.log('프로젝트 개요 생성 완료:', overview);
      return NextResponse.json({ overview });
    }
    
    if (type === 'requirements_extraction') {
      console.log('요구사항 추출은 더 이상 이 API를 사용하지 않습니다. Railway 백엔드를 직접 호출하세요.');
      return NextResponse.json({ 
        error: 'Deprecated: Use Railway backend directly',
        message: 'Requirements extraction should call Railway backend directly'
      }, { status: 410 });
    }
    
    if (type === 'requirements_update') {
      console.log('요구사항 업데이트는 더 이상 이 API를 사용하지 않습니다. Railway 백엔드를 직접 호출하세요.');
      return NextResponse.json({ 
        error: 'Deprecated: Use Railway backend directly',
        message: 'Requirements update should call Railway backend directly'
      }, { status: 410 });
    }
    
    return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error',
      type: 'backend_api_error'
    }, { status: 500 });
  }
}