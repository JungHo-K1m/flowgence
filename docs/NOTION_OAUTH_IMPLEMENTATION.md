# Notion OAuth 인증 구현 가이드

## 📋 개요

Notion OAuth 인증을 통해 각 사용자가 자신의 Notion 계정에 문서를 저장할 수 있도록 구현되었습니다.

---

## ✅ 구현 완료 사항

### 1. 데이터베이스 스키마
- ✅ `notion_connections` 테이블 생성
- ✅ 사용자별 Notion 연결 정보 저장
- ✅ RLS (Row Level Security) 정책 적용

### 2. 백엔드 구현
- ✅ `NotionModule` 생성
- ✅ `NotionController` - OAuth 인증 및 공유 API
- ✅ `NotionService` - OAuth 플로우 및 Notion API 호출
- ✅ 엔드포인트:
  - `GET /notion/oauth/authorize` - OAuth 인증 시작
  - `GET /notion/oauth/callback` - OAuth 콜백 처리
  - `GET /notion/connection` - 연결 정보 조회
  - `DELETE /notion/connection` - 연결 해제
  - `POST /notion/share/requirements` - 요구사항 공유
  - `POST /notion/share/estimate` - 견적 공유

### 3. 프론트엔드 구현
- ✅ `notionOAuth.ts` - OAuth 유틸리티 함수
- ✅ 설정 페이지 (`/mypage/settings`) - Notion 연결 UI
- ✅ `RequirementsResultPanel` - 사용자별 연결 확인 및 공유

---

## 🔧 설정 필요 사항

### 1. Notion OAuth 앱 생성

1. [Notion 개발자 포털](https://www.notion.com/my-integrations) 접속
2. "New integration" 클릭
3. 통합 정보 입력:
   - **Name**: Flowgence Integration
   - **Associated workspace**: 선택
4. **OAuth** 탭에서:
   - **Redirect URIs**: `http://localhost:3001/notion/oauth/callback` (개발), `https://your-domain.com/notion/oauth/callback` (프로덕션)
   - **Capabilities**: `Read content`, `Insert content`, `Update content` 선택
5. **OAuth client ID**와 **OAuth client secret** 복사

### 2. 환경 변수 설정

#### 백엔드 (`.env`)
```env
# Notion OAuth 설정
NOTION_CLIENT_ID=your_client_id_here
NOTION_CLIENT_SECRET=your_client_secret_here
NOTION_REDIRECT_URI=http://localhost:3001/notion/oauth/callback
NOTION_OAUTH_STATE_SECRET=your_random_secret_here

# 프론트엔드 URL
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001
```

#### 프론트엔드 (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. 데이터베이스 마이그레이션

```sql
-- database/add_notion_connections.sql 실행
```

---

## 🔄 사용자 플로우

### 첫 번째 공유 시

1. 사용자가 "Notion으로 공유" 버튼 클릭
2. 연결 상태 확인 → 연결 안됨
3. "Notion 계정 연결하기" 확인 모달 표시
4. 사용자가 확인 클릭
5. Notion OAuth 인증 페이지로 리디렉션
6. 사용자가 Notion 계정으로 로그인 및 권한 부여
7. 백엔드 콜백에서 액세스 토큰 교환 및 저장
8. 설정 페이지로 리디렉션 (성공 메시지 표시)
9. 다시 "Notion으로 공유" 클릭
10. 저장된 토큰으로 Notion API 호출
11. 사용자의 Notion 워크스페이스에 페이지 생성

### 이후 공유 시

1. 사용자가 "Notion으로 공유" 버튼 클릭
2. 연결 상태 확인 → 연결됨
3. 저장된 토큰으로 바로 Notion API 호출
4. 사용자의 Notion 워크스페이스에 페이지 생성

---

## 🔐 보안 고려사항

### 현재 구현
- ✅ 사용자별 토큰 분리 저장
- ✅ RLS 정책으로 사용자별 접근 제어
- ✅ State 암호화 (간단한 버전)

### 개선 필요 사항
- ⚠️ **액세스 토큰 암호화**: 현재 평문 저장 (Supabase Vault 또는 암호화 함수 사용 권장)
- ⚠️ **State 암호화 강화**: 현재 간단한 암호화 사용 (더 강력한 방법 권장)
- ⚠️ **토큰 갱신**: 만료된 토큰 자동 갱신 로직 추가
- ⚠️ **인증 미들웨어**: 백엔드에 사용자 인증 미들웨어 추가 필요

---

## 🐛 알려진 이슈

### 1. 인증 미들웨어 미구현
현재 백엔드 컨트롤러에서 `(req as any).user?.id`를 사용하고 있지만, 실제 인증 미들웨어가 구현되지 않았습니다.

**해결 방법:**
- Supabase JWT 인증 미들웨어 추가
- 또는 세션 기반 인증 미들웨어 추가

### 2. 데이터베이스 ID 설정
현재 사용자가 데이터베이스 ID를 설정할 수 있는 UI가 없습니다.

**해결 방법:**
- 설정 페이지에 데이터베이스 ID 입력 필드 추가
- 또는 Notion API를 통해 사용 가능한 데이터베이스 목록 조회

### 3. OAuth 콜백 URL
현재 백엔드로 콜백이 오지만, 프론트엔드로 리디렉션하는 로직이 필요합니다.

**현재 구현:**
- 백엔드 콜백 → 프론트엔드 설정 페이지로 리디렉션

---

## 📝 다음 단계

1. ✅ 데이터베이스 마이그레이션 실행
2. ⏳ Notion OAuth 앱 생성 및 환경 변수 설정
3. ⏳ 백엔드 인증 미들웨어 구현
4. ⏳ 액세스 토큰 암호화 구현
5. ⏳ 데이터베이스 ID 설정 UI 추가
6. ⏳ 토큰 갱신 로직 추가
7. ⏳ 테스트 및 배포

---

## 🔗 참고 문서

- [Notion OAuth 문서](https://developers.notion.com/docs/authorization)
- [Notion API 문서](https://developers.notion.com/reference)
- [Notion OAuth 플로우 가이드](docs/NOTION_OAUTH_USER_FLOW.md)

