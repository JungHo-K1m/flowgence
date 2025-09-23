# Flowgence - AI Agent 기반 SI 전과정 자동화 서비스

## 📋 프로젝트 개요

### **목표**

AI agent를 활용한 SI 전과정 자동화 서비스의 MVP Phase1 개발

### **Phase1 범위**

- **RFP Agent**: 요구사항 분석, 문서 DB화
- **견적/제안서 Agent**: 자동 견적 산출

### **핵심 기능**

1. 채팅 기반 프로젝트 개요 수집
2. AI 기반 요구사항 도출 및 정리
3. 자동 견적서 생성
4. 계약서 확인 및 승인

---

## 🎯 사용자 플로우

### **4단계 프로젝트 생성 플로우**

1. **프로젝트 개요 입력** (`/project/new`)

   - 텍스트 입력 또는 파일 업로드
   - 서비스 유형 선택 (음식 배달, 부동산 플랫폼, 업무 관리 도구, 온라인 교육, 쇼핑몰)
   - "시작하기" 버튼 클릭 시 좌측으로 채팅 UI 슬라이드

2. **요구사항 선택 + 대화** (`/project/new/requirements`)

   - 좌측: AI와의 실시간 채팅 인터페이스
   - 우측: 요구사항 카드 (카테고리별 정리)
   - 자연어 입력으로 요구사항 도출

3. **기능 구성** (`/project/new/confirmation`)

   - 확정 요구사항 탭
   - 상세 견적 탭
   - 프로젝트 요약 카드들 (총 요구사항, 프로젝트 유형, 예상 사용자, 프로젝트 기간)

4. **완료** (`/project/new/completion`)
   - 최종 견적서 확인
   - 계약서 확인
   - "최종 승인 및 계약" 버튼

---

## 🏗️ 기술 스택

### **Frontend (Next.js 14)**

```yaml
Framework: Next.js 14+ (App Router)
UI Library: Tailwind CSS + shadcn/ui
Animation: Framer Motion
State Management: Zustand
Server State: TanStack Query
AI SDK: Vercel AI SDK
Markdown: react-markdown
File Upload: react-dropzone
```

### **Backend (NestJS)**

```yaml
Framework: NestJS
AI Service: LangChain + OpenAI API
Database: PostgreSQL (Supabase)
Cache: Redis
Real-time: Socket.io
Queue: BullMQ
```

### **AI/LLM Layer**

```yaml
LLM: OpenAI GPT-4, Anthropic Claude
Framework: LangChain
Vector DB: Pinecone (향후)
Document Processing: Unstructured.io (향후)
```

### **Infrastructure**

```yaml
Development: Docker Compose
Database: Supabase PostgreSQL
File Storage: AWS S3 / Cloudflare R2 (향후)
Deployment: Vercel (Frontend) + Railway (Backend)
```

---

## 📁 프로젝트 구조

### **전체 구조**

```
flowgence/
├── frontend/                 # Next.js 14 프론트엔드
├── backend/                  # NestJS 백엔드
├── database/                 # 데이터베이스 스키마
├── docker-compose.yml        # 개발 환경 설정
└── env.example              # 환경변수 템플릿
```

### **Frontend 구조**

