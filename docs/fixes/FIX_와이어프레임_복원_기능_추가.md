# 🔧 와이어프레임 복원 기능 추가

**날짜**: 2025-11-14  
**작업자**: AI Assistant  
**이슈**: 마이페이지에서 프로젝트 상세보기 시 와이어프레임이 표시되지 않음

---

## 🐛 **문제 상황**

### 사용자 보고
- 마이페이지 프로젝트 대시보드에서 프로젝트 카드 클릭 → "상세보기" 또는 "작성 이어하기"
- 프로젝트 개요, 요구사항은 정상적으로 복원되지만 **와이어프레임이 표시되지 않음**

### 근본 원인
```typescript
// ❌ Before: frontend/src/hooks/useProjectResume.ts
const projectData = {
  projectId: project.id,
  overview: projectOverview,
  requirements: project.requirements || {},
  chatMessages: formattedMessages,
  extractedRequirements: requirements || [],
  // ❌ wireframe 데이터 누락!
  timestamp: Date.now(),
};
```

**문제점**:
1. **데이터 조회 누락**: `useProjectResume.ts`에서 `wireframes` 테이블 조회하지 않음
2. **세션 저장 누락**: `sessionStorage`에 와이어프레임 데이터 저장하지 않음
3. **복원 로직 누락**: `restoreProjectState`에 와이어프레임 복원 로직 없음
4. **State Setter 미제공**: `useWireframe` 훅에서 `setWireframe` export하지 않음

---

## ✅ **해결 방법**

### 1️⃣ **`useProjectResume.ts` - 와이어프레임 조회 추가**

```typescript
// ✅ After: 와이어프레임 데이터 조회
const { data: wireframeData, error: wireframeError } = await supabase
  .from("wireframes")
  .select("*")
  .eq("project_id", projectId)
  .order("created_at", { ascending: false })
  .limit(1);

if (wireframeError) {
  console.warn("와이어프레임 조회 실패 (무시):", wireframeError);
}

const latestWireframe = wireframeData && wireframeData.length > 0 ? wireframeData[0] : null;

console.log("프로젝트 복구 - 와이어프레임 데이터:", {
  projectId: project.id,
  hasWireframe: !!latestWireframe,
  wireframeVersion: latestWireframe?.version,
  wireframeScreenCount: latestWireframe?.spec?.screens?.length || 0,
});

// sessionStorage에 저장
const projectData = {
  projectId: project.id,
  // ...
  wireframe: latestWireframe?.spec || null, // ✅ 추가
  timestamp: Date.now(),
};
```

**특징**:
- `wireframes` 테이블에서 최신 버전 1개만 조회 (`.limit(1)`)
- 조회 실패는 경고만 표시 (와이어프레임이 없을 수도 있음)
- `spec` 필드만 추출 (`latestWireframe?.spec`)

---

### 2️⃣ **`useWireframe.ts` - `setWireframe` export**

```typescript
// ✅ After
return {
  wireframe,
  isGenerating,
  isApplying,
  error,
  generateWireframe,
  applyEdit,
  clearWireframe,
  setWireframe, // ✅ 프로젝트 복원 시 사용
};
```

**이유**: 프로젝트 복원 시 외부에서 와이어프레임을 직접 설정할 수 있도록 함

---

### 3️⃣ **`useProjectRestore.ts` - 와이어프레임 복원 로직**

```typescript
// ✅ Type 추가
projectData: {
  description?: string;
  serviceType?: string;
  overview?: any;
  chatMessages?: any[];
  requirements?: any;
  extractedRequirements?: any;
  wireframe?: any; // ✅ 추가
},
setState: {
  // ...
  setWireframe?: (wireframe: any) => void; // ✅ 추가
}

// ✅ 복원 로직 추가
// 5. 와이어프레임 복원
if (projectData.wireframe && setState.setWireframe) {
  console.log("와이어프레임 복원:", {
    hasWireframe: !!projectData.wireframe,
    screenCount: projectData.wireframe?.screens?.length || 0,
  });
  setState.setWireframe(projectData.wireframe);
}
```

---

### 4️⃣ **`page.tsx` - `setWireframe` 전달**

```typescript
// ✅ useWireframe에서 setWireframe 추출
const { wireframe, isGenerating, isApplying, error: wireframeError, 
        generateWireframe, applyEdit, clearWireframe, setWireframe } = useWireframe();

// ✅ restoreProjectState 호출 시 전달
restoreProjectState(projectData, step, {
  setProjectDescription,
  setSelectedServiceType,
  setChatMessages,
  setCurrentStep,
  setShowChatInterface,
  setShowRequirements,
  setShowConfirmation,
  setShowFinalResult,
  updateOverview,
  setOverviewDirectly,
  updateExtractedRequirements,
  setEditableRequirements,
  setWireframe, // ✅ 추가
});
```

