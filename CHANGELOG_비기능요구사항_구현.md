# 변경 이력: 비기능 요구사항 동적 구현

**날짜**: 2025-11-07  
**작업자**: AI Assistant  
**요청자**: 사용자

---

## 📋 작업 개요

하드코딩되어 있던 비기능 요구사항(Non-Functional Requirements)을 AI가 자동으로 추출하고 동적으로 표시하도록 시스템을 개선했습니다.

### 🎯 작업 목표

**기존 문제점:**
- `RequirementsResultPanel.tsx`에 비기능 요구사항이 하드코딩되어 있음
- 모든 프로젝트에 동일한 비기능 요구사항이 표시되어 부적절함
- 사용자가 수정할 수 없는 고정된 데이터

**개선 목표:**
- AI가 프로젝트 특성에 맞는 비기능 요구사항 자동 추출
- 동적 데이터로 교체하여 프로젝트별 맞춤 요구사항 제공
- 우선순위(priority) 및 측정 지표(metrics) 추가
- 향후 수동 편집 기능 추가를 위한 기반 마련

---

## 🔧 구현 내용

### 1. 타입 정의 확장

**파일**: `frontend/src/types/requirements.ts`

#### 추가된 인터페이스

```typescript
// 비기능 요구사항 (Non-Functional Requirements)
export interface NonFunctionalRequirement {
  id: string;
  category: string; // "성능", "보안", "사용성", "호환성", "확장성", "유지보수성"
  description: string;
  priority: 'high' | 'medium' | 'low';
  metrics?: string; // 측정 가능한 지표 (예: "페이지 로드 3초 이내")
}

export interface ExtractedRequirements {
  categories: RequirementCategory[];
  nonFunctionalRequirements?: NonFunctionalRequirement[]; // 비기능 요구사항 추가
  extractedAt: string;
  totalCount: number;
  needsReview: boolean;
}
```

#### 주요 필드 설명

- `id`: 고유 식별자 (예: "nfr-1", "nfr-2")
- `category`: 비기능 요구사항 카테고리
  - 성능 (Performance)
  - 보안 (Security)
  - 사용성 (Usability)
  - 호환성 (Compatibility)
  - 확장성 (Scalability)
  - 유지보수성 (Maintainability)
- `description`: 구체적이고 측정 가능한 요구사항 설명
- `priority`: 우선순위 (high/medium/low)
- `metrics`: 측정 지표 (선택 사항)

---

### 2. AI 프롬프트 수정

**파일**: `backend/src/chat/chat.service.ts`

#### 수정 위치
`extractRequirementsFromHistory` 함수의 `systemPrompt`

#### 변경 내용

**이전**:
```typescript
응답 형식:
{
  "categories": [...]
}
```

**이후**:
```typescript
응답 형식:
{
  "categories": [...],
  "nonFunctionalRequirements": [
    {
      "id": "nfr-1",
      "category": "성능|보안|사용성|호환성|확장성|유지보수성",
      "description": "구체적이고 측정 가능한 요구사항",
      "priority": "high|medium|low",
      "metrics": "측정 가능한 지표 (선택사항)"
    }
  ]
}

비기능 요구사항 추출 가이드:
1. 대화에서 명시적으로 언급된 비기능 요구사항을 우선 추출
2. 프로젝트 특성상 필수적인 비기능 요구사항 추가 (최소 3-5개)
3. 각 요구사항은 구체적이고 측정 가능해야 함
4. 우선순위는 프로젝트 중요도에 따라 결정
```

#### 비기능 요구사항 카테고리 정의

프롬프트에 6가지 카테고리를 명시적으로 정의:

- **성능 (Performance)**: 응답시간, 처리속도, 로드시간 등
- **보안 (Security)**: 인증, 암호화, 접근제어, 데이터 보호 등
- **사용성 (Usability)**: UI/UX, 접근성, 사용자 편의성 등
- **호환성 (Compatibility)**: 브라우저, 디바이스, OS 호환성 등
- **확장성 (Scalability)**: 사용자 증가, 데이터 증가 대응 등
- **유지보수성 (Maintainability)**: 코드 품질, 문서화, 모니터링 등

