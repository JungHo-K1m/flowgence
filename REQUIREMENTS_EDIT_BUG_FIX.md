# 요구사항 연속 편집 버그 수정

## 문제점
같은 중분류 내의 소분류 요구사항을 **연속으로 수정할 때**, 첫 번째 수정은 성공하지만 두 번째부터는 업데이트가 반영되지 않는 버그가 발생했습니다.

## 원인 분석

### 문제 발생 시나리오
1. 요구사항 A를 편집하고 모달을 닫음 → 성공 ✅
2. 같은 카테고리에서 요구사항 B를 편집하고 모달을 닫음 → 실패 ❌
3. 요구사항 B가 업데이트되지 않음

### 근본 원인
`applyModalChangesToStructure` 함수에서 **ID → 인덱스 매핑**을 생성할 때 **잘못된 순서**로 처리가 되었습니다:

```typescript
// Before: 잘못된 순서
1. requirementIndexMap 생성 (원본 데이터 기준)
2. newSubCategories 얕은 복사
3. 삭제 작업 수행
4. updatedFlatList 순회하면서 업데이트
   → requirementIndexMap은 삭제 전 인덱스를 가리킴!
   → 첫 번째 편집은 성공 (원본 인덱스 유지)
   → 두 번째 편집은 실패 (이미 변경된 인덱스)
```

### 세부 설명
- 첫 번째 편집 시에는 원본 인덱스를 사용하므로 정상 작동
- 두 번째 편집 시에는 `requirementIndexMap`이 여전히 **삭제 전 인덱스**를 참조
- 하지만 실제 배열은 이미 첫 번째 편집으로 인해 변경됨
- 결과적으로 잘못된 위치의 요구사항이 업데이트되거나 아예 찾지 못함

## 해결 방법

### 수정된 로직
```typescript
// After: 올바른 순서
1. newSubCategories 얕은 복사
2. 삭제 작업 수행
3. requirementIndexMap 생성 (삭제 후 데이터 기준) ✅
4. updatedFlatList 순회하면서 업데이트
   → 삭제 후 생성된 인덱스 사용
   → 모든 편집이 정확한 위치 반영
```

### 코드 변경사항

#### Before (잘못된 코드)
```typescript
// 기존 요구사항을 id -> 위치 매핑으로 빠르게 찾도록 준비
const requirementIndexMap = new Map<...>();
cat.subCategories.forEach((sub, si: number) => {
  (sub.requirements || []).forEach((req: Requirement, ri: number) => {
    if (req.id)
      requirementIndexMap.set(req.id, { subIndex: si, reqIndex: ri });
  });
});

// 변환용 얕은 복사
const newSubCategories = cat.subCategories.map(...);

// 삭제 작업
keepIds.forEach(...);
// ... 삭제 로직

// 업데이트 처리 (잘못된 인덱스 참조)
updatedFlatList.forEach((item) => {
  const found = item.id && requirementIndexMap.get(item.id); // ❌ 삭제 전 인덱스!
  // ...
});
```

#### After (수정된 코드)
```typescript
// 변환용 얕은 복사
const newSubCategories = cat.subCategories.map(...);

// 1) 삭제 작업 먼저 수행
const keepIds = new Set(...);
newSubCategories.forEach((sub) => {
  sub.requirements = sub.requirements.filter(
    (req: Requirement) => !req.id || keepIds.has(req.id)
  );
});

// 2) 삭제 후 requirementIndexMap 재생성 ✅
const requirementIndexMap = new Map<...>();
newSubCategories.forEach((sub, si: number) => {
  (sub.requirements || []).forEach((req: Requirement, ri: number) => {
    if (req.id) {
      requirementIndexMap.set(req.id, { subIndex: si, reqIndex: ri });
    }
  });
});

// 3) 업데이트 처리 (올바른 인덱스 참조)
updatedFlatList.forEach((item) => {
  const found = item.id && requirementIndexMap.get(item.id); // ✅ 삭제 후 인덱스!
  // ...
});
```

## 핵심 변경사항

### 1. 매핑 생성 시점 변경
- **Before**: `newSubCategories` 생성 전에 매핑 생성
- **After**: 삭제 작업 **후**에 매핑 생성

