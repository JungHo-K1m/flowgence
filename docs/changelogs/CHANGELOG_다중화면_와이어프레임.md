# Changelog - 다중 화면 와이어프레임 지원

## 날짜
2025-01-12

## 개요
AI가 프로젝트 요구사항을 분석하여 필요한 화면 수를 자동으로 결정하고, 여러 화면의 와이어프레임을 생성하도록 개선했습니다.

## 주요 변경 사항

### 1. 타입 정의 확장
**파일:** `frontend/src/types/wireframe.ts`

**변경 내용:**
- `WireframeSpec.screen` → `WireframeSpec.screens[]` (단수 → 복수 배열)

**수정 전:**
```typescript
export interface WireframeSpec {
  viewport: { width: number; height: number; device: Device };
  screen: WireframeScreen;  // 단일 화면
}
```

**수정 후:**
```typescript
export interface WireframeSpec {
  viewport: { width: number; height: number; device: Device };
  screens: WireframeScreen[];  // 여러 화면 지원
}
```

### 2. 백엔드 LLM 프롬프트 개선
**파일:** `backend/src/wireframes/wireframes.service.ts`

**변경 내용:**
- AI가 요구사항 분석 후 필요한 주요 화면들(3-7개)을 자동 생성
- 시스템 프롬프트에 다중 화면 생성 규칙 추가
- 사용자 프롬프트에 화면 선정 가이드 추가

**주요 업데이트:**
```typescript
// 시스템 프롬프트
- 스키마: { viewport, screens: [{ id, name, layout, elements[] }, ...] }
- 요구사항 분석 후 필요한 주요 화면들을 모두 생성합니다 (보통 3-7개)

// 사용자 프롬프트
화면 선정 가이드:
- 홈/메인 화면 (필수)
- 목록/검색 화면 (있는 경우)
- 상세 화면 (있는 경우)
- 등록/작성 화면 (있는 경우)
- 마이페이지/프로필 화면 (있는 경우)
- 로그인 화면 (인증이 필요한 경우)
- 설정 화면 (있는 경우)
```

**폴백 와이어프레임:**
- 단일 화면을 `screens` 배열에 포함하도록 수정

**검증 로직:**
```typescript
// 수정 전
if (!spec.viewport || !spec.screen || !spec.screen.elements)

// 수정 후
if (!spec.viewport || !spec.screens || !Array.isArray(spec.screens) || spec.screens.length === 0)
```

### 3. LoFiCanvas 컴포넌트 - 화면 전환 UI 추가
**파일:** `frontend/src/components/wireframe/LoFiCanvas.tsx`

**변경 내용:**
- `useState`로 현재 선택된 화면 인덱스 관리
- 여러 화면이 있는 경우 탭 UI 자동 표시
- 화면 전환 시 부드러운 트랜지션

**주요 기능:**
```typescript
const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
const currentScreen = screens[currentScreenIndex];

// 화면 선택 탭 (여러 화면이 있는 경우만 표시)
{screens.length > 1 && (
  <div className="flex flex-wrap gap-2 justify-center">
    {screens.map((screen, index) => (
      <button onClick={() => setCurrentScreenIndex(index)}>
        {screen.name}
      </button>
    ))}
  </div>
)}
```

**UI 개선:**
- 활성 탭: 인디고 배경 + 흰색 텍스트 + 그림자
- 비활성 탭: 회색 배경 + 호버 효과
- 화면 정보에 "화면 X/Y" 표시 추가

### 4. WireframeEditor 컴포넌트 업데이트
**파일:** `frontend/src/components/wireframe/WireframeEditor.tsx`

**변경 내용:**
- 여러 화면이 있을 때 안내 메시지 표시
- 예시 프롬프트에 첫 번째 화면 이름 포함
- 플레이스홀더 텍스트 개선

**주요 개선:**
```typescript
// 여러 화면이 있는 경우 안내 메시지
{wireframe.screens && wireframe.screens.length > 1 && (
  <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
    💡 여러 화면이 있습니다. 수정할 화면을 명시하세요.
  </div>
)}

// 동적 예시 프롬프트
const firstScreenName = wireframe.screens[0]?.name || "홈 화면";
const examplePrompts = [
  `${firstScreenName}의 검색 버튼을 더 크게`,
  `${firstScreenName}의 리스트 높이 늘리기`,
  // ...
];
```

