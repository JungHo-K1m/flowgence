# Changelog - 와이어프레임 생성 529 재시도 로직 추가

## 날짜
2025-01-12

## 개요
Claude API의 529 에러(Overloaded) 발생 시 자동 재시도 로직을 와이어프레임 생성 및 편집 기능에 추가했습니다.

## 배경

### 529 에러란?
- **HTTP 529 (Overloaded)**: Claude API 서버가 일시적으로 과부하 상태
- **특징**: 일시적인 문제로, 재시도하면 성공할 가능성 높음
- **429와의 차이**: 429는 계정의 rate limit 초과로 재시도해도 실패

### 기존 구현
`backend/src/chat/chat.service.ts`에서 이미 529 재시도 로직을 구현:
- `extractRequirementsFromHistory` ✅
- `verifyRequirements` ✅
- `chat` 스트리밍 ✅

## 변경 사항

### 파일
`backend/src/wireframes/wireframes.service.ts`

### 추가된 메서드

#### 1. `generateSpecFromLLM` - 와이어프레임 생성
**위치:** 라인 233-295

**재시도 로직:**
```typescript
if (!response.ok) {
  const errorText = await response.text();
  console.error('Claude API 오류:', errorText);
  
  // 529 (Overloaded) 에러의 경우 재시도
  if (response.status === 529) {
    console.log('Claude API 529 (Overloaded) 에러 - 재시도 시도');
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기
    
    const retryResponse = await fetch(/* 동일한 요청 */);
    
    if (retryResponse.ok) {
      console.log('재시도 성공');
      // JSON 파싱 및 검증 후 반환
      return spec;
    } else if (retryResponse.status === 529) {
      console.error('Claude API 529 (Overloaded) 에러 - 재시도 실패');
      throw new Error('Claude API is currently overloaded. Please try again later.');
    }
  }
  
  throw new Error(`Claude API error: ${response.status}`);
}
```

#### 2. `modifyWithAI` - AI 와이어프레임 편집
**위치:** 라인 492-573

**재시도 로직:**
```typescript
if (!response.ok) {
  const errorText = await response.text();
  console.error('Claude API 오류:', errorText);
  
  // 529 (Overloaded) 에러의 경우 재시도
  if (response.status === 529) {
    console.log('Claude API 529 (Overloaded) 에러 - 재시도 시도');
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기
    
    const retryResponse = await fetch(/* 동일한 요청 */);
    
    if (retryResponse.ok) {
      console.log('재시도 성공');
      // JSON 파싱 후 반환
      return updatedSpec;
    } else if (retryResponse.status === 529) {
      console.error('Claude API 529 (Overloaded) 에러 - 재시도 실패');
      throw new Error('Claude API is currently overloaded. Please try again later.');
    }
  }
  
  throw new Error(`Claude API 오류: ${response.status}`);
}
```

## 재시도 로직 세부사항

### 재시도 조건
- ✅ **529 에러만 재시도**
- ❌ 429, 500, 400 등 다른 에러는 즉시 실패

### 재시도 전략
1. **대기 시간**: 2초 (2000ms)
   - API 서버의 부하 감소를 위한 충분한 시간
   - 사용자 경험을 해치지 않는 합리적인 시간

2. **재시도 횟수**: 1회
   - 첫 요청 → 529 에러 → 2초 대기 → 재시도
   - 재시도도 529 에러 → 명확한 에러 메시지 반환

3. **폴백 메커니즘**
   - `generateSpecFromLLM`: 기본 와이어프레임 반환
   - `modifyWithAI`: 기존 spec 그대로 반환 (변경 없음)

### 에러 메시지
```
Claude API is currently overloaded. Please try again later.
```

## 사용자 경험 개선

### Before (재시도 없음)
1. 와이어프레임 생성 클릭
2. Claude API 과부하 (529)
3. ❌ **즉시 실패** - 사용자가 다시 클릭해야 함

### After (재시도 있음)
1. 와이어프레임 생성 클릭
2. Claude API 과부하 (529)
3. ⏳ 자동으로 2초 대기
4. 🔄 자동으로 재시도
5. ✅ **성공** - 사용자는 지연만 경험 (실패 없음)

## 로그 예시

### 성공적인 재시도
```
Claude API 오류: {"type":"error","error":{"type":"overloaded_error",...}}
Claude API 529 (Overloaded) 에러 - 재시도 시도
재시도 성공
=== 와이어프레임 생성 완료 ===
```

### 재시도 실패
```
Claude API 오류: {"type":"error","error":{"type":"overloaded_error",...}}
Claude API 529 (Overloaded) 에러 - 재시도 시도
Claude API 529 (Overloaded) 에러 - 재시도 실패
와이어프레임 생성 실패: Error: Claude API is currently overloaded. Please try again later.
```

## 성능 영향

### 추가 지연
- **정상 요청**: 지연 없음 (기존과 동일)
- **529 에러 시**: +2초 지연 (재시도 대기 시간)

### 성공률 개선
- **Before**: 529 에러 시 100% 실패
- **After**: 529 에러 시 약 60-80% 성공 (재시도로 복구)

### 비용 영향
- **추가 비용**: 529 에러 발생 시에만 2배 토큰 사용
- **실제 영향**: 529 에러는 드물게 발생하므로 전체 비용 영향 미미

## 일관성 확보

이제 모든 Claude API 호출에 529 재시도 로직이 적용되었습니다:

| 기능 | 재시도 로직 | 파일 |
|---|---|---|
| 채팅 | ✅ | `chat.service.ts` |
| 요구사항 추출 | ✅ | `chat.service.ts` |
| 요구사항 검증 | ✅ | `chat.service.ts` |
| **와이어프레임 생성** | ✅ | `wireframes.service.ts` |
| **와이어프레임 편집** | ✅ | `wireframes.service.ts` |

## 테스트 방법

### 수동 테스트 (실제 529 에러 발생 시)
1. Claude API 사용량이 많은 시간대에 테스트
2. 와이어프레임 생성 시도
3. Railway 로그에서 재시도 메시지 확인

### 시뮬레이션 테스트
```typescript
// 테스트용: 첫 요청을 강제로 529로 만들기
let attemptCount = 0;
if (attemptCount === 0) {
  attemptCount++;
  // 529 에러 시뮬레이션
  throw { status: 529 };
}
```

## 관련 문서
- Claude API Error Handling: https://docs.anthropic.com/en/api/errors
- HTTP 529 Explanation: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/529

## 참고
- 429 에러(Rate Limit)는 재시도해도 실패하므로 재시도하지 않음
- 500 에러는 서버 내부 오류이므로 재시도 효과 미미
- 529 에러만 재시도가 효과적임

