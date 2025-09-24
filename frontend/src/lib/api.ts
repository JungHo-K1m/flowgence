import { API_ENDPOINTS } from './constants';

// API Response 타입
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

// API 호출 기본 함수
async function apiCall<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: response.status,
        error: data.message || 'API 호출 중 오류가 발생했습니다.',
      };
    }

    return {
      status: response.status,
      data,
    };
  } catch (error) {
    console.error('API 호출 오류:', error);
    
    // 네트워크 에러인지 확인
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      return {
        status: 503,
        error: '백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.',
      };
    }
    
    return {
      status: 500,
      error: '네트워크 오류가 발생했습니다.',
    };
  }
}

// Health Check
export async function checkHealth(): Promise<ApiResponse> {
  return apiCall(API_ENDPOINTS.HEALTH);
}

// Projects API
export async function createProject(projectData: any): Promise<ApiResponse> {
  return apiCall(API_ENDPOINTS.PROJECTS, {
    method: 'POST',
    body: JSON.stringify(projectData),
  });
}

export async function getProjects(): Promise<ApiResponse> {
  return apiCall(API_ENDPOINTS.PROJECTS);
}

export async function getProject(id: string): Promise<ApiResponse> {
  return apiCall(API_ENDPOINTS.PROJECT_BY_ID(id));
}

export async function updateProject(id: string, projectData: any): Promise<ApiResponse> {
  return apiCall(API_ENDPOINTS.PROJECT_BY_ID(id), {
    method: 'PUT',
    body: JSON.stringify(projectData),
  });
}

export async function deleteProject(id: string): Promise<ApiResponse> {
  return apiCall(API_ENDPOINTS.PROJECT_BY_ID(id), {
    method: 'DELETE',
  });
}

export async function getProjectRequirements(id: string): Promise<ApiResponse> {
  return apiCall(API_ENDPOINTS.PROJECT_REQUIREMENTS(id));
}

export async function getProjectEstimations(id: string): Promise<ApiResponse> {
  return apiCall(API_ENDPOINTS.PROJECT_ESTIMATIONS(id));
}

// Chat API
export async function sendChatMessage(messageData: {
  projectId: string;
  message: string;
  metadata?: any;
  history?: any[];
}): Promise<ApiResponse> {
  return apiCall(API_ENDPOINTS.CHAT_MESSAGE, {
    method: 'POST',
    body: JSON.stringify(messageData),
  });
}

export async function extractRequirements(data: {
  projectId: string;
  history: any[];
}): Promise<ApiResponse> {
  return apiCall(API_ENDPOINTS.CHAT_REQUIREMENTS_EXTRACT, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateRequirements(data: {
  projectId: string;
  existingRequirements: any;
  history: any[];
}): Promise<ApiResponse> {
  return apiCall(API_ENDPOINTS.CHAT_REQUIREMENTS_UPDATE, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getChatMessages(projectId: string): Promise<ApiResponse> {
  return apiCall(API_ENDPOINTS.CHAT_MESSAGES(projectId));
}
