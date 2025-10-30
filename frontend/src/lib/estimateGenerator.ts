// 견적서 마크다운 생성 유틸리티

interface EstimateData {
  baseEstimate: number;
  discount: number;
  finalEstimate: number;
  stages: Array<{
    name: string;
    duration: string;
    percentage: number;
    cost: number;
  }>;
  payments: Array<{
    stage: string;
    percentage: number;
    amount: number;
  }>;
  projectOverview: {
    duration: string;
    period: string;
    personnel: number;
    breakdown: string;
    warranty: string;
    warrantyDetail: string;
  };
}

interface RequirementsData {
  total: number;
  mandatory: number;
  recommended: number;
  optional: number;
  projectType: string;
  estimatedUsers: string;
  duration: string;
}

interface ProjectData {
  description: string;
  serviceType: string;
}

interface ExtractedRequirements {
  categories: Array<{
    majorCategory?: string;
    category?: string;
    subCategories: Array<{
      subCategory?: string;
      subcategory?: string;
      requirements: Array<{
        id: string;
        title: string;
        description: string;
        priority: "high" | "medium" | "low";
      }>;
    }>;
  }>;
  totalCount: number;
}

export function generateEstimateMarkdown(
  estimateData: EstimateData,
  requirementsData: RequirementsData,
  projectData: ProjectData,
  projectOverview?: any,
  extractedRequirements?: ExtractedRequirements | null
): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR").format(amount) + "원";
  };

  const currentDate = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const projectName = projectOverview?.serviceCoreElements?.title || 
                     projectData.serviceType || 
                     "프로젝트";

  const markdown = `# 프로젝트 견적서

**생성일**: ${currentDate}  
**프로젝트명**: ${projectName}  
**서비스 유형**: ${projectData.serviceType}

---

## 📋 프로젝트 개요

### 프로젝트 정보
- **프로젝트명**: ${projectName}
- **서비스 유형**: ${projectData.serviceType}
- **프로젝트 설명**: ${projectData.description}
- **예상 사용자**: ${requirementsData.estimatedUsers}
- **개발 기간**: ${requirementsData.duration}

### 요구사항 요약
- **총 요구사항**: ${requirementsData.total}개
  - 필수 요구사항: ${requirementsData.mandatory}개
  - 권장 요구사항: ${requirementsData.recommended}개
  - 선택 요구사항: ${requirementsData.optional}개

---

## 💰 견적 요약

### 📊 견적 개요
- **기본 견적**: ${formatCurrency(estimateData.baseEstimate)}
- **할인 금액**: ${formatCurrency(estimateData.discount)}
- **최종 견적**: **${formatCurrency(estimateData.finalEstimate)}**

### 💵 상세 견적 내역

| 항목 | 금액 | 비고 |
|------|------|------|
| 기본 견적 | <span class="requirement-name">${formatCurrency(estimateData.baseEstimate)}</span> | 프로젝트 기본 개발 비용 |
| 할인 | <span class="requirement-description">-${formatCurrency(estimateData.discount)}</span> | ${estimateData.discount > 0 ? '조기 계약 할인' : '할인 없음'} |
| **최종 견적** | **<span class="priority-badge mandatory">${formatCurrency(estimateData.finalEstimate)}</span>** | **총 프로젝트 비용** |

---

## 📅 단계별 상세 내역

### 📊 개발 단계 요약
- **총 개발 단계**: ${estimateData.stages.length}단계
- **총 개발 기간**: ${estimateData.stages.reduce((total, stage) => {
  const weeks = parseInt(stage.duration.replace(/[^0-9]/g, '')) || 0;
  return total + weeks;
}, 0)}주
- **총 개발 비용**: ${formatCurrency(estimateData.stages.reduce((total, stage) => total + stage.cost, 0))}

### 📋 단계별 상세 내역

<div class="section-break"></div>

| 단계 | 기간 | 비율 | 금액 | 상태 |
|------|------|------|------|------|
${estimateData.stages.map((stage, index) => {
  const stageIcon = index === 0 ? '🚀' : 
                   index === estimateData.stages.length - 1 ? '🏁' : '⚙️';
  const stageName = `<span class="requirement-name">${stageIcon} ${stage.name}</span>`;
  const duration = `<span class="requirement-description">${stage.duration}</span>`;
  const percentage = `<span class="priority-badge recommended">${stage.percentage}%</span>`;
  const cost = `<span class="requirement-name">${formatCurrency(stage.cost)}</span>`;
  const status = index === 0 ? '<span class="priority-badge mandatory">진행중</span>' : 
                 index === estimateData.stages.length - 1 ? '<span class="priority-badge optional">완료</span>' : 
                 '<span class="priority-badge recommended">대기</span>';
  
  return `| ${stageName} | ${duration} | ${percentage} | ${cost} | ${status} |`;
}).join('\n')}

---

## 💳 지불 조건

### 📊 지불 요약
- **총 지불 단계**: ${estimateData.payments.length}단계
- **총 지불 금액**: ${formatCurrency(estimateData.payments.reduce((total, payment) => total + payment.amount, 0))}
- **지불 방식**: 단계별 분할 지불

### 💰 지불 상세 내역

<div class="section-break"></div>

| 단계 | 비율 | 금액 | 지불 시점 | 상태 |
|------|------|------|----------|------|
${estimateData.payments.map((payment, index) => {
  const paymentIcon = index === 0 ? '💰' : 
                     index === estimateData.payments.length - 1 ? '🏆' : '💳';
  const stageName = `<span class="requirement-name">${paymentIcon} ${payment.stage}</span>`;
  const percentage = `<span class="priority-badge recommended">${payment.percentage}%</span>`;
  const amount = `<span class="requirement-name">${formatCurrency(payment.amount)}</span>`;
  const timing = index === 0 ? '계약 체결 시' : 
                index === estimateData.payments.length - 1 ? '프로젝트 완료 시' : 
                '단계 완료 시';
  const timingText = `<span class="requirement-description">${timing}</span>`;
  const status = index === 0 ? '<span class="priority-badge mandatory">지불완료</span>' : 
                 '<span class="priority-badge recommended">대기중</span>';
  
  return `| ${stageName} | ${percentage} | ${amount} | ${timingText} | ${status} |`;
}).join('\n')}

---

## 👥 프로젝트 팀 구성

### 📊 팀 구성 요약
- **총 투입 인력**: ${estimateData.projectOverview.personnel}명
- **개발 기간**: ${estimateData.projectOverview.duration}
- **프로젝트 기간**: ${estimateData.projectOverview.period}

### 👨‍💼 팀 구성 상세

<div class="section-break"></div>

| 역할 | 인력 | 담당 업무 | 중요도 |
|------|------|----------|--------|
| 프로젝트 매니저 | 1명 | 프로젝트 전체 관리 및 일정 조율 | <span class="priority-badge mandatory">필수</span> |
| 프론트엔드 개발자 | 2명 | 사용자 인터페이스 및 사용자 경험 개발 | <span class="priority-badge mandatory">필수</span> |
| 백엔드 개발자 | 2명 | 서버 로직 및 데이터베이스 설계 | <span class="priority-badge mandatory">필수</span> |
| 디자이너 | 1명 | UI/UX 디자인 및 사용자 경험 설계 | <span class="priority-badge recommended">권장</span> |
| QA 엔지니어 | 1명 | 품질 보증 및 테스트 관리 | <span class="priority-badge recommended">권장</span> |

### 🛡️ 품질 보증

<div class="section-break"></div>

| 항목 | 내용 | 기간 | 중요도 |
|------|------|------|--------|
| 보증 기간 | <span class="requirement-name">${estimateData.projectOverview.warranty}</span> | 프로젝트 완료 후 | <span class="priority-badge mandatory">필수</span> |
| 보증 내용 | <span class="requirement-description">${estimateData.projectOverview.warrantyDetail}</span> | 무상 유지보수 | <span class="priority-badge mandatory">필수</span> |
| 버그 수정 | <span class="requirement-description">발견된 버그 무상 수정</span> | 보증 기간 내 | <span class="priority-badge mandatory">필수</span> |
| 기능 개선 | <span class="requirement-description">소규모 기능 개선 지원</span> | 보증 기간 내 | <span class="priority-badge recommended">권장</span> |

---

## 🔧 기술 스택

### 📊 기술 스택 요약
- **프론트엔드**: ${projectOverview?.serviceCoreElements?.techStack?.frontend?.length || 3}개 기술
- **백엔드**: ${projectOverview?.serviceCoreElements?.techStack?.backend?.length || 3}개 기술
- **데이터베이스**: ${projectOverview?.serviceCoreElements?.techStack?.database?.length || 2}개 기술
- **인프라**: ${projectOverview?.serviceCoreElements?.techStack?.infrastructure?.length || 3}개 기술

### 🛠️ 기술 스택 상세

<div class="section-break"></div>

| 카테고리 | 기술 | 용도 | 중요도 |
|----------|------|------|--------|
${projectOverview?.serviceCoreElements?.techStack ? `
${projectOverview.serviceCoreElements.techStack.frontend?.map((tech: string, index: number) => {
  const category = index === 0 ? '프론트엔드' : '';
  const categoryIcon = index === 0 ? '🎨' : '';
  const categoryName = index === 0 ? `<span class="requirement-name">${categoryIcon} ${category}</span>` : '';
  const techName = `<span class="requirement-name">${tech}</span>`;
  const purpose = index === 0 ? '사용자 인터페이스 개발' : 
                 index === 1 ? '상태 관리 및 라우팅' : 
                 '타입 안전성 및 개발 효율성';
  const purposeText = `<span class="requirement-description">${purpose}</span>`;
  const importance = '<span class="priority-badge mandatory">필수</span>';
  
  return `| ${categoryName} | ${techName} | ${purposeText} | ${importance} |`;
}).join('\n') || ''}

