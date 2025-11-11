# 요구사항 필드 보존 버그 수정

## 문제점
**하나의 중분류 내에 여러 개의 "결정 필요" 소분류 요구사항**이 있을 때, 하나만 편집하여 저장하면 **나머지 요구사항의 "결정 필요" 태그가 사라지는** 버그가 발생했습니다.

## 증상
```
중분류: "예산 관리"
  - 소분류 A: "항공료 최적화" (결정 필요 ✅)
  - 소분류 B: "숙박비 설정" (결정 필요 ✅)
  - 소분류 C: "환전 가이드" (결정 필요 ✅)

소분류 A만 편집하여 저장
  → 소분류 A: "승인됨" ✅
  → 소분류 B: "결정 필요" → "승인됨" ❌ (사라짐)
  → 소분류 C: "결정 필요" → "승인됨" ❌ (사라짐)
```

## 원인 분석

### 근본 원인
`applyModalChangesToStructure` 함수에서 요구사항을 업데이트할 때 **편집되지 않은 필드도 덮어쓰기** 때문입니다:

#### Before (버그 있는 코드)
```typescript
newSubCategories[subIndex].requirements[reqIndex] = {
  ...prev,
  id: item.id,
  title: item.title,
  description: item.description,
  // 항상 이렇게 덮어씀 ❌
  status: "approved",
  needsClarification: false,
  clarificationQuestions: [],
};
```

### 문제 발생 시나리오

1. **모달에 전체 요구사항 전달**
   - `getModalRequirementsForCategory`가 카테고리 내 모든 요구사항 전달
   - 편집되지 않은 요구사항도 배열에 포함됨

2. **인라인 편집 실행**
   - `RequirementManagementPanel`에서 특정 요구사항만 편집
   - 편집된 항목에만 `status: "approved"`, `needsClarification: false` 설정

3. **`onRequirementsChange` 호출**
   - `SimpleRequirementModal`이 **전체 배열**을 전달
   - 편집되지 않은 요구사항은 원본 필드 유지

4. **`applyModalChangesToStructure` 처리**
   - 모든 요구사항에 대해 `status: "approved"` 강제 설정 ❌
   - 편집되지 않은 요구사항도 `needsClarification: false` 설정 ❌
   - **결과**: 편집하지 않은 요구사항의 태그가 사라짐

## 해결 방법

### 조건부 필드 업데이트
`item`에 해당 필드가 있으면 사용하고, 없으면 **기존 값을 유지**하도록 수정했습니다.

#### After (수정된 코드)
```typescript
newSubCategories[subIndex].requirements[reqIndex] = {
  ...prev,
  id: item.id,
  title: item.title,
  description: item.description,
  // item에 status가 있으면 사용, 없으면 기존 값 유지 ✅
  status: item.status || prev.status || "approved",
  // item에 needsClarification이 있으면 사용, 없으면 기존 값 유지 ✅
  needsClarification:
    item.needsClarification !== undefined
      ? item.needsClarification
      : prev.needsClarification,
  // item에 clarificationQuestions가 있으면 사용, 없으면 기존 값 유지 ✅
  clarificationQuestions:
    item.clarificationQuestions || prev.clarificationQuestions || [],
  // 다른 필드들도 기존 값 유지
  priority: item.priority || prev.priority || "medium",
};
```

## 핵심 변경사항

### 1. ID 매핑 성공 시 (720-742 라인)
```typescript
// item에 status가 있으면 사용, 없으면 기존 값 유지
status: item.status || prev.status || "approved",

// item에 needsClarification이 있으면 사용, 없으면 기존 값 유지
needsClarification:
  item.needsClarification !== undefined
    ? item.needsClarification
    : prev.needsClarification,
```

### 2. ID 매핑 실패 시 (제목 매칭) (761-778 라인)
```typescript
// item에 status가 있으면 사용, 없으면 기존 값 유지
status: item.status || req.status || "approved",

// item에 needsClarification이 있으면 사용, 없으면 기존 값 유지
needsClarification:
  item.needsClarification !== undefined
    ? item.needsClarification
    : req.needsClarification,
```

## 처리 흐름

### Before (버그 있음)
```
전체 요구사항 배열 전달:
[
  { id: 'A', title: '항공료', needsClarification: false },  // 편집됨
  { id: 'B', title: '숙박비', needsClarification: true },   // 편집 안 됨
  { id: 'C', title: '환전', needsClarification: true }      // 편집 안 됨
]

처리:
- A: status="approved", needsClarification=false ✅
- B: status="approved", needsClarification=false ❌ (잘못 덮어씀!)
- C: status="approved", needsClarification=false ❌ (잘못 덮어씀!)
```

