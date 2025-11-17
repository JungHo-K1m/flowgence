import { Device, ViewportSpec, WireframeSpec } from "@/types/wireframe";
import { generateUserJourneyMermaidDefault } from "./mermaidGenerator";

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
  wireframe?: WireframeSpec | null,
  wireframeImage?: string, // Base64 인코딩된 와이어프레임 이미지
  mermaidImage?: string // Base64 인코딩된 Mermaid 다이어그램 이미지
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
    step: number;
    title: string;
    description: string;
    userAction: string;
    systemResponse: string;
    estimatedHours?: string;
    requiredSkills?: string[];
  };

  const userJourneySteps: JourneyStep[] =
    projectOverview?.userJourney?.steps?.map((step: any, index: number) => ({
      step: step?.step || index + 1,
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
      step: index + 1,
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
          step: index + 1,
          title: `${index + 1}. ${screen}`,
          description: `${screen} 화면에서 제공해야 할 핵심 가치를 정의합니다.`,
          userAction: `${screen} 화면에서 사용자가 수행하는 대표적인 액션을 설계합니다.`,
          systemResponse: `${screen} 화면에서 시스템이 제공해야 하는 응답을 기술합니다.`,
        }));

  const finalUserJourneySteps: JourneyStep[] =
    userJourneySteps.length > 0
      ? userJourneySteps
      : fallbackJourneyFromScreens.length > 0
      ? fallbackJourneyFromScreens
      : [
          {
            step: 1,
            title: "요구사항 분석",
            description: "사용자 요구사항을 수집하고 분석합니다.",
            userAction: "프로젝트 담당자가 요구사항을 입력합니다.",
            systemResponse: "AI가 요구사항을 분석하고 분류합니다.",
            estimatedHours: undefined,
            requiredSkills: undefined,
          },
          {
            step: 2,
            title: "기능 구성",
            description: "수집된 요구사항을 기반으로 기능 구성을 확정합니다.",
            userAction: "담당자가 기능을 검토하고 승인합니다.",
            systemResponse: "시스템이 기능 목록을 정리하여 제공합니다.",
            estimatedHours: undefined,
            requiredSkills: undefined,
          },
          {
            step: 3,
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

  // Mermaid 다이어그램 생성
  const mermaidDiagramCode = finalUserJourneySteps.length > 0
    ? generateUserJourneyMermaidDefault(finalUserJourneySteps)
    : "";

  // Mermaid 다이어그램 섹션 생성 (이미지 우선, 실패 시 코드 블록)
  const mermaidDiagramSection = (() => {
    // 이미지가 있고 유효한 경우 이미지 사용
    if (mermaidImage && mermaidImage.startsWith('data:image')) {
      console.log("마크다운 생성 - Mermaid 이미지 사용:", {
        imageLength: mermaidImage.length,
        imagePreview: mermaidImage.substring(0, 50),
      });
      return [
        "### 사용자 여정 다이어그램",
        "",
        '<div class="mermaid-preview" style="text-align: center; page-break-inside: avoid;">',
        `<img src="${mermaidImage}" alt="사용자 여정 다이어그램" style="max-width: 100%; height: auto; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />`,
        "</div>",
        "",
      ].join("\n");
    }
    
    // 이미지가 없거나 유효하지 않은 경우 코드 블록 사용
    if (mermaidDiagramCode && mermaidDiagramCode.trim()) {
      console.log("마크다운 생성 - Mermaid 코드 블록 사용 (이미지 없음)");
      return [
        "### 사용자 여정 다이어그램",
        "",
        "```mermaid",
        mermaidDiagramCode,
        "```",
        "",
      ].join("\n");
    }
    
    return "";
  })();

  const userJourneySection =
    finalUserJourneySteps.length > 0
      ? [
          // Mermaid 다이어그램 섹션
          mermaidDiagramSection,
          // 단계별 상세 정보
          finalUserJourneySteps
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
            .join("\n\n"),
        ].filter(Boolean).join("\n\n")
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

  // 확장된 요구사항 상세 섹션 렌더링
  const detailedRequirementsSection = renderDetailedRequirements(extractedRequirements);

  // 추적 매트릭스 섹션 렌더링
  const traceMatrixSection = renderTraceMatrix(extractedRequirements);

  const markdown = `# ${requirementsData.projectName} — 프로젝트 요구사항 명세서

**생성일**: ${currentDate}  
**프로젝트명**: ${requirementsData.projectName}  
**서비스 유형**: ${projectData.serviceType}

---

## 📋 1. 프로젝트 개요

### 프로젝트 정보
- **프로젝트명**: ${requirementsData.projectName}
- **서비스 유형**: ${projectData.serviceType}
- **프로젝트 설명**: ${projectData.description}
- **총 기능 요구사항**: ${requirementsData.functionalRequirements.length}개
- **총 화면 수**: ${wireframe?.screens?.length || requirementsData.screenList.length}개

### 프로젝트 목표
${requirementsData.overview.goal}

### 핵심 가치 제안
${requirementsData.overview.valueProposition}

---

## 🎯 2. 프로젝트 범위 (포함/제외)

### 포함 가정
${requirementsData.scope.included.map(item => `- ${item}`).join('\n')}

${requirementsData.scope.excluded.length > 0 ? `### 범위 밖
${requirementsData.scope.excluded.map(item => `- ${item}`).join('\n')}` : ''}

---

## ⚙️ 3. 기능 요구사항 (FR)

### 📊 요구사항 요약
- **총 요구사항**: ${requirementsData.functionalRequirements.length}개
- **필수 요구사항**: ${requirementsData.functionalRequirements.filter(req => req.priority === "필수").length}개
- **권장 요구사항**: ${requirementsData.functionalRequirements.filter(req => req.priority === "권장").length}개
- **선택 요구사항**: ${requirementsData.functionalRequirements.filter(req => req.priority === "선택").length}개

${detailedRequirementsSection}

### 📋 요약 목록

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

## 🔧 4. 비기능 요구사항 (NFR)

${renderNonFunctionalRequirements(requirementsData.nonFunctionalRequirements)}

---

## 📱 5. 화면/와이어프레임

### 📊 화면 구성 요약
- **총 화면 수**: ${wireframe?.screens?.length || requirementsData.screenList.length}개
- **주요 화면**: 메인, 상세, 목록, 관리 화면

${renderWireframeSection(wireframe, wireframeImage)}

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

## 🛠️ 6. 기술 스택

${renderTechStack(requirementsData.dataModel)}

---

${traceMatrixSection}

## 🎨 7. 사용자 여정 (User Journey)

${userJourneySection}

---

## 📈 8. 프로젝트 규모 및 복잡도

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

## 💰 9. 예상 견적 정보

${estimationSection}

---

## 📞 문의사항

요구사항 명세서에 대한 문의사항이 있으시면 언제든지 연락주시기 바랍니다.

**Flowgence 팀**  
이메일: contact@flowgence.ai  
전화: 042-123-4567

---

*본 요구사항 명세서는 ${currentDate} 기준으로 작성되었으며, 프로젝트 요구사항 변경 시 내용이 달라질 수 있습니다.*
`;

  return markdown;
}

// 상세 요구사항 렌더링 (확장된 형식)
function renderDetailedRequirements(extractedRequirements?: any): string {
  if (!extractedRequirements || !extractedRequirements.categories) {
    return `
### 📝 상세 요구사항 분석
요구사항 상세 분석 데이터가 아직 준비되지 않았습니다.
`;
  }

  const categories = extractedRequirements.categories || [];
  let output = `
### 📝 카테고리별 상세 내역

`;

  categories.forEach((category: any, catIndex: number) => {
    const allRequirements = category.subCategories?.flatMap((subCategory: any) => 
      subCategory.requirements || []
    ) || [];

    output += `#### ${catIndex + 1}. ${category.category} (${allRequirements.length}개)\n\n`;

    if (category.subCategories && category.subCategories.length > 0) {
      category.subCategories.forEach((subCategory: any) => {
        if (!subCategory.requirements || subCategory.requirements.length === 0) return;

        output += `**${subCategory.subcategory}**\n\n`;

        subCategory.requirements.forEach((req: any) => {
          const id = req.id || `FR-${catIndex+1}-?`;
          const priority = req.priority === 'high' ? 'MUST' : req.priority === 'medium' ? 'SHOULD' : 'COULD';
          const roles = req.roles && Array.isArray(req.roles) ? req.roles.join(', ') : '미정';
          
          output += `##### ${id}. ${req.title} (${priority})\n\n`;
          output += `**설명**: ${req.description || '설명 없음'}\n\n`;
          
          if (req.roles && req.roles.length > 0) {
            output += `- **역할**: ${roles}\n`;
          }
          
          if (req.dataRules && req.dataRules.length > 0) {
            output += `- **데이터 규칙**: ${req.dataRules.join(' / ')}\n`;
          }
          
          if (req.exceptions && req.exceptions.length > 0) {
            output += `- **예외 처리**: ${req.exceptions.join(' / ')}\n`;
          }
          
          if (req.trace) {
            const trace = req.trace;
            if (trace.screens && trace.screens.length > 0) {
              output += `- **연관 화면**: ${trace.screens.join(', ')}\n`;
            }
            if (trace.apis && trace.apis.length > 0) {
              output += `- **API**: ${trace.apis.join(', ')}\n`;
            }
            if (trace.tables && trace.tables.length > 0) {
              output += `- **DB 테이블**: ${trace.tables.join(', ')}\n`;
            }
          }
          
          if (req.ac && req.ac.length > 0) {
            output += `\n**수용 기준 (AC)**:\n`;
            req.ac.forEach((ac: any) => {
              output += `- [${ac.type}] ${ac.text}\n`;
            });
          }
          
          if (req.source) {
            output += `\n*출처: ${req.source}*\n`;
          }
          
          output += `\n`;
        });
      });
    } else {
      output += `상세 요구사항이 없습니다.\n\n`;
    }
  });

  return output;
}

// NFR 렌더링
function renderNonFunctionalRequirements(nfrs: any[]): string {
  if (!nfrs || nfrs.length === 0) {
    return '비기능 요구사항이 정의되지 않았습니다.';
  }

  let output = `| ID | 카테고리 | 요구사항 | 측정 지표 | 검증 방법 | 중요도 |\n`;
  output += `|----|----|-------|-------|-------|-------|\n`;

  nfrs.forEach((req: any) => {
    const categoryIcon = req.category === "성능" || req.category === "performance" ? "⚡" : 
                        req.category === "보안" || req.category === "security" ? "🔒" : 
                        req.category === "사용성" || req.category === "usability" ? "👥" : 
                        req.category === "호환성" || req.category === "compatibility" ? "🔄" : 
                        req.category === "확장성" || req.category === "scalability" ? "📈" :
                        req.category === "유지보수성" || req.category === "maintainability" ? "🛠️" : "📋";
    
    const id = req.id || '-';
    const categoryName = `<span class="requirement-name">${categoryIcon} ${req.category}</span>`;
    const statement = req.statement || req.description || '-';
    const metric = req.metric || req.metrics || '-';
    const howToVerify = req.howToVerify || '-';
    const priorityText = req.priority === 'MUST' || req.priority === 'high' ? '높음' : 
                         req.priority === 'SHOULD' || req.priority === 'medium' ? '중간' : 
                         req.priority === 'COULD' || req.priority === 'low' ? '낮음' : '높음';
    const priorityClass = priorityText === '높음' ? 'mandatory' : priorityText === '중간' ? 'recommended' : 'optional';
    const importance = `<span class="priority-badge ${priorityClass}">${priorityText}</span>`;
    
    output += `| ${id} | ${categoryName} | ${statement} | ${metric} | ${howToVerify} | ${importance} |\n`;
  });

  return output;
}

// 추적 매트릭스 렌더링
function renderTraceMatrix(extractedRequirements?: any): string {
  if (!extractedRequirements || !extractedRequirements.categories) {
    return '';
  }

  const allRequirements: any[] = [];
  extractedRequirements.categories.forEach((category: any) => {
    category.subCategories?.forEach((subCategory: any) => {
      subCategory.requirements?.forEach((req: any) => {
        if (req.trace) {
          allRequirements.push(req);
        }
      });
    });
  });

  if (allRequirements.length === 0) {
    return '';
  }

  let output = `## 🔗 추적 매트릭스 (Traceability Matrix)\n\n`;
  output += `| FR ID | 제목 | 화면 | API/DB | 테스트 |\n`;
  output += `|-------|------|------|--------|--------|\n`;

  allRequirements.forEach((req) => {
    const id = req.id || '-';
    const title = req.title || '-';
    const screens = req.trace.screens?.join(', ') || '-';
    const apisAndTables = [
      ...(req.trace.apis || []),
      ...(req.trace.tables || []).map((t: string) => `[${t}]`)
    ].join(', ') || '-';
    const tests = req.trace.tests?.join(', ') || '-';

    output += `| ${id} | ${title} | ${screens} | ${apisAndTables} | ${tests} |\n`;
  });

  output += `\n---\n\n`;
  return output;
}

// 기술 스택 렌더링 (NestJS 강조)
function renderTechStack(dataModel?: any): string {
  if (dataModel) {
    return `
### 프론트엔드
${dataModel.frontend.map((tech: string) => `- ${tech}`).join('\n')}

### 백엔드
${dataModel.backend.map((tech: string) => `- ${tech}`).join('\n')}

### 데이터베이스
${dataModel.database.map((tech: string) => `- ${tech}`).join('\n')}

### 인프라
${dataModel.infrastructure.map((tech: string) => `- ${tech}`).join('\n')}
`;
  }

  return `
### 기본 기술 스택
- **프론트엔드**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS, shadcn/ui
- **백엔드**: NestJS, Node.js, Supabase (PostgreSQL), Redis, Socket.io
- **데이터베이스**: PostgreSQL, Redis
- **인프라**: Vercel (Frontend), Railway (Backend)
`;
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

function resolveViewportForScreen(
  screen: { viewport?: ViewportSpec; device?: Device },
  fallback?: ViewportSpec,
): ViewportSpec {
  if (screen.viewport) {
    return screen.viewport;
  }
  if (fallback) {
    return fallback;
  }
  return {
    width: 390,
    height: 844,
    device: screen.device ?? "mobile",
  };
}

function formatDeviceLabel(device: Device): string {
  switch (device) {
    case "desktop":
      return "💻 웹";
    case "tablet":
      return "📱 태블릿";
    case "mobile":
    default:
      return "📲 모바일";
  }
}

function renderWireframeSection(wireframe?: WireframeSpec | null, wireframeImage?: string): string {
  // 이미지가 제공되면 이미지 사용 (고품질)
  if (wireframeImage) {
    return `
## 🖼️ 와이어프레임 미리보기

<div class="wireframe-preview" style="text-align: center;">
  <img src="${wireframeImage}" alt="와이어프레임" style="max-width: 100%; height: auto; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
</div>

---
`;
  }

  // 이미지가 없으면 기존 HTML 렌더링 사용
  if (!wireframe || !wireframe.screens || wireframe.screens.length === 0) {
    return "";
  }

  const defaultViewport = wireframe.viewport;
  const deviceMap = new Map<
    Device,
    Array<{ screen: (typeof wireframe.screens)[number]; index: number }>
  >();

  wireframe.screens.forEach((screen, index) => {
    const viewport = resolveViewportForScreen(screen, defaultViewport);
    const device = viewport.device;
    if (!deviceMap.has(device)) {
      deviceMap.set(device, []);
    }
    deviceMap.get(device)?.push({ screen, index });
  });

  const deviceSections = Array.from(deviceMap.entries())
    .map(([device, screens]) => {
      const deviceHeading = `<h3 class="wireframe-device-heading">${formatDeviceLabel(
        device,
      )} (${screens.length}개 화면)</h3>`;

      const screenItems = screens
        .map(({ screen, index }) => {
          const viewport = resolveViewportForScreen(screen, defaultViewport);
          const scale =
            viewport.width > 0
              ? Math.min(320 / viewport.width, 0.6)
              : 0.4;
          const viewportWidth = Math.round(viewport.width * scale);
          const viewportHeight = Math.round(viewport.height * scale);

          const elementsHtml = screen.elements
            .map((element) => {
              const left = Math.round(element.x * scale);
              const top = Math.round(element.y * scale);
              const width = Math.max(Math.round(element.w * scale), 12);
              const height = Math.max(Math.round(element.h * scale), 12);
              const label = element.label ? ` • ${element.label}` : "";
              return `<div class="wireframe-element type-${element.type}" style="left:${left}px;top:${top}px;width:${width}px;height:${height}px;">
        <div class="wireframe-element-content">
          <span class="wireframe-element-icon">${getWireframeIcon(
            element.type,
          )}</span>
          <span class="wireframe-element-label">${element.type.toUpperCase()}${label}</span>
        </div>
      </div>`;
            })
            .join("");

          return `<div class="wireframe-screen">
      <div class="wireframe-screen-header">
        <div class="wireframe-screen-title">${String(index + 1).padStart(
          2,
          "0",
        )}. ${screen.name}</div>
        <div class="wireframe-screen-meta">${formatDeviceLabel(
          viewport.device,
        )} • ${viewport.width} × ${viewport.height}px • ${screen.layout.type.toUpperCase()} LAYOUT</div>
      </div>
      <div class="wireframe-canvas-wrapper">
        <div class="wireframe-canvas" style="width:${viewportWidth}px;height:${viewportHeight}px;">
          ${elementsHtml}
        </div>
      </div>
    </div>`;
        })
        .join("");

      return `<div class="wireframe-device-group">${deviceHeading}${screenItems}</div>`;
    })
    .join("");

  return `
## 🖼️ 와이어프레임 미리보기

<div class="wireframe-preview">
${deviceSections}
</div>

---
`;
}
