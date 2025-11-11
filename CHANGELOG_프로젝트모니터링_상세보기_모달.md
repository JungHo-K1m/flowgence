# 프로젝트 모니터링 - 상세보기 모달 추가

**날짜**: 2025-11-11  
**작업자**: AI Assistant  
**목적**: 관리자 페이지의 프로젝트 모니터링 탭에서 프로젝트 상세보기 모달 구현

---

## 📋 개요

프로젝트 모니터링 테이블에서 "상세보기" 버튼을 클릭하면, 모달 형태로 프로젝트의 모든 상세 정보를 확인할 수 있도록 구현했습니다.

---

## 🎯 주요 기능

### 1. 모달 방식 채택

**선택 이유:**
- ✅ 관리자 대시보드(승인 대기 검토)와 **UI 일관성** 유지
- ✅ 기존 `RequirementsResultPanel` 컴포넌트 **재사용**
- ✅ 전체 화면 활용으로 많은 정보 표시 가능
- ✅ 빠른 확인 및 닫기 가능

### 2. 표시되는 정보

```
┌────────────────────────────────────────────┐
│ 프로젝트 상세                       [✕]   │
├────────────────────────────────────────────┤
│ 📌 프로젝트 기본 정보                      │
│  • 프로젝트명, 사용자명, 상태 배지         │
│  • 요청일, 최종 수정일                     │
│  • 프로젝트 설명                           │
│                                             │
│ 🎯 프로젝트 개요 (있는 경우)              │
│  • 서비스명, 서비스 설명                   │
│  • 핵심 기능 (리스트)                      │
│  • 타겟 유저, 예상 개발 기간               │
│                                             │
│ 💰 견적 정보                                │
│  • 총 견적금액 (강조 표시)                 │
│  • 요구사항 개수                           │
│                                             │
│ 📝 요구사항 상세                            │
│  • RequirementsResultPanel (전체)         │
│    - 기능 요구사항 (카테고리별)            │
│    - 비기능 요구사항                       │
│    - 다운로드 버튼 등                      │
└────────────────────────────────────────────┘
```

---

## 📂 수정된 파일

### `frontend/src/app/admin/projects/page.tsx`

#### 1. Import 추가
```typescript
import { RequirementsResultPanel } from "@/components/project/RequirementsResultPanel";
```

#### 2. 인터페이스 확장

##### ProjectOverview 확장
```typescript
interface ProjectOverview {
  estimation?: {
    totalCost?: string;
  };
  serviceCoreElements?: {  // ← 추가
    title: string;
    description: string;
    keyFeatures: string[];
    targetUsers: string[];
    estimatedDuration: string;
  };
}
```

##### ProjectDetail 추가 (모달용)
```typescript
interface ProjectDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  requirements?: {
    categories?: any[];
    totalCount?: number;
    extractedAt?: string;
    needsReview?: boolean;
    [key: string]: any;
  } | null;
  project_overview?: ProjectOverview | null;
  profiles?: {
    full_name?: string | null;
    email?: string | null;
  };
}
```

#### 3. 상태 추가
```typescript
const [selectedProject, setSelectedProject] = useState<ProjectDetail | null>(null);
const [isDetailOpen, setIsDetailOpen] = useState(false);
const [detailLoading, setDetailLoading] = useState(false);
```

#### 4. 함수 추가

##### openProjectDetail
```typescript
const openProjectDetail = async (id: string) => {
  setIsDetailOpen(true);
  setDetailLoading(true);
  
  try {
    const supabase = createClient();
    const { data: project, error } = await supabase
      .from("projects")
      .select(
        `
        *,
        profiles:user_id (
          full_name,
          email
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;

    setSelectedProject(project);
  } catch (error) {
    console.error("프로젝트 상세 로드 실패:", error);
    setSelectedProject(null);
  } finally {
    setDetailLoading(false);
  }
};
```

**특징:**
- Supabase에서 프로젝트 전체 데이터 + 사용자 프로필 조회
- 비동기 처리로 로딩 상태 관리
- 에러 처리 포함

##### closeProjectDetail
```typescript
const closeProjectDetail = () => {
  setIsDetailOpen(false);
  setSelectedProject(null);
};
```

#### 5. "상세보기" 버튼 수정

##### Before
```typescript
<button className="text-[#6366F1] hover:text-[#4F46E5] font-medium">
  상세보기
