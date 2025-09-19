# Flowgence - AI Agent 기반 SI 전과정 자동화 서비스

## 📋 프로젝트 개요
AI agent를 활용한 SI 전과정 자동화 서비스의 Phase1 MVP 구현

### 핵심 기능
- 채팅 기반 프로젝트 개요 수집
- AI를 통한 요구사항 도출 및 정리
- 자동 견적서 생성
- 요구사항 및 견적서 마크다운 다운로드

## 🏗️ 기술 스택

### Frontend
- Next.js 14 (App Router)
- Tailwind CSS + shadcn/ui
- Zustand (상태 관리)
- TanStack Query (서버 상태)
- Vercel AI SDK (채팅)

### Backend
- NestJS (메인 API)
- FastAPI (AI 서비스)
- Socket.io (실시간 통신)
- BullMQ (작업 큐)

### Database
- Supabase (PostgreSQL)
- Redis (캐시/세션)

### AI/ML
- OpenAI API (GPT-4)
- LangChain
- Pinecone (벡터 검색)

### DevOps
- Docker + Docker Compose
- Vercel (프론트엔드 배포)
- Railway (백엔드 배포)

## 🚀 빠른 시작

### 1. 프로젝트 클론
```bash
git clone <repository-url>
cd flowgence-project
```

### 2. 환경 변수 설정
```bash
cp env.example .env
# .env 파일을 편집하여 필요한 값들을 설정
```

### 3. 모든 의존성 설치
```bash
npm run install:all
```

### 4. Docker로 개발 환경 실행 (권장)
```bash
# 전체 서비스 실행
npm run docker:up

# 또는 개별 서비스 실행
docker-compose up -d postgres redis
```

### 5. 개발 서버 실행
```bash
# 프론트엔드와 백엔드를 동시에 실행
npm run dev

# 또는 개별 실행
npm run dev:frontend  # 프론트엔드만
npm run dev:backend   # 백엔드만
```

### 6. 프로덕션 빌드 및 실행
```bash
# 빌드
npm run build

# 실행
npm run start
```

## 📁 프로젝트 구조

```
flowgence-project/
├── frontend/                 # Next.js 14 프론트엔드
│   ├── app/                 # App Router 페이지
│   ├── components/          # 재사용 가능한 컴포넌트
│   ├── lib/                 # 유틸리티 및 설정
│   └── stores/              # Zustand 스토어
├── backend/                 # NestJS 백엔드
│   ├── src/
│   │   ├── auth/           # 인증 모듈
│   │   ├── projects/       # 프로젝트 관리
│   │   ├── chat/           # 채팅 기능
│   │   ├── ai/             # AI 에이전트
│   │   └── common/         # 공통 모듈
│   └── test/
├── shared/                  # 공통 타입/인터페이스
├── docker-compose.yml      # 개발 환경
└── docs/                   # 문서
```

## 🔧 개발 가이드

### 프론트엔드 개발
```bash
cd frontend
npm run dev          # 개발 서버 실행
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 서버 실행
npm run lint         # ESLint 실행
```

### 백엔드 개발
```bash
cd backend
npm run start:dev    # 개발 서버 실행
npm run build        # 프로덕션 빌드
npm run start:prod   # 프로덕션 서버 실행
npm run test         # 테스트 실행
```

## 📝 API 문서
- Swagger UI: http://localhost:3001/api/docs
- GraphQL Playground: http://localhost:3001/graphql

## 🐳 Docker 명령어

```bash
# 전체 서비스 실행
docker-compose up -d

# 특정 서비스만 실행
docker-compose up -d frontend backend

# 로그 확인
docker-compose logs -f

# 서비스 재시작
docker-compose restart backend

# 전체 정리
docker-compose down -v
```

## 📊 모니터링
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Database: http://localhost:5432
- Redis: http://localhost:6379

## 🤝 기여하기
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스
이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.
