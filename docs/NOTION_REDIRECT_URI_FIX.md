# Notion Redirect URI 설정 오류 해결 가이드

## 🔴 문제

Notion OAuth 인증 시 다음 에러 발생:
```
redirect_uri가 유효하지 않거나 누락되었습니다.
```

## 🔍 원인

Notion OAuth 앱의 **Redirect URIs** 설정에 백엔드 콜백 URL이 등록되지 않았거나 정확히 일치하지 않음.

## ✅ 해결 방법

### 1. Notion OAuth 앱 설정 확인

1. [Notion 개발자 포털](https://www.notion.com/my-integrations) 접속
2. "Flowgence Integration" 앱 선택
3. **OAuth** 탭 클릭
4. **Redirect URIs** 섹션 확인

### 2. Redirect URI 추가

**Railway 백엔드 URL**을 정확히 추가해야 합니다 (⚠️ `/api` prefix 필수):

```
https://scintillating-empathy-production.up.railway.app/api/notion/oauth/callback
```

**중요 사항:**
- ✅ 정확한 URL (대소문자 구분)
- ✅ `https://` 프로토콜 필수
- ✅ 마지막에 `/` 없이
- ✅ 경로: `/api/notion/oauth/callback` (⚠️ `/api` prefix 필수)

### 3. 여러 환경 설정 (선택사항)

개발 환경과 프로덕션 환경을 모두 사용하는 경우:

```
# 개발 환경
http://localhost:3001/api/notion/oauth/callback

# 프로덕션 환경
https://scintillating-empathy-production.up.railway.app/api/notion/oauth/callback
```

### 4. 환경 변수 확인

Railway 환경 변수에서 `NOTION_REDIRECT_URI`가 올바르게 설정되어 있는지 확인:

```env
NOTION_REDIRECT_URI=https://scintillating-empathy-production.up.railway.app/api/notion/oauth/callback
```

### 5. 설정 후 재시도

1. Notion OAuth 앱에서 Redirect URI 저장
2. Railway 환경 변수 확인
3. Railway 서버 재시작 (필요 시)
4. 다시 OAuth 인증 시도

## 🔍 확인 체크리스트

- [ ] Notion OAuth 앱의 Redirect URIs에 Railway URL 추가
- [ ] URL이 정확히 일치하는지 확인 (대소문자, 슬래시 포함)
- [ ] Railway 환경 변수 `NOTION_REDIRECT_URI` 확인
- [ ] Railway 서버 재시작
- [ ] 다시 OAuth 인증 시도

## ⚠️ 주의사항

1. **URL 정확성**: Notion은 URL을 정확히 비교하므로, 작은 차이도 에러를 발생시킵니다.
   - ❌ `https://.../notion/oauth/callback/` (마지막 슬래시)
   - ✅ `https://.../notion/oauth/callback` (슬래시 없음)

2. **프로토콜**: `https://` 필수 (프로덕션)

3. **도메인 변경**: Railway 도메인이 변경되면 Notion 설정도 업데이트 필요

## 📝 현재 설정 확인

**⚠️ 중요: 백엔드가 `/api` prefix를 사용하므로, 경로에 `/api`를 포함해야 합니다!**

올바른 URL:
```
https://scintillating-empathy-production.up.railway.app/api/notion/oauth/callback
```

이 URL이 Notion OAuth 앱의 Redirect URIs에 정확히 등록되어 있어야 합니다.

