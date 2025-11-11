# AI 검증 로딩 화면 통합 가이드

**날짜**: 2025-11-07  
**목적**: Step 2 → Step 3 전환 시 AI 검증 단계 추가

---

## 📋 개요

요구사항 편집 완료 후 "다음 단계" 버튼 클릭 시, AI가 요구사항을 검증하는 과정을 사용자에게 명확히 보여줍니다.

---

## 🎨 제공된 컴포넌트

### 1. AIVerificationLoading (상세 버전 - 추천 ⭐)

**특징:**
- ✅ 4단계 검증 프로세스 표시
- ✅ 단계별 체크마크 (✓ ⟳ ○)
- ✅ 프로그레스 바
- ✅ 예상 소요 시간 표시
- ✅ 각 단계별 자동 전환 (3초, 3초, 2.5초, 2초)

**검증 단계:**
1. 요구사항 일관성 검토 (3초)
2. 누락된 항목 확인 (3초)
3. 우선순위 검증 (2.5초)
4. 최종 검토 (2초)

**총 소요 시간:** 약 10.5초

---

### 2. AIVerificationLoadingSimple (간단 버전)

**특징:**
- ✅ 간결한 UI
- ✅ 순환 메시지 (3초마다 변경)
- ✅ 애니메이션 점(...)
- ✅ Tip 정보 표시

**메시지:**
- "요구사항 일관성을 확인하고 있습니다"
- "누락된 항목을 검토하고 있습니다"
- "우선순위를 분석하고 있습니다"

---

## 💻 통합 방법

### Step 1: page.tsx에 상태 추가

```typescript
// frontend/src/app/page.tsx

// 상태 추가
const [isVerifying, setIsVerifying] = useState(false);

// Import 추가
import { AIVerificationLoading } from "@/components/requirements/AIVerificationLoading";
// 또는
import { AIVerificationLoadingSimple } from "@/components/requirements/AIVerificationLoadingSimple";
```

---

### Step 2: handleNextStep 함수 수정

#### Option A: 기존 함수 확장 (추천)

```typescript
const handleNextStep = useCallback(async () => {
  // ... 기존 코드 ...

  // Step 2 → Step 3 전환 시 AI 검증 추가
  if (currentStep === 2) {
    try {
      // 검증 로딩 시작
      setIsVerifying(true);

      // AI 검증 API 호출
      const verificationResult = await verifyRequirements(
        editableRequirements || extractedRequirements
      );

      // 검증 결과 처리
      if (verificationResult.status === "success") {
        console.log("AI 검증 완료:", verificationResult);
        
        // 검증 결과로 요구사항 업데이트 (선택사항)
        if (verificationResult.optimizedRequirements) {
          setEditableRequirements(verificationResult.optimizedRequirements);
        }
      }
    } catch (error) {
      console.error("AI 검증 실패:", error);
      // 실패해도 진행 가능하도록 처리
    } finally {
      // 검증 완료
      setIsVerifying(false);
    }
  }

  // 다음 단계로 이동
  setCurrentStep(currentStep + 1);
}, [currentStep, editableRequirements, extractedRequirements]);
```

#### Option B: 별도 함수 생성

```typescript
const verifyAndProceed = useCallback(async () => {
  setIsVerifying(true);

  try {
    // AI 검증 실행
    const result = await fetch("/api/requirements/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requirements: editableRequirements || extractedRequirements,
        projectId: savedProjectId,
      }),
    });

    const data = await result.json();
    console.log("AI 검증 결과:", data);

    // 검증 결과 반영 (선택사항)
    if (data.suggestions) {
      // 사용자에게 제안사항 표시
      console.log("AI 제안사항:", data.suggestions);
    }
  } catch (error) {
    console.error("검증 중 오류:", error);
  } finally {
    setIsVerifying(false);
    setCurrentStep(3); // Step 3으로 이동
  }
}, [editableRequirements, extractedRequirements, savedProjectId]);

// RequirementsPanel의 onNextStep에 연결
<RequirementsPanel
  onNextStep={verifyAndProceed}
  // ... 기타 props
/>
```

---

### Step 3: 로딩 화면 렌더링

```typescript
export default function HomePage() {
  return (
    <div>
      {/* 기존 UI */}
      {currentStep === 2 && (
        <RequirementsPanel
          onNextStep={handleNextStep}
          // ... props
        />
      )}

      {/* AI 검증 로딩 (Step 2에서 다음 단계 버튼 클릭 시) */}
      {isVerifying && <AIVerificationLoading />}
      {/* 또는 */}
      {isVerifying && <AIVerificationLoadingSimple />}

      {/* Step 3 */}
      {currentStep === 3 && (
        <ConfirmationPanel
          // ... props
        />
      )}
    </div>
  );
}
```

---

## 🔧 백엔드 API 구현 (선택사항)

AI 검증을 실제로 수행하려면 백엔드 API가 필요합니다.

### API 엔드포인트

