// 개발 모드용 더미 데이터
// API 비용 절감을 위해 모바일 UI 테스트 시 사용

export const DUMMY_PROJECT_OVERVIEW = {
  serviceCoreElements: {
    title: "AI 기반 업무 자동화 플랫폼",
    description: "반복적인 업무 프로세스를 AI가 자동으로 처리하여 업무 효율을 높이는 SaaS 플랫폼입니다.",
    keyFeatures: [
      "AI 문서 자동 분류 및 정리",
      "업무 프로세스 자동화 워크플로우",
      "실시간 협업 대시보드",
      "데이터 분석 및 인사이트 리포트",
      "외부 서비스 API 연동"
    ],
    targetUsers: [
      "중소기업 관리자",
      "스타트업 운영팀",
      "프리랜서",
      "1인 기업가"
    ],
    projectScale: "중규모",
    techComplexity: "보통",
    estimatedDuration: "3-4개월",
    requiredTeam: [
      "프론트엔드 개발자 2명",
      "백엔드 개발자 2명",
      "AI/ML 엔지니어 1명",
      "UI/UX 디자이너 1명",
      "PM 1명"
    ],
    techStack: {
      frontend: ["Next.js", "TypeScript", "TailwindCSS", "React Query"],
      backend: ["NestJS", "Node.js", "PostgreSQL", "Redis"],
      database: ["PostgreSQL", "MongoDB"],
      infrastructure: ["AWS", "Docker", "Kubernetes", "Vercel"]
    },
    businessModel: {
      revenueStreams: ["월 구독료", "엔터프라이즈 라이선스", "API 사용료"],
      monetizationStrategy: "프리미엄 구독 기반 SaaS 모델",
      pricingModel: "Basic(무료) / Pro(월 29,000원) / Enterprise(문의)",
      targetMarketSize: "국내 중소기업 약 700만 개사",
      competitiveAdvantage: "AI 기반 자동화로 기존 대비 70% 시간 절감"
    }
  },
  userJourney: {
    steps: [
      {
        step: 1,
        title: "회원가입 및 온보딩",
        description: "간편한 소셜 로그인으로 가입 후, 업무 유형을 선택합니다.",
        userAction: "Google/카카오 로그인 후 업무 유형 선택",
        systemResponse: "맞춤형 대시보드 및 워크플로우 템플릿 제공",
        estimatedHours: "8시간",
        requiredSkills: ["프론트엔드", "OAuth 연동"]
      },
      {
        step: 2,
        title: "워크플로우 설정",
        description: "드래그 앤 드롭으로 자동화할 업무 흐름을 구성합니다.",
        userAction: "워크플로우 빌더에서 노드 연결",
        systemResponse: "실시간 미리보기 및 유효성 검사",
        estimatedHours: "24시간",
        requiredSkills: ["프론트엔드", "상태관리"]
      },
      {
        step: 3,
        title: "AI 문서 처리",
        description: "업로드된 문서를 AI가 자동으로 분류하고 정리합니다.",
        userAction: "문서 업로드 또는 드래그 앤 드롭",
        systemResponse: "AI 분석 결과 및 카테고리 제안",
        estimatedHours: "40시간",
        requiredSkills: ["백엔드", "AI/ML", "파일 처리"]
      },
      {
        step: 4,
        title: "대시보드 모니터링",
        description: "실시간으로 업무 진행 상황을 확인합니다.",
        userAction: "대시보드 조회 및 필터 적용",
        systemResponse: "실시간 차트 및 알림 표시",
        estimatedHours: "16시간",
        requiredSkills: ["프론트엔드", "데이터 시각화"]
      },
      {
        step: 5,
        title: "리포트 생성",
        description: "기간별 업무 성과를 분석한 리포트를 생성합니다.",
        userAction: "리포트 유형 선택 및 기간 설정",
        systemResponse: "PDF/Excel 리포트 다운로드",
        estimatedHours: "12시간",
        requiredSkills: ["백엔드", "PDF 생성"]
      }
    ]
  },
  aiAnalysis: {
    insights: [
      {
        type: "strength" as const,
        icon: "💪",
        message: "AI 자동화 기능이 명확한 차별점으로 작용할 수 있습니다."
      },
      {
        type: "suggestion" as const,
        icon: "💡",
        message: "초기 사용자 확보를 위해 무료 체험 기간을 14일에서 30일로 연장하는 것을 권장합니다."
      },
      {
        type: "warning" as const,
        icon: "⚠️",
        message: "AI 처리 비용이 수익성에 영향을 줄 수 있으므로, 사용량 제한 정책을 고려해주세요."
      }
    ]
  }
};