```
frontend/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx           # 루트 레이아웃 (고정 헤더)
│   │   ├── page.tsx             # 홈페이지
│   │   ├── project/             # 프로젝트 관련 페이지
│   │   │   ├── new/             # 새 프로젝트 생성 (4단계)
│   │   │   │   ├── page.tsx     # 1단계: 프로젝트 개요
│   │   │   │   ├── loading.tsx  # 로딩 UI
│   │   │   │   ├── requirements/ # 2단계: 요구사항 + 대화
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── confirmation/ # 3단계: 기능 구성
│   │   │   │   │   └── page.tsx
│   │   │   │   └── completion/   # 4단계: 완료
│   │   │   │       └── page.tsx
│   │   │   ├── [id]/            # 기존 프로젝트 관리
│   │   │   │   ├── layout.tsx   # 프로젝트 레이아웃
│   │   │   │   ├── page.tsx     # 프로젝트 대시보드
│   │   │   │   ├── overview/    # 프로젝트 개요
│   │   │   │   ├── requirements/ # 요구사항 관리
│   │   │   │   ├── estimation/  # 견적 관리
│   │   │   │   └── contract/    # 계약 관리
│   │   │   └── layout.tsx       # 프로젝트 레이아웃
│   │   ├── auth/                # 인증 관련
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── signup/
│   │   │       └── page.tsx
│   │   └── api/                 # API 라우트
│   │       ├── auth/
│   │       │   └── route.ts
│   │       ├── chat/
│   │       │   └── route.ts
│   │       └── projects/
│   │           └── route.ts
│   ├── components/              # 재사용 컴포넌트
│   │   ├── layout/              # 레이아웃 컴포넌트
│   │   │   ├── Header.tsx
│   │   │   ├── Navigation.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── chat/                # 채팅 UI 컴포넌트
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── TypingIndicator.tsx
│   │   │   └── ChatInput.tsx
│   │   ├── project/             # 프로젝트 관련 컴포넌트
│   │   │   ├── ProjectInput.tsx
│   │   │   ├── RequirementCard.tsx
│   │   │   ├── ProjectSummary.tsx
│   │   │   ├── EstimationCard.tsx
│   │   │   ├── FileUpload.tsx
│   │   │   └── ServiceTypeButtons.tsx
│   │   ├── providers/           # 컨텍스트 프로바이더
│   │   │   ├── AuthProvider.tsx
│   │   │   └── ChatProvider.tsx
│   │   └── ui/                  # shadcn/ui 컴포넌트
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── input.tsx
│   │       ├── select.tsx
│   │       └── textarea.tsx
│   ├── hooks/                   # 커스텀 훅
│   │   ├── useAuth.ts
│   │   ├── useChat.ts
│   │   ├── useProject.ts
│   │   └── useFileUpload.ts
│   ├── stores/                  # Zustand 상태 관리
│   │   ├── projectStore.ts
│   │   ├── chatStore.ts
│   │   └── authStore.ts
│   ├── types/                   # TypeScript 타입
│   │   ├── index.ts
│   │   ├── project.ts
│   │   ├── chat.ts
│   │   └── auth.ts
│   ├── lib/                     # 유틸리티 및 설정
│   │   ├── utils.ts
│   │   ├── supabase.ts
│   │   ├── openai.ts
│   │   └── constants.ts
│   ├── styles/                  # 추가 스타일
│   │   ├── globals.css
│   │   └── components.css
│   └── assets/                  # 정적 자산 (향후 확장)
├── public/                      # 정적 파일
│   ├── images/                  # 이미지 파일
│   │   └── flowgence-logo.png   # Flowgence 로고
│   ├── favicon.ico              # 파비콘
│   ├── next.svg                 # Next.js 로고
│   ├── vercel.svg               # Vercel 로고
│   ├── file.svg                 # 파일 아이콘
│   ├── globe.svg                # 글로브 아이콘
│   └── window.svg               # 윈도우 아이콘
├── package.json                 # 의존성 관리
├── next.config.ts               # Next.js 설정
├── tailwind.config.ts           # Tailwind CSS 설정
├── tsconfig.json                # TypeScript 설정
├── components.json              # shadcn/ui 설정
├── eslint.config.mjs            # ESLint 설정
├── postcss.config.mjs           # PostCSS 설정
└── README.md                    # 프로젝트 문서
```

### **Backend 구조**

```
backend/
├── src/
│   ├── main.ts                  # 애플리케이션 진입점
│   ├── app.module.ts            # 루트 모듈
│   ├── app.controller.ts        # 루트 컨트롤러
│   ├── app.service.ts           # 루트 서비스
│   ├── app.controller.spec.ts   # 루트 컨트롤러 테스트
│   ├── config/                  # 설정 파일
│   │   └── database.config.ts   # 데이터베이스 설정
│   └── entities/                # 데이터베이스 엔티티
│       ├── user.entity.ts       # 사용자 엔티티
│       ├── project.entity.ts    # 프로젝트 엔티티
│       ├── chat-message.entity.ts # 채팅 메시지 엔티티
│       ├── requirement.entity.ts # 요구사항 엔티티
│       ├── estimation.entity.ts  # 견적 엔티티
│       └── file.entity.ts       # 파일 엔티티
├── test/                       # 테스트 파일
│   ├── app.e2e-spec.ts         # E2E 테스트
│   └── jest-e2e.json           # Jest E2E 설정
├── package.json                # 의존성 관리
├── package-lock.json           # 의존성 락 파일
├── tsconfig.json               # TypeScript 설정
├── tsconfig.build.json         # TypeScript 빌드 설정
├── nest-cli.json               # NestJS CLI 설정
├── eslint.config.mjs           # ESLint 설정
├── .prettierrc                 # Prettier 설정
├── Dockerfile                  # Docker 설정
└── README.md                   # 프로젝트 문서
```

---

## 🎨 UI/UX 특징

### **디자인 시스템**

