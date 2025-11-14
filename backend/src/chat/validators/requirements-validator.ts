// 요구사항 JSON 검증 유틸리티

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

const FORBIDDEN_PLACEHOLDERS = ['qwe', 'asd', 'undefined', '미정', 'TBD', 'TODO'];
const FORBIDDEN_TECH_STACKS = ['Express']; // NestJS 사용해야 함

/**
 * 요구사항 JSON 검증
 */
export function validateRequirementsJSON(data: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Placeholder 금지어 검사
  const forbiddenFound = findForbiddenPlaceholders(JSON.stringify(data));
  if (forbiddenFound.length > 0) {
    errors.push(`금지된 placeholder 발견: ${forbiddenFound.join(', ')}`);
  }

  // 2. 기술 스택 검증 (NestJS 강제)
  const techStackIssues = validateTechStack(data);
  errors.push(...techStackIssues);

  // 3. FR 최소 기준 검증
  const frValidation = validateFunctionalRequirements(data);
  errors.push(...frValidation.errors);
  warnings.push(...frValidation.warnings);

  // 4. NFR 검증
  const nfrValidation = validateNonFunctionalRequirements(data);
  errors.push(...nfrValidation.errors);
  warnings.push(...nfrValidation.warnings);

  // 5. 정합성 검사
  const consistencyIssues = validateConsistency(data);
  errors.push(...consistencyIssues);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Placeholder 금지어 탐지
 */
function findForbiddenPlaceholders(text: string): string[] {
  const found: string[] = [];
  FORBIDDEN_PLACEHOLDERS.forEach((placeholder) => {
    const regex = new RegExp(`\\b${placeholder}\\b`, 'gi');
    if (regex.test(text)) {
      found.push(placeholder);
    }
  });
  return found;
}

/**
 * 기술 스택 검증
 */
function validateTechStack(data: any): string[] {
  const errors: string[] = [];
  const techStackStr = JSON.stringify(data).toLowerCase();

  FORBIDDEN_TECH_STACKS.forEach((forbidden) => {
    if (techStackStr.includes(forbidden.toLowerCase())) {
      errors.push(`금지된 기술 스택 "${forbidden}" 발견. NestJS를 사용해야 합니다.`);
    }
  });

  return errors;
}

/**
 * 기능 요구사항(FR) 검증
 */
function validateFunctionalRequirements(data: any): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data.categories || !Array.isArray(data.categories)) {
    errors.push('categories 배열이 없거나 유효하지 않습니다.');
    return { errors, warnings };
  }

  data.categories.forEach((category: any, catIndex: number) => {
    if (!category.subCategories || !Array.isArray(category.subCategories)) {
      warnings.push(`카테고리 "${category.category}"에 subCategories가 없습니다.`);
      return;
    }

    category.subCategories.forEach((subCategory: any) => {
      if (!subCategory.requirements || !Array.isArray(subCategory.requirements)) {
        return;
      }

      subCategory.requirements.forEach((req: any, reqIndex: number) => {
        const reqId = req.id || `FR-${catIndex+1}-${reqIndex+1}`;

        // 필수 필드 검사
        if (!req.title || req.title.trim().length === 0) {
          errors.push(`${reqId}: title이 비어있습니다.`);
        }

        if (!req.description || req.description.length < 40) {
          warnings.push(`${reqId}: description이 40자 미만입니다 (현재: ${req.description?.length || 0}자).`);
        }

        // AC 검증 (최소 3개, 타입 다양성)
        if (!req.ac || !Array.isArray(req.ac) || req.ac.length < 3) {
          warnings.push(`${reqId}: 수용기준(ac)이 3개 미만입니다.`);
        } else {
          const types = req.ac.map((ac: any) => ac.type);
          const hasFunc = types.includes('functional');
          const hasAccess = types.includes('accessibility');
          const hasError = types.includes('error') || types.includes('performance');
          
          if (!hasFunc || !hasAccess || !hasError) {
            warnings.push(`${reqId}: AC에 functional, accessibility, error/performance 중 하나 이상 누락.`);
          }
        }

        // dataRules 검증 (최소 3개)
        if (!req.dataRules || !Array.isArray(req.dataRules) || req.dataRules.length < 3) {
          warnings.push(`${reqId}: 데이터 규칙(dataRules)이 3개 미만입니다.`);
        }

        // exceptions 검증 (최소 2개)
        if (!req.exceptions || !Array.isArray(req.exceptions) || req.exceptions.length < 2) {
          warnings.push(`${reqId}: 예외 처리(exceptions)가 2개 미만입니다.`);
        }

        // roles 검증
        if (!req.roles || !Array.isArray(req.roles) || req.roles.length === 0) {
          warnings.push(`${reqId}: 역할(roles)이 명시되지 않았습니다.`);
        }

        // trace 검증
        if (!req.trace || typeof req.trace !== 'object') {
          warnings.push(`${reqId}: 추적성(trace)이 없습니다.`);
        } else {
          if (!req.trace.screens || req.trace.screens.length === 0) {
            warnings.push(`${reqId}: trace.screens가 비어있습니다.`);
          }
          if (!req.trace.apis || req.trace.apis.length === 0) {
            warnings.push(`${reqId}: trace.apis가 비어있습니다.`);
          }
        }
      });
    });
  });

  return { errors, warnings };
}

