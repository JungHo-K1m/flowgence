# Notion OAuth 인증 유저 플로우

## 📋 개요

Notion OAuth 인증을 통해 각 사용자가 자신의 Notion 계정에 문서를 저장할 수 있도록 하는 기능의 유저 플로우입니다.

---

## 🔄 전체 플로우 다이어그램

```
사용자가 "Notion으로 공유" 버튼 클릭
         ↓
Notion 연결 상태 확인
         ↓
    ┌────┴────┐
    │         │
연결됨     연결 안됨
    │         │
    │         ├─→ "Notion 계정 연결" 버튼 표시
    │         │   ↓
    │         │   Notion OAuth 인증 페이지로 이동
    │         │   ↓
    │         │   사용자가 Notion 계정으로 로그인
    │         │   ↓
    │         │   권한 부여
    │         │   ↓
    │         │   인증 코드 수신 (콜백)
    │         │   ↓
    │         │   액세스 토큰 교환
    │         │   ↓
    │         │   사용자별 토큰 저장 (DB)
    │         │   ↓
    │         └─→ 연결 완료
    │
    ↓
저장된 토큰으로 Notion API 호출
    ↓
사용자의 Notion 워크스페이스에 페이지 생성
    ↓
성공 메시지 표시 + 페이지 URL 반환
```

---

## 📄 상세 플로우

### 1. 첫 번째 공유 시 (연결 안됨)

#### Step 1: "Notion으로 공유" 버튼 클릭
```
사용자가 "Notion으로 공유" 버튼 클릭
→ handleShareNotion() 함수 실행
```

#### Step 2: Notion 연결 상태 확인
```typescript
// 사용자별 Notion 연결 정보 조회
const notionConnection = await getNotionConnection(userId);

if (!notionConnection) {
  // 연결 안됨 → OAuth 인증 시작
}
```

#### Step 3: Notion 연결 안내 모달 표시
```
┌─────────────────────────────────────┐
│  Notion 계정 연결이 필요합니다      │
│                                     │
│  Flowgence에서 Notion으로 문서를   │
│  공유하려면 Notion 계정을 연결해야  │
│  합니다.                            │
│                                     │
│  [Notion 계정 연결하기] 버튼        │
│  [나중에] 버튼                      │
└─────────────────────────────────────┘
```

#### Step 4: "Notion 계정 연결하기" 클릭
```
→ Notion OAuth 인증 페이지로 리디렉션
→ URL: https://api.notion.com/v1/oauth/authorize?
      client_id={CLIENT_ID}&
      redirect_uri={REDIRECT_URI}&
      response_type=code&
      owner=user
```

#### Step 5: Notion에서 로그인 및 권한 부여
```
사용자가 Notion 웹사이트에서:
1. Notion 계정으로 로그인 (이미 로그인되어 있으면 생략)
2. "Flowgence에 권한 부여" 확인
3. "허용" 버튼 클릭
```

#### Step 6: 인증 코드 수신 (콜백)
```
Notion이 리디렉션 URI로 인증 코드 전달:
→ /auth/notion/callback?code={AUTHORIZATION_CODE}&state={STATE}
```

#### Step 7: 액세스 토큰 교환
```typescript
// 백엔드에서 처리
POST https://api.notion.com/v1/oauth/token
{
  grant_type: "authorization_code",
  code: "{AUTHORIZATION_CODE}",
  redirect_uri: "{REDIRECT_URI}"
}

// 응답
{
  access_token: "...",
  token_type: "bearer",
  bot_id: "...",
  workspace_id: "...",
  workspace_name: "..."
}
```

#### Step 8: 사용자별 토큰 저장
```typescript
// Supabase DB에 저장
INSERT INTO notion_connections (
  user_id,
  access_token,
  workspace_id,
  workspace_name,
  bot_id
) VALUES (...)
```