export const DUMMY_REQUIREMENTS = {
  categories: [
    {
      category: "사용자 관리",
      majorCategory: "사용자 관리",
      subCategories: [
        {
          subcategory: "회원가입/로그인",
          subCategory: "회원가입/로그인",
          requirements: [
            {
              id: "REQ-001",
              title: "소셜 로그인 기능",
              description: "Google, 카카오, 네이버 계정을 통한 간편 로그인을 지원합니다.",
              priority: "high" as const,
              needsClarification: false,
              clarificationQuestions: [],
              status: "draft" as const
            },
            {
              id: "REQ-002",
              title: "이메일 인증",
              description: "회원가입 시 이메일 인증을 통한 계정 활성화 프로세스를 구현합니다.",
              priority: "high" as const,
              needsClarification: false,
              clarificationQuestions: [],
              status: "draft" as const
            },
            {
              id: "REQ-003",
              title: "비밀번호 재설정",
              description: "이메일을 통한 비밀번호 재설정 링크 발송 기능입니다.",
              priority: "medium" as const,
              needsClarification: false,
              clarificationQuestions: [],
              status: "draft" as const
            }
          ]
        },
        {
          subcategory: "프로필 관리",
          subCategory: "프로필 관리",
          requirements: [
            {
              id: "REQ-004",
              title: "프로필 정보 수정",
              description: "사용자 이름, 프로필 이미지, 연락처 등 개인정보를 수정할 수 있습니다.",
              priority: "medium" as const,
              needsClarification: false,
              clarificationQuestions: [],
              status: "draft" as const
            },
            {
              id: "REQ-005",
              title: "알림 설정",
              description: "이메일, 푸시 알림 등 알림 수신 여부를 설정합니다.",
              priority: "low" as const,
              needsClarification: true,
              clarificationQuestions: ["푸시 알림 서비스 제공업체 선정 필요"],
              status: "draft" as const
            }
          ]
        }
      ]
    },
    {
      category: "워크플로우 자동화",
      majorCategory: "워크플로우 자동화",
      subCategories: [
        {
          subcategory: "워크플로우 빌더",
          subCategory: "워크플로우 빌더",
          requirements: [
            {
              id: "REQ-006",
              title: "드래그 앤 드롭 편집기",
              description: "시각적인 워크플로우 편집기로 업무 흐름을 구성합니다.",
              priority: "high" as const,
              needsClarification: false,
              clarificationQuestions: [],
              status: "draft" as const
            },
            {
              id: "REQ-007",
              title: "조건 분기 처리",
              description: "IF-THEN-ELSE 형태의 조건부 워크플로우 분기를 지원합니다.",
              priority: "high" as const,
              needsClarification: true,
              clarificationQuestions: ["복잡한 조건식(AND/OR) 지원 범위 결정 필요"],
              status: "draft" as const
            },
            {
              id: "REQ-008",
              title: "템플릿 저장/불러오기",
              description: "자주 사용하는 워크플로우를 템플릿으로 저장하고 재사용합니다.",
              priority: "medium" as const,
              needsClarification: false,
              clarificationQuestions: [],
              status: "draft" as const
            }
          ]
        },
        {
          subcategory: "실행 및 모니터링",
          subCategory: "실행 및 모니터링",
          requirements: [
            {
              id: "REQ-009",
              title: "실시간 실행 로그",
              description: "워크플로우 실행 과정을 실시간으로 모니터링합니다.",
              priority: "medium" as const,
              needsClarification: false,
              clarificationQuestions: [],
              status: "draft" as const
            },
            {
              id: "REQ-010",
              title: "에러 알림 및 재시도",
              description: "실행 실패 시 알림을 발송하고 자동 재시도를 수행합니다.",
              priority: "high" as const,
              needsClarification: false,
              clarificationQuestions: [],
              status: "draft" as const
            }
          ]
        }
      ]
    },
    {
      category: "AI 문서 처리",
      majorCategory: "AI 문서 처리",
      subCategories: [
        {
          subcategory: "문서 분석",
          subCategory: "문서 분석",
          requirements: [
            {
              id: "REQ-011",
              title: "OCR 텍스트 추출",
              description: "이미지/PDF 문서에서 텍스트를 자동으로 추출합니다.",
              priority: "high" as const,
              needsClarification: false,
              clarificationQuestions: [],
              status: "draft" as const
            },
            {
              id: "REQ-012",
              title: "AI 카테고리 분류",
              description: "문서 내용을 분석하여 자동으로 카테고리를 분류합니다.",
              priority: "high" as const,
              needsClarification: true,
              clarificationQuestions: ["사용할 AI 모델 선정 필요 (GPT-4, Claude 등)"],
              status: "draft" as const
            },
            {
              id: "REQ-013",
              title: "핵심 정보 추출",
              description: "계약서, 영수증 등에서 주요 정보를 자동 추출합니다.",
              priority: "medium" as const,
              needsClarification: false,
              clarificationQuestions: [],
              status: "draft" as const
            }
          ]
        }
      ]
    },
    {
      category: "대시보드 및 리포트",
      majorCategory: "대시보드 및 리포트",
      subCategories: [
        {
          subcategory: "대시보드",
          subCategory: "대시보드",
          requirements: [
            {
              id: "REQ-014",
              title: "실시간 통계 대시보드",
              description: "업무 처리량, 성공률 등을 실시간 차트로 표시합니다.",
              priority: "medium" as const,
              needsClarification: false,
              clarificationQuestions: [],
              status: "draft" as const
            },
            {
              id: "REQ-015",
              title: "커스텀 위젯",
              description: "사용자가 원하는 정보를 위젯으로 추가/제거할 수 있습니다.",
              priority: "low" as const,
              needsClarification: false,
              clarificationQuestions: [],
              status: "draft" as const
            }
          ]
        },
        {
          subcategory: "리포트",
          subCategory: "리포트",
          requirements: [
            {
              id: "REQ-016",
              title: "PDF 리포트 생성",
              description: "기간별 업무 성과 리포트를 PDF로 다운로드합니다.",
              priority: "medium" as const,
              needsClarification: false,
              clarificationQuestions: [],
              status: "draft" as const
            },
            {
              id: "REQ-017",
              title: "Excel 데이터 내보내기",
              description: "상세 데이터를 Excel 형식으로 내보냅니다.",
              priority: "low" as const,
              needsClarification: false,
              clarificationQuestions: [],
              status: "draft" as const
            }
          ]
        }
      ]
    }
  ],
  nonFunctionalRequirements: [
    {
      id: "NFR-001",
      category: "성능",
      description: "메인 페이지 로딩 시간 3초 이내, API 응답 시간 500ms 이내",
      priority: "high" as const,
      metrics: "Lighthouse 성능 점수 90점 이상"
    },
    {
      id: "NFR-002",
      category: "보안",
      description: "모든 데이터 전송 시 HTTPS 적용, 민감 정보 AES-256 암호화",
      priority: "high" as const,
      metrics: "OWASP Top 10 취약점 0건"
    },
    {
      id: "NFR-003",
      category: "확장성",
      description: "동시 접속자 10,000명 처리 가능, 수평 확장 지원",
      priority: "medium" as const,
      metrics: "Auto-scaling 설정 완료"
    },
    {
      id: "NFR-004",
      category: "사용성",
      description: "모바일 반응형 지원, 웹 접근성 AA 등급 준수",
      priority: "medium" as const,
      metrics: "WCAG 2.1 AA 충족"
    },
    {
      id: "NFR-005",
      category: "유지보수성",
      description: "코드 커버리지 80% 이상, 문서화 완료",
      priority: "low" as const,
      metrics: "테스트 커버리지 리포트"
    }
  ],
  extractedAt: new Date().toISOString(),
  totalCount: 17,
  needsReview: true
};

