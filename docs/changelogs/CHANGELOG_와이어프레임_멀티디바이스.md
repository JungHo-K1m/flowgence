## Changelog - 와이어프레임 디바이스 분기 지원

### 날짜
2025-01-12

### 개요
- AI가 생성하는 와이어프레임이 모바일/데스크톱 화면을 모두 포함하도록 확장
- 프론트엔드 렌더러 및 PDF/Notion 내보내기에서 디바이스별 화면 전환 지원

### 주요 변경 사항
1. **백엔드 (`backend/src/wireframes/wireframes.service.ts`)**
   - LLM 프롬프트를 업데이트하여 모바일/데스크톱 화면을 동시에 생성하도록 지시
   - 각 screen에 `viewport` 정보 포함 (`width`, `height`, `device`)
   - 폴백 와이어프레임에 모바일/데스크톱 기본 화면 추가
   - AI 편집 로직에서도 viewport/device 구조를 유지하도록 규칙 강화

2. **타입 정의 (`frontend/src/types/wireframe.ts`)**
   - `ViewPortSpec` 도입, `WireframeScreen`에 `device`, `viewport` 추가
   - `WireframeSpec.viewport`를 optional로 변경(화면별 override 허용)

3. **와이어프레임 렌더러 (`frontend/src/components/wireframe/LoFiCanvas.tsx`)**
   - 디바이스 탭(모바일/데스크톱) + 화면 탭 UI 제공
   - 각 화면의 viewport 크기/디바이스 정보를 사용해 캔버스 렌더링

4. **PDF/Notion 출력 (`frontend/src/lib/requirementsMarkdownGenerator.ts`, `pdfGenerator.ts`)**
   - 디바이스별 그룹핑된 와이어프레임 섹션 생성
   - CSS 스타일 확장 (`wireframe-device-group`, `wireframe-device-heading`)
   - 사용자 여정 및 견적 정보가 비어 있을 때에도 기본 흐름/금액이 채워지도록 추가 보완

### 사용자 영향
- 프로젝트에 따라 모바일과 웹 와이어프레임을 각각 확인 가능
- PDF/Notion 공유 시 두 디바이스 화면이 모두 포함되어 전달

### 테스트 체크리스트
- 모바일/데스크톱 화면이 탭으로 전환되는지 확인
- PDF 내보내기 결과에서 디바이스별 섹션이 출력되는지 확인
- 와이어프레임 편집(AI 수정) 후에도 화면 구조가 유지되는지 확인

