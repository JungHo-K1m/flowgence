# Notion OAuth 404 에러 해결 가이드

## 🔴 문제

Notion OAuth 콜백 시 404 에러 발생:
```
Cannot GET /notion/oauth/callback
```

## 🔍 원인

백엔드가 `/api` prefix를 사용하지만, Notion OAuth redirect_uri가 `/api`를 포함하지 않음.

### 백엔드 설정
```typescript
// backend/src/main.ts
app.setGlobalPrefix('api');
```

따라서 실제 경로는:
- ✅ `/api/notion/oauth/callback` (올바름)
- ❌ `/notion/oauth/callback` (404 에러)

## ✅ 해결 방법

### 1. Notion OAuth 앱 Redirect URI 수정

1. [Notion 개발자 포털](https://www.notion.com/my-integrations) 접속
2. "Flowgence Integration" 앱 선택
3. **OAuth** 탭 클릭
4. **Redirect URIs** 섹션에서 URL 수정:

**변경 전:**
```
https://scintillating-empathy-production.up.railway.app/notion/oauth/callback
```

**변경 후:**
```
https://scintillating-empathy-production.up.railway.app/api/notion/oauth/callback
```

### 2. Railway 환경 변수 수정

Railway 환경 변수 `NOTION_REDIRECT_URI`도 수정:

**변경 전:**
```env
NOTION_REDIRECT_URI=https://scintillating-empathy-production.up.railway.app/notion/oauth/callback
```

**변경 후:**
```env
NOTION_REDIRECT_URI=https://scintillating-empathy-production.up.railway.app/api/notion/oauth/callback
```

### 3. 개발 환경 설정 (로컬)

로컬 개발 환경도 동일하게 수정:

**backend/.env:**
```env
NOTION_REDIRECT_URI=http://localhost:3001/api/notion/oauth/callback
```

## 📝 확인 체크리스트

- [ ] Notion OAuth 앱의 Redirect URI에 `/api` prefix 추가
- [ ] Railway 환경 변수 `NOTION_REDIRECT_URI`에 `/api` prefix 추가
- [ ] 로컬 `.env` 파일에도 `/api` prefix 추가 (개발 시)
- [ ] Railway 서버 재시작 (환경 변수 변경 후)
- [ ] 다시 OAuth 인증 시도

## 🔍 경로 확인

### 백엔드 실제 경로
```
/api/notion/oauth/authorize    (OAuth 시작)
/api/notion/oauth/callback     (OAuth 콜백) ← 이 경로로 설정해야 함
/api/notion/connection         (연결 정보 조회)
/api/notion/share/requirements (요구사항 공유)
```

### Notion OAuth 앱 설정
```
Redirect URI: https://scintillating-empathy-production.up.railway.app/api/notion/oauth/callback
```

## ⚠️ 중요 사항

1. **정확한 경로**: `/api` prefix를 반드시 포함해야 합니다.
2. **대소문자**: URL은 대소문자를 구분합니다.
3. **슬래시**: 마지막에 `/` 없이 설정합니다.
4. **프로토콜**: `https://` 필수 (프로덕션)

## 🚀 수정 후 테스트

1. Notion OAuth 앱에서 Redirect URI 저장
2. Railway 환경 변수 업데이트
3. Railway 서버 재시작
4. 다시 "Notion 계정 연결하기" 클릭
5. Notion 인증 후 콜백이 정상적으로 처리되는지 확인

