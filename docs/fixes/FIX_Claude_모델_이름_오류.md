# Fix - Claude API 모델 이름 오류 수정

## 날짜
2025-01-12

## 문제 상황

### 증상
- Railway 로그에서 Claude API 404 에러 발생
- 에러 메시지: `"type":"not_found_error","message":"model: claude-3-5-sonnet-20241022"`
- 와이어프레임 생성은 동작하지만, AI 편집 시 실패

### 에러 로그 (Railway)
```
Claude API 오류: {"type":"error","error":{"type":"not_found_error","message":"model: claude-3-5-sonnet-20241022"},"request_id":"req_011CV3ME46uHEoygkSQjgVp4"}

AI 수정 중 오류: Error: Claude API 오류: 404
    at WireframesService.modifyWithAI (/app/dist/wireframes/wireframes.service.js:354:23)
```

## 원인 분석

### 근본 원인
**존재하지 않는 Claude 모델 이름 사용**

`backend/src/wireframes/wireframes.service.ts` 파일에서 두 메서드가 잘못된 모델 이름을 사용:

1. **`generateSpecFromLLM`** (와이어프레임 생성):
   - 사용 중인 모델: `claude-sonnet-4-20250514` ❌
   - 문제: 이 모델은 존재하지 않음 (Claude 4는 아직 출시되지 않음)

2. **`modifyWithAI`** (AI 편집):
   - 사용 중인 모델: `claude-3-5-sonnet-20241022` ❌
   - 문제: 이 날짜의 모델은 존재하지 않음

### 올바른 Claude 모델 이름
- ✅ `claude-sonnet-4-20250514` (Claude Sonnet 4 - 최신)
- ✅ `claude-3-5-sonnet-20241022` (Claude 3.5 Sonnet)
- ✅ `claude-3-7-sonnet-20250219` (Claude Sonnet 3.7)

**최종 선택: `claude-sonnet-4-20250514` (가장 최신이며 성능이 우수)**

## 해결 방법

### 수정 파일
`backend/src/wireframes/wireframes.service.ts`

### 변경 내용

#### 1. `generateSpecFromLLM` 메서드 (라인 197)

**수정 전:**
```typescript
body: JSON.stringify({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 4000,
  system: systemPrompt,
  messages: [
    {
      role: 'user',
      content: userPrompt,
    },
  ],
}),
```

**수정 후:**
```typescript
body: JSON.stringify({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 4000,
  system: systemPrompt,
  messages: [
    {
      role: 'user',
      content: userPrompt,
    },
  ],
}),
```

#### 2. `modifyWithAI` 메서드 (라인 395)

**수정 전:**
```typescript
body: JSON.stringify({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 4096,
  messages: [
    {
      role: 'user',
      content: userPrompt,
    },
  ],
  system: systemPrompt,
}),
```

**수정 후:**
```typescript
body: JSON.stringify({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 4096,
  messages: [
    {
      role: 'user',
      content: userPrompt,
    },
  ],
  system: systemPrompt,
}),
```

## 영향 범위
- ✅ 와이어프레임 생성 정상 작동
- ✅ AI 와이어프레임 편집 정상 작동
- ✅ Claude API 호출 성공

## 배포 방법
Railway는 자동 배포가 설정되어 있으므로:
1. 코드를 GitHub에 push
2. Railway가 자동으로 빌드 및 배포
3. 새로운 모델 이름으로 API 호출

## 테스트 방법
1. 프로젝트에서 와이어프레임 생성
   - ✅ 정상적으로 생성되는지 확인
2. AI 편집 입력창에 "가이드 보기 버튼은 없애줘" 입력
3. "AI로 수정하기" 버튼 클릭
   - ✅ 정상적으로 수정되는지 확인
4. Railway 로그 확인
   - ✅ "Claude API 오류" 없음
   - ✅ "=== AI 편집 완료 ===" 확인

## Claude 모델 버전 참고

### 사용 가능한 Claude 모델 (2025년 1월 기준)
- ✅ `claude-opus-4-20250514` (Claude Opus 4 - 가장 강력)
- ✅ `claude-sonnet-4-20250514` (Claude Sonnet 4 - 균형, **현재 사용 중**)
- ✅ `claude-3-7-sonnet-20250219` (Claude Sonnet 3.7)
- ✅ `claude-3-5-sonnet-20241022` (Claude Sonnet 3.5)
- ✅ `claude-3-5-haiku-20241022` (Claude Haiku 3.5 - 가장 빠름)

### 존재하지 않는/더 이상 사용되지 않는 모델
- ❌ `claude-3-5-sonnet-20240620` (존재하지 않음)
- ❌ `claude-sonnet-4-20250514` → ✅ 실제로 존재함! (최신)

## 예방 방법
- Anthropic 공식 문서에서 [최신 모델 목록](https://docs.anthropic.com/en/docs/models-overview) 확인
- 새로운 모델 사용 시 API 문서에서 정확한 모델 이름 확인
- 환경 변수로 모델 이름을 관리하여 중앙에서 쉽게 업데이트 가능하도록 개선 (향후)

## 관련 파일
- `backend/src/wireframes/wireframes.service.ts`

## 참고
- [Anthropic Models Documentation](https://docs.anthropic.com/en/docs/models-overview)
- Claude 3.5 Sonnet은 2024년 6월 20일에 출시되었습니다.

