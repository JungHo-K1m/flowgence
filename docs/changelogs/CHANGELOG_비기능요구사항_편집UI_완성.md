# 변경 이력: 비기능 요구사항 편집 UI 완성

**날짜**: 2025-11-07  
**작업자**: AI Assistant  
**요청자**: 사용자

---

## 📋 작업 개요

비기능 요구사항 편집 UI를 구현하고, 기존 편집 로직(`saveEditedRequirements`)을 재사용하여 추가/편집/삭제 기능을 완성했습니다.

### 🎯 작업 목표

**요청사항:**
> "가능하면 기존의 편집 로직을 그대로 적용하고자 한다. 가능할까??"

**달성 결과:**
- ✅ 기존 `saveEditedRequirements` 함수 100% 재사용
- ✅ 기존 편집 패턴(`handleRequirementStatusChange`, `handleCategoryDelete` 등)과 동일한 구조
- ✅ 완전한 추가/편집/삭제 기능 구현
- ✅ 인라인 모달 UI 추가

---

## 🔧 구현 내용

### 1. 편집 핸들러 추가 (page.tsx)

#### 추가된 함수들

**기존 패턴:**
```typescript
const handleRequirementStatusChange = useCallback(
  async (requirementId: string, newStatus: string) => {
    const updatedRequirements = { ...editableRequirements, /* 수정 */ };
    setEditableRequirements(updatedRequirements);
    await saveEditedRequirements(updatedRequirements);
  },
  [editableRequirements, saveEditedRequirements]
);
```

**비기능 요구사항용 함수 (동일한 패턴):**

```typescript
// 1. 추가 핸들러
const handleAddNFR = useCallback(
  async (newNFR: {
    category: string;
    description: string;
    priority: "high" | "medium" | "low";
    metrics?: string;
  }) => {
    if (!editableRequirements) return;

    try {
      const nfrId = `nfr-${Date.now()}`;
      const updatedRequirements = {
        ...editableRequirements,
        nonFunctionalRequirements: [
          ...(editableRequirements.nonFunctionalRequirements || []),
          {
            id: nfrId,
            ...newNFR,
          },
        ],
      };

      setEditableRequirements(updatedRequirements);
      await saveEditedRequirements(updatedRequirements); // ← 기존 함수 재사용
      console.log("비기능 요구사항 추가 완료:", nfrId);
    } catch (error) {
      console.error("비기능 요구사항 추가 실패:", error);
      throw error;
    }
  },
  [editableRequirements, saveEditedRequirements]
);

// 2. 편집 핸들러
const handleEditNFR = useCallback(
  async (
    nfrId: string,
    updatedNFR: {
      category: string;
      description: string;
      priority: "high" | "medium" | "low";
      metrics?: string;
    }
  ) => {
    if (!editableRequirements) return;

    try {
      const updatedRequirements = {
        ...editableRequirements,
        nonFunctionalRequirements: (
          editableRequirements.nonFunctionalRequirements || []
        ).map((nfr) =>
          nfr.id === nfrId
            ? {
                ...nfr,
                ...updatedNFR,
              }
            : nfr
        ),
      };

      setEditableRequirements(updatedRequirements);
      await saveEditedRequirements(updatedRequirements); // ← 기존 함수 재사용
      console.log("비기능 요구사항 편집 완료:", nfrId);
    } catch (error) {
      console.error("비기능 요구사항 편집 실패:", error);
      throw error;
    }
  },
  [editableRequirements, saveEditedRequirements]
);

// 3. 삭제 핸들러
const handleDeleteNFR = useCallback(
  async (nfrId: string) => {
    if (!editableRequirements) return;

    try {
      const updatedRequirements = {
        ...editableRequirements,
        nonFunctionalRequirements: (
          editableRequirements.nonFunctionalRequirements || []
        ).filter((nfr) => nfr.id !== nfrId),
      };

      setEditableRequirements(updatedRequirements);
      await saveEditedRequirements(updatedRequirements); // ← 기존 함수 재사용
      console.log("비기능 요구사항 삭제 완료:", nfrId);
    } catch (error) {
      console.error("비기능 요구사항 삭제 실패:", error);
      throw error;
    }
  },
  [editableRequirements, saveEditedRequirements]
);
```