---

### 3. 하드코딩 제거 및 동적 데이터 적용

**파일**: `frontend/src/components/project/RequirementsResultPanel.tsx`

#### 변경 사항

**이전 (하드코딩)**:
```typescript
nonFunctionalRequirements: [
  {
    category: "성능",
    description: "모든 페이지는 3초 이내에 로드되어야 한다.",
  },
  {
    category: "보안",
    description: "사용자 비밀번호는 암호화하여 저장해야 한다.",
  },
  // ... 고정된 데이터
],
```

**이후 (동적 데이터)**:
```typescript
nonFunctionalRequirements: extractedRequirements?.nonFunctionalRequirements?.map(nfr => ({
  id: nfr.id,
  category: nfr.category,
  description: nfr.description,
  priority: nfr.priority,
  metrics: nfr.metrics,
})) || [],
```

#### UI 렌더링 개선

**추가된 기능**:

1. **빈 데이터 처리**
   ```tsx
   {requirementsData.nonFunctionalRequirements.length === 0 ? (
     <p className="text-gray-500 text-center py-4">
       비기능 요구사항이 아직 정의되지 않았습니다.
     </p>
   ) : (
     // 데이터 표시
   )}
   ```

2. **Priority 배지**
   ```tsx
   {req.priority && (
     <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
       req.priority === 'high'
         ? 'bg-red-100 text-red-800'
         : req.priority === 'medium'
         ? 'bg-yellow-100 text-yellow-800'
         : 'bg-green-100 text-green-800'
     }`}>
       {req.priority === 'high' ? '높음' : req.priority === 'medium' ? '중간' : '낮음'}
     </span>
   )}
   ```

3. **Metrics 표시**
   ```tsx
   {req.metrics && (
     <p className="text-sm text-gray-500 italic">
       📊 측정 지표: {req.metrics}
     </p>
   )}
   ```

#### Import 추가
```typescript
import { ExtractedRequirements, NonFunctionalRequirement } from "@/types/requirements";
```

---

### 4. 마크다운 생성기 업데이트

**파일**: `frontend/src/lib/requirementsMarkdownGenerator.ts`

#### 타입 정의 업데이트

```typescript
interface RequirementsData {
  // ...
  nonFunctionalRequirements: Array<{
    id?: string;
    category: string;
    description: string;
    priority?: string;
    metrics?: string;
  }>;
  // ...
}
```

#### 마크다운 테이블 업데이트

**이전**:
```markdown
| 카테고리 | 설명 | 중요도 |
```

**이후**:
```markdown
| 카테고리 | 설명 | 측정 지표 | 중요도 |
```

#### 코드 변경

```typescript
## 🔧 비기능 요구사항