</button>
```

##### After
```typescript
<button 
  onClick={() => openProjectDetail(project.id)}
  className="text-[#6366F1] hover:text-[#4F46E5] font-medium"
>
  상세보기
</button>
```

#### 6. 모달 렌더링 추가

```typescript
{isDetailOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
    <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh]">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">프로젝트 상세</h2>
        <button onClick={closeProjectDetail} className="text-gray-500 hover:text-gray-800">
          ✕
        </button>
      </div>
      
      {/* 콘텐츠 (스크롤 가능) */}
      <div className="overflow-y-auto max-h-[calc(90vh-4rem)]">
        {detailLoading ? (
          <로딩 메시지>
        ) : selectedProject ? (
          <프로젝트 상세 정보>
        ) : (
          <에러 메시지>
        )}
      </div>
    </div>
  </div>
)}
```

**특징:**
- `z-50`: 다른 요소 위에 표시
- `bg-black/50`: 배경 딤 처리 (50% 투명도)
- `max-w-5xl`: 최대 너비 제한
- `max-h-[90vh]`: 최대 높이 90% (화면에 맞춤)
- `overflow-y-auto`: 내용이 길면 스크롤

---

## 🎨 모달 상세 구조

### 1. 프로젝트 기본 정보

```typescript
<section className="border border-gray-200 rounded-lg p-6 shadow-sm">
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
    <div>
      <h3 className="text-2xl font-semibold text-gray-900 mb-1">
        {selectedProject.title}
      </h3>
      <p className="text-sm text-gray-600">
        {selectedProject.profiles?.full_name || "알 수 없음"}
      </p>
    </div>
    {getStatusBadge(selectedProject.status)}
  </div>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <p className="text-gray-500">요청일</p>
      <p>{new Date(selectedProject.created_at).toLocaleDateString("ko-KR")}</p>
    </div>
    <div>
      <p className="text-gray-500">최종 수정일</p>
      <p>{new Date(selectedProject.updated_at).toLocaleDateString("ko-KR")}</p>
    </div>
    <div className="md:col-span-2">
      <p className="text-gray-500">프로젝트 설명</p>
      <p>{selectedProject.description || "설명 없음"}</p>
    </div>
  </div>