**핵심 포인트:**
- `saveEditedRequirements` 함수를 100% 재사용
- 기존 편집 패턴과 완전히 동일한 구조
- `editableRequirements` 상태 직접 수정 → DB 저장
- 에러 처리 및 로깅 일관성 유지

---

### 2. Props 전달 (page.tsx → RequirementsPanel)

```typescript
<RequirementsPanel
  // ... 기존 props
  onAddNFR={handleAddNFR}      // ← 추가
  onEditNFR={handleEditNFR}    // ← 추가
  onDeleteNFR={handleDeleteNFR} // ← 추가
  isNextButtonEnabled={isStep2ButtonEnabled}
  isLoading={isOverviewLoading}
/>
```

---

### 3. RequirementsPanel 인터페이스 확장

```typescript
interface RequirementsPanelProps {
  // ... 기존 props
  onAddNFR?: (newNFR: {
    category: string;
    description: string;
    priority: "high" | "medium" | "low";
    metrics?: string;
  }) => Promise<void>;
  
  onEditNFR?: (
    nfrId: string,
    updatedNFR: {
      category: string;
      description: string;
      priority: "high" | "medium" | "low";
      metrics?: string;
    }
  ) => Promise<void>;
  
  onDeleteNFR?: (nfrId: string) => Promise<void>;
}
```

---

### 4. 모달 상태 관리 (RequirementsPanel.tsx)

```typescript
// 비기능 요구사항 모달 상태
const [showNFRModal, setShowNFRModal] = useState(false);
const [editingNFR, setEditingNFR] = useState<any>(null);
```

---

### 5. 버튼 연결

#### A. 추가 버튼
```typescript
<button
  onClick={(e) => {
    e.stopPropagation();
    requireAuth(() => {
      setEditingNFR(null); // 새 항목 추가 모드
      setShowNFRModal(true);
    });
  }}
  className="px-3 py-1 text-sm font-medium text-[#4F46E5] rounded"
>
  + 새 요구사항
</button>
```

#### B. 편집 버튼
```typescript
<button
  onClick={() => {
    requireAuth(() => {
      setEditingNFR(nfr); // 편집 모드
      setShowNFRModal(true);
    });
  }}
  className="px-2 py-1 text-xs text-[#4F46E5] hover:bg-indigo-50 rounded"
>
  편집
</button>
```

#### C. 삭제 버튼
```typescript
<button
  onClick={() => {
    requireAuth(async () => {
      if (window.confirm("이 비기능 요구사항을 삭제하시겠습니까?")) {
        try {
          await onDeleteNFR?.(nfr.id);
        } catch (error) {
          console.error("삭제 실패:", error);
          alert("삭제 중 오류가 발생했습니다.");
        }
      }
    });
  }}
  className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
>
  삭제
</button>
```

---

### 6. 편집 모달 컴포넌트

#### 완전한 폼 UI 구현

```typescript
function NFREditModal({
  isOpen,
  nfr,
  onSave,
  onClose,
}: {
  isOpen: boolean;
  nfr: any;
  onSave: (data: {
    category: string;
    description: string;
    priority: "high" | "medium" | "low";
    metrics?: string;
  }) => Promise<void>;
  onClose: () => void;
}) {
  const [category, setCategory] = useState(nfr?.category || "");
  const [description, setDescription] = useState(nfr?.description || "");
  const [priority, setPriority] = useState<"high" | "medium" | "low">(
    nfr?.priority || "medium"
  );
  const [metrics, setMetrics] = useState(nfr?.metrics || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category.trim() || !description.trim()) {
      alert("카테고리와 설명은 필수입니다.");
      return;
    }
    await onSave({
      category: category.trim(),
      description: description.trim(),
      priority,
      metrics: metrics.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <form onSubmit={handleSubmit}>
          {/* 카테고리 선택 */}
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="성능">⚡ 성능 (Performance)</option>
            <option value="보안">🔒 보안 (Security)</option>
            <option value="사용성">👥 사용성 (Usability)</option>
            <option value="호환성">🔄 호환성 (Compatibility)</option>
            <option value="확장성">📈 확장성 (Scalability)</option>
            <option value="유지보수성">🛠️ 유지보수성 (Maintainability)</option>
          </select>

          {/* 설명 입력 */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="구체적이고 측정 가능한 요구사항을 입력하세요"
          />

          {/* 우선순위 라디오 버튼 */}
          <div>
            <label>
              <input type="radio" value="high" checked={priority === "high"} />
              높음
            </label>
            <label>
              <input type="radio" value="medium" checked={priority === "medium"} />
              중간
            </label>
            <label>
              <input type="radio" value="low" checked={priority === "low"} />
              낮음
            </label>
          </div>

          {/* 측정 지표 (선택사항) */}
          <input
            type="text"
            value={metrics}
            onChange={(e) => setMetrics(e.target.value)}
            placeholder="예: 페이지 로드 시간 < 3초"
          />

          <button type="submit">{nfr ? "수정" : "추가"}</button>
        </form>
      </div>
    </div>
  );
}
```