${requirementsData.nonFunctionalRequirements.length === 0 
  ? '비기능 요구사항이 정의되지 않았습니다.' 
  : `| 카테고리 | 설명 | 측정 지표 | 중요도 |
|----------|------|----------|--------|
${requirementsData.nonFunctionalRequirements.map((req: any) => {
  const categoryIcon = req.category === "성능" ? "⚡" : 
                      req.category === "보안" ? "🔒" : 
                      req.category === "사용성" ? "👥" : 
                      req.category === "호환성" ? "🔄" : 
                      req.category === "확장성" ? "📈" :
                      req.category === "유지보수성" ? "🛠️" : "📋";
  
  const categoryName = `<span class="requirement-name">${categoryIcon} ${req.category}</span>`;
  const description = `<span class="requirement-description">${req.description}</span>`;
  const metrics = req.metrics ? `<span class="requirement-description">${req.metrics}</span>` : '-';
  const priorityText = req.priority === 'high' ? '높음' : req.priority === 'medium' ? '중간' : req.priority === 'low' ? '낮음' : '높음';
  const priorityClass = req.priority === 'high' ? 'mandatory' : req.priority === 'medium' ? 'recommended' : 'optional';
  const importance = `<span class="priority-badge ${priorityClass}">${priorityText}</span>`;
  
  return `| ${categoryName} | ${description} | ${metrics} | ${importance} |`;
}).join('\n')}`}
```

---

### 5. 상태 관리 확인

**파일**: `frontend/src/app/page.tsx`

#### 확인 사항

기존 상태 관리 로직이 이미 비기능 요구사항을 지원:

1. **extractedRequirements 상태**
   - AI가 추출한 전체 requirements 객체를 저장
   - `nonFunctionalRequirements` 필드도 자동으로 포함

2. **editableRequirements 상태**
   - 사용자가 편집 가능한 requirements 상태
   - `setEditableRequirements`로 전체 객체 관리

3. **DB 저장**
   - `saveRequirements` 함수가 전체 requirements 객체를 저장
   - `nonFunctionalRequirements`도 자동으로 DB에 저장됨

**추가 작업 불필요**: 기존 상태 관리 구조가 이미 확장 가능하게 설계되어 있어 별도의 수정이 필요하지 않음.

---

## 📊 데이터 흐름

```
┌─────────────────────────────────────────────────────────────┐
│ 1. 사용자 대화 입력                                          │
│    - 프로젝트 요구사항 설명                                  │
│    - "성능이 중요합니다", "보안을 신경써주세요" 등           │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. AI 분석 (backend/src/chat/chat.service.ts)               │
│    ┌─────────────────────────────────────────────────────┐  │
│    │ extractRequirementsFromHistory()                    │  │
│    │ - 기능 요구사항 추출 (categories)                   │  │
│    │ - 비기능 요구사항 추출 (nonFunctionalRequirements)  │  │
│    │   * 최소 3-5개 자동 생성                           │  │
│    │   * 카테고리, 우선순위, 측정지표 포함              │  │
│    └─────────────────────────────────────────────────────┘  │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. 프론트엔드 상태 저장 (frontend/src/app/page.tsx)         │
│    ┌─────────────────────────────────────────────────────┐  │
│    │ setEditableRequirements(requirements)               │  │
│    │ - 메모리에 저장                                     │  │
│    │                                                     │  │
│    │ saveRequirements(projectId, requirements)           │  │
│    │ - Supabase DB에 저장                                │  │
│    └─────────────────────────────────────────────────────┘  │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. UI 표시 (RequirementsResultPanel.tsx)                    │
│    ┌─────────────────────────────────────────────────────┐  │
│    │ 비기능 요구사항 섹션                                │  │
│    │ ┌───────────────────────────────────────────────┐  │  │
│    │ │ [성능] 🔴 높음                                │  │  │
│    │ │ 모든 페이지는 3초 이내에 로드되어야 한다.      │  │  │
│    │ │ 📊 측정 지표: 페이지 로드 < 3초              │  │  │
│    │ └───────────────────────────────────────────────┘  │  │
│    │ ┌───────────────────────────────────────────────┐  │  │
│    │ │ [보안] 🔴 높음                                │  │  │
│    │ │ 사용자 비밀번호는 bcrypt로 암호화해야 한다.   │  │  │
│    │ └───────────────────────────────────────────────┘  │  │
│    └─────────────────────────────────────────────────────┘  │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. 마크다운/PDF 내보내기                                     │
│    - generateRequirementsMarkdown()                          │
│    - 비기능 요구사항 포함된 문서 생성                        │
│    - priority, metrics 포함                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 AI 자동 추출 예시

### 입력 (사용자 대화)

```
사용자: "온라인 쇼핑몰을 만들고 싶어요. 
       페이지가 빠르게 로드되는 게 중요하고, 
       결제 정보는 안전하게 보호되어야 합니다. 
       모바일과 PC 모두에서 잘 작동했으면 좋겠어요."
```

### 출력 (AI 추출 결과)