</section>
```

**표시 항목:**
- 프로젝트명 (큰 글씨)
- 사용자명 (작은 글씨)
- 상태 배지
- 요청일, 최종 수정일 (한국어 날짜 형식)
- 프로젝트 설명

---

### 2. 프로젝트 개요 (조건부)

```typescript
{selectedProject.project_overview?.serviceCoreElements && (
  <section className="border border-gray-200 rounded-lg p-6 shadow-sm">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">
      🎯 프로젝트 개요
    </h3>
    <div className="space-y-4">
      <div>
        <p className="text-gray-500 mb-1">서비스명</p>
        <p className="text-gray-900">
          {selectedProject.project_overview.serviceCoreElements.title}
        </p>
      </div>
      <div>
        <p className="text-gray-500 mb-1">서비스 설명</p>
        <p className="text-gray-900">
          {selectedProject.project_overview.serviceCoreElements.description}
        </p>
      </div>
      {/* 핵심 기능 (리스트) */}
      <div>
        <p className="text-gray-500 mb-2">핵심 기능</p>
        <ul className="list-disc list-inside space-y-1">
          {keyFeatures.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
      </div>
      {/* 타겟 유저, 개발 기간 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-gray-500 mb-1">타겟 유저</p>
          <p>{targetUsers.join(", ")}</p>
        </div>
        <div>
          <p className="text-gray-500 mb-1">예상 개발 기간</p>
          <p>{estimatedDuration}</p>
        </div>
      </div>
    </div>
  </section>
)}
```

**조건부 렌더링:**
- `serviceCoreElements`가 있을 때만 표시
- AI가 생성한 프로젝트 개요 정보

---

### 3. 견적 정보

```typescript
<section className="border border-gray-200 rounded-lg p-6 shadow-sm">
  <h3 className="text-lg font-semibold text-gray-900 mb-4">
    💰 견적 정보
  </h3>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="space-y-1">
      <p className="text-gray-500">총 견적금액</p>
      <p className="text-2xl font-bold text-[#6366F1]">
        {getEstimateAmount(selectedProject).toLocaleString()}원
      </p>
    </div>
    <div className="space-y-1">
      <p className="text-gray-500">요구사항 개수</p>
      <p className="text-2xl font-bold text-gray-900">
        {getRequirementCount(selectedProject)}개
      </p>
    </div>
  </div>
</section>
```

**특징:**
- 총 견적금액을 큰 글씨 + 브랜드 컬러로 강조
- 요구사항 개수도 함께 표시
- `getEstimateAmount`, `getRequirementCount` 함수 재사용

---

### 4. 요구사항 상세

```typescript
<section className="border border-gray-200 rounded-lg p-6 shadow-sm">
  <h3 className="text-lg font-semibold text-gray-900 mb-4">
    📝 요구사항 상세
  </h3>
  {selectedProject.requirements ? (
    <div className="border border-gray-200 rounded-lg">
      <RequirementsResultPanel
        projectData={{
          description: selectedProject.description || "",
          serviceType: selectedProject.project_overview?.serviceCoreElements?.title || "",
          uploadedFiles: [] as File[],
          chatMessages: [],
        }}
        extractedRequirements={{
          categories: selectedProject.requirements.categories || [],
          extractedAt: selectedProject.requirements.extractedAt || selectedProject.created_at,
          needsReview: selectedProject.requirements.needsReview ?? false,
          totalCount: selectedProject.requirements.totalCount || 0,
        }}
        projectOverview={
          (selectedProject.project_overview || undefined) as any
        }
      />
    </div>
  ) : (
    <p className="text-gray-500">
      요구사항 데이터가 아직 등록되지 않았습니다.
    </p>
  )}
</section>
```

**특징:**
- `RequirementsResultPanel` 컴포넌트 재사용
- 조건부 렌더링 (요구사항이 없으면 메시지 표시)
- 요구사항이 있으면:
  - 기능 요구사항 (카테고리별)
  - 비기능 요구사항
  - 마크다운 다운로드 버튼
  - 모든 상세 정보

---

## 🔄 사용자 흐름

```
프로젝트 모니터링 테이블
      ↓
"상세보기" 버튼 클릭
      ↓
openProjectDetail(id) 호출
      ↓
Supabase에서 프로젝트 상세 데이터 로드
      ↓
모달 표시
┌─────────────────────────┐
│ 프로젝트 상세      [✕] │
│                         │
│ 📌 기본 정보           │
│ 🎯 프로젝트 개요       │
│ 💰 견적 정보           │
│ 📝 요구사항 상세       │
└─────────────────────────┘
      ↓
사용자 확인
      ↓
"✕" 버튼 또는 배경 클릭 (선택사항)
      ↓
closeProjectDetail() 호출
      ↓
모달 닫힘
      ↓
테이블로 복귀
```

---

## 🎯 UX 개선 사항

### 1. 로딩 상태 관리
```typescript
{detailLoading ? (
  <div className="p-8 text-center text-gray-500">
    프로젝트 정보를 불러오는 중...
  </div>
) : (
  <프로젝트 상세>
)}
```

**장점:**
- 데이터 로드 중임을 사용자에게 명확히 전달
- 빈 화면을 보여주지 않음

---

### 2. 에러 처리
```typescript
try {
  // Supabase 조회
} catch (error) {
  console.error("프로젝트 상세 로드 실패:", error);
  setSelectedProject(null);
}

// 렌더링
{selectedProject ? (
  <프로젝트 상세>
) : (
  <div className="p-8 text-center text-gray-500">
    프로젝트 정보를 찾을 수 없습니다.
  </div>
)}
```

**장점:**
- 에러 발생 시 사용자에게 친절한 메시지
- 콘솔에 에러 로그 기록 (디버깅)

---

### 3. 조건부 렌더링
```typescript
{selectedProject.project_overview?.serviceCoreElements && (
  <프로젝트 개요 섹션>
)}

{selectedProject.requirements ? (
  <RequirementsResultPanel />
) : (
  <요구사항 없음 메시지>
)}
```

**장점:**
- 데이터가 있을 때만 표시
- 빈 섹션으로 인한 혼란 방지

---

### 4. 스크롤 최적화
```typescript
<div className="overflow-y-auto max-h-[calc(90vh-4rem)]">
  {/* 콘텐츠 */}
</div>
```

**장점:**
- 화면 높이의 90% - 헤더 높이만큼 사용
- 내용이 길어도 모달이 화면 밖으로 나가지 않음
- 스크롤로 모든 내용 확인 가능

---

### 5. 일관된 UI 스타일
```typescript
// 모든 섹션
<section className="border border-gray-200 rounded-lg p-6 shadow-sm">
  <h3 className="text-lg font-semibold text-gray-900 mb-4">
    {아이콘} {제목}
  </h3>
  {/* 내용 */}
</section>
```

**장점:**
- 섹션 구분이 명확
- 시각적 계층 구조 명확
- 아이콘으로 빠른 인식

---

## 📊 모달 vs 별도 페이지 비교

| 항목 | 모달 (✅ 선택됨) | 별도 페이지 |
|------|-----------------|------------|
| **빠른 확인** | ✅ 매우 빠름 | ❌ 페이지 전환 |
| **컨텍스트 유지** | ✅ 테이블 보임 (배경) | ❌ 테이블 사라짐 |
| **일관성** | ✅ 승인 대기와 동일 | ❌ 다른 패턴 |
| **URL 공유** | ❌ 불가능 | ✅ 가능 |
| **뒤로가기** | ❌ 지원 안 함 | ✅ 자연스러움 |
| **화면 활용** | ⚠️ 90% 제한 | ✅ 100% |
| **구현 복잡도** | ✅ 간단 | ⚠️ 라우팅 필요 |

**결론:**
- 빠른 확인이 주 목적 → **모달이 적합** ✅
- 심층 분석 필요 → 별도 페이지가 적합

---

## 🚀 향후 개선 가능 사항

### Phase 1 (현재) ✅
- [x] 모달 구현
- [x] 프로젝트 상세 표시
- [x] RequirementsResultPanel 통합

### Phase 2 (미래)
- [ ] 모달에서 직접 상태 변경 (승인/거부)
- [ ] 프로젝트 수정 버튼
- [ ] 댓글/메모 추가 기능
- [ ] 히스토리 조회 (변경 이력)

### Phase 3 (고급)
- [ ] 여러 프로젝트 비교 (듀얼 모달)
- [ ] 프로젝트 간 이동 (← / → 버튼)
- [ ] 키보드 단축키 (ESC: 닫기, ← / →: 이동)
- [ ] URL 파라미터 지원 (`?detail=project_id`)

---

## 🧪 테스트 시나리오

### 시나리오 1: 정상 플로우
1. 프로젝트 모니터링 페이지 접속
2. 테이블에서 프로젝트 선택
3. "상세보기" 버튼 클릭
4. 모달 표시 확인
   - ✅ 프로젝트 기본 정보
   - ✅ 프로젝트 개요 (있으면)
   - ✅ 견적 정보
   - ✅ 요구사항 상세
5. "✕" 버튼 클릭
6. 모달 닫힘 확인

### 시나리오 2: 로딩 상태
1. "상세보기" 버튼 클릭
2. 로딩 메시지 확인
   - "프로젝트 정보를 불러오는 중..."
3. 데이터 로드 완료
4. 프로젝트 상세 표시

### 시나리오 3: 요구사항 없는 프로젝트
1. 요구사항이 없는 프로젝트 선택
2. "상세보기" 버튼 클릭
3. 기본 정보 + 개요 + 견적은 표시
4. 요구사항 섹션에 "요구사항 데이터가 아직 등록되지 않았습니다." 메시지 확인

### 시나리오 4: 에러 처리
1. 존재하지 않는 프로젝트 ID로 상세보기 시도 (강제 에러)
2. 에러 메시지 확인
   - "프로젝트 정보를 찾을 수 없습니다."
3. 콘솔에 에러 로그 확인

### 시나리오 5: 스크롤 테스트
1. 요구사항이 많은 프로젝트 선택
2. 모달 표시
3. 스크롤로 모든 내용 확인 가능한지 테스트
4. 모달이 화면 밖으로 나가지 않는지 확인

---

## 📝 코드 재사용성

### 공통 컴포넌트 재사용
```
admin/page.tsx (승인 대기)
      ↓
RequirementsResultPanel
      ↑
admin/projects/page.tsx (프로젝트 모니터링)
```

**장점:**
- 코드 중복 최소화
- 일관된 UI/UX
- 유지보수 용이

---

**변경 사항 정리 완료**

프로젝트 모니터링 탭에서 상세보기 모달이 성공적으로 추가되었습니다! 🎉

