# Notion 환경 변수 배포 가이드

## 📋 개요

Notion OAuth 관련 환경 변수를 Vercel과 Railway에 설정하는 방법입니다.

---

## 🏗️ 아키텍처

```
┌─────────────┐         ┌─────────────┐
│   Vercel    │────────▶│   Railway   │
│  (Frontend) │         │  (Backend)  │
│  Next.js    │         │   NestJS    │
└─────────────┘         └─────────────┘
      │                        │
      │                        │
      ▼                        ▼
┌─────────────┐         ┌─────────────┐
│  Supabase   │         │   Notion    │
│   (Auth)    │         │    OAuth    │
└─────────────┘         └─────────────┘
```

---

## 🔧 Railway (백엔드) 환경 변수

### 설정 위치
**Railway 프로젝트 → Variables 탭**

### 설정할 환경 변수

```env
# Notion OAuth Configuration
NOTION_CLIENT_ID=your_notion_client_id_here
NOTION_CLIENT_SECRET=your_notion_client_secret_here
NOTION_REDIRECT_URI=https://your-railway-domain.up.railway.app/notion/oauth/callback
NOTION_OAUTH_STATE_SECRET=your_random_secret_here_min_32_chars

# Frontend/Backend URLs
FRONTEND_URL=https://your-vercel-domain.vercel.app
BACKEND_URL=https://your-railway-domain.up.railway.app

# Database Configuration
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Anthropic API (Claude)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Node Environment
NODE_ENV=production
```

### Railway 설정 방법

1. **Railway 프로젝트 접속**
   - https://railway.app 접속
   - 프로젝트 선택

2. **Variables 탭 클릭**
   - 좌측 메뉴에서 "Variables" 클릭

3. **환경 변수 추가**
   - "New Variable" 버튼 클릭
   - Key와 Value 입력
   - 각 환경 변수별로 반복

4. **중요: NOTION_REDIRECT_URI 설정**
   ```
   NOTION_REDIRECT_URI=https://your-railway-domain.up.railway.app/notion/oauth/callback
   ```
   - Railway 도메인을 실제 도메인으로 변경
   - 예: `https://scintillating-empathy-production.up.railway.app/notion/oauth/callback`

---

## 🎨 Vercel (프론트엔드) 환경 변수

### 설정 위치
**Vercel 프로젝트 → Settings → Environment Variables**

### 설정할 환경 변수

```env
# Backend API URL
NEXT_PUBLIC_API_URL=https://your-railway-domain.up.railway.app

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Vercel 설정 방법

1. **Vercel 프로젝트 접속**
   - https://vercel.com 접속
   - 프로젝트 선택

2. **Settings → Environment Variables**
   - 좌측 메뉴에서 "Settings" 클릭
   - "Environment Variables" 섹션 클릭

3. **환경 변수 추가**
   - "Add New" 버튼 클릭
   - Key와 Value 입력
   - Environment 선택 (Production, Preview, Development)
   - 각 환경 변수별로 반복

4. **중요: NEXT_PUBLIC_API_URL 설정**
   ```
   NEXT_PUBLIC_API_URL=https://your-railway-domain.up.railway.app
   ```
   - Railway 백엔드 도메인을 실제 도메인으로 변경
   - 예: `https://scintillating-empathy-production.up.railway.app`

---

## 🔐 Notion OAuth 앱 설정

### Redirect URI 설정

Notion 개발자 포털에서 OAuth 앱을 생성할 때, **Railway 백엔드 URL**을 Redirect URI로 설정해야 합니다:

```
https://your-railway-domain.up.railway.app/notion/oauth/callback
```

### 설정 방법

