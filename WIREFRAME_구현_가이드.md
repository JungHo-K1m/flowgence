# 와이어프레임 기능 구현 가이드

**날짜**: 2025-11-11  
**작업자**: AI Assistant  
**목적**: 요구사항 편집 완료 후 로파이 와이어프레임 자동 생성 기능 추가

---

## 🎯 구현 완료 현황

### ✅ 완료된 작업 (MVP Phase 1)

1. **타입 정의** (`frontend/src/types/wireframe.ts`)
   - `WireframeSpec`, `WireElement`, `WireframeScreen` 등
   - 디바이스, 요소 타입 정의

2. **백엔드 API** (`backend/src/wireframes/`)
   - `wireframes.service.ts`: LLM 호출 로직
   - `wireframes.controller.ts`: REST API 엔드포인트
   - `wireframes.module.ts`: NestJS 모듈
   - 폴백 메커니즘 (LLM 실패 시 기본 와이어프레임)

3. **프론트엔드 API** (`frontend/src/app/api/wireframes/generate/`)
   - Next.js API 라우트 (백엔드 프록시)

4. **렌더러 컴포넌트** (`frontend/src/components/wireframe/LoFiCanvas.tsx`)
   - 박스 기반 로파이 렌더링
   - 타입별 스타일링
   - 호버 효과

5. **커스텀 훅** (`frontend/src/hooks/useWireframe.ts`)
   - 와이어프레임 생성/관리 로직

6. **DB 마이그레이션** (`supabase/migrations/20250111_create_wireframes_table.sql`)
   - `wireframes` 테이블
   - RLS 정책
   - 인덱스

---

## 📋 남은 작업 (MVP Phase 1 완성)

### 1. Supabase 마이그레이션 실행 (5분)

```bash
# Supabase CLI 설치 (아직 없다면)
npm install -g supabase

# 로컬 개발 환경
supabase db reset

# 또는 프로덕션에 직접 적용
# Supabase 대시보드 → SQL Editor에서
# supabase/migrations/20250111_create_wireframes_table.sql 복사/실행
```

**확인:**
```sql
-- wireframes 테이블 생성 확인
select * from wireframes limit 1;
```

---

### 2. page.tsx에 와이어프레임 UI 통합 (1-2시간)

#### 옵션 A: 3단계(기능 구성) 탭에 추가 (✅ 추천)

**위치**: `frontend/src/app/page.tsx` - Step 3 (ConfirmationPanel)

```typescript
// page.tsx 수정 예시
import { useWireframe } from "@/hooks/useWireframe";
import { LoFiCanvas } from "@/components/wireframe/LoFiCanvas";

function HomePageContent() {
  const { wireframe, isGenerating, error, generateWireframe } = useWireframe();
  
  // ... 기존 코드 ...

  return (
    <>
      {/* Step 3: 기능 구성 확인 */}
      {currentStep === 3 && showConfirmation && (
        <div className="space-y-6">
          <ConfirmationPanel ... />
          
          {/* 와이어프레임 섹션 추가 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">
              📱 화면 미리보기 (로파이 와이어프레임)
            </h3>
            
            {!wireframe && !isGenerating && (
              <button
                onClick={() => generateWireframe(savedProjectId!)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                와이어프레임 생성
              </button>
            )}
            
            {isGenerating && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent border-indigo-600" />
                <p className="ml-4 text-gray-600">AI가 화면을 그리고 있습니다...</p>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">오류: {error}</p>
              </div>
            )}
            
            {wireframe && (
              <div className="flex justify-center">
                <LoFiCanvas spec={wireframe} scale={0.8} />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
```

---

#### 옵션 B: 2단계(요구사항 편집) 우측 패널에 추가

**위치**: `RequirementsPanel.tsx` 또는 우측 패널

```typescript
// 요구사항 편집 중 미리보기로 표시
<div className="fixed right-0 top-0 h-screen w-96 bg-white shadow-lg p-4 overflow-y-auto">
  <h3 className="text-sm font-semibold mb-2">실시간 미리보기</h3>
  {wireframe && <LoFiCanvas spec={wireframe} scale={0.5} />}
</div>
```

---

### 3. 로딩 상태 개선 (30분)

더 나은 로딩 UX:

```typescript
// frontend/src/components/wireframe/WireframeLoading.tsx
export function WireframeLoading() {
  const [step, setStep] = useState(0);
  
  const steps = [
    "요구사항 분석 중...",
    "화면 구조 설계 중...",
    "요소 배치 중...",
    "와이어프레임 완성 중..."
  ];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setStep(prev => (prev + 1) % steps.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-transparent border-indigo-600" />
      <p className="text-gray-700 font-medium">{steps[step]}</p>
      <p className="text-sm text-gray-500">예상 소요 시간: 10-15초</p>
    </div>
  );
}
```

