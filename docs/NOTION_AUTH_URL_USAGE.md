# Notion 인증 URL 사용 가이드

## 📋 개요

Notion 통합 설정 페이지에 표시되는 "인증 URL"이 어디에 사용되는지 설명합니다.

---

## 🔍 인증 URL이란?

이미지에 표시된 인증 URL:
```
https://api.notion.com/v1/oauth/authorize?client_id=2aed872b-594c-804e-9afc-0037584...
```

이것은 **Notion OAuth 인증을 시작하기 위한 URL**입니다.

---

## 🔄 실제 사용 플로우

### 1. Notion 설정 페이지의 인증 URL
- **용도**: 참고용 템플릿 URL
- **위치**: Notion 개발자 포털의 통합 설정 페이지
- **설명**: 이 URL은 Notion이 제공하는 기본 템플릿입니다. 실제로는 우리 백엔드에서 동적으로 생성합니다.

### 2. 실제 사용 위치

#### Step 1: 사용자가 "Notion 계정 연결하기" 클릭
```
프론트엔드 (Vercel)
  ↓
frontend/src/lib/notionOAuth.ts
  ↓
startNotionOAuth() 함수 호출
```

#### Step 2: 백엔드 API 호출
```typescript
// frontend/src/lib/notionOAuth.ts
export async function startNotionOAuth(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/notion/oauth/authorize`, {
    method: 'GET',
    credentials: 'include',
    redirect: 'follow',
  });
  // ...
}
```

#### Step 3: 백엔드에서 인증 URL 생성
```typescript
// backend/src/notion/notion.controller.ts
@Get('oauth/authorize')
async authorize(@Res() res: Response, @Req() req: Request) {
  const redirectUrl = await this.notionService.getAuthorizationUrl(userId);
  return res.redirect(redirectUrl); // ← 여기서 인증 URL로 리디렉션
}
```

#### Step 4: 동적 인증 URL 생성
```typescript
// backend/src/notion/notion.service.ts
async getAuthorizationUrl(userId: string): Promise<string> {
  const state = this.encryptState(userId);
  
  const params = new URLSearchParams({
    client_id: this.clientId,           // ← 환경 변수에서 가져옴
    redirect_uri: this.redirectUri,      // ← Railway 백엔드 콜백 URL
    response_type: 'code',
    owner: 'user',
    state: state,                        // ← 암호화된 사용자 ID
  });

  // ← 여기서 동적으로 인증 URL 생성
  return `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;
}
```

#### Step 5: 사용자를 Notion 인증 페이지로 리디렉션
```
생성된 URL 예시:
https://api.notion.com/v1/oauth/authorize?
  client_id=2aed872b-594c-804e-9afc-003758451dad&
  redirect_uri=https://your-railway-domain.up.railway.app/notion/oauth/callback&
  response_type=code&
  owner=user&
  state=encrypted_user_id
```

---

## 📊 전체 플로우 다이어그램

```
사용자가 "Notion 계정 연결하기" 클릭
         ↓
프론트엔드: startNotionOAuth() 호출
         ↓
백엔드: GET /notion/oauth/authorize
         ↓
백엔드: getAuthorizationUrl() 실행
         ↓
동적 인증 URL 생성
  (client_id, redirect_uri, state 포함)
         ↓
사용자를 생성된 URL로 리디렉션
         ↓
Notion OAuth 인증 페이지 표시
  (사용자가 로그인 및 권한 부여)
         ↓
Notion이 redirect_uri로 인증 코드 전달
         ↓
백엔드: GET /notion/oauth/callback
         ↓
인증 코드를 액세스 토큰으로 교환
         ↓
사용자별 토큰 저장 (DB)
         ↓
프론트엔드 설정 페이지로 리디렉션
```

---

## 🔑 핵심 포인트

### 1. Notion 설정 페이지의 인증 URL
- **용도**: 참고용 템플릿
- **실제 사용**: ❌ 직접 사용하지 않음
- **설명**: Notion이 제공하는 기본 예시 URL입니다.

### 2. 실제 사용되는 인증 URL
- **생성 위치**: 백엔드 `NotionService.getAuthorizationUrl()`
- **생성 시점**: 사용자가 "Notion 계정 연결하기" 클릭 시
- **포함 정보**:
  - `client_id`: Notion OAuth 앱의 Client ID
  - `redirect_uri`: Railway 백엔드 콜백 URL
  - `response_type`: 'code' (인증 코드 방식)
  - `owner`: 'user' (사용자 소유)
  - `state`: 암호화된 사용자 ID (보안)

### 3. 왜 동적으로 생성하나요?
- ✅ **보안**: `state` 파라미터에 사용자 ID를 암호화하여 포함
- ✅ **유연성**: 환경에 따라 다른 `redirect_uri` 사용 가능
- ✅ **동적 처리**: 사용자별로 다른 `state` 값 사용

---

## ⚙️ 설정 방법

### 1. Notion 설정 페이지
- **인증 URL**: 참고용이므로 수정 불필요
- **OAuth Client ID**: 복사하여 Railway 환경 변수에 설정
- **OAuth Client Secret**: 복사하여 Railway 환경 변수에 설정

### 2. Railway 환경 변수
```env
NOTION_CLIENT_ID=2aed872b-594c-804e-9afc-003758451dad
NOTION_CLIENT_SECRET=your_client_secret_here
NOTION_REDIRECT_URI=https://your-railway-domain.up.railway.app/notion/oauth/callback
```

### 3. 백엔드 코드
- `NotionService.getAuthorizationUrl()` 메서드가 자동으로 인증 URL 생성
- 환경 변수에서 `NOTION_CLIENT_ID`와 `NOTION_REDIRECT_URI`를 읽어옴

---

## 🎯 요약

| 항목 | 설명 |
|------|------|
| **Notion 설정 페이지의 인증 URL** | 참고용 템플릿 (직접 사용 안 함) |
| **실제 사용되는 인증 URL** | 백엔드에서 동적으로 생성 |
| **생성 위치** | `backend/src/notion/notion.service.ts` |
| **사용 시점** | 사용자가 "Notion 계정 연결하기" 클릭 시 |
| **포함 정보** | client_id, redirect_uri, state 등 |

---

## 💡 결론

**Notion 설정 페이지의 "인증 URL"은 참고용입니다.**

실제로는:
1. 백엔드 코드에서 동적으로 인증 URL을 생성합니다.
2. 사용자가 "Notion 계정 연결하기"를 클릭하면 백엔드가 URL을 생성합니다.
3. 생성된 URL로 사용자를 Notion OAuth 인증 페이지로 리디렉션합니다.

따라서 Notion 설정 페이지의 인증 URL을 직접 복사해서 사용할 필요는 없습니다. 백엔드 코드가 자동으로 처리합니다!

