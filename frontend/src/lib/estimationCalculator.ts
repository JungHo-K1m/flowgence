// ===========================================
// 견적 계산 로직
// ===========================================

import {
  ExtractedRequirements,
  Requirement,
  RequirementCategory,
} from "@/types/requirements";
import {
  DEFAULT_ROLE_RATES,
  PRIORITY_MULTIPLIERS,
  CATEGORY_BASE_EFFORT,
  DEFAULT_ROLE_ALLOCATION,
  STAGE_PERCENTAGES,
  PAYMENT_PERCENTAGES,
  DAILY_WORKING_HOURS,
  getRoleRate,
  type RoleRates,
} from "./estimationRates";

/**
 * 요구사항별 공수 계산 결과
 */
export interface RequirementEffort {
  requirement: Requirement;
  category: string;
  baseDays: number;
  priorityMultiplier: number;
  adjustedDays: number;
  hours: number;
  cost: number;
  roles: Array<{
    role: string;
    allocation: number;
    hours: number;
    cost: number;
  }>;
}

/**
 * 카테고리별 견적 요약
 */
export interface CategoryEstimate {
  category: string;
  requirementCount: number;
  totalDays: number;
  totalHours: number;
  totalCost: number;
  requirements: RequirementEffort[];
}

/**
 * 전체 견적 계산 결과
 */
export interface EstimationResult {
  // 기본 정보
  totalRequirements: number;
  totalDays: number;
  totalHours: number;
  totalCost: number;
  
  // 카테고리별 상세
  categoryEstimates: CategoryEstimate[];
  
  // 역할별 상세
  roleBreakdown: Array<{
    role: string;
    totalHours: number;
    totalCost: number;
    percentage: number;
  }>;
  
  // 단계별 분배
  stageBreakdown: Array<{
    stage: string;
    percentage: number;
    days: number;
    hours: number;
    cost: number;
  }>;
  
  // 지불 조건
  paymentSchedule: Array<{
    stage: string;
    percentage: number;
    amount: number;
  }>;
  
  // 프로젝트 기간 추정
  estimatedDuration: string;
  estimatedWeeks: number;
  
  // 팀 구성
  teamSize: number;
  teamBreakdown: string;
}

/**
 * 요구사항 기반 견적 계산
 */
