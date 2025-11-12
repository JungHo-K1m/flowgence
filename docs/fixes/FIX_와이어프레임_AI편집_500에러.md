# Fix - 와이어프레임 AI 편집 500 에러 해결

## 날짜
2025-01-12

## 문제 상황

### 증상
- 최초 와이어프레임 생성은 정상 작동
- AI로 와이어프레임 수정 시도 시 500 에러 발생
- Railway 백엔드 로그에 아무런 기록이 없음
- 브라우저 콘솔에서 `/api/wireframes/apply-edit` 엔드포인트 500 에러 확인

### 에러 메시지
```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
POST https://flowgence-frontend.vercel.app/api/wireframes/apply-edit
```

## 원인 분석

### 근본 원인
**환경 변수 불일치**

두 API route 파일이 서로 다른 환경 변수를 사용하고 있었습니다:

1. **`generate/route.ts`** (정상 작동):
   ```typescript
   const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
   ```

2. **`apply-edit/route.ts`** (에러 발생):
   ```typescript
   const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
   ```

### 문제 상세
- Vercel 환경 변수에는 `NEXT_PUBLIC_API_URL`만 설정되어 있음
- `NEXT_PUBLIC_BACKEND_URL`은 설정되지 않음
- 결과: `apply-edit` route가 `undefined`로 요청하거나 `localhost:3001`로 요청
- Railway 백엔드에 요청이 도달하지 못함 → Railway 로그에 아무것도 없음

## 해결 방법

### 수정 파일
`frontend/src/app/api/wireframes/apply-edit/route.ts`

### 변경 내용

**수정 전:**
```typescript
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
```

**수정 후:**
```typescript
const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
```

### 추가 개선사항
디버깅을 위해 상세한 로깅 추가:
- 요청 body 로깅
- Backend URL 로깅
- 응답 상태 로깅
- 에러 스택 추적 로깅

```typescript
console.log('=== Frontend API: AI 편집 요청 시작 ===');
console.log('Request body:', { projectId, prompt });
console.log('Backend URL:', backendUrl);
console.log('Full URL:', `${backendUrl}/wireframes/apply-edit`);
console.log('Backend response status:', response.status);
```

## 영향 범위
- ✅ AI 와이어프레임 편집 기능 정상 작동
- ✅ Railway 백엔드에 요청이 정상적으로 도달
- ✅ 백엔드 로그에서 요청 확인 가능

## 테스트 방법
1. 프로젝트에서 와이어프레임 생성
2. "AI로 수정하기" 입력창에 수정 요청 입력 (예: "검색 버튼을 더 크게")
3. "AI로 수정하기" 버튼 클릭
4. 정상적으로 와이어프레임이 수정되는지 확인
5. Railway 로그에서 "=== AI 편집 요청 ===" 로그 확인

## 예방 방법
- 모든 API route에서 동일한 환경 변수 이름 사용
- 환경 변수 이름은 프로젝트 전체에서 일관성 유지
- 새로운 API route 추가 시 기존 route 참고하여 동일한 패턴 사용

## 관련 파일
- `frontend/src/app/api/wireframes/generate/route.ts`
- `frontend/src/app/api/wireframes/apply-edit/route.ts`
- `backend/src/wireframes/wireframes.controller.ts`
- `backend/src/wireframes/wireframes.service.ts`

## 참고
Railway에 로그가 없다는 것은 일반적으로 요청이 백엔드에 도달하지 못했다는 신호입니다. 이런 경우 프론트엔드 API route와 환경 변수 설정을 먼저 확인해야 합니다.