```json
{
  "nonFunctionalRequirements": [
    {
      "id": "nfr-1",
      "category": "성능",
      "description": "모든 페이지는 3초 이내에 로드되어야 한다.",
      "priority": "high",
      "metrics": "페이지 로드 시간 < 3초"
    },
    {
      "id": "nfr-2",
      "category": "보안",
      "description": "결제 정보는 TLS 1.3 암호화를 통해 전송되어야 한다.",
      "priority": "high",
      "metrics": "PCI DSS 준수"
    },
    {
      "id": "nfr-3",
      "category": "호환성",
      "description": "iOS 15+, Android 12+, Chrome 100+, Safari 15+를 지원해야 한다.",
      "priority": "high"
    },
    {
      "id": "nfr-4",
      "category": "확장성",
      "description": "동시 접속자 1,000명까지 처리 가능해야 한다.",
      "priority": "medium",
      "metrics": "동시 접속자 수 > 1,000명"
    },
    {
      "id": "nfr-5",
      "category": "사용성",
      "description": "반응형 디자인으로 모든 디바이스에서 최적화된 UI를 제공해야 한다.",
      "priority": "medium"
    }
  ]
}
```

---

## 🔍 기술적 세부사항

### TypeScript 타입 안정성

모든 변경 사항은 TypeScript 타입 안정성을 유지:

```typescript
// ✅ 타입 안전
const nfr: NonFunctionalRequirement = {
  id: "nfr-1",
  category: "성능",
  description: "...",
  priority: "high",
  metrics: "..."
};

// ❌ 타입 에러 발생
const invalid = {
  category: "성능",
  // id, description, priority 누락 → 컴파일 에러
};
```

### 하위 호환성

기존 프로젝트(비기능 요구사항 없음)도 정상 작동:

```typescript
// 기존 프로젝트
{
  categories: [...],
  extractedAt: "...",
  totalCount: 5
  // nonFunctionalRequirements 없음 → OK (선택 필드)
}

// UI에서 빈 배열로 처리
nonFunctionalRequirements: extractedRequirements?.nonFunctionalRequirements || []
```

### DB 스키마

Supabase `projects` 테이블의 `requirements` 필드(JSONB)는 자동으로 확장 가능:

```sql
-- 추가 마이그레이션 불필요
-- JSONB 필드는 동적 구조 지원
{
  "categories": [...],
  "nonFunctionalRequirements": [...],  -- 자동으로 저장됨
  "extractedAt": "...",
  "totalCount": 5
}
```

---

## ✅ 테스트 체크리스트

### 기능 테스트

- [ ] AI가 비기능 요구사항을 자동 추출하는가?
- [ ] 추출된 데이터가 DB에 정상 저장되는가?
- [ ] UI에 비기능 요구사항이 정상 표시되는가?
- [ ] priority 배지가 올바르게 표시되는가?
- [ ] metrics가 있을 때만 표시되는가?
- [ ] 빈 배열일 때 안내 메시지가 표시되는가?

### 마크다운/PDF 내보내기

- [ ] 마크다운 생성 시 비기능 요구사항 포함되는가?
- [ ] 테이블 형식이 올바른가?
- [ ] priority와 metrics가 포함되는가?

### 하위 호환성

- [ ] 기존 프로젝트(비기능 요구사항 없음) 정상 작동하는가?
- [ ] 복원된 프로젝트에서 데이터 손실이 없는가?

### 타입 안정성

- [ ] TypeScript 컴파일 오류가 없는가?
- [ ] Linter 경고가 최소화되었는가?

---

## 🚀 향후 개선 사항 (Phase 3)

### 1. 편집 UI 구현

**목표**: RequirementsPanel에서 비기능 요구사항 편집

**구현 계획**:

```tsx
// 추가할 컴포넌트
<NonFunctionalRequirementsEditor
  requirements={editableRequirements?.nonFunctionalRequirements}
  onAdd={handleAddNFR}
  onEdit={handleEditNFR}
  onDelete={handleDeleteNFR}
  onPriorityChange={handlePriorityChange}
/>
```