- **색상**: 파란색 (#6366F1) 메인 컬러, 회색 톤 보조
- **레이아웃**: 좌우 분할 (채팅 UI + 사이드바)
- **애니메이션**: Framer Motion으로 부드러운 전환 효과

### **반응형 디자인**

- 데스크톱: 좌우 분할 레이아웃
- 모바일: 세로 스택 레이아웃

### **접근성**

- 키보드 네비게이션 지원
- 스크린 리더 호환
- 고대비 모드 지원

---

## 🗄️ 데이터베이스 설계

### **핵심 테이블**

- **profiles**: 사용자 정보 (Supabase Auth 연동)
- **projects**: 프로젝트 정보
- **chat_messages**: AI 채팅 메시지
- **requirements**: 요구사항 상세 정보
- **estimations**: 견적 정보
- **files**: 업로드된 파일 정보

### **주요 특징**

- PostgreSQL + JSONB 지원
- Row Level Security (RLS) 적용
- UUID 기반 Primary Key
- 자동 타임스탬프 관리

---

## 🚀 배포 및 개발 환경

### **개발 환경**

```bash
# 전체 프로젝트 실행
npm run dev

# 개별 서비스 실행
npm run dev:frontend    # 프론트엔드만
npm run dev:backend     # 백엔드만

# Docker 환경
docker-compose up -d
```

### **배포 환경**

- **Frontend**: Vercel (자동 배포)
- **Backend**: Railway / AWS
- **Database**: Supabase (관리형 PostgreSQL)
- **Domain**: Custom Domain 설정

---

## 📊 개발 진행 상황

### **완료된 작업**

- ✅ 프로젝트 초기 설정
- ✅ Next.js 15 + TypeScript 환경 구축 (Frontend)
- ✅ NestJS + TypeScript 환경 구축 (Backend)
- ✅ Tailwind CSS + shadcn/ui 설정
- ✅ Supabase 클라이언트 설정 (@supabase/ssr 패키지)
- ✅ 디렉토리 구조 생성 (Frontend & Backend 완전한 구조)
- ✅ 빈 파일들 생성 (모든 컴포넌트, 페이지, 훅, 스토어)
- ✅ API 라우트 구조 생성 (Frontend)
- ✅ 데이터베이스 엔티티 구조 생성 (Backend)
- ✅ 이미지 디렉토리 구조 설정
- ✅ Git 설정 최적화 (.gitignore 수정)
- ✅ Flowgence 로고 이미지 추가
- ✅ **메인 페이지 UI 구현 완료**
  - 공용 헤더 컴포넌트 (로고, 네비게이션)
  - 통합된 입력 필드 + 시작하기 버튼 (760px 반응형)
  - 서비스 타입 선택 버튼들 (5개)
  - 파일 업로드 드래그 앤 드롭 영역
  - 반응형 디자인 (데스크톱/모바일 대응)
- ✅ **프로젝트 생성 플로우 UI 구현 완료**
  - 슬라이드 애니메이션 (좌측 채팅 UI, 우측 프로젝트 개요)
  - 프로그레스바 (4단계 표시, 연결선 포함)
  - 채팅 인터페이스 (실시간 메시지 순서, 너비 최적화)
  - 프로젝트 개요 패널 (탭 구조, AI 분석 섹션)
  - 레이아웃 최적화 (메시지 영역만 스크롤, 입력/버튼 고정)
- ✅ **채팅 UI 고도화 완료**
  - 타이핑 인디케이터 (AI 응답 대기 중 애니메이션)
  - 메시지 말풍선 색상 통일 (#EAEBFA AI, #FFFFFF 사용자)
  - 동적 너비 조정 (짧은 텍스트는 작게, 긴 텍스트는 최대 60% 너비)
  - 줄바꿈 최적화 (break-words로 긴 단어 처리)
  - 사용자 아이콘 위치 최적화 (말풍선 오른쪽)
- ✅ **사용자 인증 시스템 완성**
  - 로그인/회원가입 페이지 구현 (이메일/비밀번호)
  - Supabase Auth 연동 완료
  - 사용자 프로필 자동 생성 (트리거 함수)
  - 인증 상태 관리 (useAuth 훅)
  - 헤더에 로그인/로그아웃 상태 표시
- ✅ **역할 기반 접근 제어 시스템 구현**
  - 3단계 역할 시스템 (admin, user, client)
  - 권한 기반 접근 제어 (PERMISSIONS 객체)
  - 역할 체크 훅 (useRole)
  - 가드 컴포넌트 (RoleGuard, AdminOnly, UserOnly, ClientOnly)
  - 관리자 전용 페이지 (/admin)
  - 헤더에 관리자 링크 조건부 표시
- ✅ **로그인 안내 및 상태 유지 시스템 구현**
  - 로그인 안내 모달 (LoginRequiredModal)
  - 상태 유지 훅 (useStatePersistence)
  - 인증 가드 훅 (useAuthGuard)
  - 로그인 후 자동 상태 복원 및 페이지 이동
  - 프로젝트 개요 단계는 로그인 체크 없이 자유롭게 진행
- ✅ **요구사항 편집 모달 시스템 구현**
  - AI 추천 요구사항 패널 (AIRecommendationsPanel)
  - 요구사항 관리 패널 (RequirementManagementPanel)
  - 인라인 편집 기능 (InlineEditInput)
  - 새 요구사항 추가 모달 (AddRequirementModal)
  - 삭제 확인 모달 (DeleteConfirmModal)
  - 전체 화면 모달 (SimpleRequirementModal)
- ✅ **3단계 기능 구성 페이지 구현**
  - 확정 요구사항 탭 (요구사항 요약, 상세 내역 테이블)
  - 상세 견적 탭 (견적 요약, 단계별 내역, 지불 조건, 프로젝트 개요)
  - 전체 화면 레이아웃 (채팅 UI 완전 제거)
  - 단계별 UI 분리 로직 (각 단계에서 해당 UI만 표시)
- ✅ **4단계 요구사항 결과 페이지 구현**
  - 최종 확인 모달 (견적 요청 진행 확인)
  - 요구사항 결과 페이지 (RequirementsResultPanel)
  - 좌측 네비게이션 탭 (개요, 범위, 기능/비기능 요구사항, 화면 목록, 데이터 모델)
  - 문서 다운로드 및 Notion 공유 기능
  - 섹션별 스크롤 네비게이션 및 검색 기능
  - 완전한 UI 분리 (채팅 UI 완전 제거, 하단 네비게이션 버튼 제거)
- ✅ **실시간 AI 채팅 기능 구현 완료**
  - OpenAI Claude API 연동 및 실제 AI 응답 구현
  - 실시간 프로젝트 개요 업데이트 (JSON 파싱 및 UI 반영)
  - 대화 히스토리 기반 컨텍스트 유지
  - 중복 API 요청 방지 시스템 구현
  - 에러 처리 및 폴백 메커니즘 구현

- ✅ **요구사항 추출 및 관리 시스템 구현 완료**
  - AI 기반 요구사항 자동 추출 및 계층적 분류 (대분류/중분류/소분류)
  - 프로젝트 개요에서 요구사항 관리로 자동 전환 시스템
  - 실시간 요구사항 추출 API (`/api/chat` - `requirements_extraction` 타입)
  - 구조화된 JSON 응답 형식 (categories, subCategories, requirements)
  - `needsClarification` 플래그를 통한 명확화 필요 요구사항 식별
  - "결정이 필요한 요구사항" 전용 섹션 UI 구현

- ✅ **요구사항 편집 UI 및 DB 저장 시스템 구현 완료**
  - 편집 모달에서 실시간 DB 저장 기능 (낙관적 업데이트)
  - 저장 상태 표시 (저장 중/완료/실패) 및 사용자 피드백
  - 프로젝트 ID 추적을 통한 정확한 데이터 저장
  - 카테고리 제목 변경 및 소분류 요구사항 CRUD 기능
  - 우선순위 태그 제거로 깔끔한 UI 구성

- ✅ **Supabase 데이터베이스 연동 완료**
  - PostgreSQL 함수 구현 (`save_requirements_dual`, `save_project_with_messages`)
  - JSONB 필드와 정규화 테이블 동시 저장 시스템
  - Row Level Security (RLS) 정책 적용
  - 프로젝트 데이터, 채팅 메시지, 요구사항 통합 저장
  - 로그인 시 임시 상태 자동 DB 이전 시스템

### **진행 중인 작업**

- 🔄 백엔드 API 연동 (NestJS)
- 🔄 견적서 자동 생성 시스템

### **아직 구현되지 않은 핵심 기능**

- ❌ **백엔드 API 서버 구성**: NestJS 서버가 실제로 동작하지 않음
- ❌ **견적서 자동 생성**: AI 기반 견적 산출 시스템 미구현
- ❌ **파일 업로드 처리**: 드래그 앤 드롭은 UI만 구현, 실제 업로드 미구현
- ❌ **PDF 내보내기**: 요구사항 문서 PDF 생성 기능 미구현

### **예정된 작업 (우선순위별)**

#### **🔥 최우선 작업 (MVP 완성을 위해 필수)**

- 📋 **백엔드 API 서버 구동**: NestJS 서버 실제 동작 및 포트 설정
- 📋 **견적서 자동 생성 시스템**: AI 기반 견적 산출 및 PDF 생성
- 📋 **파일 업로드 처리**: 실제 파일 저장 및 관리 시스템

#### **📋 2차 우선순위 (핵심 기능 완성)**

- 📋 PDF 내보내기 기능 구현 (요구사항 문서)
- 📋 Notion 공유 기능 구현
- 📋 드래그 앤 드롭 기능 구현 (AI 추천 → 요구사항 추가)
- 📋 프로젝트 히스토리 관리 시스템

#### **📋 3차 우선순위 (고도화 기능)**

- 📋 계약서 생성 시스템
- 📋 실시간 알림 시스템
- 📋 사용자 관리 기능 (관리자 페이지 확장)
- 📋 프로젝트 템플릿 시스템
- 📋 다국어 지원 (i18n)

---

## 🔄 **단계별 페이지 전환 로직**

### **페이지 상태 관리**

```typescript
// 주요 상태 변수
const [showChatInterface, setShowChatInterface] = useState(false);
const [showRequirements, setShowRequirements] = useState(false);
const [showConfirmation, setShowConfirmation] = useState(false);
const [showFinalResult, setShowFinalResult] = useState(false);
const [showFinalModal, setShowFinalModal] = useState(false);
const [currentStep, setCurrentStep] = useState(1);
```

### **단계별 UI 표시 조건**

#### **1단계: 프로젝트 개요**

- **조건**: `!showChatInterface && !showRequirements && !showConfirmation && !showFinalResult`
- **표시 요소**: 초기 랜딩 페이지 (입력 필드, 서비스 타입 버튼, 파일 업로드)
- **네비게이션**: "시작하기" → 2단계로 이동

#### **2단계: 요구사항 선택 + 대화**

- **조건**: `showChatInterface && showRequirements`
- **표시 요소**:
  - 프로그레스 바
  - 좌측: 채팅 인터페이스 (1/3 너비)
  - 우측: 요구사항 패널 (2/3 너비)
- **네비게이션**: "다음 단계" → 로그인 체크 → 3단계로 이동

#### **3단계: 기능 구성**

- **조건**: `showConfirmation`
- **표시 요소**:
  - 프로그레스 바
  - 전체 화면: ConfirmationPanel (채팅 UI 완전 제거)
  - 탭: "확정 요구사항" / "상세 견적"
- **네비게이션**: "이전 단계" → 2단계로 복귀, "최종 승인 및 계약" → 4단계로 이동

#### **4단계: 요구사항 결과**

- **조건**: `showFinalResult`
- **표시 요소**:
  - 프로그레스 바
  - 전체 화면: RequirementsResultPanel (채팅 UI 완전 제거)
  - 좌측: 네비게이션 탭 (개요, 범위, 기능/비기능 요구사항, 화면 목록, 데이터 모델)
  - 우측: 섹션별 콘텐츠 및 검색 기능
  - 상단: PDF 내보내기, Notion 공유 버튼
- **네비게이션**: 하단 네비게이션 버튼 제거 (최종 단계)

### **상태 전환 로직**

```typescript
// 1단계 → 2단계
const handleStart = () => {
  setShowChatInterface(true);
  setCurrentStep(1);
};

// 2단계 → 3단계
const handleNextStep = () => {
  if (currentStep === 2) {
    requireAuth(() => {
      setShowRequirements(false);
      setShowConfirmation(true);
      setCurrentStep(3);
    }, currentProjectData);
  }
};

// 3단계 → 4단계 (최종 확인 모달)
const handleNextStep = () => {
  if (currentStep === 3) {
    setShowFinalModal(true); // 최종 확인 모달 표시
  }
};

// 최종 확인 후 4단계로 이동
const handleFinalConfirm = () => {
  setShowFinalModal(false);
  setShowConfirmation(false);
  setShowFinalResult(true);
  setCurrentStep(4);
};

// 3단계 → 2단계 (뒤로가기)
const handlePrevStep = () => {
  if (currentStep === 3) {
    setShowConfirmation(false);
    setShowRequirements(true);
    setCurrentStep(2);
  } else if (currentStep === 4) {
    setShowFinalResult(false);
    setShowConfirmation(true);
    setCurrentStep(3);
  }
};
```

### **로그인 상태 유지**

- **상태 저장**: `useStatePersistence` 훅으로 프로젝트 데이터 저장
- **자동 복원**: 로그인 후 저장된 상태와 targetStep으로 자동 이동
- **URL 파라미터**: `?step=2` 또는 `?step=3`으로 직접 단계 이동 지원

---

## 🔧 개발 가이드

### **시작하기**

1. 환경변수 설정 (`.env.local` 파일 생성)
2. 의존성 설치: `npm install`
3. 개발 서버 실행: `npm run dev`

### **이미지 관리**

```bash
# 이미지 파일 추가
git add public/images/

# 커밋 및 푸시
git commit -m "Add image files"
git push origin main
```

### **Git 설정**

- `.gitignore`에서 `public/uploads/`만 제외하고 `frontend/public/images/`는 포함
- 이미지 파일은 정상적으로 `git add` 명령어로 추가 가능

### **코딩 컨벤션**

- TypeScript 엄격 모드 사용
- ESLint + Prettier 설정
- 컴포넌트는 함수형 컴포넌트 사용
- 상태 관리는 Zustand 활용

### **Git 워크플로우**

- `main`: 프로덕션 브랜치
- `develop`: 개발 브랜치
- `feature/*`: 기능 개발 브랜치
- `hotfix/*`: 긴급 수정 브랜치

---

## 📝 추가 정보

### **프로젝트 목표**

- Phase1 MVP 완성 (6주 목표)
- 사용자 피드백 수집 및 개선
- Phase2 확장 계획 (12주 목표)

### **기술적 도전과제**

#### **🔥 현재 가장 시급한 과제**

- **백엔드-프론트엔드 연동**: NestJS API 서버와 Next.js 프론트엔드 간 데이터 통신
- **실제 데이터베이스 연동**: Supabase 스키마를 활용한 CRUD 작업 구현
- **AI 서비스 통합**: OpenAI API를 활용한 실제 채팅 기능 구현

#### **📋 향후 도전과제**

- AI 응답 품질 최적화
- 실시간 채팅 성능 최적화
- 견적 정확도 향상
- 사용자 경험 개선
- 파일 업로드 및 처리 최적화

### **향후 확장 계획**

- 와이어프레임 자동 생성
- 더 많은 AI Agent 추가
- 마이크로서비스 아키텍처 도입
- 국제화 (i18n) 지원

---

_마지막 업데이트: 2025-09-24 (요구사항 추출 시스템 및 DB 저장 기능 구현 완료)_

---

## 📋 최근 업데이트 내역

### **2025-09-24**

- ✅ **실시간 AI 채팅 기능 구현 완료**
  - OpenAI Claude API 연동 및 실제 AI 응답 구현
  - 실시간 프로젝트 개요 업데이트 (JSON 파싱 및 UI 반영)
  - 대화 히스토리 기반 컨텍스트 유지 시스템 구현
  - 중복 API 요청 방지 시스템 구현 (useRef 기반 해시 비교)
  - 에러 처리 및 폴백 메커니즘 구현
  - JSON 응답 파싱 로직 강화 (마크다운 코드 블록 처리)
  - 실시간 UI 업데이트 최적화 (useCallback 및 상태 관리)

- ✅ **요구사항 추출 시스템 구현 완료**
  - AI 기반 요구사항 자동 추출 및 계층적 분류 (대분류/중분류/소분류)
  - 프로젝트 개요에서 요구사항 관리로 자동 전환 시스템
  - 실시간 요구사항 추출 API (`/api/chat` - `requirements_extraction` 타입)
  - 구조화된 JSON 응답 형식 (categories, subCategories, requirements)
  - `needsClarification` 플래그를 통한 명확화 필요 요구사항 식별
  - `clarificationQuestions` 배열로 구체적인 질문 제공

- ✅ **요구사항 편집 UI 및 DB 저장 시스템 구현 완료**
  - 편집 모달에서 실시간 DB 저장 기능 (낙관적 업데이트)
  - 저장 상태 표시 (저장 중/완료/실패) 및 사용자 피드백
  - 프로젝트 ID 추적을 통한 정확한 데이터 저장
  - 카테고리 제목 변경 및 소분류 요구사항 CRUD 기능
  - "결정이 필요한 요구사항" 전용 섹션 UI 구현
  - 우선순위 태그 제거로 깔끔한 UI 구성

- ✅ **Supabase 데이터베이스 연동 완료**
  - PostgreSQL 함수 구현 (`save_requirements_dual`, `save_project_with_messages`)
  - JSONB 필드와 정규화 테이블 동시 저장 시스템
  - Row Level Security (RLS) 정책 적용
  - 프로젝트 데이터, 채팅 메시지, 요구사항 통합 저장
  - 로그인 시 임시 상태 자동 DB 이전 시스템

### **2025-09-24**

- ✅ **로그인 안내 및 상태 유지 시스템 구현**
  - 로그인 안내 모달 (LoginRequiredModal) 구현
  - 상태 유지 훅 (useStatePersistence) 구현
  - 인증 가드 훅 (useAuthGuard) 구현
  - 로그인 후 자동 상태 복원 및 페이지 이동 기능
  - 프로젝트 개요 단계는 로그인 체크 없이 자유롭게 진행하도록 최적화
- ✅ **요구사항 편집 모달 시스템 구현**
  - AI 추천 요구사항 패널 (AIRecommendationsPanel) 구현
  - 요구사항 관리 패널 (RequirementManagementPanel) 구현
  - 인라인 편집 기능 (InlineEditInput) 구현
  - 새 요구사항 추가 모달 (AddRequirementModal) 구현
  - 삭제 확인 모달 (DeleteConfirmModal) 구현
  - 전체 화면 모달 (SimpleRequirementModal) 구현
  - 모달을 최상위 레벨로 이동하여 전체 화면 표시 보장
- ✅ **3단계 기능 구성 페이지 구현**
  - ConfirmationPanel 컴포넌트 생성
  - 확정 요구사항 탭 구현 (요구사항 요약, 상세 내역 테이블)
  - 상세 견적 탭 구현 (견적 요약, 단계별 내역, 지불 조건, 프로젝트 개요)
  - 전체 화면 레이아웃 (채팅 UI 완전 제거)
  - 단계별 UI 분리 로직 구현 (각 단계에서 해당 UI만 표시)
  - 페이지 네비게이션 로직 업데이트 (2단계 ↔ 3단계 이동)
- ✅ **4단계 요구사항 결과 페이지 구현**
  - FinalConfirmationModal 컴포넌트 생성 (최종 확인 모달)
  - RequirementsResultPanel 컴포넌트 생성 (요구사항 결과 페이지)
  - 좌측 네비게이션 탭 구현 (6개 섹션: 개요, 범위, 기능/비기능 요구사항, 화면 목록, 데이터 모델)
  - 섹션별 스크롤 네비게이션 및 검색 기능 구현
  - PDF 내보내기 및 Notion 공유 버튼 구현 (기능 준비 완료)
  - 완전한 UI 분리 로직 구현 (채팅 UI 완전 제거, 하단 네비게이션 버튼 제거)
  - 4단계 완료로 전체 프로젝트 생성 플로우 완성

### **2025-09-24**

- ✅ Supabase 패키지 최신화 (@supabase/ssr 적용)
- ✅ 완전한 Frontend 디렉토리 구조 생성 (모든 컴포넌트, 페이지, 훅, 스토어)
- ✅ 완전한 Backend 디렉토리 구조 생성 (모든 엔티티, 설정, 테스트 파일)
- ✅ API 라우트 구조 생성 (auth, chat, projects)
- ✅ 데이터베이스 엔티티 구조 생성 (user, project, chat-message, requirement, estimation, file)
- ✅ 이미지 디렉토리 구조 완성
- ✅ Git 설정 최적화 (.gitignore 수정)
- ✅ Flowgence 로고 이미지 추가
- ✅ 프로젝트 구조 문서화 완료 (Frontend & Backend 실제 디렉토리와 일치)
- ✅ **메인 페이지 UI 구현 완료**
  - Header 컴포넌트 (로고 + 네비게이션)
  - 통합된 입력 필드 (760px 반응형)
  - 서비스 타입 버튼들 (5개 카테고리)
  - 파일 업로드 드래그 앤 드롭
  - react-dropzone 패키지 연동
- ✅ **프로젝트 생성 플로우 UI 완성**
  - 슬라이드 애니메이션 (좌측 채팅, 우측 개요)
  - 프로그레스바 (4단계, 연결선, 색상 통일 #6366F1)
  - 채팅 인터페이스 (실시간 메시지 순서, 너비 최적화)
  - 프로젝트 개요 패널 (탭 구조, AI 분석)
  - 레이아웃 최적화 (스크롤 영역 분리, 고정 요소)
  - 색상 통일 (#6366F1 메인 컬러 적용)
- ✅ **채팅 UI 고도화 완성**
  - 타이핑 인디케이터 구현 (AI 응답 대기 중 bounce 애니메이션)
  - 메시지 말풍선 색상 체계 구축 (#EAEBFA AI, #FFFFFF 사용자, #E5E7EB 테두리)
  - 동적 너비 시스템 (짧은 텍스트는 내용에 맞게, 긴 텍스트는 최대 60% 너비)
  - 줄바꿈 최적화 (break-words로 긴 단어 자동 줄바꿈)
  - 사용자 아이콘 위치 개선 (말풍선 오른쪽 정렬)
  - TypeScript 타입 안정성 확보 (Message 인터페이스 통합)
- ✅ **사용자 인증 시스템 완성**
  - 로그인/회원가입 페이지 구현 (이메일/비밀번호)
  - Supabase Auth 연동 완료
  - 사용자 프로필 자동 생성 (트리거 함수)
  - 인증 상태 관리 (useAuth 훅)
  - 헤더에 로그인/로그아웃 상태 표시
- ✅ **역할 기반 접근 제어 시스템 구현**
  - 3단계 역할 시스템 (admin, user, client)
  - 권한 기반 접근 제어 (PERMISSIONS 객체)
  - 역할 체크 훅 (useRole)
  - 가드 컴포넌트 (RoleGuard, AdminOnly, UserOnly, ClientOnly)
  - 관리자 전용 페이지 (/admin)
  - 헤더에 관리자 링크 조건부 표시

---

## 📊 **현재 상태 요약**

**완성도**: 약 **85%** (UI/UX + AI 서비스 + DB 연동 중심)

- ✅ UI/UX: **100% 완료** (모든 페이지와 컴포넌트 구현 완료)
- ✅ 프로젝트 구조: **100% 완료**
- ✅ 데이터베이스 설계: **100% 완료** (스키마 + 실제 연동 완료)
- ✅ 사용자 인증 시스템: **100% 완료** (Supabase Auth 연동)
- ✅ 역할 기반 접근 제어: **100% 완료**
- ✅ 로그인 안내 및 상태 유지: **100% 완료**
- ✅ 요구사항 편집 모달: **100% 완료**
- ✅ 3단계 기능 구성 페이지: **100% 완료**
- ✅ 4단계 요구사항 결과 페이지: **100% 완료**
- ✅ 완전한 프로젝트 생성 플로우: **100% 완료** (1단계 → 4단계)
- ✅ AI 서비스: **95% 완료** (실시간 채팅, 프로젝트 개요, 요구사항 추출 구현)
- ✅ 프론트엔드 데이터 연동: **90% 완료** (AI 응답 기반 실시간 업데이트 + DB 저장)
- ✅ 요구사항 추출 시스템: **100% 완료** (AI 기반 자동 추출 및 계층적 분류)
- ✅ 데이터베이스 연동: **90% 완료** (프로젝트, 채팅, 요구사항 저장/편집)
- ❌ 백엔드 API: **20% 완료** (구조만, 실제 동작 없음)
- ❌ 실제 비즈니스 로직: **60% 완료**

**핵심 이슈**: **UI/UX, 프로젝트 생성 플로우, AI 서비스, 데이터베이스 연동이 거의 완성되었습니다**. 사용자가 실제로 AI와 대화하며 프로젝트를 구성하고, 요구사항을 추출하고 편집할 수 있으며, 모든 데이터가 Supabase에 저장됩니다. 이제 백엔드 API 서버 구동과 견적서 생성 기능이 남은 주요 작업입니다.

---

## 🤖 **AI 구현 고려사항**

### **1단계: 실시간 프로젝트 개요 추출**

#### **A. 실시간 UI 업데이트 가능성**

- ✅ **구현 완료**: 구조화된 JSON 응답으로 실시간 업데이트 구현
- **구현 방식**:
  - 전체 대화 히스토리를 Claude API에 전송
  - AI가 프로젝트 개요를 JSON 형식으로 추출하여 응답
  - 프론트엔드에서 JSON 파싱 후 UI 실시간 업데이트
  - 중복 요청 방지 시스템으로 성능 최적화
- **응답 형식**:
  ```json
  {
    "serviceCoreElements": {
      "title": "프로젝트 제목",
      "description": "프로젝트 설명",
      "keyFeatures": ["핵심 기능1", "핵심 기능2"],
      "targetUsers": ["타겟 사용자1", "타겟 사용자2"]
    },
    "userJourney": {
      "steps": [
        {
          "step": 1,
          "title": "단계 제목",
          "description": "단계 설명",
          "userAction": "사용자 행동",
          "systemResponse": "시스템 응답"
        }
      ]
    }
  }
  ```

#### **B. UI에 적합한 응답 형식**

- ✅ **구현 가능**: JSON 스키마로 통일된 응답 구조
- **구현 방식**:
  - AI 응답을 구조화된 JSON 형식으로 통일
  - `confidence` 필드로 AI 응답의 신뢰도 표시
  - `needsUserInput` 플래그로 사용자 입력 필요 여부 표시
- **응답 형식**:
  ```json
  {
    "type": "project_overview",
    "data": {
      /* 프로젝트 개요 데이터 */
    },
    "confidence": 0.85,
    "needsUserInput": true,
    "userInputPrompt": "추가로 필요한 정보가 있다면 여기에 표시"
  }
  ```

### **2단계: 요구사항 추출 및 분류**

#### **A. 1단계 대화 기반 요구사항 추출**

- ✅ **구현 가능**: 전체 대화 히스토리 기반으로 요구사항 추출
- **구현 방식**:
  - 1단계에서 2단계로 넘어갈 때 전체 대화 히스토리 분석
  - AI가 요구사항을 추출하고 대/중/소분류로 자동 분류
  - 각 요구사항의 우선순위와 사용자 입력 필요 여부 판단
- **응답 형식**:
  ```json
  {
    "requirements": [
      {
        "category": "대분류",
        "subcategory": "중분류",
        "requirements": [
          {
            "title": "소분류 제목",
            "description": "상세 설명",
            "priority": "high|medium|low",
            "needsClarification": true,
            "clarificationQuestions": ["구체적인 질문1", "구체적인 질문2"]
          }
        ]
      }
    ]
  }
  ```

#### **B. 세분화된 요구사항 분류**

- ✅ **구현 가능**: 대/중/소분류 구조로 체계적 분류
- **구현 방식**:
  - 대분류: 인증, 결제, 관리자, 사용자 관리 등
  - 중분류: 로그인, 회원가입, 비밀번호 찾기 등
  - 소분류: 이메일/비밀번호 로그인, OAuth 로그인 등
- **구조 예시**:
  ```typescript
  interface RequirementStructure {
    category: string; // 대분류 (예: 인증)
    subcategory: string; // 중분류 (예: 로그인)
    requirements: Array<{
      title: string; // 소분류 (예: 이메일/비밀번호 로그인)
      description: string;
      priority: "high" | "medium" | "low";
      needsClarification: boolean;
      clarificationQuestions: string[];
    }>;
  }
  ```

#### **C. 사용자 입력 필요한 사항 표시**

- ✅ **구현 가능**: `needsClarification` 플래그와 질문 리스트로 관리
- **구현 방식**:
  - AI가 요구사항 분석 시 사용자 입력이 필요한 부분 자동 감지
  - 구체적인 질문과 선택 가능한 옵션들을 자동 생성
  - 사용자가 답변하지 않은 항목들을 명확히 표시
- **구조 예시**:
  ```typescript
  interface ClarificationItem {
    id: string;
    category: string;
    question: string;
    options: string[]; // AI가 생성한 선택 가능한 옵션들
    required: boolean;
    userAnswer?: string;
  }
  ```

### **토큰 사용량 최적화 전략**

#### **초기 구현 방식**

- **전체 히스토리 전송**: 매번 전체 대화 히스토리를 OpenAI API에 전송
- **비용 모니터링**: 토큰 사용량 추적 및 비용 분석
- **임계점 설정**: 월 $100 이상 사용 시 최적화 방안 적용

#### **향후 최적화 방안**

- **슬라이딩 윈도우**: 최근 N개 메시지만 유지 (예: 최근 10개)
- **프로젝트 요약**: 핵심 정보만 압축하여 전송
- **하이브리드 접근**: 요약 + 최근 메시지 조합
- **예상 비용 절약**: 85% 이상 토큰 사용량 감소 가능

### **구현 우선순위**

#### **🔥 1차 우선순위 (MVP 완성)**

1. ✅ **실시간 프로젝트 개요 추출**: 1단계에서 화면 우측 실시간 업데이트 (완료)
2. 📋 **요구사항 추출**: 1단계 → 2단계 전환 시 요구사항 자동 추출
3. 📋 **기본 분류**: 대/중/소분류 구조로 요구사항 정리

#### **📋 2차 우선순위 (사용자 경험 개선)**

1. **사용자 입력 필요 사항 표시**: 명확한 질문과 옵션 제공
2. **세분화된 요구사항 분류**: 더 정교한 카테고리 분류
3. **토큰 사용량 모니터링**: 비용 추적 및 최적화 준비

#### **📋 3차 우선순위 (성능 최적화)**

1. **토큰 사용량 최적화**: 슬라이딩 윈도우 방식 적용
2. **프로젝트 요약 시스템**: 핵심 정보 압축 전송
3. **캐싱 시스템**: 반복적인 요청 최적화
