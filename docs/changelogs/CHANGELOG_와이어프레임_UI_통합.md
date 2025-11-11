# 와이어프레임 UI 통합 완료 (탭 구조)

**날짜**: 2025-11-11  
**작업자**: AI Assistant  
**목적**: 3단계(기능 구성)에 "화면 미리보기" 탭 추가

## 🔄 구조 변경 이유
- **문제**: 기존 방식(ConfirmationPanel 아래에 배치)은 스크롤로 접근이 어려움
- **해결**: "확정 요구사항", "상세 견적"과 같은 레벨의 **탭으로 구성**
- **장점**: 명확한 UI, 탭 전환으로 쉬운 접근, 일관된 UX

---

## ✅ 완료된 작업

### 1. ConfirmationPanel.tsx 업데이트

#### Import 추가
```typescript
import { WireframeSpec } from "@/types/wireframe";
import { LoFiCanvas } from "@/components/wireframe/LoFiCanvas";
```

#### Props 인터페이스 확장
```typescript
interface ConfirmationPanelProps {
  // ... 기존 props
  // 와이어프레임 관련
  wireframe?: WireframeSpec | null;
  isGeneratingWireframe?: boolean;
  wireframeError?: string | null;
  onGenerateWireframe?: () => void;
  onRegenerateWireframe?: () => void;
  savedProjectId?: string;
}
```

#### activeTab 타입 확장
```typescript
const [activeTab, setActiveTab] = useState<"requirements" | "estimate" | "wireframe">(
  "requirements"
);
```

#### 탭 버튼 추가
```typescript
<button onClick={() => setActiveTab("wireframe")}>
  📱 화면 미리보기
</button>
```

#### 탭 컨텐츠 추가 (1166-1294 라인)
- 초기 상태: 생성 버튼
- 로딩 상태: 스피너 + 메시지
- 에러 상태: 에러 메시지 + 재시도
- 완료 상태: 와이어프레임 + 정보 패널

### 2. page.tsx 업데이트

#### useWireframe 훅 사용
```typescript
const { wireframe, isGenerating, error: wireframeError, generateWireframe, clearWireframe } = useWireframe();
```

#### ConfirmationPanel에 props 전달
```typescript
<ConfirmationPanel
  // ... 기존 props
  wireframe={wireframe}
  isGeneratingWireframe={isGenerating}
  wireframeError={wireframeError}
  onGenerateWireframe={() => {
    if (savedProjectId) {
      generateWireframe(savedProjectId);
    } else {
      alert('프로젝트를 먼저 저장해주세요');
    }
  }}
  onRegenerateWireframe={() => {
    clearWireframe();
    if (savedProjectId) {
      generateWireframe(savedProjectId);
    }
  }}
  savedProjectId={savedProjectId}
/>
```

#### 기존 독립 와이어프레임 섹션 제거
- ConfirmationPanel 아래에 있던 와이어프레임 섹션 완전히 제거
- 모든 와이어프레임 UI는 이제 탭 내부에서 관리

**구성 요소:**
- ✅ 섹션 헤더 (제목 + 설명)
- ✅ "다시 생성" 버튼 (와이어프레임이 있을 때만)
- ✅ 초기 상태 (생성 전)
- ✅ 로딩 상태 (생성 중)
- ✅ 에러 상태 (실패 시)
- ✅ 완료 상태 (와이어프레임 표시)

---

## 🎨 새로운 탭 구조

### Step 3 화면 레이아웃
```
┌─────────────────────────────────────────┐
│  [1 프로젝트 개요] - [2 요구사항] -    │
│  [3 기능 구성] - [4 완료]              │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  기능 구성 확인                         │
├─────────────────────────────────────────┤
│ [확정 요구사항] [상세 견적] [📱 화면 미리보기] │ ← 탭!
├─────────────────────────────────────────┤
│                                         │
│  (탭별 컨텐츠)                          │
│                                         │
└─────────────────────────────────────────┘
│  [← 이전]              [다음 단계 →]   │
└─────────────────────────────────────────┘
```

## 🎨 와이어프레임 탭 UI 상태

### 초기 상태 (생성 전)
```
┌─────────────────────────────────┐
│ 📱 화면 미리보기                │
│ AI가 요구사항을 기반으로...     │
├─────────────────────────────────┤
│                                  │
│        🎨                        │
│  AI가 화면을 자동으로 그려       │
│  드립니다                        │
│                                  │
│  [와이어프레임 생성하기]         │
│                                  │
└─────────────────────────────────┘
```

### 로딩 상태 (생성 중)
```
┌─────────────────────────────────┐
│ 📱 화면 미리보기                │
│ AI가 요구사항을 기반으로...     │
├─────────────────────────────────┤
│                                  │
│        ⭕ (회전)                │
│        📱                        │
│                                  │
│  AI가 화면을 그리고 있습니다... │
│  요구사항을 분석하고 최적의      │
│  레이아웃을 구성하고 있습니다    │
│  예상 소요 시간: 10-15초         │
│                                  │
└─────────────────────────────────┘
```

