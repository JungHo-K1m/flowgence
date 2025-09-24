// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// API Endpoints
export const API_ENDPOINTS = {
  // Health check
  HEALTH: `${API_BASE_URL}/health`,
  
  // Projects
  PROJECTS: `${API_BASE_URL}/projects`,
  PROJECT_BY_ID: (id: string) => `${API_BASE_URL}/projects/${id}`,
  PROJECT_REQUIREMENTS: (id: string) => `${API_BASE_URL}/projects/${id}/requirements`,
  PROJECT_ESTIMATIONS: (id: string) => `${API_BASE_URL}/projects/${id}/estimations`,
  
  // Chat
  CHAT_MESSAGE: `${API_BASE_URL}/chat/message`,
  CHAT_REQUIREMENTS_EXTRACT: `${API_BASE_URL}/chat/requirements/extract`,
  CHAT_REQUIREMENTS_UPDATE: `${API_BASE_URL}/chat/requirements/update`,
  CHAT_MESSAGES: (projectId: string) => `${API_BASE_URL}/chat/messages/${projectId}`,
} as const;

// Service Types
export const SERVICE_TYPES = [
  { id: 'food-delivery', name: '음식 배달', description: '배달 앱 및 플랫폼' },
  { id: 'real-estate', name: '부동산 플랫폼', description: '부동산 중개 및 관리' },
  { id: 'work-management', name: '업무 관리 도구', description: '프로젝트 및 업무 관리' },
  { id: 'online-education', name: '온라인 교육', description: '교육 플랫폼 및 LMS' },
  { id: 'e-commerce', name: '쇼핑몰', description: '전자상거래 플랫폼' },
] as const;

// Project Status
export const PROJECT_STATUS = {
  DRAFT: 'draft',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  CLIENT: 'client',
} as const;

// Permissions
export const PERMISSIONS = {
  [USER_ROLES.ADMIN]: ['read', 'write', 'delete', 'admin'],
  [USER_ROLES.USER]: ['read', 'write'],
  [USER_ROLES.CLIENT]: ['read'],
} as const;
