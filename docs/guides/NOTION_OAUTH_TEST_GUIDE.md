# Notion OAuth 테스트 가이드

## ✅ 완료된 작업

- [x] 데이터베이스 스키마 추가 (`notion_connections` 테이블)
- [x] 환경 변수 설정 완료

---

## 🔄 다음 단계

### 1. 서버 재시작 (필수)

환경 변수를 변경했으므로 서버를 재시작해야 합니다.

#### 백엔드 서버 재시작
```bash
cd backend
npm run start:dev
```

#### 프론트엔드 서버 재시작
```bash
cd frontend
npm run dev
```

---

## 🧪 테스트 방법

### 1. 설정 페이지에서 Notion 연결 테스트

#### Step 1: 설정 페이지 접속
```
http://localhost:3000/mypage/settings
```

#### Step 2: Notion 연결 상태 확인
- "연결 안됨" 상태가 표시되어야 합니다.

#### Step 3: "Notion 계정 연결하기" 버튼 클릭
- Notion OAuth 인증 페이지로 리디렉션되어야 합니다.

#### Step 4: Notion에서 로그인 및 권한 부여
- Notion 계정으로 로그인
- "Flowgence Integration에 권한 부여" 확인
- "허용" 버튼 클릭

#### Step 5: 콜백 처리 확인
- 백엔드 콜백 URL로 리디렉션
- 설정 페이지로 리디렉션 (`/mypage/settings?notion_connected=true`)
- "연결됨" 상태가 표시되어야 합니다.

---

### 2. 요구사항 공유 테스트

#### Step 1: 프로젝트 생성 및 요구사항 도출
```
1. 프로젝트 생성
2. 요구사항 도출 완료
3. 요구사항 결과 페이지로 이동
```

#### Step 2: "Notion으로 공유" 버튼 클릭
- 연결이 되어 있으면 바로 공유 진행
- 연결이 안 되어 있으면 OAuth 인증 시작

#### Step 3: Notion 페이지 생성 확인
- 성공 메시지 표시
- Notion 페이지 URL 반환
- 브라우저에서 Notion 페이지 열기

---

## 🔍 확인 사항

### 1. 백엔드 로그 확인

백엔드 서버 콘솔에서 다음 로그를 확인하세요:

#### OAuth 인증 시작 시
```
GET /notion/oauth/authorize
```

#### OAuth 콜백 처리 시
```
GET /notion/oauth/callback?code=...
토큰 교환 성공
연결 정보 저장 완료
```

#### Notion 공유 시
```
POST /notion/share/requirements
Notion API 호출 성공
페이지 생성 완료
```

### 2. 데이터베이스 확인

Supabase에서 `notion_connections` 테이블을 확인하세요:

```sql
SELECT * FROM notion_connections;
```

연결 성공 시 다음 정보가 저장되어야 합니다:
- `user_id`: 사용자 ID
- `access_token`: Notion 액세스 토큰 (암호화 권장)
- `workspace_id`: Notion 워크스페이스 ID
- `workspace_name`: Notion 워크스페이스 이름
- `bot_id`: Notion Bot ID
- `connected_at`: 연결 일시

### 3. 브라우저 콘솔 확인

프론트엔드 브라우저 콘솔에서 다음을 확인하세요:

#### 연결 정보 조회
```javascript
// 정상 응답
{
  connected: true,
  workspaceName: "Your Workspace",
  connectedAt: "2024-01-01T00:00:00.000Z"
}
```

#### 에러 확인
- 네트워크 에러
- 인증 에러
- API 호출 실패

---

## ⚠️ 알려진 이슈 및 해결 방법

### 1. 인증 미들웨어 미구현

**현재 상태:**
- 백엔드 컨트롤러에서 `(req as any).user?.id` 사용
- 실제 인증 미들웨어가 구현되지 않음

**임시 해결 방법:**
- 개발 환경에서는 수동으로 사용자 ID를 전달하거나
- 인증 미들웨어를 구현해야 함

**해결 방법:**
```typescript
// backend/src/notion/notion.controller.ts
// 인증 미들웨어 추가 필요
@UseGuards(AuthGuard) // 또는 Supabase JWT Guard
@Get('oauth/authorize')
async authorize(@Req() req: Request) {
  const userId = req.user?.id; // 미들웨어에서 주입
  // ...
}
```

### 2. OAuth 콜백 URL 불일치

**증상:**
- OAuth 인증 후 콜백이 실패
- "Invalid redirect_uri" 에러

**해결 방법:**
1. Notion OAuth 앱의 Redirect URI 확인
2. Railway 환경 변수의 `NOTION_REDIRECT_URI` 확인
3. 두 값이 정확히 일치해야 함

```
Notion OAuth 앱: https://your-railway-domain.up.railway.app/notion/oauth/callback
Railway 환경 변수: https://your-railway-domain.up.railway.app/notion/oauth/callback
```

### 3. 데이터베이스 ID 미설정

**증상:**
- "Notion 데이터베이스 ID가 설정되지 않았습니다" 에러

**해결 방법:**
1. Notion에서 데이터베이스 생성
2. 데이터베이스 ID 복사
3. 설정 페이지에서 데이터베이스 ID 입력 (향후 구현)
4. 또는 환경 변수에 기본 데이터베이스 ID 설정

---

## 📝 체크리스트

### 환경 설정
- [x] 데이터베이스 스키마 추가
- [x] 환경 변수 설정
- [ ] 서버 재시작

### 테스트
- [ ] 설정 페이지에서 Notion 연결
- [ ] OAuth 인증 플로우 확인
- [ ] 연결 정보 저장 확인
- [ ] 요구사항 Notion 공유 테스트
- [ ] 견적서 Notion 공유 테스트

### 문제 해결
- [ ] 인증 미들웨어 구현 (필요 시)
- [ ] 데이터베이스 ID 설정 UI 추가 (필요 시)
- [ ] 에러 처리 개선 (필요 시)

---

## 🚀 다음 구현 단계

1. **인증 미들웨어 구현**
   - Supabase JWT 인증 미들웨어 추가
   - 사용자 ID 자동 주입

2. **데이터베이스 ID 설정 UI**
   - 설정 페이지에 데이터베이스 ID 입력 필드 추가
   - Notion API를 통한 데이터베이스 목록 조회

3. **토큰 갱신 로직**
   - 만료된 토큰 자동 갱신
   - 재인증 요청

4. **에러 처리 개선**
   - 사용자 친화적인 에러 메시지
   - 재시도 로직

---

## 📞 문제 발생 시

1. **백엔드 로그 확인**
   - Railway 로그 또는 로컬 콘솔 확인
   - 에러 메시지 확인

2. **프론트엔드 콘솔 확인**
   - 브라우저 개발자 도구 콘솔
   - 네트워크 탭에서 API 호출 확인

3. **데이터베이스 확인**
   - Supabase에서 `notion_connections` 테이블 확인
   - 연결 정보가 올바르게 저장되었는지 확인

4. **환경 변수 확인**
   - Railway/Vercel 환경 변수 재확인
   - 값이 올바르게 설정되었는지 확인