#### 모달 호출
```typescript
{showNFRModal && (
  <NFREditModal
    isOpen={showNFRModal}
    nfr={editingNFR}
    onSave={async (data) => {
      try {
        if (editingNFR) {
          await onEditNFR?.(editingNFR.id, data);
        } else {
          await onAddNFR?.(data);
        }
        setShowNFRModal(false);
        setEditingNFR(null);
      } catch (error) {
        console.error("저장 실패:", error);
        alert("저장 중 오류가 발생했습니다.");
      }
    }}
    onClose={() => {
      setShowNFRModal(false);
      setEditingNFR(null);
    }}
  />
)}
```

---

## 🎨 UI 미리보기

### 편집 모달

```
┌────────────────────────────────────────────────────────┐
│ 새 비기능 요구사항 추가                        [X]     │
├────────────────────────────────────────────────────────┤
│                                                         │
│ 카테고리 *                                              │
│ [⚡ 성능 (Performance)        ▼]                       │
│                                                         │
│ 요구사항 설명 *                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ 모든 페이지는 3초 이내에 로드되어야 한다.       │   │
│ │                                                 │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ 우선순위 *                                              │
│ ⦿ 높음   ○ 중간   ○ 낮음                               │
│                                                         │
│ 측정 지표 (선택사항)                                    │
│ [ 페이지 로드 시간 < 3초                          ]   │
│                                                         │
├────────────────────────────────────────────────────────┤
│                               [취소]  [추가]           │
└────────────────────────────────────────────────────────┘
```

---

## 📊 데이터 흐름

```
사용자 액션
    ↓
┌─────────────────────────────────────────────────────┐
│ 1. 버튼 클릭 (추가/편집/삭제)                        │
│    - "새 요구사항" → setEditingNFR(null)            │
│    - "편집" → setEditingNFR(nfr)                    │
│    - "삭제" → onDeleteNFR(nfr.id)                   │
└─────────────────┬───────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────┐
│ 2. 모달 표시 (추가/편집만)                           │
│    - NFREditModal 컴포넌트 렌더링                    │
│    - 폼 입력 (카테고리, 설명, 우선순위, 지표)        │
└─────────────────┬───────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────┐
│ 3. 저장 (page.tsx 핸들러 호출)                       │
│    - handleAddNFR() 또는 handleEditNFR()            │
│    - editableRequirements 상태 업데이트              │
└─────────────────┬───────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────┐
│ 4. DB 저장 (기존 로직 재사용)                        │
│    - saveEditedRequirements(updatedRequirements)     │
│    - Supabase projects.requirements JSONB 업데이트   │
└─────────────────┬───────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────┐
│ 5. UI 반영                                           │
│    - 모달 닫기                                       │
│    - 카드 목록 자동 업데이트                         │
└─────────────────────────────────────────────────────┘
```

---

## ✅ 주요 특징

### 1. 기존 로직 100% 재사용
- `saveEditedRequirements` 함수 그대로 사용
- `editableRequirements` 상태 관리 패턴 유지
- 에러 처리 및 로깅 일관성

### 2. 타입 안정성
```typescript
// TypeScript 타입 정의
interface NFRData {
  category: string;
  description: string;
  priority: "high" | "medium" | "low";
  metrics?: string;
}
```

### 3. 사용자 경험
- ✅ 인증 가드 통합 (`requireAuth`)
- ✅ 확인 다이얼로그 (삭제 시)
- ✅ 에러 알림
- ✅ 폼 유효성 검사

### 4. 하위 호환성
- 기존 프로젝트 (NFR 없음) → 정상 작동
- 새 프로젝트 (NFR 있음) → 편집 가능

---

## 🔄 사용 시나리오

### A. 새 비기능 요구사항 추가

