# 요구사항 결과 페이지에 와이어프레임 추가

**날짜**: 2025-11-11  
**작업자**: AI Assistant  
**목적**: Step 4 (요구사항 결과 페이지)에 와이어프레임 미리보기 섹션 추가

---

## 🎯 목표

Step 3에서 생성한 와이어프레임을 Step 4 (최종 결과 페이지)에서도 확인할 수 있도록 개선

### Before
```
Step 4 (요구사항 결과 페이지)
├─ 개요
├─ 범위
├─ 기능 요구사항
├─ 비기능 요구사항
├─ 화면 목록
└─ 데이터 모델
```

### After
```
Step 4 (요구사항 결과 페이지)
├─ 개요
├─ 범위
├─ 기능 요구사항
├─ 비기능 요구사항
├─ 화면 목록
├─ 📱 화면 미리보기 (NEW!)  ← 와이어프레임이 있을 때만 표시
└─ 데이터 모델
```

---

## ✅ 완료된 작업

### 1. RequirementsResultPanel.tsx 업데이트

#### Import 추가
```typescript
import { WireframeSpec } from "@/types/wireframe";
import { LoFiCanvas } from "@/components/wireframe/LoFiCanvas";
```

#### Props 인터페이스 확장
```typescript
interface RequirementsResultPanelProps {
  // ... 기존 props
  wireframe?: WireframeSpec | null;  // ← 추가
}
```

#### 섹션 목록 업데이트
```typescript
const sections = [
  { id: "overview", label: "개요" },
  { id: "scope", label: "범위" },
  { id: "functional", label: "기능 요구사항" },
  { id: "non-functional", label: "비기능 요구사항" },
  { id: "screens", label: "화면 목록" },
  { id: "wireframe", label: "화면 미리보기", hidden: !wireframe },  // ← 추가
  { id: "data-model", label: "데이터 모델" },
];
```

**특징:**
- `hidden: !wireframe` → 와이어프레임이 없으면 메뉴에서 숨김

#### 사이드바 필터링
```typescript
{sections.filter((section) => !section.hidden).map((section) => (
  <button ... />
))}
```

**특징:**
- `hidden` 속성이 `true`인 섹션은 사이드바에 표시하지 않음

#### 와이어프레임 섹션 추가
```typescript
{/* Wireframe Section */}
{wireframe && (
  <section id="wireframe" className="mb-8">
    <h2 className="text-xl font-semibold text-gray-900 mb-4">
      📱 화면 미리보기 (로파이 와이어프레임)
    </h2>
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
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
    <div className="flex justify-center bg-gray-50 rounded-lg p-8 border border-gray-200">
      <LoFiCanvas spec={wireframe} scale={0.8} />
    </div>
  </section>
)}
```

**위치:** "화면 목록" 섹션과 "데이터 모델" 섹션 사이

### 2. page.tsx 업데이트

#### RequirementsResultPanel에 props 전달
```typescript
<RequirementsResultPanel
  projectData={{...}}
  extractedRequirements={extractedRequirements}
  projectOverview={overview}
  wireframe={wireframe}  // ← 추가
/>
```

---

## 🎨 UI 구조

### 사이드바 네비게이션
```
┌─────────────────────┐
│ [프로젝트명]        │
├─────────────────────┤
│ 개요                │
│ 범위                │
│ 기능 요구사항       │
│ 비기능 요구사항     │
│ 화면 목록           │
│ 📱 화면 미리보기    │ ← 와이어프레임이 있을 때만
│ 데이터 모델         │
└─────────────────────┘
```

### 와이어프레임 섹션
```
┌──────────────────────────────────────────┐
│ 📱 화면 미리보기 (로파이 와이어프레임)  │
├──────────────────────────────────────────┤
│                                          │
│  💡 와이어프레임 정보                   │
│  • 로파이(저해상도) 와이어프레임입니다  │
│  • 화면 구조와 주요 요소 배치 확인      │
│  • 실제 디자인은 개발 단계에서 진행     │
│                                          │
├──────────────────────────────────────────┤
│                                          │
│      [와이어프레임 렌더링]              │
│                                          │
│  ┌─────────────────────┐                │
│  │   [navbar]          │                │
│  │   [search]          │                │
│  │   [list]            │                │
│  │   [footer]          │                │
│  └─────────────────────┘                │
│                                          │
└──────────────────────────────────────────┘
```

---

## 🔄 사용자 플로우

### 전체 플로우
```
Step 1: 프로젝트 개요
      ↓
Step 2: 요구사항 추출/편집
      ↓
AI 검증 완료
      ↓
Step 3: 기능 구성 확인
      ├─ [확정 요구사항] 탭
      ├─ [상세 견적] 탭
      └─ [📱 화면 미리보기] 탭
           ↓
      [와이어프레임 생성하기] 클릭 (선택)
           ↓
      와이어프레임 표시
           ↓
Step 4: 최종 결과 (RequirementsResultPanel)
      ├─ 개요
      ├─ 범위
      ├─ 기능 요구사항
      ├─ 비기능 요구사항
      ├─ 화면 목록
      ├─ 📱 화면 미리보기  ← Step 3에서 생성한 와이어프레임 표시
      └─ 데이터 모델
```

