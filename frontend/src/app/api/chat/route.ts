import { NextRequest, NextResponse } from 'next/server';
import { ExtractedRequirements } from '@/types/requirements';

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

// 요구사항 업데이트 함수
const updateRequirements = async (input: ProjectInput, messages: ChatMessage[], existingRequirements: ExtractedRequirements) => {
  // Claude API 키 확인
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('ANTHROPIC_API_KEY가 설정되지 않았습니다. 테스트 모드로 실행합니다.');
    
    // 테스트 모드: 기존 요구사항에 새로운 요구사항 추가
    const newRequirement = {
      id: `req_${Date.now()}`,
      title: "채팅에서 추가된 요구사항",
      description: "사용자가 채팅을 통해 추가한 새로운 요구사항입니다.",
      priority: "medium" as const,
      needsClarification: false,
      clarificationQuestions: [],
      status: "draft" as const
    };

    // 기존 요구사항에 새 요구사항 추가
    if (existingRequirements?.categories?.[0]?.subCategories?.[0]?.requirements) {
      existingRequirements.categories[0].subCategories[0].requirements.push(newRequirement);
      existingRequirements.totalCount = (existingRequirements.totalCount || 0) + 1;
    }

    return existingRequirements;
  }

  const systemPrompt = `당신은 Flowgence의 SI 프로젝트 요구사항 업데이트 전문가입니다.

## 역할 및 전문성
- **요구사항 병합 전문가**: 기존 요구사항과 새로운 채팅 정보를 지능적으로 병합
- **충돌 해결 전문가**: 기존 요구사항과 새 정보 간의 충돌을 해결하고 최적의 결과 도출
- **우선순위 재평가 전문가**: 새로운 정보를 바탕으로 기존 요구사항의 우선순위 재평가
- **구조 유지 전문가**: 기존 요구사항의 체계적 구조를 유지하면서 새로운 정보 반영

## 업데이트 원칙
1. **기존 구조 유지**: 대분류/중분류 구조는 최대한 유지
2. **중복 제거**: 새로운 정보가 기존 요구사항과 중복되면 기존 것을 업데이트
3. **우선순위 조정**: 새로운 정보에 따라 우선순위 재평가
4. **명확화 질문 업데이트**: 새로운 정보로 명확해진 요구사항의 질문 제거
5. **새 요구사항 추가**: 완전히 새로운 요구사항은 적절한 위치에 추가

사용자가 입력한 프로젝트 정보, 기존 요구사항, 새로운 대화 내용을 바탕으로 **오직 JSON 형식으로만** 응답해주세요. 
다른 텍스트나 설명 없이 순수한 JSON만 반환해야 합니다.

반환할 JSON 형식은 기존 요구사항과 동일한 구조를 유지하되, 새로운 정보를 반영하여 업데이트된 버전을 제공해주세요.`;

  // 대화 히스토리를 텍스트로 변환
  const conversationHistory = messages.map(msg => 
    `${msg.type === 'user' ? '사용자' : 'AI'}: ${msg.content}`
  ).join('\n');

  const userPrompt = `프로젝트 정보:
- 설명: ${input.description}
- 서비스 타입: ${input.serviceType}
- 업로드된 파일: ${input.uploadedFiles?.length || 0}개

기존 요구사항:
${JSON.stringify(existingRequirements, null, 2)}

새로운 대화 내용:
${conversationHistory}

위 정보를 바탕으로 다음을 수행해주세요:

1. **기존 요구사항 분석**: 현재 요구사항의 구조와 내용을 파악
2. **새 정보 추출**: 대화에서 언급된 새로운 기능이나 요구사항 식별
3. **지능적 병합**: 
   - 기존 요구사항과 중복되는 새로운 정보는 기존 요구사항을 업데이트
   - 완전히 새로운 요구사항은 적절한 위치에 추가
   - 우선순위가 변경된 요구사항은 우선순위 재설정
4. **명확화 질문 업데이트**: 새로운 정보로 명확해진 요구사항의 clarificationQuestions 제거
5. **구조 최적화**: 필요시 대분류/중분류 구조 조정

**중요**: 
- 기존 요구사항의 ID는 최대한 유지
- 사용자가 편집한 요구사항은 우선적으로 보존
- 새로운 정보는 기존 구조에 자연스럽게 통합
- 중복을 제거하고 일관성 유지
- totalCount와 extractedAt 필드 업데이트`;

  console.log('=== 요구사항 업데이트 프롬프트 ===');
  console.log('기존 요구사항 개수:', existingRequirements?.totalCount || 0);
  console.log('새 대화 메시지 개수:', messages.length);

  try {
    const response = await callClaudeAPI(systemPrompt, userPrompt);
    console.log('Claude API 응답 (요구사항 업데이트):', response);
    
    // JSON 파싱
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('JSON 형식의 응답을 찾을 수 없습니다.');
    }
    
    const updatedRequirements = JSON.parse(jsonMatch[0]);
    console.log('파싱된 업데이트된 요구사항:', updatedRequirements);
    
    return updatedRequirements;
  } catch (error) {
    console.error('요구사항 업데이트 오류:', error);
    throw error;
  }
};

