# Flowgence 프로젝트 문서

프로젝트와 관련된 모든 문서를 한 곳에 모아놓았습니다.

---

## 디렉토리 구조

```
docs/
├── changelogs/          # 기능 추가 및 개선 변경 이력 (24개)
├── guides/              # 구현 가이드 및 설정 매뉴얼 (13개)
├── fixes/               # 버그 수정 문서 (18개)
├── PROJECT_OVERVIEW.md  # 프로젝트 전체 개요
├── SESSION_SUMMARY.md   # 세션 작업 요약
└── README.md            # 이 파일 (문서 인덱스)
```

---

## 문서 카테고리

### [changelogs/](./changelogs/) - 변경 이력 (24개)

기능 추가 및 개선 사항에 대한 상세 변경 이력

#### 와이어프레임
- `CHANGELOG_와이어프레임_UI_통합.md` - 탭 구조로 UI 통합
- `CHANGELOG_와이어프레임_다중화면.md` → 다중 화면 지원
- `CHANGELOG_와이어프레임_멀티디바이스.md` - 멀티 디바이스 지원
- `CHANGELOG_와이어프레임_재생성_버그수정.md` - 재생성 버그 수정
- `CHANGELOG_와이어프레임_529재시도_로직.md` - 529 에러 재시도
- `CHANGELOG_WireframeEditor_ESLint수정.md` - ESLint 수정
- `CHANGELOG_PDF_와이어프레임_포함.md` - PDF 내보내기에 와이어프레임 포함
- `CHANGELOG_요구사항결과페이지_와이어프레임_추가.md` - 결과 페이지 와이어프레임

#### AI 기능
- `CHANGELOG_AI검증_기능_추가.md` - AI 검증 기능
- `CHANGELOG_AI검증_모달_추가.md` - AI 검증 결과 모달
- `CHANGELOG_AI검증_백엔드통합.md` - 백엔드 AI 검증 통합
- `CHANGELOG_AI_분석_업데이트.md` - AI 분석 업데이트
- `CHANGELOG_채팅_타이핑효과_개선.md` - 채팅 타이핑 효과

#### 요구사항
- `CHANGELOG_비기능요구사항_구현.md` - 비기능 요구사항 구현
- `CHANGELOG_비기능요구사항_편집UI_완성.md` - 비기능 요구사항 편집 UI

#### UI/UX
- `CHANGELOG_랜딩페이지_중앙정렬.md` - 랜딩 페이지 정렬
- `CHANGELOG_로딩스피너_개선.md` - 로딩 스피너 개선
- `CHANGELOG_프로젝트개요_로딩_개선.md` - 프로젝트 개요 로딩 UI
- `CHANGELOG_견적서_마크다운_개선.md` - 견적서 마크다운 개선
- `CHANGELOG_프로젝트모니터링_상세보기_모달.md` - 모니터링 상세 모달

#### 기타
- `CHANGELOG_문의하기_이메일전송.md` - 이메일 전송 기능
- `CHANGELOG_보안수정_및_UI개선.md` - 보안 수정 및 UI 개선
- `CHANGELOG_사용자관리_액션열_제거.md` - 사용자 관리 UI 개선
- `CHANGELOG_시작하기버튼_빈입력방지.md` - 입력 검증

---

### [guides/](./guides/) - 구현 가이드 (13개)

기능 구현 방법 및 설정 가이드

#### 통합/연동
- `FILE_UPLOAD_IMPLEMENTATION.md` - 파일 업로드 구현
- `FIGMA_연동_가이드.md` - Figma 연동
- `ENV_SETUP_GUIDE.md` - 환경 변수 설정

#### Notion 연동
- `NOTION_SETUP_GUIDE.md` - Notion 기본 설정
- `NOTION_ENV_DEPLOYMENT.md` - Notion 환경 변수 배포
- `NOTION_OAUTH_IMPLEMENTATION.md` - OAuth 구현
- `NOTION_OAUTH_TEST_GUIDE.md` - OAuth 테스트
- `NOTION_OAUTH_USER_FLOW.md` - OAuth 사용자 흐름
- `NOTION_AUTH_URL_USAGE.md` - 인증 URL 사용법
- `NOTION_SHARE_USER_FLOW.md` - 공유 사용자 흐름