### 와이어프레임 유무에 따른 차이

#### Case 1: 와이어프레임 있음
```
Step 3에서 [와이어프레임 생성하기] 클릭
      ↓
와이어프레임 생성 완료
      ↓
Step 4 이동
      ↓
사이드바에 "📱 화면 미리보기" 표시
      ↓
클릭 → 와이어프레임 확인 가능
```

#### Case 2: 와이어프레임 없음
```
Step 3에서 [와이어프레임 생성하기] 건너뜀
      ↓
Step 4 이동
      ↓
사이드바에 "📱 화면 미리보기" 숨김
      ↓
다른 섹션들만 표시
```

---

## 📊 주요 기능

### 1. 조건부 렌더링
```typescript
// 와이어프레임이 있을 때만 섹션 표시
{wireframe && (
  <section id="wireframe">
    ...
  </section>
)}
```

### 2. 동적 메뉴 표시
```typescript
// hidden 속성이 true이면 메뉴에서 제외
sections.filter((section) => !section.hidden)
```

### 3. 스크롤 네비게이션
- 사이드바 메뉴 클릭 → 해당 섹션으로 스크롤
- `scrollToSection` 함수로 부드러운 스크롤

### 4. 일관된 UI
- Step 3의 와이어프레임 UI와 동일한 스타일
- 정보 패널 (파란색 배경)
- 80% 스케일 렌더링

---

## 🎨 스타일링

### 섹션 헤더
```css
text-xl font-semibold text-gray-900 mb-4
```

### 정보 패널
```css
bg-blue-50 border border-blue-200 rounded-lg p-4
```

### 와이어프레임 컨테이너
```css
flex justify-center bg-gray-50 rounded-lg p-8 border border-gray-200
```

### 사이드바 메뉴 (활성)
```css
bg-blue-100 text-blue-700
```

### 사이드바 메뉴 (비활성)
```css
text-gray-600 hover:text-gray-900 hover:bg-gray-100
```

---

## 🧪 테스트 시나리오

### 시나리오 1: 와이어프레임 포함
```
1. Step 1-2 완료
2. Step 3에서 [와이어프레임 생성하기] 클릭
3. 와이어프레임 확인
4. [다음 단계] 클릭 → Step 4
5. 사이드바에서 "📱 화면 미리보기" 확인
6. 클릭 → 와이어프레임 섹션으로 스크롤
7. ✅ 와이어프레임 표시 확인
```

### 시나리오 2: 와이어프레임 없음
```
1. Step 1-2 완료
2. Step 3에서 와이어프레임 생성 건너뜀
3. [다음 단계] 클릭 → Step 4
4. 사이드바 확인
5. ✅ "📱 화면 미리보기" 메뉴 없음 확인
6. 다른 섹션들만 표시
```

### 시나리오 3: 스크롤 네비게이션
```
1. Step 4에서 와이어프레임 있는 상태
2. 사이드바에서 "개요" 클릭 → 개요 섹션 스크롤
3. "화면 목록" 클릭 → 화면 목록 스크롤
4. "📱 화면 미리보기" 클릭 → 와이어프레임 스크롤
5. ✅ 부드러운 스크롤 애니메이션 확인
```

---

## 📝 영향 범위

### 수정된 파일
1. `frontend/src/components/project/RequirementsResultPanel.tsx`
   - Import 추가 (WireframeSpec, LoFiCanvas)
   - Props 인터페이스 확장
   - sections 배열에 wireframe 추가
   - 사이드바 필터링 로직 추가
   - 와이어프레임 섹션 추가

2. `frontend/src/app/page.tsx`
   - RequirementsResultPanel에 wireframe props 전달

### 영향받는 기능
- ✅ Step 4 (요구사항 결과 페이지) - 와이어프레임 섹션 추가
- ✅ 사이드바 네비게이션 - 동적 메뉴 표시
- ✅ PDF 다운로드 - 영향 없음 (마크다운 생성은 별도)
- ✅ Notion 공유 - 영향 없음

---

## 💡 추가 개선 사항 (향후)

### Option 1: PDF에 와이어프레임 포함
```typescript
// generateRequirementsMarkdown에 와이어프레임 섹션 추가
if (wireframe) {
  markdown += '\n\n## 화면 미리보기\n\n';
  markdown += '![와이어프레임](data:image/png;base64,...)';
}
```

### Option 2: 와이어프레임 이미지 다운로드
```typescript
<button onClick={downloadWireframeImage}>
  PNG 다운로드
</button>
```

### Option 3: 여러 화면 와이어프레임
```typescript
// 여러 화면의 와이어프레임 지원
wireframes: WireframeSpec[]
```

---

## 🎯 결론

✅ **Step 4에서 와이어프레임 확인 가능**  
✅ **조건부 메뉴 표시로 깔끔한 UX**  
✅ **일관된 UI/UX 유지**  
✅ **타입 에러 없음**

**사용자가 Step 3에서 와이어프레임을 생성했다면, Step 4에서도 동일한 와이어프레임을 확인할 수 있습니다!** 🎊

