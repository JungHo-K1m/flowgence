import { NextRequest, NextResponse } from 'next/server';

// Claude AI API 호출 함수
const callClaudeAPI = async (systemPrompt: string, userPrompt: string) => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  console.log('Claude API 응답:', data);
  
  if (!data.content || !data.content[0] || !data.content[0].text) {
    throw new Error('Invalid response format from Claude API');
  }
  
  return data.content[0].text;
};

interface ProjectInput {
  description: string;
  serviceType: string;
  uploadedFiles: File[];
}

interface ChatMessage {
  type: 'user' | 'ai' | 'system';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('API 호출 시작');
    const { type, input, messages } = await request.json();
    console.log('요청 데이터:', { type, input: input?.description, messagesCount: messages?.length });
    
    if (type === 'project_overview') {
      console.log('프로젝트 개요 생성 시작');
      const overview = await generateProjectOverview(input, messages);
      console.log('프로젝트 개요 생성 완료:', overview);
      return NextResponse.json({ overview });
    }
    
    return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error',
      type: 'claude_api_error'
    }, { status: 500 });
  }
}

const generateProjectOverview = async (input: ProjectInput, messages: ChatMessage[]) => {
  // Claude API 키 확인
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('ANTHROPIC_API_KEY가 설정되지 않았습니다. 테스트 모드로 실행합니다.');
    
    // 테스트 모드: 샘플 데이터 반환
    return {
      serviceCoreElements: {
        title: "테스트 프로젝트",
        description: input.description || "프로젝트 설명이 입력되지 않았습니다.",
        keyFeatures: ["기능 1", "기능 2", "기능 3"],
        targetUsers: ["일반 사용자", "비즈니스 사용자"],
        projectScale: "중규모",
        techComplexity: "보통",
        estimatedDuration: "3-4개월",
        requiredTeam: ["프론트엔드", "백엔드", "기획/디자인"],
        techStack: {
          frontend: ["React", "TypeScript"],
          backend: ["Node.js", "Express"],
          database: ["PostgreSQL"],
          infrastructure: ["AWS"]
        }
      },
      userJourney: {
        steps: [
          {
            step: 1,
            title: "프로젝트 시작",
            description: "사용자가 프로젝트를 시작합니다.",
            userAction: "프로젝트 설명 입력",
            systemResponse: "프로젝트 분석 시작",
            estimatedHours: "2-4시간",
            requiredSkills: ["기획", "분석"]
          },
          {
            step: 2,
            title: "요구사항 수집",
            description: "사용자의 요구사항을 수집합니다.",
            userAction: "요구사항 입력",
            systemResponse: "요구사항 분석 및 정리",
            estimatedHours: "4-8시간",
            requiredSkills: ["기획", "분석", "UI/UX"]
          }
        ]
      },
      estimation: {
        totalCost: "3,000만원 - 5,000만원",
        breakdown: {
          development: "2,000만원 - 3,500만원",
          design: "500만원 - 800만원",
          testing: "300만원 - 500만원",
          deployment: "200만원 - 300만원"
        },
        timeline: {
          planning: "2-3주",
          development: "8-12주",
          testing: "2-3주",
          deployment: "1-2주"
        }
      }
    };
  }

  console.log('Claude API 호출 시작');
  console.log('입력 데이터:', { 
    description: input.description, 
    serviceType: input.serviceType,
    messagesCount: messages.length 
  });

  const systemPrompt = `당신은 Flowgence의 SI 프로젝트 분석 및 견적 산출 전문가입니다.

  ## 역할 및 전문성
  - **SI 프로젝트 분석 전문가**: 웹/모바일/시스템 개발 프로젝트의 요구사항 분석 및 기술적 복잡도 평가
  - **견적 산출 전문가**: 개발 기간, 인력 구성, 기술 스택에 따른 정확한 견적 산출
  - **요구사항 분류 전문가**: 기능적/비기능적 요구사항을 대/중/소분류로 체계화
  - **기술 스택 추천 전문가**: 프로젝트 특성에 맞는 최적의 기술 스택 및 아키텍처 제안

  ## 분석 기준
  1. **프로젝트 규모**: 소규모(1-3개월), 중규모(3-6개월), 대규모(6개월+)
  2. **기술 복잡도**: 단순, 보통, 복잡, 매우 복잡
  3. **개발 인력**: 프론트엔드, 백엔드, 풀스택, DevOps, 기획/디자인
  4. **예상 견적**: 개발비, 운영비, 유지보수비

  사용자가 입력한 프로젝트 정보와 대화 내용을 바탕으로 **오직 JSON 형식으로만** 응답해주세요. 
  다른 텍스트나 설명 없이 순수한 JSON만 반환해야 합니다.
  
  반환할 JSON 형식:
  {
    "serviceCoreElements": {
      "title": "프로젝트 제목",
      "description": "프로젝트 설명",
      "keyFeatures": ["핵심 기능1", "핵심 기능2"],
      "targetUsers": ["타겟 사용자1", "타겟 사용자2"],
      "projectScale": "소규모|중규모|대규모",
      "techComplexity": "단순|보통|복잡|매우복잡",
      "estimatedDuration": "예상 개발 기간 (개월)",
      "requiredTeam": ["프론트엔드", "백엔드", "풀스택", "DevOps", "기획/디자인"],
      "techStack": {
        "frontend": ["React", "Vue", "Angular"],
        "backend": ["Node.js", "Python", "Java"],
        "database": ["PostgreSQL", "MongoDB", "MySQL"],
        "infrastructure": ["AWS", "Azure", "GCP"]
      }
    },
    "userJourney": {
      "steps": [
        {
          "step": 1,
          "title": "단계 제목",
          "description": "단계 설명",
          "userAction": "사용자 행동",
          "systemResponse": "시스템 응답",
          "estimatedHours": "예상 소요 시간",
          "requiredSkills": ["필요한 기술 스택"]
        }
      ]
    },
    "estimation": {
      "totalCost": "총 예상 비용 (원)",
      "breakdown": {
        "development": "개발비",
        "design": "디자인비",
        "testing": "테스트비",
        "deployment": "배포비"
      },
      "timeline": {
        "planning": "기획/설계 기간",
        "development": "개발 기간",
        "testing": "테스트 기간",
        "deployment": "배포 기간"
      }
    }
  }`;

  // 대화 히스토리를 텍스트로 변환
  const conversationHistory = messages.map(msg => 
    `${msg.type === 'user' ? '사용자' : 'AI'}: ${msg.content}`
  ).join('\n');

  const userPrompt = `프로젝트 정보:
  - 설명: ${input.description}
  - 서비스 타입: ${input.serviceType}
  - 업로드된 파일: ${input.uploadedFiles?.length || 0}개
  
  대화 내용:
  ${conversationHistory}
  
  위 정보와 대화 내용을 바탕으로 다음을 분석해주세요:
  
  1. **프로젝트 규모 및 복잡도**: 개발 기간, 기술적 난이도, 필요한 인력 규모
  2. **핵심 기능 식별**: MVP 기능, 추가 기능, 향후 확장 기능
  3. **기술 스택 추천**: 프로젝트 특성에 맞는 최적의 기술 선택
  4. **견적 산출**: 개발비, 운영비, 유지보수비 포함한 총 비용
  5. **일정 계획**: 단계별 개발 일정 및 마일스톤
  
  특히 SI 프로젝트의 특성을 고려하여 실무적이고 정확한 분석을 제공해주세요.
  
  **중요**: 대화 내용에서 사용자가 추가로 언급한 기능이나 요구사항이 있다면 반드시 반영해주세요.`;

  const response = await callClaudeAPI(systemPrompt, userPrompt);

  try {
    const content = response;
    if (!content) {
      throw new Error('No content received from Claude');
    }
    
    console.log('Claude 응답 원본:', content);
    
    // 여러 패턴으로 JSON 추출 시도
    let jsonContent = content;
    
    // 1. ```json``` 코드 블록에서 추출
    const jsonBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      jsonContent = jsonBlockMatch[1].trim();
      console.log('JSON 블록에서 추출:', jsonContent);
    }
    
    // 2. ``` 코드 블록에서 추출 (json 태그 없이)
    if (jsonContent === content) {
      const codeBlockMatch = content.match(/```\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        const extracted = codeBlockMatch[1].trim();
        // JSON 형태인지 확인
        if (extracted.startsWith('{') && extracted.endsWith('}')) {
          jsonContent = extracted;
          console.log('코드 블록에서 JSON 추출:', jsonContent);
        }
      }
    }
    
    // 3. 첫 번째 { 부터 마지막 } 까지 추출
    if (jsonContent === content) {
      const firstBrace = content.indexOf('{');
      const lastBrace = content.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonContent = content.substring(firstBrace, lastBrace + 1);
        console.log('중괄호로 JSON 추출:', jsonContent);
      }
    }
    
    // JSON 파싱 시도
    const parsedData = JSON.parse(jsonContent);
    console.log('JSON 파싱 성공:', parsedData);
    return parsedData;
    
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
    console.error('Raw response:', response);
    
    // 파싱 실패 시 기본 구조 반환
    return {
      serviceCoreElements: {
        title: "프로젝트 분석 중...",
        description: "AI가 프로젝트를 분석하고 있습니다.",
        keyFeatures: ["분석 중..."],
        targetUsers: ["분석 중..."]
      },
      userJourney: {
        steps: [
          {
            step: 1,
            title: "분석 중",
            description: "프로젝트를 분석하고 있습니다.",
            userAction: "분석 중",
            systemResponse: "분석 중"
          }
        ]
      }
    };
  }
};