/**
 * 비기능 요구사항(NFR) 검증
 */
function validateNonFunctionalRequirements(data: any): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data.nonFunctionalRequirements || !Array.isArray(data.nonFunctionalRequirements)) {
    warnings.push('nonFunctionalRequirements 배열이 없습니다.');
    return { errors, warnings };
  }

  data.nonFunctionalRequirements.forEach((nfr: any, index: number) => {
    const nfrId = nfr.id || `NFR-${index+1}`;

    // metric 검증 (정량 지표 필수)
    if (!nfr.metric || nfr.metric.trim().length === 0) {
      warnings.push(`${nfrId}: 측정 가능한 지표(metric)가 없습니다.`);
    }

    // howToVerify 검증 (검증 방법 필수)
    if (!nfr.howToVerify || nfr.howToVerify.trim().length === 0) {
      warnings.push(`${nfrId}: 검증 방법(howToVerify)이 명시되지 않았습니다.`);
    }

    // statement 검증
    if (!nfr.statement || nfr.statement.trim().length === 0) {
      errors.push(`${nfrId}: 요구사항 문장(statement)이 비어있습니다.`);
    }
  });

  return { errors, warnings };
}

/**
 * 정합성 검증 (화면 수, 일정 등)
 */
function validateConsistency(data: any): string[] {
  const errors: string[] = [];

  // 화면 수 정합성 (meta.totalScreens == screens.length)
  if (data.meta && typeof data.meta.totalScreens === 'number') {
    const actualScreenCount = data.screens?.length || 0;
    if (data.meta.totalScreens !== actualScreenCount) {
      errors.push(`화면 수 불일치: meta.totalScreens=${data.meta.totalScreens}, screens.length=${actualScreenCount}`);
    }
  }

  // WBS 일정 정합성 검사
  if (data.wbs && Array.isArray(data.wbs)) {
    const totalEffort = data.wbs.reduce((sum: number, item: any) => sum + (item.effortPW || 0), 0);
    const calculatedWeeks = Math.ceil(totalEffort / 5);
    
    if (data.meta && typeof data.meta.scheduleWeeks === 'number') {
      if (Math.abs(data.meta.scheduleWeeks - calculatedWeeks) > 2) {
        errors.push(`일정 불일치: meta.scheduleWeeks=${data.meta.scheduleWeeks}, WBS 계산=${calculatedWeeks}주`);
      }
    }
  }

  return errors;
}

/**
 * 검증 결과를 openIssues로 변환
 */
export function convertValidationToOpenIssues(validation: ValidationResult): string[] {
  const issues: string[] = [];

  validation.errors.forEach((error) => {
    issues.push(`확인 필요 (오류): ${error}`);
  });

  validation.warnings.forEach((warning) => {
    issues.push(`확인 권장: ${warning}`);
  });

  return issues;
}