export const DUMMY_CHAT_MESSAGES = [
  {
    id: "msg-1",
    type: "system" as const,
    content: "프로젝트를 시작합니다. 어떤 서비스를 만들고 싶으신가요?",
    icon: "🚀"
  },
  {
    id: "msg-2",
    type: "user" as const,
    content: "AI 기반 업무 자동화 플랫폼을 만들고 싶습니다. 반복적인 업무를 자동으로 처리해주는 SaaS 서비스입니다."
  },
  {
    id: "msg-3",
    type: "ai" as const,
    content: "좋은 아이디어네요! AI 업무 자동화 플랫폼에 대해 몇 가지 질문이 있습니다.\n\n1. 주요 타겟 고객은 누구인가요? (B2B/B2C)\n2. 어떤 종류의 업무를 자동화하고 싶으신가요?\n3. 경쟁 서비스 대비 차별점은 무엇인가요?"
  },
  {
    id: "msg-4",
    type: "user" as const,
    content: "타겟은 중소기업과 스타트업입니다. 문서 분류, 데이터 입력, 보고서 생성 같은 반복 업무를 자동화하려고 합니다. AI가 문서 내용을 이해하고 자동으로 처리하는 게 차별점입니다."
  },
  {
    id: "msg-5",
    type: "ai" as const,
    content: "명확한 방향이네요! 프로젝트 개요를 분석해보겠습니다.\n\n✅ **핵심 기능**으로 AI 문서 자동 분류, 워크플로우 자동화, 실시간 대시보드를 제안드립니다.\n\n✅ **기술 스택**은 Next.js + NestJS + PostgreSQL 조합이 적합해 보입니다.\n\n요구사항을 상세하게 정리해드릴까요?"
  }
];

export const DUMMY_WIREFRAME = {
  title: "메인 대시보드",
  description: "사용자가 로그인 후 처음 보는 메인 화면입니다.",
  components: [
    { id: "header", name: "상단 네비게이션", type: "navigation" },
    { id: "sidebar", name: "사이드바 메뉴", type: "navigation" },
    { id: "stats", name: "통계 카드 영역", type: "widget" },
    { id: "chart", name: "실시간 차트", type: "chart" },
    { id: "table", name: "최근 활동 테이블", type: "table" }
  ],
  mermaidCode: `graph TD
    A[사용자] --> B[로그인]
    B --> C[대시보드]
    C --> D[워크플로우]
    C --> E[문서 관리]
    C --> F[리포트]`
};

// 개발 모드 여부 확인
export const isDevelopmentMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  return process.env.NODE_ENV === 'development' &&
         localStorage.getItem('USE_DUMMY_DATA') === 'true';
};

// 개발 모드 토글
export const toggleDevelopmentMode = (enable: boolean): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('USE_DUMMY_DATA', enable ? 'true' : 'false');
  window.location.reload();
};

// 현재 개발 모드 상태 확인
export const getDevelopmentModeStatus = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('USE_DUMMY_DATA') === 'true';
};
