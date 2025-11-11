# 요구사항 로딩 UI 개선 (스피너 → 단계별 진행 메시지)

## 개요
2단계 우측 화면의 요구사항 로딩 UI를 스피너 + 진행 점 애니메이션에서 **단계별 진행 메시지가 순차적으로 나타나는 형식**으로 개선했습니다.

## 변경 전/후

### 변경 전
- 단순한 스피너 애니메이션
- 고정된 타이틀과 설명
- 진행 점 3개 애니메이션
- 사용자가 "어떻게 진행되고 있는지" 알기 어려움

### 변경 후
- **단계별 진행 메시지 5개 순차 표시**
- 각 단계마다 체크마크(✓) / 로딩 스피너 / 빈 원 표시
- 완료된 단계는 초록색/보라색/파란색 배경으로 강조
- 1.5초마다 자동으로 다음 단계로 진행
- 현재 진행 상태를 명확하게 시각화

## 주요 기능

### 1. 단계별 진행 메시지
각 stage별로 5개의 진행 메시지를 순차적으로 표시:

#### **extracting (요구사항 추출)**
1. "프로젝트 내용을 분석하고 있습니다..."
2. "핵심 기능을 파악하고 있습니다..."
3. "타겟 사용자를 정의하고 있습니다..."
4. "요구사항을 분류하고 있습니다..."
5. "최종 검토 중입니다..."

#### **updating (요구사항 업데이트)**
1. "새로운 채팅 내용을 분석하고 있습니다..."
2. "기존 요구사항과 비교 중입니다..."
3. "업데이트할 항목을 찾고 있습니다..."
4. "요구사항을 수정하고 있습니다..."
5. "최종 확인 중입니다..."

#### **saving (데이터 저장)**
1. "데이터를 준비하고 있습니다..."
2. "프로젝트 정보를 저장하고 있습니다..."
3. "요구사항을 데이터베이스에 기록하고 있습니다..."
4. "검증 중입니다..."
5. "저장 완료!"

### 2. 시각적 상태 표시
각 단계마다 3가지 상태를 구분하여 표시:

```typescript
// 완료된 단계 (index < currentStep)
✓ 체크마크 표시 + 색상 배경

// 진행 중인 단계 (index === currentStep)
🔄 작은 스피너 애니메이션 + 색상 배경

// 대기 중인 단계 (index > currentStep)
○ 빈 원 + 회색 배경
```

### 3. 색상 테마
각 stage별로 다른 색상 테마 적용:

- **purple**: 요구사항 추출 (AI 분석 단계)
- **green**: 요구사항 업데이트 (수정 단계)
- **blue**: 데이터 저장 (저장 단계)

### 4. 자동 진행
- 1.5초마다 자동으로 다음 단계로 진행
- 마지막 단계에서 자동 멈춤
- 각 단계는 완료 상태(체크마크)를 유지

## 코드 구조

### 주요 변경사항

```typescript
// 1. 단계별 메시지 배열 정의
const getStageSteps = () => {
  switch (stage) {
    case "extracting": return [...];
    case "updating": return [...];
    case "saving": return [...];
  }
};

// 2. 현재 단계 상태 관리
const [currentStep, setCurrentStep] = useState(0);

// 3. 자동 진행 useEffect
useEffect(() => {
  const interval = setInterval(() => {
    setCurrentStep((prev) => {
      if (prev < steps.length - 1) {
        return prev + 1;
      }
      return prev; // 마지막 단계에서 멈춤
    });
  }, 1500); // 1.5초마다 진행

  return () => clearInterval(interval);
}, [steps.length]);

// 4. 단계별 렌더링
{steps.map((step, index) => (
  <div
    className={`p-3 rounded-lg transition-all duration-500 ${
      index <= currentStep
        ? `${colors.bgLight} ${colors.text} font-medium`
        : "bg-gray-100 text-gray-400"
    }`}
  >
    {/* 체크마크/스피너/빈원 표시 */}
    {/* 단계 메시지 */}
  </div>
))}
```

## 사용자 경험 개선

### Before
```
[로딩 스피너]
요구사항을 추출하고 있습니다
AI가 프로젝트 내용을 분석하여 요구사항을 도출하고 있습니다
[점점점 애니메이션]
```

### After
```
[로딩 스피너]
요구사항을 추출하고 있습니다

✓ 프로젝트 내용을 분석하고 있습니다...
✓ 핵심 기능을 파악하고 있습니다...
🔄 타겟 사용자를 정의하고 있습니다... (진행 중)
○ 요구사항을 분류하고 있습니다...
○ 최종 검토 중입니다...
```

## 추가 개선 사항

### 1. 타이밍 조정 가능
현재 1.5초 간격으로 설정되어 있지만, 필요에 따라 조정 가능:

```typescript
const interval = setInterval(() => {
  // ...
}, 1500); // 이 값을 변경하여 속도 조정
```

### 2. 실제 진행 상태 연동 가능
현재는 타이머 기반이지만, 실제 API 응답 시점과 연동 가능:

```typescript
// 이벤트 리스너를 추가하여 실제 진행 상태와 동기화
useEffect(() => {
  const listener = (event) => {
    setCurrentStep(event.detail.step);
  };
  window.addEventListener('requirements-progress', listener);
  return () => window.removeEventListener('requirements-progress', listener);
}, []);
```

### 3. 애니메이션 커스터마이징
Tailwind CSS 클래스로 다양한 애니메이션 적용 가능:

```typescript
className="transition-all duration-500" // 부드러운 전환
className="animate-spin" // 회전 애니메이션
className="animate-pulse" // 펄스 애니메이션
```

## 브라우저 호환성
- 모든 모던 브라우저 지원
- CSS transitions 사용 (GPU 가속)
- React 18+ 필수

## 접근성
- 명확한 텍스트 메시지 제공
- 색상과 아이콘으로 상태 표현
- 키보드 네비게이션 고려 (향후 개선 가능)

## 테스트 방법

1. **요구사항 추출 로딩**
   - 프로젝트 개요에서 "다음 단계" 클릭
   - 5단계 진행 메시지 순차 표시 확인
   - 각 단계가 완료되면 체크마크로 변경되는지 확인

2. **요구사항 업데이트 로딩**
   - 채팅으로 요구사항 추가/수정
   - 5단계 진행 메시지 표시 확인

3. **데이터 저장 로딩**
   - 로그인 후 프로젝트 저장
   - 5단계 진행 메시지 표시 확인

## 향후 개선 계획

1. **실제 API 응답과 동기화**
   - 현재는 타이머 기반
   - 실제 진행 단계와 동기화하여 더 정확한 UX 제공

2. **애니메이션 다양화**
   - typewriter 효과
   - 슬라이드 인/아웃 효과
   - 페이드 효과

3. **사용자 커스터마이징**
   - 진행 속도 조절 옵션
   - 단계별 설명 상세화
   - 스킵 옵션 제공 (프리미엄 사용자)

## 영향 범위

### 수정된 파일
- `frontend/src/components/requirements/RequirementsLoading.tsx`

### 영향받는 페이지
- `/project/new/requirements` (2단계)
- 요구사항 패널 모든 로딩 상태

## 성능
- 불필요한 리렌더링 최소화
- useEffect cleanup으로 메모리 누수 방지
- CSS transitions로 GPU 가속 활용

