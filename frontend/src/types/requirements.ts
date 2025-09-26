// ===========================================
// Requirements Extraction Types
// ===========================================

export interface Requirement {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  needsClarification: boolean;
  clarificationQuestions: string[];
  status: 'draft' | 'review' | 'approved' | 'rejected' | 'implemented';
}

export interface RequirementCategory {
  majorCategory: string; // 대분류
  subCategories: {
    subCategory: string; // 중분류
    requirements: Requirement[]; // 소분류
  }[];
}

export interface ExtractedRequirements {
  categories: RequirementCategory[];
  extractedAt: string;
  totalCount: number;
  needsReview: boolean;
}

// ===========================================
// Database Storage Types
// ===========================================

export interface ProjectData {
  title: string;
  description: string;
  serviceType: string;
  project_overview: any; // ProjectOverview 타입
  uploadedFiles?: File[];
}

export interface ChatMessageData {
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    message_index?: number;
    timestamp?: string;
    [key: string]: any;
  };
}

export interface SaveProjectResponse {
  project_id: string;
  status: 'success' | 'error';
  message: string;
}

export interface SaveRequirementsResponse {
  status: 'success' | 'error';
  message: string;
}

// ===========================================
// API Request/Response Types
// ===========================================

export interface RequirementsExtractionRequest {
  type: 'requirements_extraction';
  input: {
    description: string;
    serviceType: string;
    uploadedFiles: File[];
    projectOverview?: any; // 프로젝트 개요 정보 추가
  };
  messages: Array<{
    type: 'user' | 'ai' | 'system';
    content: string;
  }>;
}

export interface RequirementsUpdateRequest {
  type: 'requirements_update';
  input: {
    description: string;
    serviceType: string;
    uploadedFiles: File[];
    projectOverview?: any;
  };
  messages: Array<{
    type: 'user' | 'ai' | 'system';
    content: string;
  }>;
  existingRequirements: ExtractedRequirements;
}

export interface RequirementsExtractionResponse {
  requirements: ExtractedRequirements;
}

// ===========================================
// UI State Types
// ===========================================

export interface RequirementsExtractionState {
  isLoading: boolean;
  error: string | null;
  extractedRequirements: ExtractedRequirements | null;
  lastExtractionTime: string | null;
}

export interface ProjectStorageState {
  isLoading: boolean;
  error: string | null;
  savedProjectId: string | null;
  isSaved: boolean;
}
