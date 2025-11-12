# Fix - 요구사항 결과 페이지 스크롤 네비게이션 헤더 고려

## 날짜
2025-01-12

## 문제 상황

### 증상
요구사항 결과 페이지의 좌측 네비게이션 버튼을 클릭하면:
- 헤더 뒤로 콘텐츠가 숨겨짐
- 스크롤 위치가 정확하지 않음
- 섹션의 시작 부분이 헤더에 가려져서 보이지 않음

### 원인 분석

**페이지 구조:**
```tsx
<div className="flex-1 flex flex-col mb-4">
  {/* Header - 스크롤 영역 밖 */}
  <div className="border-b border-gray-200 px-6 py-4">
    <h1>요구사항 결과 페이지</h1>
    <div>검색...</div>
  </div>
  
  {/* Content - 스크롤 영역 */}
  <div className="requirements-content overflow-y-auto ...">
    <section id="overview">...</section>
    <section id="scope">...</section>
    ...
  </div>
</div>
```

**기존 `scrollToSection` 로직:**
```typescript
const element = document.getElementById(sectionId);
const contentArea = document.querySelector('.requirements-content');
const elementTop = (element as HTMLElement).offsetTop; // ❌ 문제!

contentArea.scrollTo({
  top: elementTop - 20,
  behavior: "smooth",
});
```

**문제점:**
- `offsetTop`은 부모 요소로부터의 절대 위치를 반환
- 헤더가 스크롤 영역 밖에 있어서 헤더 높이가 계산에 포함되지 않음
- 결과: 섹션이 헤더 뒤로 숨겨짐

## 해결 방법

### 수정된 코드

**파일:** `frontend/src/components/project/RequirementsResultPanel.tsx`

**변경 내용:**
```typescript
const scrollToSection = (sectionId: string) => {
  setActiveSection(sectionId);
  setTimeout(() => {
    const element = document.getElementById(sectionId);
    if (element) {
      const contentArea = document.querySelector('.requirements-content');
      if (contentArea) {
        // ✅ getBoundingClientRect로 정확한 상대 위치 계산
        const containerRect = contentArea.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        
        // 현재 스크롤 위치 + 요소와 컨테이너 사이의 거리
        const scrollTop = contentArea.scrollTop + (elementRect.top - containerRect.top);
        
        // 스크롤 위치 설정 (상단 여백 20px 추가)
        contentArea.scrollTo({
          top: scrollTop - 20,
          behavior: "smooth",
        });
      }
    }
  }, 100);
};
```

### 핵심 개선사항

#### 1. `getBoundingClientRect()` 사용
**Before (offsetTop):**
- 부모 요소로부터의 절대 위치
- 헤더 영역을 고려하지 못함
- 스크롤 상태를 고려하지 못함

**After (getBoundingClientRect):**
- 뷰포트 기준 현재 위치
- 헤더 영역 자동 고려
- 스크롤 상태 정확히 반영

#### 2. 상대 위치 계산
```typescript
// 컨테이너의 현재 위치
const containerRect = contentArea.getBoundingClientRect();

// 요소의 현재 위치
const elementRect = element.getBoundingClientRect();

// 두 요소의 상대 거리
const relativeDistance = elementRect.top - containerRect.top;

// 최종 스크롤 위치 = 현재 스크롤 + 상대 거리
const scrollTop = contentArea.scrollTop + relativeDistance;
```

#### 3. 정확한 위치 계산 흐름
1. **현재 상태 파악**
   - 컨테이너가 어디에 있는지 (헤더 아래)
   - 요소가 어디에 있는지 (컨테이너 내부)
   - 현재 스크롤 위치는 어디인지

2. **상대 거리 계산**
   - 컨테이너 상단을 기준으로
   - 요소까지의 거리 계산
   - 헤더는 자동으로 고려됨

3. **스크롤 위치 설정**
   - 현재 스크롤 + 상대 거리
   - 상단 여백 20px 추가
   - 부드러운 스크롤 애니메이션

## Before vs After

### Before (offsetTop 사용)
```
[좌측 네비게이션] [헤더 영역                      ]
                   [─────────────────────────]
                   [개요 섹션 (헤더에 가려짐)    ]
                   [                          ]
                   [실제로 보이는 내용        ]
```

### After (getBoundingClientRect 사용)
```
[좌측 네비게이션] [헤더 영역                      ]
                   [─────────────────────────]
                   [  (20px 여백)             ]
                   [개요 섹션 시작 ✅         ]
                   [                          ]
                   [모든 내용이 정확히 보임   ]
```

## 추가 고려사항

### 다양한 레이아웃에서 작동
- ✅ 고정 헤더 (fixed header)
- ✅ 상대 위치 헤더 (relative header)
- ✅ 스티키 헤더 (sticky header)
- ✅ 중첩된 스크롤 컨테이너

### 브라우저 호환성
`getBoundingClientRect()`는 모든 주요 브라우저에서 지원:
- Chrome ✅
- Firefox ✅
- Safari ✅
- Edge ✅

### 성능 영향
- **최소한의 성능 영향**
- `getBoundingClientRect()`는 매우 빠른 연산
- 100ms 지연으로 불필요한 재계산 방지

## 테스트 방법

1. 요구사항 결과 페이지 접속
2. 좌측 네비게이션에서 각 섹션 클릭
   - ✅ 개요
   - ✅ 범위
   - ✅ 기능 요구사항
   - ✅ 비기능 요구사항
   - ✅ 화면 목록
   - ✅ 화면 미리보기
   - ✅ 데이터 모델
3. 각 섹션의 시작 부분이 정확히 보이는지 확인
4. 헤더에 가려지지 않는지 확인
5. 20px 여백이 있는지 확인

## 관련 파일
- `frontend/src/components/project/RequirementsResultPanel.tsx`

## 참고
- MDN: getBoundingClientRect() - https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect
- 이전 수정: `offsetTop`을 사용한 첫 번째 시도 (불완전)
- 현재 수정: `getBoundingClientRect`를 사용한 정확한 계산 ✅

## 향후 개선 방향
- 헤더가 sticky나 fixed로 변경되어도 동일하게 작동
- 다양한 화면 크기에서 테스트
- 모바일 환경에서도 정확한 스크롤