interface ProjectInput {
  description: string;
  serviceType: string;
  uploadedFiles: File[];
  projectOverview?: Record<string, unknown>;
}

interface ChatMessage {
  type: 'user' | 'ai' | 'system';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('API 호출 시작');
    const requestBody = await request.json();
    const { type, input, messages, existingRequirements } = requestBody;
    console.log('요청 데이터:', { type, input: input?.description, messagesCount: messages?.length });
    
    if (type === 'project_overview') {
      console.log('프로젝트 개요 생성 시작');
      const overview = await generateProjectOverview(input, messages);
      console.log('프로젝트 개요 생성 완료:', overview);
      return NextResponse.json({ overview });
    }
    
    if (type === 'requirements_extraction') {
      console.log('요구사항 추출 시작');
      const requirements = await extractRequirements(input, messages);
      console.log('요구사항 추출 완료:', requirements);
      return NextResponse.json({ requirements });
    }
    
    if (type === 'requirements_update') {
      console.log('요구사항 업데이트 시작');
      console.log('기존 요구사항 개수:', existingRequirements?.totalCount || 0);
      const updatedRequirements = await updateRequirements(input, messages, existingRequirements);
      console.log('요구사항 업데이트 완료:', updatedRequirements);
      return NextResponse.json({ requirements: updatedRequirements });
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
    
    console.log('=== Claude API 응답 ===');
    console.log('Claude 응답 원본:', content);
    console.log('=======================');
    
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

const extractRequirements = async (input: ProjectInput, messages: ChatMessage[]) => {
  // Claude API 키 확인
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('ANTHROPIC_API_KEY가 설정되지 않았습니다. 테스트 모드로 실행합니다.');
    
    // 테스트 모드: 샘플 요구사항 데이터 반환 (계층적 구조)
    return {
      categories: [
        {
          majorCategory: "사용자 관리",
          subCategories: [
            {
              subCategory: "인증",
              requirements: [
                {
                  id: "req_1",
                  title: "이메일/비밀번호 로그인",
                  description: "사용자가 이메일과 비밀번호로 로그인할 수 있어야 함",
                  priority: "high",
                  needsClarification: true,
                  clarificationQuestions: ["2단계 인증이 필요한가요?", "소셜 로그인도 지원하나요?"],
                  status: "draft"
                },
                {
                  id: "req_2",
                  title: "비밀번호 찾기",
                  description: "비밀번호를 잊은 사용자가 이메일로 재설정할 수 있어야 함",
                  priority: "medium",
                  needsClarification: false,
                  clarificationQuestions: [],
                  status: "draft"
                }
              ]
            },
            {
              subCategory: "프로필 관리",
              requirements: [
                {
                  id: "req_3",
                  title: "개인정보 수정",
                  description: "사용자가 자신의 개인정보를 수정할 수 있어야 함",
                  priority: "medium",
                  needsClarification: false,
                  clarificationQuestions: [],
                  status: "draft"
                }
              ]
            }
          ]
        },
        {
          majorCategory: "핵심 기능",
          subCategories: [
            {
              subCategory: "알림 시스템",
              requirements: [
                {
                  id: "req_4",
                  title: "스트레칭 알림",
                  description: "일정 시간마다 스트레칭 알림을 보내는 기능",
                  priority: "high",
                  needsClarification: true,
                  clarificationQuestions: ["알림 주기는 어떻게 설정하나요?", "직무별로 다른 알림이 필요한가요?"],
                  status: "draft"
                }
              ]
            }
          ]
        }
      ],
      extractedAt: new Date().toISOString(),
      totalCount: 4,
      needsReview: true
    };
  }

  console.log('요구사항 추출 API 호출 시작');
  console.log('입력 데이터:', { 
    description: input.description, 
    serviceType: input.serviceType,
    messagesCount: messages.length,
    hasProjectOverview: !!input.projectOverview
  });

  if (input.projectOverview) {
    console.log('=== 프로젝트 개요 정보 ===');
    const projectOverview = input.projectOverview as Record<string, unknown>;
    console.log('프로젝트 제목:', (projectOverview.serviceCoreElements as Record<string, unknown>)?.title);
    console.log('핵심 기능:', (projectOverview.serviceCoreElements as Record<string, unknown>)?.keyFeatures);
    console.log('기술 스택:', (projectOverview.serviceCoreElements as Record<string, unknown>)?.techStack);
    console.log('사용자 여정 단계 수:', ((projectOverview.userJourney as Record<string, unknown>)?.steps as unknown[])?.length);
    console.log('========================');
  } else {
    console.log('⚠️ 프로젝트 개요가 없습니다. 기본 정보만으로 요구사항을 추출합니다.');
  }

  const systemPrompt = `당신은 Flowgence의 SI 프로젝트 요구사항 분석 전문가입니다.

## 역할 및 전문성
- **요구사항 도출 전문가**: 프로젝트 설명과 대화 내용에서 기능적/비기능적 요구사항을 체계적으로 도출
- **분류 체계 전문가**: 대분류(인증, 상품관리, 주문결제 등) → 중분류(로그인, 상품등록 등) → 소분류(이메일로그인, 상품정보등록 등)로 체계적 분류
- **우선순위 평가 전문가**: 각 요구사항의 비즈니스 중요도와 기술적 복잡도를 고려한 우선순위 설정
- **명확화 질문 생성 전문가**: 모호한 요구사항에 대한 구체적이고 실용적인 질문 생성

## 분석 기준
1. **대분류**: 인증, 상품관리, 주문결제, 배송관리, 사용자관리, 관리자기능, 결제시스템, 알림시스템, 보안, 성능
2. **중분류**: 각 대분류 내에서 세부 기능 영역
3. **소분류**: 구체적인 기능 단위
4. **우선순위**: high(핵심기능), medium(중요기능), low(부가기능)
5. **명확화 필요**: 사용자 추가 입력이 필요한 요구사항 식별

사용자가 입력한 프로젝트 정보와 대화 내용을 바탕으로 **오직 JSON 형식으로만** 응답해주세요. 
다른 텍스트나 설명 없이 순수한 JSON만 반환해야 합니다.

반환할 JSON 형식:
{
  "categories": [
    {
      "majorCategory": "대분류 (예: 사용자 관리)",
      "subCategories": [
        {
          "subCategory": "중분류 (예: 인증)",
          "requirements": [
            {
              "id": "req_1",
              "title": "소분류 (예: 이메일/비밀번호 로그인)",
              "description": "상세 설명",
              "priority": "high|medium|low",
              "needsClarification": true,
              "clarificationQuestions": ["구체적인 질문1", "구체적인 질문2"],
              "status": "draft"
            },
            {
              "id": "req_2", 
              "title": "소분류 (예: 소셜 로그인)",
              "description": "상세 설명",
              "priority": "medium",
              "needsClarification": false,
              "clarificationQuestions": [],
              "status": "draft"
            }
          ]
        },
        {
          "subCategory": "중분류 (예: 프로필 관리)",
          "requirements": [
            {
              "id": "req_3",
              "title": "소분류 (예: 개인정보 수정)",
              "description": "상세 설명",
              "priority": "high",
              "needsClarification": false,
              "clarificationQuestions": [],
              "status": "draft"
            }
          ]
        }
      ]
    },
    {
      "majorCategory": "대분류 (예: 핵심 기능)",
      "subCategories": [
        {
          "subCategory": "중분류 (예: 알림 시스템)",
          "requirements": [
            {
              "id": "req_4",
              "title": "소분류 (예: 스트레칭 알림)",
              "description": "상세 설명",
              "priority": "high",
              "needsClarification": true,
              "clarificationQuestions": ["알림 주기는 어떻게 설정하나요?", "직무별로 다른 알림이 필요한가요?"],
              "status": "draft"
            }
          ]
        }
      ]
    }
  ],
  "extractedAt": "2025-01-22T10:30:00Z",
  "totalCount": 4,
  "needsReview": true
}`;

  // 대화 히스토리를 텍스트로 변환
  const conversationHistory = messages.map(msg => 
    `${msg.type === 'user' ? '사용자' : 'AI'}: ${msg.content}`
  ).join('\n');

  const userPrompt = `프로젝트 정보:
- 설명: ${input.description}
- 서비스 타입: ${input.serviceType}
- 업로드된 파일: ${input.uploadedFiles?.length || 0}개

프로젝트 개요 (이전 단계에서 생성된 상세 분석):
${input.projectOverview ? JSON.stringify(input.projectOverview, null, 2) : '프로젝트 개요가 아직 생성되지 않았습니다.'}

대화 내용:
${conversationHistory}

위 정보와 대화 내용을 바탕으로 다음을 수행해주세요:

1. **요구사항 도출**: 프로젝트 설명과 대화에서 언급된 모든 기능적 요구사항을 도출
2. **체계적 분류**: 대분류 → 중분류 → 소분류로 체계적으로 분류
3. **우선순위 설정**: 각 요구사항의 비즈니스 중요도에 따른 우선순위 설정
4. **명확화 질문**: 모호하거나 추가 정보가 필요한 요구사항에 대한 구체적 질문 생성
5. **완성도 평가**: 현재 정보로 도출 가능한 요구사항의 완성도 평가

특히 SI 프로젝트의 특성을 고려하여 실무적이고 정확한 요구사항을 도출해주세요.

**중요**: 
- 대화 내용에서 사용자가 언급한 모든 기능과 요구사항을 반드시 포함
- 프로젝트 개요가 있다면 해당 정보를 적극 활용하여 더 정확하고 구체적인 요구사항 도출
- 프로젝트 개요의 기술 스택, 사용자 여정, 예상 비용 등을 참고하여 실현 가능한 요구사항으로 변환
- 누락된 부분이 있다면 "needsClarification": true로 표시하고 구체적 질문 생성
- 각 요구사항은 개발 가능한 단위로 세분화
- 우선순위는 비즈니스 임팩트와 기술적 복잡도를 종합 고려`;

  console.log('=== 요구사항 추출 프롬프트 ===');
  console.log('System Prompt:', systemPrompt);
  console.log('User Prompt:', userPrompt);
  console.log('===============================');

  const response = await callClaudeAPI(systemPrompt, userPrompt);

  try {
    const content = response;
    if (!content) {
      throw new Error('No content received from Claude');
    }
    
    console.log('Claude 요구사항 추출 응답 원본:', content);
    
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
    console.log('=== 요구사항 JSON 파싱 성공 ===');
    console.log('파싱된 데이터:', parsedData);
    console.log('카테고리 개수:', parsedData.categories?.length || 0);
    console.log('===============================');
    
    // 응답 데이터 검증 및 보완
    const validatedData = {
      categories: parsedData.categories || [],
      extractedAt: parsedData.extractedAt || new Date().toISOString(),
      totalCount: parsedData.totalCount || parsedData.categories?.reduce((total: number, cat: Record<string, unknown>) => 
        total + ((cat.subCategories as Record<string, unknown>[])?.reduce((subTotal: number, subCat: Record<string, unknown>) => 
          subTotal + ((subCat.requirements as unknown[])?.length || 0), 0) || 0), 0) || 0,
      needsReview: parsedData.needsReview !== undefined ? parsedData.needsReview : true
    };
    
    console.log('=== 최종 검증된 데이터 ===');
    console.log('검증된 데이터:', validatedData);
    console.log('========================');
    
    return validatedData;
    
  } catch (parseError) {
    console.error('요구사항 JSON parse error:', parseError);
    console.error('Raw response:', response);
    
    // 파싱 실패 시 기본 구조 반환
    return {
      categories: [
        {
          category: "분석 중",
          subcategory: "요구사항 도출 중",
          requirements: [
            {
              id: "req_temp",
              title: "요구사항 분석 중",
              description: "AI가 요구사항을 분석하고 있습니다.",
              priority: "medium",
              needsClarification: true,
              clarificationQuestions: ["추가 정보가 필요합니다."],
              status: "draft"
            }
          ]
        }
      ],
      extractedAt: new Date().toISOString(),
      totalCount: 1,
      needsReview: true
    };
  }
};