1. "🔧 비기능 요구사항" 클릭하여 펼치기
2. "+ 새 요구사항" 버튼 클릭
3. 모달에서 정보 입력:
   - 카테고리: "성능" 선택
   - 설명: "페이지 로드 3초 이내"
   - 우선순위: "높음"
   - 측정 지표: "평균 < 3초"
4. "추가" 버튼 클릭
5. 즉시 DB 저장 및 UI 반영

### B. 기존 비기능 요구사항 편집

1. 카드의 "편집" 버튼 클릭
2. 모달에 기존 데이터 표시
3. 정보 수정 (예: 우선순위 "중간" → "높음")
4. "수정" 버튼 클릭
5. 즉시 DB 저장 및 UI 반영

### C. 비기능 요구사항 삭제

1. 카드의 "삭제" 버튼 클릭
2. 확인 다이얼로그: "이 비기능 요구사항을 삭제하시겠습니까?"
3. "확인" 클릭
4. 즉시 DB에서 삭제 및 UI 반영

---

## 📂 수정된 파일 목록

```
✅ frontend/src/app/page.tsx
   - handleAddNFR() 추가
   - handleEditNFR() 추가
   - handleDeleteNFR() 추가
   - RequirementsPanel에 props 전달

✅ frontend/src/components/requirements/RequirementsPanel.tsx
   - Props 인터페이스 확장
   - 모달 상태 추가 (showNFRModal, editingNFR)
   - 버튼에 핸들러 연결
   - NFREditModal 컴포넌트 추가
```

---

## 🎯 테스트 시나리오

### 1. 추가 테스트
- [ ] 로그인하지 않고 "+ 새 요구사항" 클릭 → 로그인 모달 표시
- [ ] 로그인 후 "+ 새 요구사항" 클릭 → 편집 모달 표시
- [ ] 모달에서 정보 입력 후 "추가" → DB 저장 확인
- [ ] 페이지 새로고침 후 추가된 항목 표시 확인

### 2. 편집 테스트
- [ ] "편집" 버튼 클릭 → 모달에 기존 데이터 표시
- [ ] 정보 수정 후 "수정" → DB 업데이트 확인
- [ ] 페이지 새로고침 후 수정된 내용 반영 확인

### 3. 삭제 테스트
- [ ] "삭제" 버튼 클릭 → 확인 다이얼로그 표시
- [ ] "취소" 클릭 → 삭제되지 않음
- [ ] "확인" 클릭 → DB에서 삭제 확인
- [ ] UI에서 즉시 제거되는지 확인

### 4. 에러 처리 테스트
- [ ] 네트워크 오류 시 에러 메시지 표시
- [ ] 필수 필드 누락 시 경고 표시
- [ ] 모달 닫기 후 상태 초기화 확인

---

## 🚀 다음 단계 (향후 개선)

### Phase 3: 고급 기능

1. **드래그 앤 드롭**
   - 우선순위별 재정렬
   - 카테고리별 그룹핑

2. **템플릿 기능**
   ```typescript
   const NFR_TEMPLATES = {
     "e-commerce": [...],
     "admin-panel": [...],
   };
   ```

3. **일괄 편집**
   - 여러 항목 동시 선택
   - 우선순위 일괄 변경

4. **히스토리 관리**
   - 변경 이력 추적
   - 되돌리기 기능

---

## 📝 핵심 포인트

### ✅ 기존 로직 재사용의 장점

1. **코드 중복 제거**
   - `saveEditedRequirements` 함수 하나로 모든 저장 처리
   - 유지보수 포인트 최소화

2. **일관성 유지**
   - 기능 요구사항과 비기능 요구사항의 편집 로직 통일
   - 에러 처리, 로깅, 상태 관리 패턴 일치

3. **안정성**
   - 검증된 기존 함수 사용
   - 예상치 못한 버그 발생 가능성 감소

4. **확장성**
   - 향후 다른 유형의 요구사항 추가 시에도 동일한 패턴 적용 가능

---

## 🎉 완성!

비기능 요구사항 편집 기능이 **기존 로직을 100% 재사용**하여 완성되었습니다!

- ✅ 추가 기능
- ✅ 편집 기능
- ✅ 삭제 기능
- ✅ 모달 UI
- ✅ DB 자동 저장
- ✅ 인증 가드 통합

**테스트 준비 완료!** 🚀

---

**변경 이력 종료**