---

## 🎨 UI 배치 권장사항

### 최종 추천: **3단계(기능 구성) 탭**

**이유:**
1. ✅ 요구사항 확정 후 생성 (정확도 ↑)
2. ✅ 프로젝트 개요와 함께 보기 좋음
3. ✅ 사용자가 전체 맥락 이해 후 확인
4. ✅ "다음 단계" 전에 마지막 확인

**배치:**
```
3단계: 기능 구성 확인
├─ 프로젝트 개요 (상단)
├─ 요구사항 요약 (중간)
├─ 📱 화면 미리보기 (하단) ← 새로 추가
└─ [다음 단계] 버튼
```

---

## 🧪 테스트 시나리오

### 시나리오 1: 정상 플로우
1. 프로젝트 생성 → 요구사항 추출 → 편집 완료
2. Step 3로 이동
3. "와이어프레임 생성" 버튼 클릭
4. 10-15초 로딩
5. 와이어프레임 표시 확인
   - ✅ 상단 네비게이션
   - ✅ 검색/필터
   - ✅ 목록/카드
   - ✅ 하단 탭

### 시나리오 2: LLM 실패 (폴백)
1. 백엔드에서 LLM 호출 실패
2. 폴백 와이어프레임 자동 반환
3. 기본 레이아웃 표시 확인

### 시나리오 3: 재생성
1. 와이어프레임 생성 완료
2. "다시 생성" 버튼 클릭
3. 새로운 와이어프레임으로 교체

---

## 🐛 예상 이슈 & 해결

### 이슈 1: Supabase RLS 권한 오류
**증상:** `new row violates row-level security policy`

**해결:**
```sql
-- RLS 정책 확인
select * from pg_policies where tablename = 'wireframes';

-- 문제 시 재생성
drop policy if exists "Users can insert own project wireframes" on wireframes;
create policy "Users can insert own project wireframes"
  on wireframes for insert
  with check (
    project_id in (select id from projects where user_id = auth.uid())
  );
```

---

### 이슈 2: LLM JSON 파싱 실패
**증상:** `JSON.parse error` 또는 잘못된 스키마

**해결:** (이미 구현됨)
- 코드블록 제거 로직
- JSON match 정규식
- 폴백 와이어프레임 반환

---

### 이슈 3: CORS 에러
**증상:** `Access-Control-Allow-Origin` 에러

**해결:**
```typescript
// backend/src/main.ts
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
});
```

---

## 📊 비용 예상

### LLM 호출 비용 (Claude Sonnet 4)
- **프롬프트**: ~1,500 tokens
- **응답**: ~1,000 tokens
- **비용**: $0.015/프로젝트 (약 20원)

### 월간 예상 (1,000개 프로젝트)
- **총 비용**: $15/월 (약 20,000원)
- **저렴한 편**

---

## 🚀 다음 단계 (Phase 2 - 선택사항)

### 1. 와이어프레임 편집 기능
- 드래그 앤 드롭
- 요소 크기 조정
- 요소 추가/삭제

### 2. 다중 화면 지원
- 홈, 상세, 설정 등 여러 화면
- 화면 간 전환

### 3. 다운로드/공유
- PNG 이미지 다운로드
- PDF 내보내기 통합

### 4. 버전 관리
- 와이어프레임 히스토리
- 버전 비교
- 롤백

---

## 📝 개발 체크리스트

### 백엔드
- [x] 타입 정의
- [x] Service (LLM 호출)
- [x] Controller
- [x] Module
- [x] app.module.ts 연결
- [ ] 백엔드 실행 테스트

### 프론트엔드
- [x] 타입 정의
- [x] API 라우트
- [x] LoFiCanvas 컴포넌트
- [x] useWireframe 훅
- [ ] page.tsx 통합
- [ ] 로딩 UI
- [ ] 에러 처리

### 인프라
- [ ] Supabase 마이그레이션 실행
- [ ] 환경 변수 확인 (ANTHROPIC_API_KEY)
- [ ] 배포 테스트

---

## 🎯 빠른 시작 (Quick Start)

### 1. Supabase 마이그레이션
```bash
# Supabase 대시보드 → SQL Editor
# supabase/migrations/20250111_create_wireframes_table.sql 실행
```

### 2. 백엔드 재시작
```bash
cd backend
npm run start:dev
```

### 3. 프론트엔드 page.tsx 수정
위의 "옵션 A" 코드 복사/붙여넣기

### 4. 테스트
```bash
cd frontend
npm run dev
# http://localhost:3000 접속
# 프로젝트 생성 → Step 3 → 와이어프레임 생성
```

---

**구현 완료 목표: 3-4시간** ⏱️

질문이나 이슈가 있으면 알려주세요! 🚀

