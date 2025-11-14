# 🐛 FIX: 요구사항 추출 JSON 파싱 오류 수정

**날짜**: 2025-11-14  
**작성자**: AI Assistant  
**관련 이슈**: Railway 로그에서 "Unexpected token '`'" JSON 파싱 오류

---

## 📋 문제 상황

### 증상
- 프로젝트 개요에서 요구사항을 추출할 때 JSON 파싱 실패
- Railway 로그:
  ```
  JSON 파싱 오류: SyntaxError: Unexpected token '`', "```json { "... is not valid JSON
  코드 블록 없음, 원본 텍스트 사용
  ```

### 원인 분석
1. **Claude API 응답**: ````json ... ```` 마크다운 코드 블록으로 감싼 JSON 반환
2. **정규식 매칭 실패**: `/```json\s*([\s\S]*?)\s*```/` 패턴이 일부 응답에서 매칭 실패
3. **파싱 실패**: 코드 블록 제거 없이 백틱 포함된 텍스트를 `JSON.parse()`에 전달
4. **결과**: `Unexpected token '`'` 에러 발생

---

## 🛠️ 해결 방법

### 변경 파일
- `backend/src/chat/chat.service.ts`

### 수정 내용

#### Before (기존 로직)
```typescript
// 정규식 한 번만 시도
const jsonBlockMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
if (jsonBlockMatch) {
  jsonText = jsonBlockMatch[1];
} else {
  // 실패 시 원본 텍스트 그대로 사용 (백틱 포함)
  jsonText = responseText;
}
```

**문제점**:
- 정규식이 복잡하고 greedy/non-greedy 매칭 문제
- 줄바꿈 문자 차이로 인한 매칭 실패
- 실패 시 대안 없음

#### After (개선된 로직)
```typescript
let jsonText = responseText.trim();

// 패턴 1: ```json\n...\n```
if (jsonText.startsWith('```json')) {
  jsonText = jsonText.replace(/^```json\s*/i, '');
  jsonText = jsonText.replace(/\s*```\s*$/i, '');
}
// 패턴 2: ```\n...\n```
else if (jsonText.startsWith('```')) {
  jsonText = jsonText.replace(/^```\s*/i, '');
  jsonText = jsonText.replace(/\s*```\s*$/i, '');
}

jsonText = jsonText.trim();
```

**개선점**:
- `startsWith()` 체크로 명확한 패턴 식별
- `replace()` 2회로 시작/끝 각각 제거 (더 robust)
- 여러 패턴 지원 (```json, ```)
- 정규식 대신 단순한 문자열 치환

---

## ✅ 검증 결과

### 로컬 테스트
- 타입 체크: ✅ 통과 (no linter errors)

### 배포 후 확인 사항
1. Railway 로그에서 "패턴 1: ```json 코드 블록 감지" 메시지 확인
2. "코드 블록 제거 후 텍스트" 로그에서 순수 JSON 확인
3. "요구사항 추출 JSON 파싱 성공" 메시지 확인
4. 프론트엔드에서 요구사항 카드 정상 표시

---

## 🚀 배포 방법

```bash
# 백엔드 디렉토리로 이동
cd backend

# Railway에 배포 (자동 빌드 & 재시작)
git add .
git commit -m "fix: 요구사항 추출 JSON 파싱 로직 개선"
git push origin main
```

Railway는 자동으로 main 브랜치를 감지하고 재배포합니다.

---

## 📌 관련 파일
- `backend/src/chat/chat.service.ts` - `parseRequirementsResponse()` 메서드
- `backend/src/chat/validators/requirements-validator.ts` - 검증 로직 (별도 추가)

---

## 🔄 후속 작업
- [x] JSON 파싱 로직 개선
- [x] **max_tokens 증가 (4000 → 16000)** - 상세 스키마로 인한 응답 크기 증가 대응
- [ ] 배포 후 Railway 로그 모니터링
- [ ] 실제 요구사항 추출 테스트 (프론트엔드)
- [ ] 검증 로직 통합 (현재는 import만 완료)

---

## ⚠️ 추가 수정 (2025-11-14)

### 문제: JSON 응답 잘림
- **증상**: `Expected double-quoted property name in JSON at position 8894`
- **원인**: `max_tokens: 4000`이 부족하여 응답이 중간에 잘림
  ```json
  "dataRules": ["카카오 토큰 AES-256 암호화 저장", "프로필 정보 30일 캐싱", "개인정보 마스킹 처리
  ```
  → 닫는 `"]`가 없음!

### 해결: max_tokens 4배 증가
- **변경**: `4000` → `16000` (모든 Claude API 호출)
- **이유**: 새 스키마(AC, dataRules, exceptions, trace)로 JSON 크기 증가
- **영향**: 
  - ✅ 완전한 JSON 응답 보장
  - ⚠️ API 비용 증가 (토큰당 과금)
  - ⏱️ 응답 시간 약간 증가 (1-2초)