### 2. 로직 순서 재구성
```typescript
// 올바른 순서
1. 얕은 복사 (원본 보존)
2. 삭제 작업 (불필요한 항목 제거)
3. 인덱스 매핑 재생성 (현재 상태 기준)
4. 업데이트 작업 (정확한 위치에 반영)
```

### 3. 주석 추가
```typescript
// 2) 삭제 후 requirementIndexMap 재생성 (삭제 작업 후에 생성)
// 중요: 삭제된 항목이 제거된 후에 매핑을 생성해야 올바른 인덱스 보장
```

## 테스트 시나리오

### 1. 단일 요구사항 편집
- [ ] 하나의 요구사항만 편집
- [ ] 저장 성공 확인
- [ ] UI에 반영 확인

### 2. 같은 카테고리의 여러 요구사항 순차 편집
- [ ] 요구사항 A 편집 → 저장 성공
- [ ] 요구사항 B 편집 → 저장 성공 ✅ (이전 버그)
- [ ] 요구사항 C 편집 → 저장 성공 ✅ (이전 버그)
- [ ] 모든 변경사항이 UI에 반영되는지 확인

### 3. 다른 카테고리의 요구사항 편집
- [ ] 카테고리 A의 요구사항 편집
- [ ] 카테고리 B의 요구사항 편집
- [ ] 양쪽 모두 저장 성공 확인

### 4. 요구사항 삭제 후 편집
- [ ] 요구사항 A 삭제
- [ ] 같은 카테고리의 요구사항 B 편집
- [ ] 저장 성공 확인

## 예상 결과

### Before (버그 있을 때)
```
편집 처리:
  - 요구사항 A: ✓ found → 업데이트 성공
  - 요구사항 B: ✗ not found → 업데이트 실패 (인덱스 불일치)
  - 요구사항 C: ✗ not found → 업데이트 실패 (인덱스 불일치)
```

### After (수정 후)
```
편집 처리:
  - 요구사항 A: ✓ found → 업데이트 성공
  - 요구사항 B: ✓ found → 업데이트 성공 ✅
  - 요구사항 C: ✓ found → 업데이트 성공 ✅
```

## 영향 범위

### 수정된 파일
- `frontend/src/app/page.tsx` (629-795 라인)

### 영향받는 기능
- 요구사항 편집 모달 (SimpleRequirementModal)
- 모달 내 개별 요구사항 수정
- 모달 내 개별 요구사항 삭제
- 카테고리별 요구사항 목록 업데이트

### 영향받지 않는 기능
- 요구사항 추가
- 카테고리 삭제
- 채팅으로 요구사항 업데이트

## 추가 개선 사항

### 1. 로깅 강화
```typescript
console.log("편집 처리 시작 - requirementIndexMap (삭제 후 재생성):", requirementIndexMap);
```

### 2. 에러 핸들링
```typescript
try {
  await saveEditedRequirements(next);
  console.log("편집 완료 - 업데이트된 요구사항:", next);
} catch (error) {
  console.error("편집된 요구사항 저장 실패:", error);
}
```

### 3. 코드 가독성 향상
- 주석 번호 통일 (1, 2, 3, 4)
- 단계별 명확한 구분
- 중요 포인트 명시

## 성능 영향
- **미미함**: 삭제 작업 전후에 매핑을 한 번 더 생성하는 작업이지만, 요구사항 개수가 적어 성능 영향은 없음
- **정확성 우선**: 약간의 추가 작업으로 데이터 무결성 확보

## 회귀 테스트
- [ ] 단일 편집 기능 정상 작동
- [ ] 여러 편집 연속 수행 정상 작동
- [ ] 삭제 기능 정상 작동
- [ ] 추가 기능 정상 작동
- [ ] 채팅 업데이트 기능 정상 작동

## 추가 고려사항
1. **인덱스 기반 업데이트의 한계**: ID 기반으로 인덱스 매핑을 사용하는 것은 배열 변경 시 위험할 수 있음
2. **향후 개선 방안**: ID 기반 직접 업데이트로 전환하여 인덱스 의존성 제거
3. **불변성 원칙**: 새로운 배열을 생성하여 불변성 유지 (현재 구현 ✅)