### 완료 상태 (와이어프레임 표시)
```
┌─────────────────────────────────┐
│ 📱 화면 미리보기  [🔄 다시생성] │
│ AI가 요구사항을 기반으로...     │
├─────────────────────────────────┤
│                                  │
│  ┌─────────────────────┐        │
│  │   [와이어프레임]    │        │
│  │                     │        │
│  │   [navbar]          │        │
│  │   [search]          │        │
│  │   [list]            │        │
│  │   [footer]          │        │
│  └─────────────────────┘        │
│                                  │
│  💡 와이어프레임 정보           │
│  • 로파이 와이어프레임입니다    │
│  • 화면 구조와 주요 요소 배치   │
│  • 실제 디자인은 개발 단계에서  │
└─────────────────────────────────┘
```

### 에러 상태 (실패 시)
```
┌─────────────────────────────────┐
│ 📱 화면 미리보기                │
│ AI가 요구사항을 기반으로...     │
├─────────────────────────────────┤
│                                  │
│        ⚠️                       │
│  와이어프레임 생성 실패          │
│  (에러 메시지)                   │
│                                  │
│      [다시 시도]                 │
│                                  │
└─────────────────────────────────┘
```

---

## 🎯 주요 기능

### 1. 생성 버튼
```typescript
<button
  onClick={() => {
    if (savedProjectId) {
      generateWireframe(savedProjectId);
    } else {
      alert('프로젝트를 먼저 저장해주세요');
    }
  }}
  disabled={!savedProjectId}
  className="..."
>
  와이어프레임 생성하기
</button>
```

**특징:**
- `savedProjectId`가 없으면 비활성화
- 클릭 시 `generateWireframe()` 호출
- 그라디언트 배경 (indigo → purple)

### 2. 다시 생성 버튼
```typescript
<button
  onClick={() => {
    clearWireframe();
    if (savedProjectId) {
      generateWireframe(savedProjectId);
    }
  }}
  disabled={isGenerating}
  className="..."
>
  🔄 다시 생성
</button>
```

**특징:**
- 와이어프레임이 있을 때만 표시
- 기존 와이어프레임 클리어 후 재생성
- 생성 중에는 비활성화

### 3. 로딩 애니메이션
```typescript
<div className="relative">
  <div className="animate-spin rounded-full h-20 w-20 border-4 border-t-transparent border-indigo-600"></div>
  <div className="absolute inset-0 flex items-center justify-center">
    <span className="text-2xl">📱</span>
  </div>
</div>
```

**특징:**
- 회전하는 원 + 중앙에 📱 아이콘
- 진행 상태 메시지
- 예상 소요 시간 표시

### 4. 와이어프레임 렌더링
```typescript
<div className="flex justify-center bg-gray-50 rounded-lg p-8">
  <LoFiCanvas spec={wireframe} scale={0.8} />
</div>
```

**특징:**
- 80% 스케일로 표시
- 회색 배경으로 강조
- 중앙 정렬

### 5. 정보 패널
```typescript
<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
  <div className="flex items-start gap-3">
    <span className="text-blue-600 text-xl">💡</span>
    <div className="flex-1 text-sm text-blue-800">
      <p className="font-medium mb-1">와이어프레임 정보</p>
      <ul className="list-disc list-inside space-y-1 text-blue-700">
        <li>이것은 <strong>로파이(저해상도) 와이어프레임</strong>입니다</li>
        <li>화면 구조와 주요 요소 배치를 확인할 수 있습니다</li>
        <li>실제 디자인은 개발 단계에서 세부적으로 진행됩니다</li>
      </ul>
    </div>
  </div>
</div>
```

**특징:**
- 파란색 배경으로 정보 강조
- 사용자 기대치 관리
- 로파이의 목적 설명

---

## 🔄 사용자 흐름 (탭 구조)

### 정상 플로우
```
Step 1: 프로젝트 개요
      ↓
Step 2: 요구사항 추출/편집
      ↓
AI 검증 (status: ok 또는 warning)
      ↓
Step 3: 기능 구성 확인
      ↓
[확정 요구사항] 탭 (기본) → 내용 확인
      ↓
[상세 견적] 탭 클릭 → 견적 확인
      ↓
[📱 화면 미리보기] 탭 클릭  ← NEW!
      ↓
[와이어프레임 생성하기] 클릭
      ↓
로딩 (10-15초)
      ↓
와이어프레임 표시
      ↓
(선택) [🔄 다시 생성] 클릭 → 재생성
      ↓
다른 탭으로 전환 or [다음 단계] 클릭
      ↓
Step 4: 최종 결과
```

### 탭 전환 플로우
```
[확정 요구사항] ↔ [상세 견적] ↔ [📱 화면 미리보기]
                                      ↑
                                  독립적 접근
                                  스크롤 불필요
```

