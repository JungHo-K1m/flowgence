import { WireframeSpec } from "@/types/wireframe";

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
    id?: string;
    category: string;
    description: string;
    priority?: string;
    metrics?: string;
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
  projectOverview?: any,
  wireframe?: WireframeSpec | null
): string {
  const currentDate = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const functionalMandatoryCount =
    requirementsData.functionalRequirements.filter(
      (req) => req.priority === "필수"
    ).length;
  const functionalTotalCount = requirementsData.functionalRequirements.length;

  type JourneyStep = {
    title: string;
    description: string;
    userAction: string;
    systemResponse: string;
    estimatedHours?: string;
    requiredSkills?: string[];
  };

  const userJourneySteps: JourneyStep[] =
    projectOverview?.userJourney?.steps?.map((step: any, index: number) => ({
      title: step?.title || `사용자 여정 단계 ${index + 1}`,
      description:
        step?.description?.trim() ||
        "세부 설명이 아직 준비되지 않았습니다.",
      userAction:
        step?.userAction?.trim() ||
        "사용자 행동 정보가 아직 준비되지 않았습니다.",
      systemResponse:
        step?.systemResponse?.trim() ||
        "시스템 응답 정보가 아직 준비되지 않았습니다.",
      estimatedHours: step?.estimatedHours || undefined,
      requiredSkills:
        step?.requiredSkills && step.requiredSkills.length > 0
          ? step.requiredSkills
          : undefined,
    })) || [];

  const fallbackJourneyFromWireframe: JourneyStep[] =
    wireframe?.screens?.map((screen, index) => ({
      title: screen?.name || `핵심 화면 ${index + 1}`,
      description:
        screen?.name
          ? `${screen.name} 화면에서 사용자가 수행하는 주요 흐름을 정의합니다.`
          : "핵심 화면에서 사용자 흐름을 정의합니다.",
      userAction:
        screen?.elements?.length
          ? "화면 요소를 기반으로 한 주요 사용자 행동을 설계합니다."
          : "사용자가 미리 정의된 목표를 달성하기 위해 수행해야 할 행동을 정의합니다.",
      systemResponse:
        "시스템은 사용자의 행동에 따라 적절한 데이터를 표시하고 후속 단계를 안내합니다.",
    })) ||
    [];

  const fallbackJourneyFromScreens: JourneyStep[] =
    fallbackJourneyFromWireframe.length > 0
      ? fallbackJourneyFromWireframe
      : requirementsData.screenList.map((screen, index) => ({
          title: `${index + 1}. ${screen}`,
          description: `${screen} 화면에서 제공해야 할 핵심 가치를 정의합니다.`,
          userAction: `${screen} 화면에서 사용자가 수행하는 대표적인 액션을 설계합니다.`,
          systemResponse: `${screen} 화면에서 시스템이 제공해야 하는 응답을 기술합니다.`,
        }));

  const finalUserJourneySteps =
    userJourneySteps.length > 0
      ? userJourneySteps
      : fallbackJourneyFromScreens.length > 0
      ? fallbackJourneyFromScreens
      : [
          {
            title: "요구사항 분석",
            description: "사용자 요구사항을 수집하고 분석합니다.",
            userAction: "프로젝트 담당자가 요구사항을 입력합니다.",
            systemResponse: "AI가 요구사항을 분석하고 분류합니다.",
            estimatedHours: undefined,
            requiredSkills: undefined,
          },
          {
            title: "기능 구성",
            description: "수집된 요구사항을 기반으로 기능 구성을 확정합니다.",
            userAction: "담당자가 기능을 검토하고 승인합니다.",
            systemResponse: "시스템이 기능 목록을 정리하여 제공합니다.",
            estimatedHours: undefined,
            requiredSkills: undefined,
          },
          {
            title: "견적 산출",
            description: "확정된 요구사항을 기반으로 견적을 산출합니다.",
            userAction: "담당자가 견적 결과를 검토합니다.",
            systemResponse: "시스템이 비용과 일정을 계산하여 제공합니다.",
            estimatedHours: undefined,
            requiredSkills: undefined,
          },
        ];

  const estimationData = projectOverview?.estimation
    ? {
        totalCost:
          projectOverview.estimation.totalCost || "예상 비용 정보가 준비되지 않았습니다.",
        breakdown: {
          development:
            projectOverview.estimation.breakdown?.development || "미정",
          design: projectOverview.estimation.breakdown?.design || "미정",
          testing: projectOverview.estimation.breakdown?.testing || "미정",
          deployment:
            projectOverview.estimation.breakdown?.deployment || "미정",
        },
        timeline: {
          planning:
            projectOverview.estimation.timeline?.planning || "미정",
          development:
            projectOverview.estimation.timeline?.development || "미정",
          testing:
            projectOverview.estimation.timeline?.testing || "미정",
          deployment:
            projectOverview.estimation.timeline?.deployment || "미정",
        },
      }
    : null;

  const fallbackBaseEstimate = (() => {
    if (estimationData?.totalCost && estimationData.totalCost !== "예상 비용 정보가 준비되지 않았습니다.") {
      const numeric = parseInt(
        estimationData.totalCost.replace(/[^0-9]/g, ""),
        10
      );
      return Number.isFinite(numeric) && numeric > 0 ? numeric : 85000000;
    }

    if (functionalTotalCount === 0 && wireframe?.screens?.length) {
      return 65000000 + wireframe.screens.length * 5000000;
    }

    if (functionalTotalCount > 0) {
      const base =
        functionalMandatoryCount * 6000000 +
        (functionalTotalCount - functionalMandatoryCount) * 3500000;
      return Math.max(65000000, base);
    }

    return 85000000;
  })();

  const fallbackEstimation = estimationData
    ? estimationData
    : {
        totalCost: `${new Intl.NumberFormat("ko-KR").format(
          fallbackBaseEstimate
        )}원`,
        breakdown: {
          development: `${new Intl.NumberFormat("ko-KR").format(
            Math.round(fallbackBaseEstimate * 0.5)
          )}원`,
          design: `${new Intl.NumberFormat("ko-KR").format(
            Math.round(fallbackBaseEstimate * 0.2)
          )}원`,
          testing: `${new Intl.NumberFormat("ko-KR").format(
            Math.round(fallbackBaseEstimate * 0.15)
          )}원`,
          deployment: `${new Intl.NumberFormat("ko-KR").format(
            Math.round(fallbackBaseEstimate * 0.15)
          )}원`,
        },
        timeline: {
          planning: "2주",
          development: `${Math.max(
            4,
            Math.ceil(functionalMandatoryCount * 1.5 || 6)
          )}주`,
          testing: "2주",
          deployment: "2주",
        },
      };

  const userJourneySection =
    finalUserJourneySteps.length > 0
      ? finalUserJourneySteps
          .map((step, index) => {
            const lines = [
              `### ${index + 1}. ${step.title}`,
              "",
              `**설명**: ${step.description}`,
              "",
              `**사용자 행동**: ${step.userAction}`,
              "",
              `**시스템 응답**: ${step.systemResponse}`,
            ];

            if (step.estimatedHours) {
              lines.push("", `**예상 소요시간**: ${step.estimatedHours}`);
            }

            if (step.requiredSkills && step.requiredSkills.length > 0) {
              lines.push(
                "",
                `**필요 기술**: ${step.requiredSkills.join(", ")}`
              );
            }

            return lines.join("\n");
          })
          .join("\n\n")
      : "사용자 여정 정보가 아직 준비되지 않았습니다.";

  const estimationSection = [
        "### 총 견적",
        `**${fallbackEstimation.totalCost}**`,
        "",
        "### 비용 구성",
        `- **개발 비용**: ${fallbackEstimation.breakdown.development}`,
        `- **디자인 비용**: ${fallbackEstimation.breakdown.design}`,
        `- **테스트 비용**: ${fallbackEstimation.breakdown.testing}`,
        `- **배포 비용**: ${fallbackEstimation.breakdown.deployment}`,
        "",
        "### 개발 일정",
        `- **기획**: ${fallbackEstimation.timeline.planning}`,
        `- **개발**: ${fallbackEstimation.timeline.development}`,
        `- **테스트**: ${fallbackEstimation.timeline.testing}`,
        `- **배포**: ${fallbackEstimation.timeline.deployment}`,
      ].join("\n");

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

${requirementsData.nonFunctionalRequirements.length === 0 ? '비기능 요구사항이 정의되지 않았습니다.' : `| 카테고리 | 설명 | 측정 지표 | 중요도 |
|----------|------|----------|--------|
${requirementsData.nonFunctionalRequirements.map((req: any) => {
  const categoryIcon = req.category === "성능" ? "⚡" : 
                      req.category === "보안" ? "🔒" : 
                      req.category === "사용성" ? "👥" : 
                      req.category === "호환성" ? "🔄" : 
                      req.category === "확장성" ? "📈" :
                      req.category === "유지보수성" ? "🛠️" : "📋";
  
  const categoryName = `<span class="requirement-name">${categoryIcon} ${req.category}</span>`;
  const description = `<span class="requirement-description">${req.description}</span>`;
  const metrics = req.metrics ? `<span class="requirement-description">${req.metrics}</span>` : '-';
  const priorityText = req.priority === 'high' ? '높음' : req.priority === 'medium' ? '중간' : req.priority === 'low' ? '낮음' : '높음';
  const priorityClass = req.priority === 'high' ? 'mandatory' : req.priority === 'medium' ? 'recommended' : 'optional';
  const importance = `<span class="priority-badge ${priorityClass}">${priorityText}</span>`;
  
  return `| ${categoryName} | ${description} | ${metrics} | ${importance} |`;
}).join('\n')}`}

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

${wireframe && wireframe.screens && wireframe.screens.length > 0 ? `
## 🖼️ 와이어프레임 미리보기

<div class="wireframe-preview">
${wireframe.screens.map((screen, index) => {
  const scale = wireframe.viewport.width > 0 ? Math.min(320 / wireframe.viewport.width, 0.6) : 0.4;
  const viewportWidth = Math.round(wireframe.viewport.width * scale);
  const viewportHeight = Math.round(wireframe.viewport.height * scale);
  const elementsHtml = screen.elements.map((element) => {
    const left = Math.round(element.x * scale);
    const top = Math.round(element.y * scale);
    const width = Math.max(Math.round(element.w * scale), 12);
    const height = Math.max(Math.round(element.h * scale), 12);
    const label = element.label ? ` • ${element.label}` : "";
    return `<div class="wireframe-element type-${element.type}" style="left:${left}px;top:${top}px;width:${width}px;height:${height}px;">
      <div class="wireframe-element-content">
        <span class="wireframe-element-icon">${getWireframeIcon(element.type)}</span>
        <span class="wireframe-element-label">${element.type.toUpperCase()}${label}</span>
      </div>
    </div>`;
  }).join('');

  return `<div class="wireframe-screen">
    <div class="wireframe-screen-header">
      <div class="wireframe-screen-title">${String(index + 1).padStart(2, '0')}. ${screen.name}</div>
      <div class="wireframe-screen-meta">${wireframe.viewport.device.toUpperCase()} • ${wireframe.viewport.width} × ${wireframe.viewport.height}px • ${screen.layout.type.toUpperCase()} LAYOUT</div>
    </div>
    <div class="wireframe-canvas-wrapper">
      <div class="wireframe-canvas" style="width:${viewportWidth}px;height:${viewportHeight}px;">
        ${elementsHtml}
      </div>
    </div>
  </div>`;
}).join('')}
</div>

---
` : ''}

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

${userJourneySection}

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

${estimationSection}

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

function getWireframeIcon(type: string): string {
  switch (type) {
    case "navbar":
      return "≡";
    case "footer":
      return "━";
    case "button":
      return "⏺";
    case "input":
      return "⌨";
    case "list":
      return "☰";
    case "card":
      return "□";
    case "text":
      return "T";
    case "image":
      return "🖼";
    case "chip":
      return "◎";
    case "checkbox":
      return "☑";
    case "radio":
      return "◉";
    case "select":
      return "▼";
    case "table":
      return "⇳";
    case "divider":
      return "─";
    case "icon":
      return "★";
    default:
      return "■";
  }
}