export function calculateEstimation(
  requirements: ExtractedRequirements,
  customRates?: RoleRates
): EstimationResult {
  const rates = customRates || DEFAULT_ROLE_RATES;
  const requirementEfforts: RequirementEffort[] = [];
  const categoryMap = new Map<string, RequirementEffort[]>();

  // 1. 각 요구사항별 공수 및 비용 계산
  requirements.categories.forEach((category: RequirementCategory) => {
    const categoryName = category.majorCategory || category.category || "기타";
    
    category.subCategories.forEach((subCategory) => {
      subCategory.requirements.forEach((requirement) => {
        // 기본 공수 가져오기
        const baseDays = CATEGORY_BASE_EFFORT[categoryName] || CATEGORY_BASE_EFFORT.default;
        
        // 우선순위 배수 적용
        const priorityMultiplier = PRIORITY_MULTIPLIERS[requirement.priority] || 1.0;
        const adjustedDays = baseDays * priorityMultiplier;
        const hours = adjustedDays * DAILY_WORKING_HOURS;
        
        // 역할별 비용 계산
        const roles = Object.entries(DEFAULT_ROLE_ALLOCATION)
          .filter(([role]) => role !== "기타")
          .map(([role, allocation]) => {
            const roleHours = hours * (allocation / 100);
            const roleRate = getRoleRate(role);
            const roleCost = roleHours * roleRate;
            
            return {
              role,
              allocation,
              hours: roleHours,
              cost: roleCost,
            };
          });
        
        const totalCost = roles.reduce((sum, r) => sum + r.cost, 0);
        
        const effort: RequirementEffort = {
          requirement,
          category: categoryName,
          baseDays,
          priorityMultiplier,
          adjustedDays,
          hours,
          cost: totalCost,
          roles,
        };
        
        requirementEfforts.push(effort);
        
        // 카테고리별 그룹화
        if (!categoryMap.has(categoryName)) {
          categoryMap.set(categoryName, []);
        }
        categoryMap.get(categoryName)!.push(effort);
      });
    });
  });

  // 2. 카테고리별 요약
  const categoryEstimates: CategoryEstimate[] = Array.from(categoryMap.entries()).map(
    ([category, efforts]) => ({
      category,
      requirementCount: efforts.length,
      totalDays: efforts.reduce((sum, e) => sum + e.adjustedDays, 0),
      totalHours: efforts.reduce((sum, e) => sum + e.hours, 0),
      totalCost: efforts.reduce((sum, e) => sum + e.cost, 0),
      requirements: efforts,
    })
  );

  // 3. 전체 합계
  const totalDays = requirementEfforts.reduce((sum, e) => sum + e.adjustedDays, 0);
  const totalHours = requirementEfforts.reduce((sum, e) => sum + e.hours, 0);
  const totalCost = requirementEfforts.reduce((sum, e) => sum + e.cost, 0);

  // 4. 역할별 요약
  const roleMap = new Map<string, { hours: number; cost: number }>();
  requirementEfforts.forEach((effort) => {
    effort.roles.forEach((role) => {
      if (!roleMap.has(role.role)) {
        roleMap.set(role.role, { hours: 0, cost: 0 });
      }
      const current = roleMap.get(role.role)!;
      current.hours += role.hours;
      current.cost += role.cost;
    });
  });

  const roleBreakdown = Array.from(roleMap.entries())
    .map(([role, data]) => ({
      role,
      totalHours: data.hours,
      totalCost: data.cost,
      percentage: (data.cost / totalCost) * 100,
    }))
    .sort((a, b) => b.totalCost - a.totalCost);

  // 5. 단계별 분배
  const stageBreakdown = [
    {
      stage: "요구사항 분석 및 설계",
      percentage: STAGE_PERCENTAGES.planning,
      days: Math.round(totalDays * (STAGE_PERCENTAGES.planning / 100)),
      hours: Math.round(totalHours * (STAGE_PERCENTAGES.planning / 100)),
      cost: Math.round(totalCost * (STAGE_PERCENTAGES.planning / 100)),
    },
    {
      stage: "개발",
      percentage: STAGE_PERCENTAGES.development,
      days: Math.round(totalDays * (STAGE_PERCENTAGES.development / 100)),
      hours: Math.round(totalHours * (STAGE_PERCENTAGES.development / 100)),
      cost: Math.round(totalCost * (STAGE_PERCENTAGES.development / 100)),
    },
    {
      stage: "통합 테스트 및 QA",
      percentage: STAGE_PERCENTAGES.testing,
      days: Math.round(totalDays * (STAGE_PERCENTAGES.testing / 100)),
      hours: Math.round(totalHours * (STAGE_PERCENTAGES.testing / 100)),
      cost: Math.round(totalCost * (STAGE_PERCENTAGES.testing / 100)),
    },
    {
      stage: "배포 및 안정화",
      percentage: STAGE_PERCENTAGES.deployment,
      days: Math.round(totalDays * (STAGE_PERCENTAGES.deployment / 100)),
      hours: Math.round(totalHours * (STAGE_PERCENTAGES.deployment / 100)),
      cost: Math.round(totalCost * (STAGE_PERCENTAGES.deployment / 100)),
    },
  ];

  // 6. 지불 조건
  const paymentSchedule = [
    {
      stage: "계약 시",
      percentage: PAYMENT_PERCENTAGES.contract,
      amount: Math.round(totalCost * (PAYMENT_PERCENTAGES.contract / 100)),
    },
    {
      stage: "중간 검수",
      percentage: PAYMENT_PERCENTAGES.milestone,
      amount: Math.round(totalCost * (PAYMENT_PERCENTAGES.milestone / 100)),
    },
    {
      stage: "최종 납품",
      percentage: PAYMENT_PERCENTAGES.final,
      amount: Math.round(totalCost * (PAYMENT_PERCENTAGES.final / 100)),
    },
  ];

  // 7. 프로젝트 기간 추정 (주 단위)
  const estimatedWeeks = Math.ceil(totalDays / (DAILY_WORKING_HOURS / 8 * 5)); // 주당 5일 근무 기준
  const estimatedDuration = estimatedWeeks >= 4 
    ? `${Math.round(estimatedWeeks / 4)}개월` 
    : `${estimatedWeeks}주`;

  // 8. 팀 구성 추정
  const teamSize = Math.max(3, Math.ceil(totalDays / 60)); // 최소 3명, 60일 기준으로 계산
  const teamBreakdown = roleBreakdown
    .slice(0, 5)
    .map((r) => `${r.role} ${Math.ceil(r.totalHours / 160)}명`)
    .join(", ");

  return {
    totalRequirements: requirements.totalCount,
    totalDays: Math.round(totalDays),
    totalHours: Math.round(totalHours),
    totalCost: Math.round(totalCost),
    categoryEstimates,
    roleBreakdown,
    stageBreakdown,
    paymentSchedule,
    estimatedDuration,
    estimatedWeeks,
    teamSize,
    teamBreakdown,
  };
}

/**
 * 금액 포맷팅
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ko-KR").format(amount) + "원";
}

/**
 * 기간 포맷팅
 */
export function formatDuration(days: number): string {
  if (days < 5) {
    return `${days}일`;
  } else if (days < 20) {
    return `${Math.round(days / 5)}주`;
  } else {
    return `${Math.round(days / 20)}개월`;
  }
}

