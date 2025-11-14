/**
 * 사용자 여정을 Mermaid 다이어그램으로 변환하는 유틸리티
 */

export interface UserJourneyStep {
  step: number;
  title: string;
  description: string;
  userAction: string;
  systemResponse: string;
  estimatedHours?: string;
  requiredSkills?: string[];
}

/**
 * 사용자 여정 단계들을 Mermaid Journey 다이어그램 문법으로 변환
 */
export function generateUserJourneyMermaid(steps: UserJourneyStep[]): string {
  if (!steps || steps.length === 0) {
    return '';
  }

  // Mermaid Journey 다이어그램 생성
  let mermaidCode = 'journey\n';
  
  steps.forEach((step, index) => {
    // 제목을 간단하게 정리 (특수문자 제거, 공백 처리)
    const cleanTitle = step.title
      .replace(/[^\w\s가-힣]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 30); // 최대 30자로 제한
    
    // 사용자 행동과 시스템 응답을 요약
    const userActionShort = step.userAction
      .replace(/[^\w\s가-힣]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 20);
    
    const systemResponseShort = step.systemResponse
      .replace(/[^\w\s가-힣]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 20);

    // Journey 형식: title: score: label
    // score는 1-5 사이의 값 (중요도에 따라)
    const score = 5; // 기본값
    
    mermaidCode += `    title ${step.step}: ${cleanTitle}: ${score}: ${userActionShort}\n`;
  });

  return mermaidCode;
}

/**
 * 사용자 여정을 Mermaid Flowchart로 변환 (더 상세한 정보 포함)
 */
export function generateUserJourneyFlowchart(steps: UserJourneyStep[]): string {
  if (!steps || steps.length === 0) {
    return '';
  }

  let mermaidCode = 'flowchart TD\n';
  mermaidCode += '    Start([시작]) --> Step1\n';

  steps.forEach((step, index) => {
    const stepId = `Step${step.step}`;
    const nextStepId = index < steps.length - 1 ? `Step${steps[index + 1].step}` : 'End';
    
    // 제목 정리
    const cleanTitle = step.title
      .replace(/[^\w\s가-힣]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 25);
    
    // 노드 생성
    mermaidCode += `    ${stepId}["${cleanTitle}"]\n`;
    
    // 사용자 행동과 시스템 응답을 별도 노드로 표시
    const userActionId = `UserAction${step.step}`;
    const systemResponseId = `SystemResponse${step.step}`;
    
    const userActionShort = step.userAction
      .replace(/[^\w\s가-힣]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 20);
    
    const systemResponseShort = step.systemResponse
      .replace(/[^\w\s가-힣]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 20);
    
    mermaidCode += `    ${stepId} --> ${userActionId}["👤 ${userActionShort}"]\n`;
    mermaidCode += `    ${userActionId} --> ${systemResponseId}["⚙️ ${systemResponseShort}"]\n`;
    
    // 다음 단계로 연결
    if (index < steps.length - 1) {
      mermaidCode += `    ${systemResponseId} --> ${nextStepId}\n`;
    } else {
      mermaidCode += `    ${systemResponseId} --> End([종료])\n`;
    }
  });

  return mermaidCode;
}

/**
 * 사용자 여정을 Mermaid Sequence 다이어그램으로 변환
 */
export function generateUserJourneySequence(steps: UserJourneyStep[]): string {
  if (!steps || steps.length === 0) {
    return '';
  }

  let mermaidCode = 'sequenceDiagram\n';
  mermaidCode += '    actor 사용자 as 사용자\n';
  mermaidCode += '    participant 시스템 as 시스템\n\n';

  steps.forEach((step) => {
    const cleanTitle = step.title
      .replace(/[^\w\s가-힣]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    const userActionShort = step.userAction
      .replace(/[^\w\s가-힣]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 30);
    
    const systemResponseShort = step.systemResponse
      .replace(/[^\w\s가-힣]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 30);
    
    mermaidCode += `    Note over 사용자,시스템: ${cleanTitle}\n`;
    mermaidCode += `    사용자->>시스템: ${userActionShort}\n`;
    mermaidCode += `    시스템-->>사용자: ${systemResponseShort}\n\n`;
  });

  return mermaidCode;
}

/**
 * 기본적으로 Flowchart 형식 사용 (가장 읽기 쉬움)
 */
export function generateUserJourneyMermaidDefault(steps: UserJourneyStep[]): string {
  return generateUserJourneyFlowchart(steps);
}