${projectOverview.serviceCoreElements.techStack.backend?.map((tech: string, index: number) => {
  const category = index === 0 ? '백엔드' : '';
  const categoryIcon = index === 0 ? '⚙️' : '';
  const categoryName = index === 0 ? `<span class="requirement-name">${categoryIcon} ${category}</span>` : '';
  const techName = `<span class="requirement-name">${tech}</span>`;
  const purpose = index === 0 ? '서버 사이드 로직 개발' : 
                 index === 1 ? 'API 서버 프레임워크' : 
                 '데이터베이스 관리';
  const purposeText = `<span class="requirement-description">${purpose}</span>`;
  const importance = '<span class="priority-badge mandatory">필수</span>';
  
  return `| ${categoryName} | ${techName} | ${purposeText} | ${importance} |`;
}).join('\n') || ''}

${projectOverview.serviceCoreElements.techStack.database?.map((tech: string, index: number) => {
  const category = index === 0 ? '데이터베이스' : '';
  const categoryIcon = index === 0 ? '🗄️' : '';
  const categoryName = index === 0 ? `<span class="requirement-name">${categoryIcon} ${category}</span>` : '';
  const techName = `<span class="requirement-name">${tech}</span>`;
  const purpose = index === 0 ? '메인 데이터 저장소' : 
                 '캐시 및 세션 관리';
  const purposeText = `<span class="requirement-description">${purpose}</span>`;
  const importance = '<span class="priority-badge mandatory">필수</span>';
  
  return `| ${categoryName} | ${techName} | ${purposeText} | ${importance} |`;
}).join('\n') || ''}

