// ===========================================
// 공통 타입 정의
// ===========================================

// ===========================================
// 사용자 관련 타입
// ===========================================
export interface User {
  id: string;
  email: string;
  fullName: string;
  company?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  CLIENT = 'client',
}

// ===========================================
// 프로젝트 관련 타입
// ===========================================
export interface Project {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  projectOverview?: ProjectOverview;
  requirements?: Requirement[];
  estimation?: Estimation;
  createdAt: Date;
  updatedAt: Date;
}

export enum ProjectStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  REQUIREMENTS_REVIEW = 'requirements_review',
  ESTIMATION_REVIEW = 'estimation_review',
  CONTRACT_REVIEW = 'contract_review',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface ProjectOverview {
  summary: string;
  objectives: string[];
  scope: string[];
  constraints: string[];
  stakeholders: string[];
  timeline: string;
  budget: string;
  technology: string[];
  deliverables: string[];
}

// ===========================================
// 요구사항 관련 타입
// ===========================================
export interface Requirement {
  id: string;
  projectId: string;
  title: string;
  description: string;
  category: RequirementCategory;
  priority: RequirementPriority;
  status: RequirementStatus;
  acceptanceCriteria: string[];
  dependencies: string[];
  estimatedHours?: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum RequirementCategory {
  FUNCTIONAL = 'functional',
  NON_FUNCTIONAL = 'non_functional',
  TECHNICAL = 'technical',
  BUSINESS = 'business',
  UI_UX = 'ui_ux',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  INTEGRATION = 'integration',
}

export enum RequirementPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum RequirementStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  IMPLEMENTED = 'implemented',
}

// ===========================================
// 견적 관련 타입
// ===========================================
export interface Estimation {
  id: string;
  projectId: string;
  totalCost: number;
  totalHours: number;
  breakdown: EstimationBreakdown[];
  assumptions: string[];
  risks: Risk[];
  timeline: Timeline;
  createdAt: Date;
  updatedAt: Date;
}

export interface EstimationBreakdown {
  category: string;
  description: string;
  hours: number;
  hourlyRate: number;
  totalCost: number;
  requirements: string[];
}

export interface Risk {
  id: string;
  description: string;
  impact: RiskImpact;
  probability: RiskProbability;
  mitigation: string;
}

export enum RiskImpact {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum RiskProbability {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high',
}

export interface Timeline {
  phases: Phase[];
  totalDuration: number; // weeks
  startDate: Date;
  endDate: Date;
}

export interface Phase {
  name: string;
  description: string;
  duration: number; // weeks
  dependencies: string[];
  deliverables: string[];
}

// ===========================================
// 채팅 관련 타입
// ===========================================
export interface ChatMessage {
  id: string;
  projectId: string;
  role: MessageRole;
  content: string;
  metadata?: MessageMetadata;
  createdAt: Date;
}

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

export interface MessageMetadata {
  files?: FileInfo[];
  aiModel?: string;
  tokens?: number;
  processingTime?: number;
}

// ===========================================
// 파일 관련 타입
// ===========================================
export interface FileInfo {
  id: string;
  projectId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  uploadedAt: Date;
}

// ===========================================
// API 응답 타입
// ===========================================
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ===========================================
// AI 에이전트 관련 타입
// ===========================================
export interface AIAgent {
  id: string;
  name: string;
  description: string;
  type: AgentType;
  status: AgentStatus;
  config: AgentConfig;
  createdAt: Date;
  updatedAt: Date;
}

export enum AgentType {
  RFP = 'rfp',
  ESTIMATION = 'estimation',
  CONTRACT = 'contract',
  REQUIREMENTS = 'requirements',
}

export enum AgentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TRAINING = 'training',
  ERROR = 'error',
}

export interface AgentConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  tools: string[];
}

// ===========================================
// 워크플로우 관련 타입
// ===========================================
export interface Workflow {
  id: string;
  name: string;
  description: string;
  triggers: WorkflowTrigger[];
  steps: WorkflowStep[];
  status: WorkflowStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowTrigger {
  type: TriggerType;
  config: Record<string, any>;
}

export enum TriggerType {
  WEBHOOK = 'webhook',
  SCHEDULE = 'schedule',
  EVENT = 'event',
  MANUAL = 'manual',
}

export interface WorkflowStep {
  id: string;
  type: StepType;
  name: string;
  config: Record<string, any>;
  nextSteps: string[];
}

export enum StepType {
  AI_PROCESSING = 'ai_processing',
  DATA_TRANSFORMATION = 'data_transformation',
  NOTIFICATION = 'notification',
  API_CALL = 'api_call',
  CONDITION = 'condition',
}

export enum WorkflowStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  PAUSED = 'paused',
}

// ===========================================
// 에러 타입
// ===========================================
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
}
