## Changelog - PDF 내 와이어프레임 포함

### 날짜
2025-01-12

### 배경
- 요구사항 결과 페이지에서 PDF로 내보내기를 하면 와이어프레임 섹션이 빠져 있음
- 사용자 요청: **"PDF로 내보내기 했을 때, 만들어진 와이어프레임들도 보이게끔"**

### 변경 사항
1. `generateRequirementsMarkdown`( `frontend/src/lib/requirementsMarkdownGenerator.ts` )
   - `WireframeSpec` 지원을 위해 함수 시그니처에 `wireframe` 파라미터 추가
   - `## 🖼️ 와이어프레임 미리보기` 섹션 자동 생성
   - 각 화면을 HTML 캔버스로 렌더링 (viewport 축소, 요소 위치/크기 적용)
   - 요소 타입별 아이콘 및 스타일 적용 (`getWireframeIcon` 헬퍼 추가)

2. `downloadMarkdownAsPDF`( `frontend/src/lib/pdfGenerator.ts` )
   - 와이어프레임용 CSS 추가 (`.wireframe-preview`, `.wireframe-screen`, `.wireframe-element` 등)
   - 타입별 색상 테마와 박스 스타일 정의, 인쇄 안전성 고려

3. `RequirementsResultPanel`( `frontend/src/components/project/RequirementsResultPanel.tsx` )
   - PDF/Notion/대체 공유 시 `generateRequirementsMarkdown` 호출에 `wireframe` 전달
   - Notion 공유 API에도 와이어프레임 데이터 전달

4. `shareRequirementsToNotion`( `frontend/src/lib/notionService.ts` )
   - 시그니처에 `wireframe` 파라미터 추가, 마크다운 생성 시 반영

### 영향 범위
- PDF 내보내기: 와이어프레임 화면이 시각적으로 포함
- Notion 공유/대체 공유: 동일한 마크다운 사용 → 와이어프레임 포함
- 기존 마크다운 소비처는 영향을 받지 않음 (wireframe 파라미터 optional)

### 테스트 시나리오
1. Step 4 결과 페이지에서 PDF 내보내기 → PDF 내 와이어프레임 화면 표시 확인
2. Notion 공유 → 생성된 페이지에서 와이어프레임 확인
3. ZOOM 아웃 용 와이어프레임 스크롤 UI 정상 동작 확인

### 추가 고려사항
- 이미지 대신 CSS/HTML 기반 렌더러를 사용하므로 해상도 손실 없음
- 향후 PNG 스냅샷 내보내기 필요 시 `canvas` → `toDataURL` 전략 고려 가능