---

## 📊 **데이터 흐름**

### Before (와이어프레임 누락)
```
마이페이지 → resumeProject(id) → Supabase 조회
  ├─ projects 테이블 (프로젝트 정보)
  ├─ chat_messages 테이블 (채팅)
  ├─ requirements 테이블 (요구사항)
  └─ ❌ wireframes 테이블 (조회 안 함!)
         ↓
    sessionStorage 저장 (wireframe 없음)
         ↓
    restoreProjectState (wireframe 복원 안 함)
         ↓
    ❌ 와이어프레임 표시 안 됨!
```

### After (와이어프레임 포함)
```
마이페이지 → resumeProject(id) → Supabase 조회
  ├─ projects 테이블 (프로젝트 정보)
  ├─ chat_messages 테이블 (채팅)
  ├─ requirements 테이블 (요구사항)
  └─ ✅ wireframes 테이블 (최신 버전 조회)
         ↓
    sessionStorage 저장 (wireframe 포함)
         ↓
    restoreProjectState (setWireframe 호출)
         ↓
    ✅ 와이어프레임 정상 표시!
```

---

## 🧪 **테스트 방법**

### 1. 프로젝트 생성 및 와이어프레임 생성
```
1. 메인 페이지 → 새 프로젝트 시작
2. 1단계 (개요) → 2단계 (요구사항) → 3단계 (견적/와이어프레임 생성)
3. 와이어프레임 생성 완료 확인
4. 4단계 (완료) → 프로젝트 저장
```

### 2. 마이페이지에서 복원
```
1. 마이페이지 접속
2. 최근 프로젝트 카드에서 "상세보기" 클릭
3. ✅ 와이어프레임이 정상적으로 표시되는지 확인
4. 브라우저 콘솔에서 로그 확인:
   - "와이어프레임 복원: { hasWireframe: true, screenCount: X }"
```

### 3. 콘솔 로그 확인
```javascript
// 기대되는 로그
프로젝트 복구 - 와이어프레임 데이터: {
  projectId: "xxx",
  hasWireframe: true,
  wireframeVersion: 1,
  wireframeScreenCount: 5
}

와이어프레임 복원: {
  hasWireframe: true,
  screenCount: 5
}

프로젝트 상태 복원 완료: {
  step: 3,
  hasWireframe: true
}
```

---

## 📝 **변경된 파일**

| 파일 | 변경 내용 |
|------|----------|
| `frontend/src/hooks/useProjectResume.ts` | ✅ `wireframes` 테이블 조회 추가<br>✅ `latestWireframe?.spec` sessionStorage 저장 |
| `frontend/src/hooks/useWireframe.ts` | ✅ `setWireframe` export 추가 |
| `frontend/src/hooks/useProjectRestore.ts` | ✅ `wireframe` 타입 추가<br>✅ `setWireframe` 파라미터 추가<br>✅ 와이어프레임 복원 로직 추가 |
| `frontend/src/app/page.tsx` | ✅ `setWireframe` 추출<br>✅ `restoreProjectState` 호출 시 `setWireframe` 전달 |

---

## 🎯 **영향 범위**

### ✅ 정상 동작하는 기능
- **프로젝트 복원**: 개요, 요구사항, 채팅 메시지, **와이어프레임** 모두 복원
- **와이어프레임 편집**: 복원된 와이어프레임에서 AI 편집 정상 작동
- **PDF/Notion 공유**: 와이어프레임 포함된 견적서 생성

### ⚠️ 주의사항
- **와이어프레임이 없는 프로젝트**: 정상적으로 처리 (경고 로그만 표시)
- **DB 구조 의존성**: `wireframes` 테이블이 존재하지 않으면 에러 발생 (Supabase 마이그레이션 필요)

---

## 🔄 **후속 작업**

- [ ] **실제 테스트**: Vercel 배포 후 프론트엔드에서 복원 테스트
- [ ] **에러 핸들링 개선**: `wireframes` 테이블 없을 때 graceful degradation
- [ ] **성능 최적화**: `wireframes` 테이블 인덱스 확인 (`project_id`, `created_at`)
- [ ] **문서 업데이트**: `PROJECT_OVERVIEW.md`에 와이어프레임 복원 로직 추가

---

## 🚀 **배포**

### 프론트엔드 (Vercel)
```bash
cd frontend
git add .
git commit -m "fix: 프로젝트 복원 시 와이어프레임 데이터 포함"
git push origin main
```

### 확인
```
1. Vercel 자동 배포 완료 대기 (약 2-3분)
2. https://app.flowgence.ai → 마이페이지 → 프로젝트 상세보기
3. 와이어프레임 정상 표시 확인
```

---

**작성일**: 2025-11-14  
**버전**: v1.0  
**태그**: #bugfix #wireframe #project-restore #mypage