#### 와이어프레임
- `WIREFRAME_구현_가이드.md` - 와이어프레임 구현
- `와이어프레임_생성_흐름도.md` - 생성 흐름도
- `AI_검증_로딩_통합_가이드.md` - AI 검증 로딩 통합

---

### [fixes/](./fixes/) - 버그 수정 (18개)

발견된 버그와 수정 내역

#### 요구사항
- `REQUIREMENTS_DUPLICATE_FIX.md` - 중복 요구사항 수정
- `REQUIREMENTS_EDIT_BUG_FIX.md` - 편집 버그 수정
- `REQUIREMENTS_FIELD_PRESERVATION_FIX.md` - 필드 보존 수정
- `REQUIREMENTS_LOADING_UPDATE.md` - 로딩 상태 업데이트
- `REQUIREMENTS_RESULT_SCROLL_FIX.md` - 결과 페이지 스크롤
- `REQUIREMENTS_SAVE_FIX.md` - 저장 기능 수정
- `REQUIREMENTS_UPDATE_CONDITION_FIX.md` - 업데이트 조건 수정
- `FIX_요구사항결과페이지_스크롤_헤더고려.md` - 헤더 고려 스크롤
- `FIX_요구사항추출_JSON파싱_개선.md` - JSON 파싱 개선

#### 와이어프레임
- `FIX_와이어프레임_AI편집_500에러.md` - AI 편집 500 에러
- `FIX_와이어프레임_복원_기능_추가.md` - 복원 기능

#### Notion
- `NOTION_404_FIX.md` - 404 에러 수정
- `NOTION_REDIRECT_URI_FIX.md` - Redirect URI 수정

#### 기타
- `BUILD_ERROR_FIX.md` - 빌드 에러 수정
- `COMPLETED_PROJECT_STATUS_FIX.md` - 완료 프로젝트 상태
- `FIX_Claude_모델_이름_오류.md` - Claude 모델 이름 오류
- `FIX_PDF_와이어프레임_고품질_이미지_변환.md` - PDF 고품질 이미지
- `FIX_nodemailer_타입정의_추가.md` - nodemailer 타입 정의

---

## 기능별 문서 찾기

| 기능 | changelogs | guides | fixes |
|------|-----------|--------|-------|
| 와이어프레임 | `CHANGELOG_와이어프레임_*.md` (8개) | `WIREFRAME_구현_가이드.md` | `FIX_와이어프레임_*.md` |
| AI 검증 | `CHANGELOG_AI검증_*.md` (3개) | `AI_검증_로딩_통합_가이드.md` | - |
| 요구사항 | `CHANGELOG_비기능요구사항_*.md` | - | `REQUIREMENTS_*.md` (9개) |
| Notion 연동 | - | `NOTION_*.md` (7개) | `NOTION_*.md` (2개) |
| 파일 업로드 | - | `FILE_UPLOAD_IMPLEMENTATION.md` | - |
| 견적서 | `CHANGELOG_견적서_마크다운_개선.md` | - | - |

---

## 문서 작성 규칙

| 분류 | 위치 | 네이밍 |
|------|------|--------|
| 기능 추가/개선 | `changelogs/` | `CHANGELOG_[기능명]_[설명].md` |
| 구현 가이드/설정 | `guides/` | `[기능명]_[설명].md` |
| 버그 수정 | `fixes/` | `FIX_[기능명]_[설명].md` |
| 프로젝트 전반 | `docs/` 루트 | - |

---

## 관련 링크

- [프로젝트 메인 README](../README.md)
- [Frontend README](../frontend/README.md)
- [Backend README](../backend/README.md)
- [프로젝트 전체 개요](./PROJECT_OVERVIEW.md)
