# Flowgence - AI Agent 기반 SI 전과정 자동화 서비스

[![Vercel](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://flowgence-frontend.vercel.app)
[![Railway](https://img.shields.io/badge/Backend-Railway-purple?logo=railway)](https://scintillating-empathy-production.up.railway.app)
[![Supabase](https://img.shields.io/badge/Database-Supabase-green?logo=supabase)](https://supabase.com)

## 📋 프로젝트 개요

AI agent를 활용한 SI 전과정 자동화 서비스의 **MVP Phase1** 개발 프로젝트입니다.

### 🎯 목표
RFP(제안요청서) 분석부터 견적 산출까지, SI 프로젝트의 초기 단계를 AI로 자동화합니다.

### 📊 현재 완성도: **99.9%**

- ✅ **전체 UI/UX**: 100% 완료
- ✅ **AI 채팅 시스템**: 100% 완료 (Claude API 연동)
- ✅ **요구사항 추출**: 100% 완료 (AI 기반 자동 분류)
- ✅ **데이터베이스 연동**: 100% 완료 (Supabase)
- ✅ **사용자 인증**: 100% 완료 (역할 기반 접근 제어)
- ✅ **클라우드 배포**: 100% 완료 (Vercel + Railway)
- 🔄 **견적서 자동 생성**: 30% 완료 (진행 중)

### 🌟 핵심 기능

#### **4단계 프로젝트 생성 플로우**

1. **프로젝트 개요 입력** - 텍스트/파일 업로드, 서비스 유형 선택
2. **요구사항 선택 + 대화** - AI 채팅을 통한 실시간 요구사항 도출
3. **기능 구성** - 확정 요구사항 및 상세 견적 확인
4. **완료** - 최종 견적서 및 계약서 확인

#### **AI 기능**

- 🤖 **실시간 AI 채팅**: Claude API 기반 자연어 대화
- 📊 **프로젝트 개요 자동 생성**: 대화 내용 기반 구조화
- 📋 **요구사항 자동 추출**: 대/중/소분류 계층적 분류
- 🔄 **실시간 업데이트**: 채팅을 통한 요구사항 동적 수정
- ✏️ **인라인 편집**: 즉시 편집 가능한 요구사항 관리

## 🏗️ 기술 스택

### **Frontend** (Vercel 배포)
```yaml
Framework: Next.js 14+ (App Router)
UI Library: Tailwind CSS + shadcn/ui
Animation: Framer Motion
State: Zustand + TanStack Query
AI SDK: Vercel AI SDK
Auth: Supabase Auth
```

### **Backend** (Railway 배포)
```yaml
Framework: NestJS
AI Service: Claude API (Anthropic)
Database: PostgreSQL (Supabase)
ORM: TypeORM
Validation: class-validator
```

### **Database** (Supabase)
```yaml
Database: PostgreSQL
Features: Row Level Security (RLS)
Auth: Supabase Auth
Storage: 향후 파일 업로드용
```

### **AI/LLM**
```yaml
LLM: Anthropic Claude (claude-sonnet-4-20250514)
Framework: 직접 API 호출
Vector DB: Pinecone (향후)
```

### **Infrastructure**
```yaml
Frontend: Vercel
Backend: Railway
Database: Supabase PostgreSQL
Development: Docker Compose
```

## 🌐 배포 환경

### **Production URLs**
- 🌍 **Frontend**: https://flowgence-frontend.vercel.app
- ⚡ **Backend**: https://scintillating-empathy-production.up.railway.app
- 🗄️ **Database**: Supabase (https://biouwhfczktkfdkfxpxt.supabase.co)

### **배포 아키텍처**
```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Vercel    │ ───▶ │   Railway   │ ───▶ │  Supabase   │
│  (Frontend) │      │  (Backend)  │      │  (Database) │
│  Next.js 14 │      │   NestJS    │      │ PostgreSQL  │
└─────────────┘      └─────────────┘      └─────────────┘
       │                    │
       │                    │
       ▼                    ▼
   사용자 인증         Claude API
 (Supabase Auth)    (AI 처리)

## 🚀 빠른 시작

### **1. 저장소 클론**

```bash
# 팀 레포지토리 클론
git clone https://github.com/Mevitz/flowgence.git
cd flowgence

# 또는 개인 레포지토리 클론
git clone https://github.com/JungHo-K1m/flowgence.git
cd flowgence
```

### **2. 환경 변수 설정**

#### **Frontend 환경변수** (`frontend/.env.local`)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

#### **Backend 환경변수** (`backend/.env`)
```bash
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
DATABASE_URL=your_database_url

# AI
ANTHROPIC_API_KEY=your_anthropic_api_key

# Server
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### **3. 의존성 설치**

```bash
# 루트 디렉토리에서 전체 설치
npm install

# 또는 개별 설치
cd frontend && npm install
cd ../backend && npm install
```

### **4. 개발 서버 실행**

#### **Option A: 루트에서 동시 실행** (추천)
```bash
# 루트 디렉토리에서
npm run dev

# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

#### **Option B: 개별 실행**
```bash
# 터미널 1: Frontend
cd frontend
npm run dev

# 터미널 2: Backend
cd backend
npm run start:dev
```

### **5. 접속 확인**

- 🌍 **Frontend**: http://localhost:3000
- ⚡ **Backend API**: http://localhost:3001/api/health
- 📚 **API Docs**: http://localhost:3001/api (향후 Swagger 추가 예정)

## 📁 프로젝트 구조

```
flowgence/
├── frontend/                      # Next.js 14 Frontend
│   ├── src/
│   │   ├── app/                  # App Router 페이지
│   │   │   ├── page.tsx          # 메인 페이지
│   │   │   ├── project/          # 프로젝트 관련 페이지
│   │   │   │   └── new/          # 새 프로젝트 생성 (4단계)
│   │   │   ├── auth/             # 로그인/회원가입
│   │   │   ├── mypage/           # 마이페이지
│   │   │   └── api/              # API Routes
│   │   ├── components/           # React 컴포넌트
│   │   │   ├── chat/             # 채팅 UI
│   │   │   ├── requirements/     # 요구사항 관리
│   │   │   ├── project/          # 프로젝트 관련
│   │   │   └── ui/               # shadcn/ui 컴포넌트
│   │   ├── hooks/                # Custom Hooks
│   │   ├── lib/                  # 유틸리티
│   │   ├── stores/               # Zustand 스토어
│   │   └── types/                # TypeScript 타입
│   └── public/                   # 정적 파일
│
├── backend/                       # NestJS Backend
│   ├── src/
│   │   ├── main.ts               # 진입점
│   │   ├── app.module.ts         # 루트 모듈
│   │   ├── config/               # 설정 파일
│   │   ├── entities/             # TypeORM 엔티티
│   │   ├── projects/             # 프로젝트 모듈
│   │   ├── chat/                 # 채팅 모듈
│   │   └── supabase/             # Supabase 서비스
│   ├── dist/                     # 빌드 결과물
│   └── test/                     # 테스트 파일
│
├── database/                      # 데이터베이스 스크립트
│   ├── schema.sql                # 기본 스키마
│   └── *.sql                     # 마이그레이션 파일
│
├── shared/                        # 공통 타입/인터페이스
│   └── types/
│
├── docker-compose.yml            # 개발 환경
├── PROJECT_OVERVIEW.md           # 상세 프로젝트 문서
└── README.md                     # 이 파일
```

## 🔧 개발 가이드

### **Frontend 개발**
```bash
cd frontend

# 개발 서버
npm run dev          # http://localhost:3000

# 빌드
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 서버

# 코드 품질
npm run lint         # ESLint 실행
npm run format       # Prettier 실행
```

### **Backend 개발**
```bash
cd backend

# 개발 서버
npm run start:dev    # http://localhost:3001

# 빌드
npm run build        # 프로덕션 빌드
npm run start:prod   # 프로덕션 서버

# 테스트
npm run test         # 단위 테스트
npm run test:e2e     # E2E 테스트
```

### **데이터베이스 작업**
```bash
# Supabase CLI 사용 (선택사항)
npx supabase db reset        # 스키마 리셋
npx supabase db push         # 스키마 푸시
npx supabase migration new   # 새 마이그레이션
```

## 📝 주요 API 엔드포인트

### **Chat API**
```bash
POST /api/chat
- 프로젝트 개요 생성
- 요구사항 추출
- 요구사항 업데이트
```

### **Projects API**
```bash
GET    /api/projects           # 프로젝트 목록
POST   /api/projects           # 프로젝트 생성
GET    /api/projects/:id       # 프로젝트 조회
PATCH  /api/projects/:id       # 프로젝트 수정
DELETE /api/projects/:id       # 프로젝트 삭제
```

### **Health Check**
```bash
GET /api/health               # 백엔드 상태 확인
```

> 📚 **상세 API 문서**: `PROJECT_OVERVIEW.md` 참조

## 🎨 코딩 컨벤션

### **Commit Message**
```bash
feat: 새 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 리팩토링
test: 테스트 추가
chore: 기타 작업

# 예시
feat: AI 기반 견적서 생성 기능 추가
fix: 채팅 스크롤 버그 수정
docs: README 업데이트
```

### **Branch Strategy**
```bash
main                    # 프로덕션 브랜치
feature/기능명          # 새 기능
fix/버그명              # 버그 수정
hotfix/긴급수정         # 긴급 수정

# 예시
feature/estimation-auto-generation
fix/chat-scroll-issue
```

## 📊 모니터링 & 로그

### **로컬 개발**
- 🌍 Frontend: http://localhost:3000
- ⚡ Backend: http://localhost:3001
- 🗄️ Database: Supabase 대시보드

### **프로덕션**
- 🌍 Frontend: Vercel 대시보드
- ⚡ Backend: Railway 대시보드
- 🗄️ Database: Supabase 대시보드

### **로그 확인**
```bash
# Railway 로그
railway logs

# Vercel 로그
vercel logs
```

## 👥 팀 & 기여하기

### **팀 레포지토리**
- 🏢 Organization: [Mevitz](https://github.com/Mevitz)
- 📦 Repository: [flowgence](https://github.com/Mevitz/flowgence)

### **기여 방법**

1. **이슈 생성**
   ```bash
   GitHub Issues에서 버그/기능 요청 등록
   ```

2. **브랜치 생성**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **변경사항 커밋**
   ```bash
   git commit -m "feat: 멋진 기능 추가"
   ```

4. **푸시**
   ```bash
   git push origin feature/amazing-feature
   ```

5. **Pull Request 생성**
   ```bash
   GitHub에서 PR 생성 및 리뷰 요청
   ```

### **코드 리뷰 가이드라인**
- ✅ 코드 스타일 준수
- ✅ 테스트 통과
- ✅ 의미 있는 커밋 메시지
- ✅ 문서 업데이트 (필요시)

## 📄 라이선스 & 문서

### **라이선스**
이 프로젝트는 MIT 라이선스를 따릅니다.

### **추가 문서**
- 📖 **상세 문서**: [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)
- 🚀 **배포 가이드**: PROJECT_OVERVIEW.md 참조
- 🔧 **기술 스택 상세**: PROJECT_OVERVIEW.md 참조

---

**마지막 업데이트**: 2025-10-01
**프로젝트 완성도**: 99.9%
**다음 단계**: AI 기반 견적서 자동 생성 기능 완성

---

<div align="center">
  Made with ❤️ by Flowgence Team
</div>
