import { NextRequest, NextResponse } from 'next/server';

// Railway 백엔드로 요청 전달하는 함수
const callBackendAPI = async (endpoint: string, requestBody: any) => {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  
  const response = await fetch(`${backendUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    throw new Error(`Backend API error: ${response.status}`);
  }

  const data = await response.json();
  console.log('Backend API 응답:', data);
  
  return data;
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
    const response = await callBackendAPI('/chat/message', {
      type: 'project_overview',
      input,
      messages
    });
    
    console.log('백엔드 응답 (프로젝트 개요):', response);
    return response.overview;
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
      type: 'requirements_extraction',
      input,
      messages
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
      type: 'requirements_update',
      input,
      messages,
      existingRequirements
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
      console.log('요구사항 추출 시작');
      const requirements = await extractRequirements(input, messages);
      console.log('요구사항 추출 완료:', requirements);
      return NextResponse.json({ requirements });
    }
    
    if (type === 'requirements_update') {
      console.log('요구사항 업데이트 시작');
      console.log('기존 요구사항 개수:', existingRequirements?.totalCount || 0);
      const updatedRequirements = await updateRequirements(input, messages, existingRequirements);
      console.log('요구사항 업데이트 완료:', updatedRequirements);
      return NextResponse.json({ requirements: updatedRequirements });
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