```typescript
// frontend/src/app/api/requirements/verify/route.ts

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { requirements, projectId } = await request.json();

    // AI 검증 로직 (Claude API 호출 등)
    const verificationResult = await performAIVerification(requirements);

    return NextResponse.json({
      status: "success",
      suggestions: verificationResult.suggestions,
      optimizedRequirements: verificationResult.optimized,
      warnings: verificationResult.warnings,
    });
  } catch (error) {
    console.error("AI 검증 오류:", error);
    return NextResponse.json(
      { status: "error", message: "검증 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

async function performAIVerification(requirements: any) {
  // Claude API를 사용한 검증 로직
  // 1. 요구사항 일관성 검사
  // 2. 누락된 항목 확인
  // 3. 우선순위 타당성 검증
  // 4. 중복 항목 감지
  
  return {
    suggestions: [],
    optimized: requirements,
    warnings: [],
  };
}
```

---

## 📊 UI 비교

### Option 1: AIVerificationLoading (상세)

```
┌────────────────────────────────────────────────┐
│                    ⟳                            │
│                                                 │
│         AI가 요구사항을 검증하고 있습니다       │
│      편집하신 내용을 확인하고 최적화하고 있습니다│
│                                                 │
│  ┌──────────────────────────────────────────┐ │
│  │  ✓ 요구사항 일관성 검토 완료             │ │
│  │  ⟳ 누락된 항목 확인 중...                │ │
│  │  ○ 우선순위 검증 예정                    │ │
│  │  ○ 최종 검토 예정                        │ │
│  └──────────────────────────────────────────┘ │
│                                                 │
│         ⏱️ 예상 소요 시간: 10-15초             │
│                                                 │
│  ████████████░░░░░░░░░ 60%                     │
└────────────────────────────────────────────────┘
```

### Option 2: AIVerificationLoadingSimple (간단)

```
┌────────────────────────────────────────────────┐
│                                                 │
│                    ⟳                            │
│                                                 │
│            🤖 AI 검증 중...                     │
│                                                 │
│     요구사항 일관성을 확인하고 있습니다         │
│                                                 │
│  ┌──────────────────────────────────────────┐ │
│  │ 💡 Tip: AI가 요구사항의 일관성과         │ │
│  │       완성도를 확인하고 있습니다         │ │
│  └──────────────────────────────────────────┘ │
│                                                 │
└────────────────────────────────────────────────┘
```

---

## 🎯 사용자 경험 고려사항

### 1. 로딩 시간
- **적정 시간**: 10-15초
- **너무 짧으면**: 사용자가 AI가 무엇을 했는지 인지하기 어려움
- **너무 길면**: 답답함을 느낄 수 있음

### 2. 메시지 선택
- ✅ **명확한 동작 설명**: "AI가 검증하고 있습니다"
- ✅ **단계별 피드백**: 현재 무엇을 하는지 표시
- ✅ **긍정적 표현**: "최적화하고 있습니다"
- ❌ 피해야 할 표현: "문제를 찾고 있습니다" (부정적)

### 3. 실패 처리
- AI 검증 실패 시에도 다음 단계로 진행 가능하도록
- 경고 메시지 표시: "AI 검증을 건너뛰고 진행합니다"

---

## 🚀 빠른 시작 (최소 구현)

가장 간단하게 시작하려면:

```typescript
// 1. 상태 추가
const [isVerifying, setIsVerifying] = useState(false);

// 2. Import
import { AIVerificationLoadingSimple } from "@/components/requirements/AIVerificationLoadingSimple";

// 3. 버튼 클릭 시 딜레이 추가
const handleNextStep = () => {
  if (currentStep === 2) {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setCurrentStep(3);
    }, 5000); // 5초 딜레이
  } else {
    setCurrentStep(currentStep + 1);
  }
};

// 4. 렌더링
{isVerifying && <AIVerificationLoadingSimple />}
```

이렇게 하면 실제 AI 검증 없이도 로딩 화면을 테스트할 수 있습니다.

---

## 📝 추천 시나리오

### Scenario 1: 간단한 피드백만 (최소)
- `AIVerificationLoadingSimple` 사용
- 실제 검증 없이 3-5초 딜레이만 추가
- 사용자에게 "AI가 확인했다"는 신뢰감 제공

### Scenario 2: 실제 검증 + 제안 (권장 ⭐)
- `AIVerificationLoading` 사용
- Claude API로 실제 검증 수행
- 검증 결과를 다음 단계에서 표시
  - "AI 제안: 이 요구사항을 추가하는 것이 좋습니다"

### Scenario 3: 검증 + 자동 최적화 (고급)
- `AIVerificationLoading` 사용
- AI 검증 + 자동으로 요구사항 최적화
- 사용자에게 변경사항 확인 요청

---

## ✅ 체크리스트

구현 전 확인사항:

- [ ] 로딩 컴포넌트 선택 (상세 vs 간단)
- [ ] 상태 관리 추가 (`isVerifying`)
- [ ] handleNextStep 함수 수정
- [ ] 조건부 렌더링 추가
- [ ] 실제 AI 검증 구현 여부 결정
- [ ] 에러 처리 추가
- [ ] 테스트 (실제 사용자 시나리오)

---

## 🎉 기대 효과

1. **신뢰도 향상**: 사용자가 AI가 요구사항을 검증했다고 인식
2. **품질 보증**: 실제 검증 시 일관성 문제 사전 발견
3. **사용자 경험**: 단순 화면 전환보다 프로페셔널한 느낌
4. **차별화**: 다른 도구와의 차별점 (AI 품질 검증)

---

**통합 가이드 종료**

선택한 옵션에 따라 구현을 진행하시면 됩니다!

