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
frontend/src/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # 루트 레이아웃 (고정 헤더)
│   ├── page.tsx             # 홈페이지
│   ├── project/             # 프로젝트 관련 페이지
│   │   ├── new/             # 새 프로젝트 생성 (4단계)
│   │   │   ├── page.tsx     # 1단계: 프로젝트 개요
│   │   │   ├── requirements/ # 2단계: 요구사항 + 대화
│   │   │   ├── confirmation/ # 3단계: 기능 구성
│   │   │   └── completion/   # 4단계: 완료
│   │   └── [id]/            # 기존 프로젝트 관리
│   ├── auth/                # 인증 관련
│   └── api/                 # API 라우트
├── components/              # 재사용 컴포넌트
│   ├── layout/              # 레이아웃 컴포넌트
│   ├── chat/                # 채팅 UI 컴포넌트
│   ├── project/             # 프로젝트 관련 컴포넌트
│   └── ui/                  # shadcn/ui 컴포넌트
├── hooks/                   # 커스텀 훅
├── stores/                  # Zustand 상태 관리
├── types/                   # TypeScript 타입
└── lib/                     # 유틸리티 및 설정
```

### **Backend 구조**

```
backend/src/
├── app.module.ts            # 루트 모듈
├── entities/                # 데이터베이스 엔티티
│   ├── user.entity.ts
│   ├── project.entity.ts
│   ├── chat-message.entity.ts
│   ├── requirement.entity.ts
│   └── estimation.entity.ts
├── config/                  # 설정 파일
└── main.ts                  # 애플리케이션 진입점
```

---

## 🎨 UI/UX 특징

### **디자인 시스템**

- **색상**: 파란색 (#3B82F6) 메인 컬러, 회색 톤 보조
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
- ✅ Next.js 14 + TypeScript 환경 구축
- ✅ Tailwind CSS + shadcn/ui 설정
- ✅ Supabase 클라이언트 설정
- ✅ 디렉토리 구조 생성
- ✅ 빈 파일들 생성

### **진행 중인 작업**

- 🔄 기본 컴포넌트 구현
- 🔄 페이지 구조 설계

### **예정된 작업**

- 📋 홈페이지 구현
- 📋 프로젝트 개요 입력 페이지
- 📋 채팅 UI 구현
- 📋 요구사항 관리 페이지
- 📋 견적서 생성 페이지
- 📋 백엔드 API 구현
- 📋 AI 서비스 연동

---

## 🔧 개발 가이드

### **시작하기**

1. 환경변수 설정 (`.env.local` 파일 생성)
2. 의존성 설치: `npm install`
3. 개발 서버 실행: `npm run dev`

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

- AI 응답 품질 최적화
- 실시간 채팅 성능 최적화
- 견적 정확도 향상
- 사용자 경험 개선

### **향후 확장 계획**

- 와이어프레임 자동 생성
- 더 많은 AI Agent 추가
- 마이크로서비스 아키텍처 도입
- 국제화 (i18n) 지원

---

_마지막 업데이트: 2025-09-20_
