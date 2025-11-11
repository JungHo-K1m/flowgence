# 📚 Flowgence 프로젝트 문서

프로젝트와 관련된 모든 문서를 한 곳에 모아놓았습니다.

---

## 📁 디렉토리 구조

```
docs/
├── changelogs/          # 변경 이력 문서
├── guides/              # 구현 가이드 및 설정 매뉴얼
├── fixes/               # 버그 수정 관련 문서
└── [기타 문서들]        # 프로젝트 개요, 세션 요약 등
```

---

## 📋 문서 카테고리

### 🔄 [changelogs/](./changelogs/) - 변경 이력

기능 추가 및 개선 사항에 대한 상세 변경 이력

- `CHANGELOG_와이어프레임_*.md` - 와이어프레임 기능 관련
- `CHANGELOG_AI검증_*.md` - AI 검증 기능 관련
- `CHANGELOG_비기능요구사항_*.md` - 비기능 요구사항 관련
- `CHANGELOG_로딩스피너_개선.md` - 로딩 스피너 개선
- `CHANGELOG_사용자관리_액션열_제거.md` - 사용자 관리 UI 개선
- `CHANGELOG_프로젝트모니터링_상세보기_모달.md` - 프로젝트 모니터링 개선

### 📖 [guides/](./guides/) - 구현 가이드

기능 구현 방법 및 설정 가이드

- `FILE_UPLOAD_IMPLEMENTATION.md` - 파일 업로드 구현 가이드
- `NOTION_SETUP_GUIDE.md` - Notion 연동 설정 가이드

### 🔧 [fixes/](./fixes/) - 버그 수정

발견된 버그와 수정 내역

- `REQUIREMENTS_*.md` - 요구사항 관련 버그 수정 (9개)
- `BUILD_ERROR_FIX.md` - 빌드 에러 수정
- `COMPLETED_PROJECT_STATUS_FIX.md` - 완료 프로젝트 상태 수정

### 📄 루트 문서

프로젝트 전반에 관한 주요 문서

- `PROJECT_OVERVIEW.md` - 프로젝트 전체 개요
- `SESSION_SUMMARY.md` - 세션 요약
- `AI_ANALYSIS_UPDATE.md` - AI 분석 업데이트
- `CHAT_TYPING_EFFECT_IMPROVEMENT.md` - 채팅 타이핑 효과 개선
- `ESTIMATE_MARKDOWN_IMPROVEMENT.md` - 견적서 마크다운 개선
- `PROJECT_OVERVIEW_LOADING_IMPROVEMENT.md` - 프로젝트 개요 로딩 개선
- `WIREFRAME_구현_가이드.md` - 와이어프레임 구현 가이드
- `AI_검증_로딩_통합_가이드.md` - AI 검증 로딩 통합 가이드

---

## 🔍 문서 찾기

### 기능별

- **와이어프레임**: `changelogs/CHANGELOG_와이어프레임_*.md`, `WIREFRAME_구현_가이드.md`
- **AI 검증**: `changelogs/CHANGELOG_AI검증_*.md`, `AI_검증_로딩_통합_가이드.md`
- **요구사항**: `fixes/REQUIREMENTS_*.md`
- **비기능 요구사항**: `changelogs/CHANGELOG_비기능요구사항_*.md`
- **파일 업로드**: `guides/FILE_UPLOAD_IMPLEMENTATION.md`
- **Notion 연동**: `guides/NOTION_SETUP_GUIDE.md`

### 최근 업데이트 (최신순)

1. `changelogs/CHANGELOG_와이어프레임_재생성_버그수정.md` - 재생성 버그 수정
2. `changelogs/CHANGELOG_와이어프레임_UI_통합.md` - 탭 구조로 UI 통합
3. `changelogs/CHANGELOG_사용자관리_액션열_제거.md` - 사용자 관리 개선
4. `changelogs/CHANGELOG_프로젝트모니터링_상세보기_모달.md` - 프로젝트 모니터링 모달
5. `changelogs/CHANGELOG_AI검증_모달_추가.md` - AI 검증 결과 모달

---

## 📝 문서 작성 가이드

새 문서를 추가할 때는 다음 규칙을 따라주세요:

1. **변경 이력**: `changelogs/CHANGELOG_[기능명]_[설명].md`
2. **가이드**: `guides/[기능명]_[설명].md`
3. **버그 수정**: `fixes/[기능명]_[설명]_FIX.md`
4. **기타**: `docs/` 루트에 직접 저장

### 문서 템플릿

```markdown
# [제목]

**날짜**: YYYY-MM-DD
**작업자**: [이름]
**목적**: [간단한 설명]

---

## 문제/배경

[문제 설명 또는 배경]

---

## 해결 방법

[해결 방법 설명]

---

## 코드 변경

[관련 코드 변경 사항]

---

## 테스트

[테스트 방법 및 결과]
```

---

## 🔗 관련 링크

- [프로젝트 메인 README](../README.md)
- [Frontend README](../frontend/README.md)
- [Backend README](../backend/README.md)