#### Step 9: 연결 완료 후 문서 공유
```
→ 저장된 토큰으로 Notion API 호출
→ 사용자의 Notion 워크스페이스에 페이지 생성
→ 성공 메시지 표시
```

---

### 2. 이후 공유 시 (이미 연결됨)

#### Step 1: "Notion으로 공유" 버튼 클릭
```
사용자가 "Notion으로 공유" 버튼 클릭
→ handleShareNotion() 함수 실행
```

#### Step 2: Notion 연결 상태 확인
```typescript
const notionConnection = await getNotionConnection(userId);

if (notionConnection) {
  // 연결됨 → 바로 공유 진행
  // 저장된 access_token 사용
}
```

#### Step 3: 바로 공유 진행
```
→ 저장된 access_token으로 Notion API 호출
→ 사용자의 Notion 워크스페이스에 페이지 생성
→ 성공 메시지 표시
```

---

### 3. 설정 페이지에서 연결 관리

#### Step 1: 설정 페이지 접속
```
마이페이지 → 설정
→ "Notion 연결" 섹션 표시
```

#### Step 2: 연결 상태 확인
```
┌─────────────────────────────────────┐
│  Notion 연결                        │
│                                     │
│  상태: ✅ 연결됨                    │
│  워크스페이스: {workspace_name}     │
│  연결일: {connected_at}             │
│                                     │
│  [연결 해제] 버튼                   │
│  [데이터베이스 선택] 버튼           │
└─────────────────────────────────────┘

또는

┌─────────────────────────────────────┐
│  Notion 연결                        │
│                                     │
│  상태: ❌ 연결 안됨                 │
│                                     │
│  [Notion 계정 연결하기] 버튼        │
└─────────────────────────────────────┘
```

#### Step 3: 연결 해제
```
[연결 해제] 버튼 클릭
→ 확인 모달 표시
→ DB에서 연결 정보 삭제
→ 연결 해제 완료
```

---

## 🔐 보안 고려사항

### 1. 토큰 저장
- **액세스 토큰**: 암호화하여 저장 (Supabase Vault 또는 암호화 함수 사용)
- **민감 정보**: 평문 저장 금지

### 2. 토큰 갱신
- **만료 시간 확인**: `expires_at` 필드 확인
- **토큰 갱신**: 만료 전 자동 갱신 또는 재인증 요청

### 3. 권한 범위
- **최소 권한 원칙**: 필요한 권한만 요청
- **사용자 동의**: 명확한 권한 설명

---

## 📊 데이터베이스 스키마

```sql
CREATE TABLE notion_connections (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  access_token TEXT NOT NULL, -- 암호화
  workspace_id TEXT,
  workspace_name TEXT,
  bot_id TEXT,
  database_id TEXT, -- 선택사항
  connected_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(user_id)
);
```

---

## 🔄 API 엔드포인트

### 1. Notion OAuth 시작
```
GET /api/notion/oauth/authorize
→ Notion OAuth 인증 페이지로 리디렉션
```

### 2. OAuth 콜백 처리
```
GET /api/notion/oauth/callback?code={code}&state={state}
→ 인증 코드를 액세스 토큰으로 교환
→ DB에 저장
→ 프론트엔드로 리디렉션
```

### 3. 연결 정보 조회
```
GET /api/notion/connection
→ 현재 사용자의 Notion 연결 정보 반환
```

### 4. 연결 해제
```
DELETE /api/notion/connection
→ 현재 사용자의 Notion 연결 정보 삭제
```

---

## 🎯 구현 단계

1. ✅ 데이터베이스 스키마 추가
2. ⏳ Notion OAuth 설정 (클라이언트 ID, 시크릿)
3. ⏳ OAuth 인증 플로우 구현
4. ⏳ 사용자별 토큰 저장/조회 로직
5. ⏳ 설정 페이지 UI 구현
6. ⏳ 공유 시 저장된 토큰 사용 로직 수정

