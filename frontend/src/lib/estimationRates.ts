// ===========================================
// 견적 산출 단가 설정
// ===========================================

/**
 * 역할별 시간당 단가 (원/시간)
 */
export interface RoleRates {
  [key: string]: number;
}

export const DEFAULT_ROLE_RATES: RoleRates = {
  // 개발자
  '프론트엔드 개발자': 80000,      // 8만원/시간
  '백엔드 개발자': 85000,          // 8.5만원/시간
  '풀스택 개발자': 90000,          // 9만원/시간
  '개발자': 80000,                 // 기본 개발자
  
  // 디자이너
  'UI/UX 디자이너': 70000,         // 7만원/시간
  '디자이너': 70000,               // 기본 디자이너
  
  // 기타
  '프로젝트 매니저': 100000,       // 10만원/시간
  'PM': 100000,                    // PM 약어
  'QA 엔지니어': 60000,            // 6만원/시간
  '데브옵스 엔지니어': 90000,      // 9만원/시간
  '기획자': 65000,                 // 6.5만원/시간
};

/**
 * 우선순위별 공수 배수
 * high: 1.5배, medium: 1.0배, low: 0.7배
 */
export const PRIORITY_MULTIPLIERS = {
  high: 1.5,
  medium: 1.0,
  low: 0.7,
} as const;

/**
 * 카테고리별 기본 공수 (일)
 */
export interface CategoryBaseEffort {
  [key: string]: number;
}

export const CATEGORY_BASE_EFFORT: CategoryBaseEffort = {
  // 인증/사용자 관리
  '인증': 3,
  '사용자 관리': 2,
  '권한 관리': 2,
  
  // 결제/주문
  '결제': 5,
  '주문 관리': 3,
  '결제 시스템': 5,
  
  // 관리자
  '관리자': 4,
  '관리자 기능': 4,
  '대시보드': 3,
  
  // 콘텐츠
  '콘텐츠 관리': 3,
  '게시판': 2,
  '검색': 2,
  
  // 통합/API
  'API 연동': 4,
  '외부 서비스 연동': 5,
  '통합': 4,
  
  // 기본값
  'default': 3,
};

/**
 * 역할별 기본 투입 비율 (%)
 */
export interface RoleAllocation {
  [key: string]: number;
}

export const DEFAULT_ROLE_ALLOCATION: RoleAllocation = {
  '프론트엔드 개발자': 30,
  '백엔드 개발자': 30,
  'UI/UX 디자이너': 15,
  '프로젝트 매니저': 10,
  'QA 엔지니어': 10,
  '기타': 5,
};

/**
 * 단계별 비율 (%)
 */
export const STAGE_PERCENTAGES = {
  planning: 20,      // 요구사항 분석 및 설계
  development: 50,   // 개발
  testing: 15,       // 통합 테스트 및 QA
  deployment: 15,    // 배포 및 안정화
} as const;

/**
 * 지불 조건 비율 (%)
 */
export const PAYMENT_PERCENTAGES = {
  contract: 30,      // 계약 시
  milestone: 40,     // 중간 검수
  final: 30,         // 최종 납품
} as const;

/**
 * 일일 근무 시간 (시간)
 */
export const DAILY_WORKING_HOURS = 8;

/**
 * 주당 근무 일수 (일)
 */
export const WEEKLY_WORKING_DAYS = 5;

/**
 * 월 근무 시간 계산 (시간)
 */
export const MONTHLY_WORKING_HOURS = DAILY_WORKING_HOURS * WEEKLY_WORKING_DAYS * 4; // 약 160시간

/**
 * 단가 업데이트 함수
 */
export function updateRoleRate(role: string, rate: number): RoleRates {
  return {
    ...DEFAULT_ROLE_RATES,
    [role]: rate,
  };
}

/**
 * 모든 단가 가져오기
 */
export function getAllRates(): RoleRates {
  return { ...DEFAULT_ROLE_RATES };
}

/**
 * 특정 역할의 단가 가져오기
 */
export function getRoleRate(role: string): number {
  // 정확한 매칭 먼저 시도
  if (DEFAULT_ROLE_RATES[role]) {
    return DEFAULT_ROLE_RATES[role];
  }
  
  // 부분 매칭 시도
  const matchedRole = Object.keys(DEFAULT_ROLE_RATES).find(key => 
    role.includes(key) || key.includes(role)
  );
  
  if (matchedRole) {
    return DEFAULT_ROLE_RATES[matchedRole];
  }
  
  // 기본값 반환
  return DEFAULT_ROLE_RATES['개발자'];
}

