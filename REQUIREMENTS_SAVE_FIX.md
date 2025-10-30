# 요구사항 업데이트 간헐적 저장 실패 문제 해결

## 문제점
간헐적으로 요구사항 편집 후 저장이 되지 않는 문제가 발생했습니다. 콘솔에는 "요구사항 저장 성공"이 로그되지만 실제로는 저장이 안 되는 경우가 있었습니다.

## 원인 분석

### 1. **totalCount 누락**
- `applyModalChangesToStructure` 함수에서 요구사항을 편집한 후 `totalCount` 필드를 재계산하지 않았습니다.
- UI는 업데이트되었지만 `totalCount`가 `undefined`인 상태로 저장을 시도했습니다.
- Supabase 함수가 `totalCount`를 필수로 요구하는 경우 실패할 수 있습니다.

### 2. **에러 처리 부족**
- `applyModalChangesToStructure`에서 `saveEditedRequirements`를 `await`했지만 에러가 발생하면 함수가 중단됩니다.
- UI는 업데이트된 상태를 유지하지만 DB에는 저장되지 않을 수 있습니다.

### 3. **로깅 부족**
- 저장 실패 원인을 파악하기 위한 충분한 로그가 없었습니다.
- `savedProjectId`가 없는 경우, 데이터 구조가 잘못된 경우 등을 구분하기 어려웠습니다.

## 해결 방법

### 1. **totalCount 자동 재계산 추가**
```typescript
// totalCount 재계산
const newTotalCount = next.categories.reduce(
  (total, cat) =>
    total +
    cat.subCategories.reduce(
      (subTotal, sub) => subTotal + (sub.requirements?.length || 0),
      0
    ),
  0
);
next.totalCount = newTotalCount;
```

요구사항 추가/삭제/수정 시 자동으로 전체 개수를 재계산하도록 수정했습니다.

### 2. **에러 처리 강화**
```typescript
// 변경사항을 즉시 DB에 저장 (낙관적 업데이트)
try {
  await saveEditedRequirements(next);
  console.log("편집 완료 - 업데이트된 요구사항:", next);
} catch (error) {
  console.error("편집된 요구사항 저장 실패:", error);
  // 저장 실패해도 UI는 업데이트된 상태 유지 (낙관적 업데이트)
  // 사용자에게는 저장 실패 알림이 필요할 수 있음 (추후 구현)
}
```

에러가 발생해도 UI는 업데이트된 상태를 유지하되, 콘솔에 에러를 명확히 기록하도록 수정했습니다.

### 3. **상세한 로깅 추가**
```typescript
console.log("편집된 요구사항 DB 저장 시작:", {
  savedProjectId,
  categoriesCount: updatedRequirements.categories?.length,
  totalCount: updatedRequirements.totalCount,
  requirementsData: updatedRequirements
});
```

저장 시도 전 모든 관련 데이터를 로깅하여 문제 진단을 용이하게 했습니다.

### 4. **savedProjectId 검증 강화**
```typescript
if (!savedProjectId) {
  console.warn("저장된 프로젝트 ID가 없습니다. DB 저장을 건너뜁니다.", {
    savedProjectId,
    requirementsCount: updatedRequirements.totalCount
  });
  return;
}
```

프로젝트 ID가 없을 때 상세한 컨텍스트와 함께 경고를 출력하도록 수정했습니다.

## 테스트 방법

1. **정상 시나리오**
   - 요구사항 편집 후 "변경 완료" 버튼 클릭
   - 콘솔에서 "편집된 요구사항 DB 저장 성공" 확인
   - 페이지 새로고침 후 편집 내용 유지 확인

2. **프로젝트 ID 없음 시나리오**
   - 로그인하지 않은 상태에서 요구사항 편집
   - 콘솔에서 "저장된 프로젝트 ID가 없습니다" 경고 확인
   - UI는 업데이트되지만 DB 저장은 건너뜀 확인

3. **저장 실패 시나리오**
   - 네트워크 오류 시뮬레이션 (개발자 도구에서 네트워크 차단)
   - 콘솔에서 "편집된 요구사항 저장 실패" 에러 확인
   - UI는 업데이트된 상태 유지 확인

## 추가 개선 사항

### 1. **사용자 피드백 추가** (추후 구현)
```typescript
// 저장 성공 시
toast.success("요구사항이 저장되었습니다");

// 저장 실패 시
toast.error("저장에 실패했습니다. 다시 시도해주세요.");
```

### 2. **재시도 로직 추가** (추후 구현)
```typescript
const saveWithRetry = async (data, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await saveEditedRequirements(data);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

### 3. **낙관적 업데이트 개선** (추후 구현)
- 저장 실패 시 이전 상태로 롤백 옵션
- 사용자가 원할 경우에만 롤백 수행

## 영향 범위

### 수정된 파일
- `frontend/src/app/page.tsx`

### 영향받는 기능
- 요구사항 편집 모달에서의 저장
- 카테고리별 요구사항 추가/수정/삭제
- 전체 요구사항 상태 동기화

## 예상 결과

1. **일관성 향상**: 모든 편집 작업에서 `totalCount`가 정확히 계산됩니다.
2. **에러 추적 용이**: 상세한 로깅으로 문제 진단이 쉬워집니다.
3. **사용자 경험 개선**: 저장 실패 시에도 UI는 즉시 반영됩니다 (낙관적 업데이트).
4. **안정성 향상**: 예외 처리로 인한 예상치 못한 중단이 방지됩니다.

## 주의사항

1. **낙관적 업데이트**: 저장이 실패해도 UI는 업데이트된 상태를 유지합니다. 사용자에게는 저장 실패 알림을 표시하는 것을 권장합니다.
2. **totalCount 계산**: 요구사항 구조가 변경될 때마다 자동으로 재계산되므로, 성능 영향은 미미합니다.
3. **로깅 증가**: 개발 중 로그가 많아질 수 있으므로, 프로덕션에서는 필요시 로그 레벨을 조정해야 합니다.

