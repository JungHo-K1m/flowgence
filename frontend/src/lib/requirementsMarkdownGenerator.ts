// 요구사항 결과 페이지 마크다운 생성 유틸리티

interface RequirementsData {
  projectName: string;
  overview: {
    goal: string;
    valueProposition: string;
  };
  scope: {
    included: string[];
    excluded: string[];
  };
  functionalRequirements: Array<{
    id: string;
    name: string;
    description: string;
    priority: string;
    requester?: string;
    initialRequestDate?: string;
  }>;
  nonFunctionalRequirements: Array<{
    category: string;
    description: string;
  }>;
  screenList: string[];
  dataModel?: {
    frontend: string[];
    backend: string[];
    database: string[];
    infrastructure: string[];
  };
}

interface ProjectData {
  description: string;
  serviceType: string;
}

export function generateRequirementsMarkdown(
  requirementsData: RequirementsData,
  projectData: ProjectData,
  extractedRequirements?: any,
  projectOverview?: any
): string {
  const currentDate = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const markdown = `# 프로젝트 요구사항 명세서

**생성일**: ${currentDate}  
**프로젝트명**: ${requirementsData.projectName}  
**서비스 유형**: ${projectData.serviceType}

---

## 📋 프로젝트 개요

### 프로젝트 정보
- **프로젝트명**: ${requirementsData.projectName}
- **서비스 유형**: ${projectData.serviceType}
- **프로젝트 설명**: ${projectData.description}

### 프로젝트 목표
${requirementsData.overview.goal}

### 핵심 가치 제안
${requirementsData.overview.valueProposition}

---

## 🎯 프로젝트 범위

### 포함 기능
${requirementsData.scope.included.map(item => `- ${item}`).join('\n')}

${requirementsData.scope.excluded.length > 0 ? `### 제외 기능
${requirementsData.scope.excluded.map(item => `- ${item}`).join('\n')}` : ''}

---

## ⚙️ 기능 요구사항

### 📊 요구사항 요약
- **총 요구사항**: ${requirementsData.functionalRequirements.length}개
- **필수 요구사항**: ${requirementsData.functionalRequirements.filter(req => req.priority === "필수").length}개
- **권장 요구사항**: ${requirementsData.functionalRequirements.filter(req => req.priority === "권장").length}개
- **선택 요구사항**: ${requirementsData.functionalRequirements.filter(req => req.priority === "선택").length}개

### 📋 상세 요구사항 목록

#### 🔴 필수 요구사항 (${requirementsData.functionalRequirements.filter(req => req.priority === "필수").length}개)

<div class="section-break"></div>

| 요구사항 ID | 요구사항명 | 요구사항 내용 | 요청자 | 최초 요청 일자 | 중요도 |
|-------------|-----------|--------------|--------|--------------|--------|
${requirementsData.functionalRequirements
  .filter(req => req.priority === "필수")
  .map((req) => {
    const formatDate = (dateStr: string | undefined) => dateStr ? new Date(dateStr).toLocaleDateString('ko-KR') : '-';
    const shortDescription = req.description.length > 80 ? 
      req.description.substring(0, 80) + "..." : 
      req.description;
    return `| ${req.id} | ${req.name} | ${shortDescription} | ${req.requester || '-'} | ${formatDate(req.initialRequestDate)} | ${req.priority} |`;
  }).join('\n')}

#### 🟡 권장 요구사항 (${requirementsData.functionalRequirements.filter(req => req.priority === "권장").length}개)

<div class="section-break"></div>

| 요구사항 ID | 요구사항명 | 요구사항 내용 | 요청자 | 최초 요청 일자 | 중요도 |
|-------------|-----------|--------------|--------|--------------|--------|
${requirementsData.functionalRequirements
  .filter(req => req.priority === "권장")
  .map((req) => {
    const formatDate = (dateStr: string | undefined) => dateStr ? new Date(dateStr).toLocaleDateString('ko-KR') : '-';
    const shortDescription = req.description.length > 80 ? 
      req.description.substring(0, 80) + "..." : 
      req.description;
    return `| ${req.id} | ${req.name} | ${shortDescription} | ${req.requester || '-'} | ${formatDate(req.initialRequestDate)} | ${req.priority} |`;
  }).join('\n')}

#### 🟢 선택 요구사항 (${requirementsData.functionalRequirements.filter(req => req.priority === "선택").length}개)

<div class="section-break"></div>

| 요구사항 ID | 요구사항명 | 요구사항 내용 | 요청자 | 최초 요청 일자 | 중요도 |
|-------------|-----------|--------------|--------|--------------|--------|
${requirementsData.functionalRequirements
  .filter(req => req.priority === "선택")
  .map((req) => {
    const formatDate = (dateStr: string | undefined) => dateStr ? new Date(dateStr).toLocaleDateString('ko-KR') : '-';
    const shortDescription = req.description.length > 80 ? 
      req.description.substring(0, 80) + "..." : 
      req.description;
    return `| ${req.id} | ${req.name} | ${shortDescription} | ${req.requester || '-'} | ${formatDate(req.initialRequestDate)} | ${req.priority} |`;
  }).join('\n')}

---

## 🔧 비기능 요구사항

| 카테고리 | 설명 | 중요도 |
|----------|------|--------|
${requirementsData.nonFunctionalRequirements.map(req => {
  const categoryIcon = req.category === "성능" ? "⚡" : 
                      req.category === "보안" ? "🔒" : 
                      req.category === "사용성" ? "👥" : 
                      req.category === "호환성" ? "🔄" : "📋";
  
  const categoryName = `<span class="requirement-name">${categoryIcon} ${req.category}</span>`;
  const description = `<span class="requirement-description">${req.description}</span>`;
  const importance = `<span class="priority-badge mandatory">높음</span>`;
  
  return `| ${categoryName} | ${description} | ${importance} |`;
}).join('\n')}

---

## 📱 화면 목록

### 📊 화면 구성 요약
- **총 화면 수**: ${requirementsData.screenList.length}개
- **주요 화면**: 메인, 상세, 목록, 관리 화면

### 📋 화면 상세 목록

| 순번 | 화면명 | 유형 | 중요도 |
|------|--------|------|--------|
${requirementsData.screenList.map((screen, index) => {
  const screenIcon = screen.includes("메인") ? "🏠" : 
                    screen.includes("로그인") || screen.includes("회원가입") ? "🔐" : 
                    screen.includes("상세") ? "📄" : 
                    screen.includes("목록") ? "📋" : 
                    screen.includes("장바구니") ? "🛒" : 
                    screen.includes("결제") ? "💳" : 
                    screen.includes("마이페이지") ? "👤" : "📱";
  
  const screenName = `<span class="requirement-name">${screenIcon} ${screen}</span>`;
  const screenType = screen.includes("메인") ? "메인" : 
                    screen.includes("로그인") || screen.includes("회원가입") ? "인증" : 
                    screen.includes("상세") ? "상세" : 
                    screen.includes("목록") ? "목록" : 
                    screen.includes("장바구니") ? "주문" : 
                    screen.includes("결제") ? "결제" : 
                    screen.includes("마이페이지") ? "마이페이지" : "기타";
  
  const importance = screen.includes("메인") || screen.includes("로그인") || screen.includes("상세") ? 
                    `<span class="priority-badge mandatory">필수</span>` : 
                    `<span class="priority-badge recommended">권장</span>`;
  
  return `| ${String(index + 1).padStart(2, '0')} | ${screenName} | ${screenType} | ${importance} |`;
}).join('\n')}

---

## 🛠️ 기술 스택

${requirementsData.dataModel ? `
### 프론트엔드
${requirementsData.dataModel.frontend.map(tech => `- ${tech}`).join('\n')}

### 백엔드
${requirementsData.dataModel.backend.map(tech => `- ${tech}`).join('\n')}

### 데이터베이스
${requirementsData.dataModel.database.map(tech => `- ${tech}`).join('\n')}

### 인프라
${requirementsData.dataModel.infrastructure.map(tech => `- ${tech}`).join('\n')}
` : `
### 기본 기술 스택
- **프론트엔드**: React, Next.js, TypeScript
- **백엔드**: Node.js, Express, PostgreSQL
- **데이터베이스**: PostgreSQL, Redis
- **인프라**: AWS, Docker, Kubernetes
`}

---

## 📊 상세 요구사항 분석

${extractedRequirements ? `
### 요구사항 카테고리별 상세 내역

${extractedRequirements.categories.map((category: any, categoryIndex: number) => {
  const allRequirements = category.subCategories?.flatMap((subCategory: any) => 
    subCategory.requirements || []
  ) || [];
  
  return `
#### ${category.majorCategory} (${allRequirements.length}개)

${category.subCategories?.map((subCategory: any, subIndex: number) => {
  if (!subCategory.requirements || subCategory.requirements.length === 0) return '';
  
  return `
**${subCategory.subCategory}**
${subCategory.requirements.map((req: any, reqIndex: number) => 
  `- **${req.title}**: ${req.description} (우선순위: ${req.priority === 'high' ? '높음' : req.priority === 'medium' ? '보통' : '낮음'})`
).join('\n')}
`;
}).join('') || '상세 요구사항이 없습니다.'}
`;
}).join('') || ''}
` : `
### 요구사항 상세 분석
요구사항 상세 분석 데이터가 아직 준비되지 않았습니다.
`}

---

## 🎨 사용자 여정 (User Journey)

${projectOverview?.userJourney?.steps ? `
${projectOverview.userJourney.steps.map((step: any, index: number) => `
### ${index + 1}. ${step.title}

**설명**: ${step.description}

**사용자 행동**: ${step.userAction}

**시스템 응답**: ${step.systemResponse}

${step.estimatedHours ? `**예상 소요시간**: ${step.estimatedHours}` : ''}
${step.requiredSkills && step.requiredSkills.length > 0 ? `**필요 기술**: ${step.requiredSkills.join(', ')}` : ''}
`).join('\n')}
` : `
사용자 여정 정보가 아직 준비되지 않았습니다.
`}

---

## 📈 프로젝트 규모 및 복잡도

${projectOverview?.serviceCoreElements ? `
- **프로젝트 규모**: ${projectOverview.serviceCoreElements.projectScale || '중간 규모'}
- **기술 복잡도**: ${projectOverview.serviceCoreElements.techComplexity || '보통'}
- **예상 개발 기간**: ${projectOverview.serviceCoreElements.estimatedDuration || '12주'}
- **필요 팀 구성**: ${projectOverview.serviceCoreElements.requiredTeam?.join(', ') || 'PM, 개발자, 디자이너'}
- **타겟 사용자**: ${projectOverview.serviceCoreElements.targetUsers?.join(', ') || '일반 사용자'}
` : `
프로젝트 규모 및 복잡도 정보가 아직 준비되지 않았습니다.
`}

---

## 💰 예상 견적 정보

${projectOverview?.estimation ? `
### 총 견적
**${projectOverview.estimation.totalCost}**

### 비용 구성
- **개발 비용**: ${projectOverview.estimation.breakdown.development}
- **디자인 비용**: ${projectOverview.estimation.breakdown.design}
- **테스트 비용**: ${projectOverview.estimation.breakdown.testing}
- **배포 비용**: ${projectOverview.estimation.breakdown.deployment}

### 개발 일정
- **기획**: ${projectOverview.estimation.timeline.planning}
- **개발**: ${projectOverview.estimation.timeline.development}
- **테스트**: ${projectOverview.estimation.timeline.testing}
- **배포**: ${projectOverview.estimation.timeline.deployment}
` : `
견적 정보가 아직 준비되지 않았습니다.
`}

---

## 📞 문의사항

요구사항 명세서에 대한 문의사항이 있으시면 언제든지 연락주시기 바랍니다.

**Flowgence 팀**  
이메일: contact@flowgence.com  
전화: 02-1234-5678

---

*본 요구사항 명세서는 ${currentDate} 기준으로 작성되었으며, 프로젝트 요구사항 변경 시 내용이 달라질 수 있습니다.*
`;

  return markdown;
}