${projectOverview.serviceCoreElements.techStack.infrastructure?.map((tech: string, index: number) => {
  const category = index === 0 ? '인프라' : '';
  const categoryIcon = index === 0 ? '☁️' : '';
  const categoryName = index === 0 ? `<span class="requirement-name">${categoryIcon} ${category}</span>` : '';
  const techName = `<span class="requirement-name">${tech}</span>`;
  const purpose = index === 0 ? '클라우드 서비스 플랫폼' : 
                 index === 1 ? '컨테이너화 및 배포' : 
                 '오케스트레이션 및 스케일링';
  const purposeText = `<span class="requirement-description">${purpose}</span>`;
  const importance = '<span class="priority-badge mandatory">필수</span>';
  
  return `| ${categoryName} | ${techName} | ${purposeText} | ${importance} |`;
}).join('\n') || ''}
` : `
| 🎨 프론트엔드 | <span class="requirement-name">React</span> | <span class="requirement-description">사용자 인터페이스 개발</span> | <span class="priority-badge mandatory">필수</span> |
| | <span class="requirement-name">Next.js</span> | <span class="requirement-description">풀스택 프레임워크</span> | <span class="priority-badge mandatory">필수</span> |
| | <span class="requirement-name">TypeScript</span> | <span class="requirement-description">타입 안전성 및 개발 효율성</span> | <span class="priority-badge mandatory">필수</span> |
| ⚙️ 백엔드 | <span class="requirement-name">Node.js</span> | <span class="requirement-description">서버 사이드 로직 개발</span> | <span class="priority-badge mandatory">필수</span> |
| | <span class="requirement-name">Express</span> | <span class="requirement-description">API 서버 프레임워크</span> | <span class="priority-badge mandatory">필수</span> |
| | <span class="requirement-name">PostgreSQL</span> | <span class="requirement-description">메인 데이터베이스</span> | <span class="priority-badge mandatory">필수</span> |
| 🗄️ 데이터베이스 | <span class="requirement-name">PostgreSQL</span> | <span class="requirement-description">메인 데이터 저장소</span> | <span class="priority-badge mandatory">필수</span> |
| | <span class="requirement-name">Redis</span> | <span class="requirement-description">캐시 및 세션 관리</span> | <span class="priority-badge recommended">권장</span> |
| ☁️ 인프라 | <span class="requirement-name">AWS</span> | <span class="requirement-description">클라우드 서비스 플랫폼</span> | <span class="priority-badge mandatory">필수</span> |
| | <span class="requirement-name">Docker</span> | <span class="requirement-description">컨테이너화 및 배포</span> | <span class="priority-badge mandatory">필수</span> |
| | <span class="requirement-name">Kubernetes</span> | <span class="requirement-description">오케스트레이션 및 스케일링</span> | <span class="priority-badge recommended">권장</span> |
`}

---

## 📝 주요 기능 요구사항

### 📊 기능 요약
- **총 기능 수**: ${projectOverview?.serviceCoreElements?.keyFeatures?.length || 0}개
- **핵심 기능**: 사용자 중심의 직관적인 인터페이스
- **부가 기능**: 확장성과 유지보수성을 고려한 설계

### 🎯 주요 기능 상세

<div class="section-break"></div>

| 순번 | 기능명 | 설명 | 중요도 |
|------|--------|------|--------|
${projectOverview?.serviceCoreElements?.keyFeatures ? 
  projectOverview.serviceCoreElements.keyFeatures.map((feature: string, index: number) => {
    const featureIcon = index === 0 ? '🎯' : 
                       index === 1 ? '⚡' : 
                       index === 2 ? '🔧' : '📱';
    const featureName = `<span class="requirement-name">${featureIcon} ${feature}</span>`;
    const description = `<span class="requirement-description">${feature} 관련 핵심 기능</span>`;
    const importance = index < 3 ? '<span class="priority-badge mandatory">필수</span>' : 
                      '<span class="priority-badge recommended">권장</span>';
    
    return `| ${String(index + 1).padStart(2, '0')} | ${featureName} | ${description} | ${importance} |`;
  }).join('\n') :
  `| 01 | <span class="requirement-name">🎯 기본 기능</span> | <span class="requirement-description">프로젝트의 핵심 기능</span> | <span class="priority-badge mandatory">필수</span> |