1. [Notion 개발자 포털](https://www.notion.com/my-integrations) 접속
2. OAuth 앱 선택 또는 생성
3. **OAuth** 탭 클릭
4. **Redirect URIs** 섹션에서:
   - 개발: `http://localhost:3001/notion/oauth/callback`
   - 프로덕션: `https://your-railway-domain.up.railway.app/notion/oauth/callback`
5. **Capabilities** 선택:
   - ✅ Read content
   - ✅ Insert content
   - ✅ Update content
6. **OAuth client ID**와 **OAuth client secret** 복사
7. Railway 환경 변수에 설정

---

## 📊 환경 변수 분류

### Railway (백엔드)에만 설정
- ✅ `NOTION_CLIENT_ID`
- ✅ `NOTION_CLIENT_SECRET`
- ✅ `NOTION_REDIRECT_URI`
- ✅ `NOTION_OAUTH_STATE_SECRET`
- ✅ `DATABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `ANTHROPIC_API_KEY`
- ✅ `FRONTEND_URL`
- ✅ `BACKEND_URL`

### Vercel (프론트엔드)에만 설정
- ✅ `NEXT_PUBLIC_API_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 공통 (둘 다 설정)
- ❌ 없음 (분리되어 있음)

---

## ⚠️ 중요 사항

### 1. NOTION_REDIRECT_URI
- **Railway 백엔드 URL**을 사용해야 합니다
- Vercel 프론트엔드 URL이 아닙니다!
- 예: `https://your-railway-domain.up.railway.app/notion/oauth/callback`

### 2. NEXT_PUBLIC_API_URL
- **Railway 백엔드 URL**을 사용해야 합니다
- 프론트엔드에서 백엔드 API를 호출하기 위함
- 예: `https://your-railway-domain.up.railway.app`

### 3. 환경 변수 변경 후
- Railway: 자동 재배포 (변경 사항 즉시 반영)
- Vercel: 자동 재배포 또는 수동 재배포 필요

### 4. 보안
- `NOTION_CLIENT_SECRET`은 절대 프론트엔드에 노출하지 마세요
- 백엔드에서만 사용하는 환경 변수는 `NEXT_PUBLIC_` 접두사를 사용하지 마세요

---

## 🔄 배포 후 확인

### 1. Railway 백엔드 확인
```bash
# Railway 로그 확인
# OAuth 인증이 정상적으로 작동하는지 확인
```

### 2. Vercel 프론트엔드 확인
```bash
# 브라우저 콘솔에서 확인
# NEXT_PUBLIC_API_URL이 올바르게 설정되었는지 확인
console.log(process.env.NEXT_PUBLIC_API_URL);
```

### 3. Notion OAuth 테스트
1. 프론트엔드에서 "Notion으로 공유" 버튼 클릭
2. Notion OAuth 인증 페이지로 리디렉션되는지 확인
3. 인증 후 Railway 콜백 URL로 리디렉션되는지 확인
4. 연결 성공 후 프론트엔드로 리디렉션되는지 확인

---

## 📝 체크리스트

### Railway 설정
- [ ] `NOTION_CLIENT_ID` 설정
- [ ] `NOTION_CLIENT_SECRET` 설정
- [ ] `NOTION_REDIRECT_URI` 설정 (Railway 도메인)
- [ ] `NOTION_OAUTH_STATE_SECRET` 설정
- [ ] `FRONTEND_URL` 설정 (Vercel 도메인)
- [ ] `BACKEND_URL` 설정 (Railway 도메인)
- [ ] 기타 백엔드 환경 변수 설정

### Vercel 설정
- [ ] `NEXT_PUBLIC_API_URL` 설정 (Railway 도메인)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` 설정
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정

### Notion OAuth 앱 설정
- [ ] OAuth 앱 생성
- [ ] Redirect URI 설정 (Railway 도메인)
- [ ] Capabilities 선택
- [ ] Client ID와 Secret 복사

---

## 🆘 문제 해결

### OAuth 인증 실패
- Railway `NOTION_REDIRECT_URI`가 Notion OAuth 앱의 Redirect URI와 일치하는지 확인
- Railway 도메인이 올바른지 확인

### API 호출 실패
- Vercel `NEXT_PUBLIC_API_URL`이 Railway 도메인과 일치하는지 확인
- Railway 백엔드가 정상적으로 실행 중인지 확인

### 환경 변수 미적용
- 환경 변수 변경 후 재배포 확인
- 브라우저 캐시 클리어
- 서버 재시작 확인