### 에러 플로우
```
[와이어프레임 생성하기] 클릭
      ↓
로딩 (10-15초)
      ↓
에러 발생 (LLM 실패 등)
      ↓
에러 메시지 표시
      ↓
[다시 시도] 클릭 → 재시도
      or
무시하고 [다음 단계] 진행
```

---

## 📊 상태 관리

### useWireframe 훅
```typescript
const {
  wireframe,        // WireframeSpec | null
  isGenerating,     // boolean
  error,            // string | null
  generateWireframe, // (projectId: string) => Promise<any>
  clearWireframe,   // () => void
} = useWireframe();
```

### 조건부 렌더링
```typescript
// 초기 상태
{!wireframe && !isGenerating && !wireframeError && <초기화면>}

// 로딩 상태
{isGenerating && <로딩화면>}

// 에러 상태
{wireframeError && <에러화면>}

// 완료 상태
{wireframe && !isGenerating && <와이어프레임화면>}
```

---

## 🎨 스타일링

### 색상 스킴
- **Primary**: Indigo-500 to Purple-500 (그라디언트)
- **Success**: Blue-50 (정보 패널)
- **Error**: Red-50 (에러 상태)
- **Loading**: Indigo-600 (스피너)
- **Neutral**: Gray-50 (배경)

### 애니메이션
- **스피너**: `animate-spin` (Tailwind)
- **호버**: `hover:shadow-xl` (그림자 확대)
- **전환**: `transition-all` (부드러운 전환)

### 반응형
- **모바일**: 단일 열, 패딩 조정
- **태블릿/데스크톱**: 중앙 정렬, 최대 너비 제한

---

## 🐛 에러 처리

### 1. savedProjectId 없음
```typescript
if (!savedProjectId) {
  alert('프로젝트를 먼저 저장해주세요');
  return;
}
```

### 2. LLM 호출 실패
```typescript
{wireframeError && (
  <div className="bg-red-50 ...">
    <p>{wireframeError}</p>
    <button onClick={재시도}>다시 시도</button>
  </div>
)}
```

### 3. 네트워크 에러
→ `useWireframe` 훅에서 `catch` 블록이 처리
→ `error` state에 에러 메시지 저장
→ UI에서 에러 상태 표시

---

## 🚀 성능 최적화

### 1. 조건부 렌더링
- 불필요한 컴포넌트 렌더링 방지
- 상태별로 명확하게 분리

### 2. 스케일 조정
```typescript
<LoFiCanvas spec={wireframe} scale={0.8} />
```
- 80% 크기로 렌더링
- 화면 공간 효율적 사용

### 3. 로딩 피드백
- 즉각적인 로딩 상태 표시
- 예상 시간 안내
- 진행 메시지로 불안감 해소

---

## 📝 다음 단계

### 즉시 필요한 작업
1. ✅ **Supabase 마이그레이션 실행** (완료)
2. ✅ **백엔드 재시작** (사용자가 직접 수행)
3. ✅ **프론트엔드 빌드 & 테스트**
   ```bash
   cd frontend
   npm run dev
   # http://localhost:3000
   ```

### 테스트 시나리오
```
1. Step 1-2 진행 (프로젝트 생성)
2. Step 3 도착 → "기능 구성 확인" 화면
3. 상단 탭 확인:
   - [확정 요구사항] (기본 선택)
   - [상세 견적]
   - [📱 화면 미리보기] ← 클릭!
4. 와이어프레임 탭 진입
5. [와이어프레임 생성하기] 버튼 클릭
6. 로딩 10-15초 대기
7. 와이어프레임 표시 확인
8. [다시 생성] 버튼 테스트 (선택)
9. 다른 탭으로 전환 테스트
10. [다음 단계] 클릭 → Step 4 진행
```

### 선택적 개선사항 (Phase 2)
- [ ] 와이어프레임 편집 기능
- [ ] 다중 화면 지원
- [ ] PNG 다운로드
- [ ] 버전 관리

---

## 🎯 테스트 체크리스트

### 기본 기능
- [ ] "와이어프레임 생성하기" 버튼 클릭
- [ ] 로딩 상태 확인 (10-15초)
- [ ] 와이어프레임 표시 확인
- [ ] "다시 생성" 버튼 작동 확인

### 에지 케이스
- [ ] savedProjectId 없을 때 alert 확인
- [ ] LLM 실패 시 폴백 동작 확인
- [ ] 네트워크 에러 처리 확인
- [ ] 생성 중 다른 작업 방지 확인

### UI/UX
- [ ] 로딩 애니메이션 확인
- [ ] 에러 메시지 가독성 확인
- [ ] 정보 패널 표시 확인
- [ ] 반응형 레이아웃 확인

---

**통합 완료!** 🎉

이제 Step 3에서 와이어프레임을 자동 생성할 수 있습니다!