### 5. 자동 적용되는 컴포넌트
다음 컴포넌트들은 `LoFiCanvas`를 사용하므로 **자동으로 다중 화면을 지원**합니다:

- ✅ `frontend/src/components/project/RequirementsResultPanel.tsx`
- ✅ `frontend/src/components/project/ConfirmationPanel.tsx`

## 사용 예시

### 간단한 랜딩 페이지
AI가 자동 판단: **1-2개 화면** 생성
- 홈 화면
- 문의 화면

### Todo 앱
AI가 자동 판단: **3-4개 화면** 생성
- 홈/목록 화면
- 추가 화면
- 상세 화면
- 설정 화면

### 쇼핑몰
AI가 자동 판단: **5-7개 화면** 생성
- 홈 화면
- 카테고리/목록 화면
- 상품 상세 화면
- 장바구니 화면
- 결제 화면
- 마이페이지 화면
- 설정 화면

## 사용자 경험 개선

### Before (단일 화면)
- 홈 화면만 생성
- 전체 플로우 파악 어려움
- 제한적인 미리보기

### After (다중 화면)
- 프로젝트에 필요한 모든 주요 화면 생성
- 화면 간 탭 전환으로 전체 플로우 확인
- AI가 자동으로 적절한 화면 수 결정
- 각 화면별 AI 편집 지원

## 기술적 이점

1. **타입 안전성 유지**
   - TypeScript 타입 정의로 컴파일 타임 체크
   - Lint 에러 없음

2. **확장성**
   - 화면 수 제한 없음
   - 새로운 화면 타입 쉽게 추가 가능

3. **하위 호환성**
   - 기존 단일 화면 데이터도 `screens` 배열로 마이그레이션 가능
   - 폴백 메커니즘으로 안정성 보장

4. **AI 최적화**
   - Claude Sonnet 4 모델 사용
   - 요구사항 분석 능력 활용
   - 컨텍스트에 맞는 화면 수 자동 결정

## 데이터베이스

**변경 불필요**
- `wireframes` 테이블의 `spec` 컬럼은 `jsonb` 타입
- 유연한 스키마로 추가 마이그레이션 불필요
- 기존 데이터와 호환 가능

## 테스트 방법

1. 프로젝트 요구사항 작성 (예: "쇼핑몰 앱")
2. "와이어프레임 생성하기" 클릭
3. AI가 자동으로 5-7개 화면 생성 확인
4. 화면 전환 탭 클릭하여 각 화면 확인
5. AI 편집: "홈 화면의 검색 버튼을 더 크게" 입력
6. 수정 결과 확인

## 성능 영향

- **최소한의 성능 영향**
  - 렌더링: 현재 선택된 화면만 렌더링
  - 메모리: 모든 화면 데이터를 메모리에 보관하지만, JSON 크기는 작음 (보통 < 50KB)
  - LLM 비용: 여러 화면 생성으로 토큰 사용량 증가 (약 2-3배)

## 향후 개선 방향

1. **화면 간 관계 표시**
   - 플로우 다이어그램 추가
   - 화면 전환 경로 시각화

2. **화면별 독립 편집**
   - 특정 화면만 재생성
   - 화면 순서 변경

3. **프로토타입 모드**
   - 클릭 가능한 인터랙션
   - 화면 간 전환 시뮬레이션

4. **내보내기 확장**
   - Figma 각 화면을 별도 페이지로 내보내기
   - PDF에 모든 화면 포함

## 관련 파일

### 백엔드
- `backend/src/wireframes/wireframes.service.ts`

### 프론트엔드
- `frontend/src/types/wireframe.ts`
- `frontend/src/components/wireframe/LoFiCanvas.tsx`
- `frontend/src/components/wireframe/WireframeEditor.tsx`

### 자동 적용
- `frontend/src/components/project/RequirementsResultPanel.tsx`
- `frontend/src/components/project/ConfirmationPanel.tsx`

## 참고
이 기능은 사용자의 제안("사용자가 원하는 프로젝트에 맞는 페이지 수를 보여주면 좋을 거 같은데")을 반영하여 구현되었습니다.