| 02 | <span class="requirement-name">⚡ 성능 최적화</span> | <span class="requirement-description">빠른 응답 속도와 효율성</span> | <span class="priority-badge mandatory">필수</span> |
| 03 | <span class="requirement-name">🔧 관리 기능</span> | <span class="requirement-description">관리자용 관리 도구</span> | <span class="priority-badge recommended">권장</span> |
| 04 | <span class="requirement-name">📱 모바일 지원</span> | <span class="requirement-description">모바일 환경 최적화</span> | <span class="priority-badge recommended">권장</span> |`
}

---

## 📋 상세 요구사항 내역

### 📊 요구사항 개요
- **총 요구사항**: ${extractedRequirements?.totalCount || 0}개
- **카테고리**: ${extractedRequirements?.categories?.length || 0}개
- **중요도 분류**:
  - 필수(HIGH): ${requirementsData.mandatory}개
  - 권장(MEDIUM): ${requirementsData.recommended}개
  - 선택(LOW): ${requirementsData.optional}개

${extractedRequirements && extractedRequirements.categories && extractedRequirements.categories.length > 0 ? `
### 🔍 카테고리별 상세 내역

${extractedRequirements.categories.map((category, categoryIndex) => {
  const categoryName = category.majorCategory || category.category || `카테고리 ${categoryIndex + 1}`;
  const allRequirements = category.subCategories.flatMap(sub => sub.requirements || []);
  
  return `
#### ${categoryName}
**소분류 수**: ${category.subCategories.length}개  
**요구사항 수**: ${allRequirements.length}개

${category.subCategories.map((subCategory, subIndex) => {
  const subName = subCategory.subCategory || subCategory.subcategory || `소분류 ${subIndex + 1}`;
  const reqs = subCategory.requirements || [];
  
  if (reqs.length === 0) return '';
  
  return `
##### ${subName} (${reqs.length}개)
  
| ID | 요구사항 | 설명 | 우선순위 | 공수 | 견적 |
|---|---|---|---|---|---|
${reqs.map((req, reqIndex) => {
  const id = \`REQ-\${categoryIndex + 1}-\${subIndex + 1}-\${reqIndex + 1}\`;
  const priority = req.priority === 'high' ? '필수' : req.priority === 'medium' ? '권장' : '선택';
  const priorityClass = req.priority === 'high' ? 'mandatory' : req.priority === 'medium' ? 'recommended' : 'optional';
  const effort = req.priority === 'high' ? '5일' : req.priority === 'medium' ? '3일' : '2일';
  const cost = req.priority === 'high' ? 1500000 : req.priority === 'medium' ? 1000000 : 500000;
  
  return \`| \${id} | <span class="requirement-name">\${req.title}</span> | <span class="requirement-description">\${req.description}</span> | <span class="priority-badge \${priorityClass}">\${priority}</span> | \${effort} | \${formatCurrency(cost)} |\`;
}).join('\n')}
`;
}).join('')}
`;
}).join('')}
` : `
### ℹ️ 요구사항 정보
현재 추출된 요구사항이 없습니다. 상세 요구사항은 별도 명세서를 참고해주세요.
`}

---

## 📞 문의사항

견적서에 대한 문의사항이 있으시면 언제든지 연락주시기 바랍니다.

**Flowgence 팀**  
이메일: contact@flowgence.com  
전화: 02-1234-5678

---

*본 견적서는 ${currentDate} 기준으로 작성되었으며, 프로젝트 요구사항 변경 시 견적이 달라질 수 있습니다.*
`;

  return markdown;
}

// 마크다운을 HTML로 변환하는 함수
export function markdownToHtml(markdown: string): string {
  return markdown
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    .replace(/^\| (.*) \|/gim, '<tr><td>$1</td>')
    .replace(/\| (.*) \|/gim, '<td>$1</td>')
    .replace(/^\|$/gim, '</tr>')
    .replace(/\n/gim, '<br>');
}
