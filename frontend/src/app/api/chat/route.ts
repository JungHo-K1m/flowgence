import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/constants';

// 백엔드 연결 상태 확인 함수
const checkBackendHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};

// Railway 백엔드로 요청 전달하는 함수
const callBackendAPI = async (endpoint: string, requestBody: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      let errorText;
      let errorJson;
      try {
        errorText = await response.text();

        // JSON 파싱 시도
        try {
          errorJson = JSON.parse(errorText);
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
        throw new Error(`Backend API error: ${response.status} - Failed to read error response`);
      }
    }

    const data = await response.json();

    return data;
  } catch (error) {
    throw error;
  }
};

// 프로젝트 개요 생성 함수 - Railway 백엔드로 요청 전달
const generateProjectOverview = async (input: ProjectInput, messages: ChatMessage[]) => {
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
    
    return response.projectOverview || response.overview;
  } catch (error) {
    throw error;
  }
};

// 요구사항 추출 함수 - Railway 백엔드로 요청 전달
const extractRequirements = async (input: ProjectInput, messages: ChatMessage[]) => {
  try {
    const response = await callBackendAPI('/chat/requirements/extract', {
      projectId: 'temp-project-requirements', // 임시 프로젝트 ID
      history: messages.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
    });
    
    return response.requirements;
  } catch (error) {
    throw error;
  }
};

// 요구사항 업데이트 함수 - Railway 백엔드로 요청 전달
const updateRequirements = async (input: ProjectInput, messages: ChatMessage[], existingRequirements: any) => {
  try {
    const response = await callBackendAPI('/chat/requirements/update', {
      projectId: 'temp-project-update', // 임시 프로젝트 ID
      existingRequirements,
      history: messages.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
    });
    
    return response.requirements;
  } catch (error) {
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
    // 백엔드 연결 상태 확인
    const isBackendHealthy = await checkBackendHealth();
    if (!isBackendHealthy) {
      return NextResponse.json({ 
        error: 'Backend service unavailable', 
        details: 'Railway backend is not responding',
        type: 'backend_unavailable'
      }, { status: 503 });
    }
    
    const requestBody = await request.json();
    const { type, input, messages, existingRequirements } = requestBody;

    if (type === 'project_overview') {
      const overview = await generateProjectOverview(input, messages);
      return NextResponse.json({ overview });
    }
    
    if (type === 'requirements_extraction') {
      return NextResponse.json({ 
        error: 'Deprecated: Use Railway backend directly',
        message: 'Requirements extraction should call Railway backend directly'
      }, { status: 410 });
    }
    
    if (type === 'requirements_update') {
      return NextResponse.json({ 
        error: 'Deprecated: Use Railway backend directly',
        message: 'Requirements update should call Railway backend directly'
      }, { status: 410 });
    }
    
    return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error',
      type: 'backend_api_error'
    }, { status: 500 });
  }
}