### After (수정됨)
```
전체 요구사항 배열 전달:
[
  { id: 'A', title: '항공료', needsClarification: false },  // 편집됨
  { id: 'B', title: '숙박비', needsClarification: true },   // 편집 안 됨
  { id: 'C', title: '환전', needsClarification: true }      // 편집 안 됨
]

처리:
- A: status="approved", needsClarification=false ✅
- B: status=undefined → 기존 값 유지, needsClarification=true ✅
- C: status=undefined → 기존 값 유지, needsClarification=true ✅
```

## 중요 포인트

### `needsClarification` 처리
```typescript
needsClarification:
  item.needsClarification !== undefined
    ? item.needsClarification
    : prev.needsClarification
```

**이유**: 
- `false`도 유효한 값
- `undefined`와 `false`를 구분해야 함
- `||` 대신 `!== undefined` 사용

### `status` 처리
```typescript
status: item.status || prev.status || "approved"
```

**이유**:
- 편집된 항목은 `"approved"`
- 편집 안 된 항목은 기존 값 유지
- 모두 없으면 기본값 "approved"

## 테스트 시나리오

### 1. 단일 항목 편집
```
중분류: "예산 관리"
  - 소분류 A (결정 필요) 편집
  - 저장
  
예상: 소분류 A만 "승인됨", 나머지 그대로 ✅
```

### 2. 다중 항목 편집
```
중분류: "예산 관리"
  - 소분류 A (결정 필요) 편집
  - 소분류 B (결정 필요) 편집
  - 저장
  
예상: A, B만 "승인됨", 나머지 그대로 ✅
```

### 3. 결정 필요 항목 보존
```
중분류: "예산 관리"
  - 소분류 A (결정 필요 ✅) 편집 안 함
  - 소분류 B (결정 필요 ✅) 편집 안 함
  - 소분류 C (결정 필요 ✅) 편집 안 함
  - 다른 카테고리의 항목 편집
  - 저장
  
예상: A, B, C 모두 "결정 필요" 유지 ✅
```

### 4. 혼합 시나리오
```
중분류: "예산 관리"
  - 소분류 A (결정 필요) → 편집
  - 소분류 B (결정 필요) → 편집 안 함
  - 소분류 C (승인됨) → 편집 안 함
  - 소분류 D (결정 필요) → 편집 안 함
  - 저장
  
예상:
  - A: "승인됨" ✅
  - B: "결정 필요" 유지 ✅
  - C: "승인됨" 유지 ✅
  - D: "결정 필요" 유지 ✅
```

## 영향 범위

### 수정된 파일
- `frontend/src/app/page.tsx` (725-742, 761-778 라인)

### 영향받는 기능
- 요구사항 인라인 편집
- 모달에서 전체 저장
- 필드 값 보존

### 영향받지 않는 기능
- 요구사항 추가
- 요구사항 삭제
- 채팅 업데이트

## 추가 개선 사항

### 1. 우선순위 보존
```typescript
priority: item.priority || prev.priority || "medium"
```

### 2. clarificationQuestions 보존
```typescript
clarificationQuestions:
  item.clarificationQuestions || prev.clarificationQuestions || []
```

### 3. ID 기반 매핑
```typescript
id: item.id || prev.id
```

## 예상 결과

### Before
```
총 10개 요구사항, 1개만 편집
→ 1개: "승인됨" ✅
→ 9개: "승인됨" ❌ (태그 사라짐)

사용자 경험: 일부 편집했는데 모두 승인됨으로 바뀜
```

### After
```
총 10개 요구사항, 1개만 편집
→ 1개: "승인됨" ✅
→ 9개: 기존 상태 유지 ✅

사용자 경험: 편집한 항목만 변경됨, 나머지는 그대로
```

## 회귀 테스트

### 필수 테스트
- [ ] 단일 항목 편집 시 다른 항목 상태 유지
- [ ] 다중 항목 편집 시 편집 안 된 항목 상태 유지
- [ ] 결정 필요 태그 보존 확인
- [ ] 승인됨 태그 보존 확인
- [ ] 신규 추가 항목 상태 정상 설정

### 경계 테스트
- [ ] 필드가 undefined인 경우
- [ ] 필드가 false인 경우
- [ ] 필드가 빈 배열인 경우
- [ ] 모든 필드가 없는 경우

## 결론

### 문제
전체 요구사항 배열을 업데이트할 때 편집되지 않은 필드도 강제로 변경함

### 해결
`item`에 해당 필드가 있는지 확인하고, 없으면 기존 값을 유지

### 결과
- 편집한 항목만 변경됨
- 편집 안 한 항목은 기존 상태 유지
- "결정 필요" 태그가 보존됨
- 사용자 경험 개선

