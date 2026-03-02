# 환경 변수 설정 가이드

## 📋 개요

프로젝트를 실행하기 위해 필요한 환경 변수를 설정하는 방법입니다.

---

## 📁 파일 위치

### 1. 백엔드 환경 변수
**파일 경로**: `backend/.env`

```bash
# backend 폴더에 .env 파일 생성
cd backend
touch .env  # 또는 직접 파일 생성
```

### 2. 프론트엔드 환경 변수
**파일 경로**: `frontend/.env.local`

```bash
# frontend 폴더에 .env.local 파일 생성
cd frontend
touch .env.local  # 또는 직접 파일 생성
```

---

## 🔧 백엔드 환경 변수 설정

### `backend/.env` 파일 생성

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/flowgence

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Notion OAuth Configuration
NOTION_CLIENT_ID=your_notion_client_id_here
NOTION_CLIENT_SECRET=your_notion_client_secret_here
NOTION_REDIRECT_URI=http://localhost:3001/notion/oauth/callback
NOTION_OAUTH_STATE_SECRET=your_random_secret_here_min_32_chars

# Frontend/Backend URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001

# Anthropic API (Claude)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Node Environment
NODE_ENV=development
```

### 주요 환경 변수 설명

#### 1. Notion OAuth 설정
- **NOTION_CLIENT_ID**: Notion OAuth 앱의 Client ID
- **NOTION_CLIENT_SECRET**: Notion OAuth 앱의 Client Secret
- **NOTION_REDIRECT_URI**: OAuth 콜백 URL (개발: `http://localhost:3001/notion/oauth/callback`)
- **NOTION_OAUTH_STATE_SECRET**: State 암호화용 랜덤 문자열 (최소 32자)

#### 2. 데이터베이스 설정
- **DATABASE_URL**: PostgreSQL 연결 문자열

#### 3. Supabase 설정
- **SUPABASE_URL**: Supabase 프로젝트 URL
- **SUPABASE_ANON_KEY**: Supabase Anon Key
- **SUPABASE_SERVICE_ROLE_KEY**: Supabase Service Role Key

#### 4. API 키
- **ANTHROPIC_API_KEY**: Claude API 키

---

## 🎨 프론트엔드 환경 변수 설정

### `frontend/.env.local` 파일 생성

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Notion Configuration (Optional - OAuth 사용 시 불필요)
# NEXT_PUBLIC_NOTION_API_KEY=secret_your_api_key_here
# NEXT_PUBLIC_NOTION_DATABASE_ID=your_database_id_here
```

### 주요 환경 변수 설명

#### 1. 백엔드 API URL
- **NEXT_PUBLIC_API_URL**: 백엔드 서버 URL (개발: `http://localhost:3001`)

#### 2. Supabase 설정
- **NEXT_PUBLIC_SUPABASE_URL**: Supabase 프로젝트 URL
- **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Supabase Anon Key

#### 3. Notion 설정 (선택사항)
- OAuth를 사용하는 경우 불필요합니다.
- OAuth를 사용하지 않는 경우에만 설정합니다.

---

## 🚀 설정 방법

### 1. 백엔드 환경 변수 설정

```bash
# backend 폴더로 이동
cd backend

# .env 파일 생성 (예시 파일 복사)
cp .env.example .env

# .env 파일 편집
# Windows: notepad .env
# Mac/Linux: nano .env 또는 vim .env
```

### 2. 프론트엔드 환경 변수 설정

```bash
# frontend 폴더로 이동
cd frontend

# .env.local 파일 생성 (예시 파일 복사)
cp .env.local.example .env.local

# .env.local 파일 편집
# Windows: notepad .env.local
# Mac/Linux: nano .env.local 또는 vim .env.local
```

### 3. 실제 값으로 교체

각 환경 변수의 `your_xxx_here` 부분을 실제 값으로 교체하세요.

---

## 🔐 Notion OAuth 설정 방법

### 1. Notion OAuth 앱 생성

1. [Notion 개발자 포털](https://www.notion.com/my-integrations) 접속
2. "New integration" 클릭
3. 통합 정보 입력:
   - **Name**: Flowgence Integration
   - **Associated workspace**: 선택
4. **OAuth** 탭에서:
   - **Redirect URIs**: 
     - 개발: `http://localhost:3001/notion/oauth/callback`
     - 프로덕션: `https://your-domain.com/notion/oauth/callback`
   - **Capabilities**: `Read content`, `Insert content`, `Update content` 선택
5. **OAuth client ID**와 **OAuth client secret** 복사

### 2. 환경 변수에 설정

```env
# backend/.env
NOTION_CLIENT_ID=복사한_client_id
NOTION_CLIENT_SECRET=복사한_client_secret
NOTION_REDIRECT_URI=http://localhost:3001/notion/oauth/callback
NOTION_OAUTH_STATE_SECRET=랜덤_문자열_32자_이상
```

---

## ⚠️ 주의사항

### 1. .gitignore 확인
- `.env`와 `.env.local` 파일은 `.gitignore`에 포함되어 있어 Git에 커밋되지 않습니다.
- 실제 값은 절대 Git에 커밋하지 마세요!

### 2. 프로덕션 환경
- 프로덕션 환경에서는 환경 변수를 서버 설정에서 관리하세요.
- Vercel: 프로젝트 설정 → Environment Variables
- Railway: 프로젝트 설정 → Variables
- Heroku: `heroku config:set KEY=value`

### 3. 보안
- 환경 변수에 실제 API 키와 비밀번호를 저장합니다.
- 절대 공개 저장소에 커밋하지 마세요!

---

## 📝 체크리스트

- [ ] `backend/.env` 파일 생성
- [ ] `frontend/.env.local` 파일 생성
- [ ] 모든 환경 변수 값 입력
- [ ] Notion OAuth 앱 생성 및 설정
- [ ] 서버 재시작 (환경 변수 변경 후 필수)

---

## 🔄 서버 재시작

환경 변수를 변경한 후에는 서버를 재시작해야 합니다:

```bash
# 백엔드 재시작
cd backend
npm run start:dev

# 프론트엔드 재시작
cd frontend
npm run dev
```