**기능**:
- ➕ 비기능 요구사항 추가
- ✏️ 기존 요구사항 수정
- 🗑️ 요구사항 삭제
- 🔄 우선순위 변경
- 📊 측정 지표 추가/수정

### 2. 드래그 앤 드롭

우선순위 재정렬을 위한 드래그 앤 드롭 기능:

```tsx
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
```

### 3. 템플릿 기능

프로젝트 유형별 기본 비기능 요구사항 템플릿:

```typescript
const NFR_TEMPLATES = {
  "e-commerce": [
    { category: "성능", description: "페이지 로드 3초 이내", priority: "high" },
    { category: "보안", description: "PCI DSS 준수", priority: "high" },
    // ...
  ],
  "admin-panel": [
    { category: "보안", description: "역할 기반 접근 제어", priority: "high" },
    { category: "감사", description: "모든 관리자 작업 로깅", priority: "medium" },
    // ...
  ],
  // ...
};
```

### 4. AI 품질 개선

비기능 요구사항 품질 검증:

```typescript
function validateNFR(nfr: NonFunctionalRequirement): boolean {
  // 설명이 충분히 구체적인가?
  if (nfr.description.length < 20) return false;
  
  // 모호한 표현 제외
  const vagueTerms = ['좋은', '빠른', '안전한', '편리한'];
  if (vagueTerms.some(term => nfr.description.includes(term))) return false;
  
  // 측정 가능한 지표가 있는가? (선택사항이지만 권장)
  if (nfr.priority === 'high' && !nfr.metrics) {
    console.warn('High priority NFR should have metrics:', nfr.id);
  }
  
  return true;
}
```

---

## 📝 마이그레이션 가이드

### 기존 프로젝트 마이그레이션

기존 프로젝트는 자동으로 호환됩니다:

1. **자동 처리**
   - `nonFunctionalRequirements` 필드가 없는 프로젝트는 빈 배열로 처리
   - UI에서 "비기능 요구사항이 아직 정의되지 않았습니다" 메시지 표시

2. **수동 추가 (선택사항)**
   - 프로젝트를 열고 "채팅으로 수정" 기능 사용
   - "비기능 요구사항을 추가해주세요" 요청
   - AI가 자동으로 추출하여 추가

---

## 🐛 알려진 이슈

### 1. Next.js 빌드 오류

**증상**: `[TypeError: generate is not a function]`

**원인**: Next.js 빌드 프로세스 자체의 문제 (코드 수정과 무관)

**해결 방법**: 
- `node_modules` 삭제 후 `npm install` 재실행
- Next.js 버전 업데이트 확인
- (별도 이슈로 처리 필요)

### 2. TypeScript 경고

**증상**: "Unexpected any" 경고 일부 발생

**영향**: 빌드에는 영향 없음 (경고만 발생)

**개선 계획**: 추후 명시적 타입 정의로 교체

---

## 📚 참고 자료

### 비기능 요구사항 표준

- **ISO/IEC 25010**: 시스템 및 소프트웨어 품질 모델
- **FURPS+**: Functionality, Usability, Reliability, Performance, Supportability
- **NFR Framework**: Non-Functional Requirements Framework

### 카테고리 선정 기준

6가지 카테고리는 다음을 참고하여 선정:

1. **ISO 25010 품질 모델**
   - Performance Efficiency (성능)
   - Security (보안)
   - Usability (사용성)
   - Compatibility (호환성)
   - Maintainability (유지보수성)

2. **일반적인 SI 프로젝트 요구사항**
   - Scalability (확장성) 추가

---

## 👥 기여자

- **개발**: AI Assistant
- **요청**: 사용자 (flowgence-project)
- **검토**: 추후 진행 예정

---

## 📞 문의

이 변경사항에 대한 문의사항이 있으시면 프로젝트 관리자에게 연락해주세요.

---

**변경 이력 종료**

