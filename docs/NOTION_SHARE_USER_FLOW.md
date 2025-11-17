# Notion 공유 기능 유저 플로우

## 📋 개요

Flowgence에서 Notion으로 프로젝트 문서를 공유하는 기능의 전체 유저 플로우를 정리한 문서입니다.

---

## 🎯 공유 가능한 문서

1. **요구사항 명세서** (`RequirementsResultPanel`)
2. **프로젝트 견적서** (`ConfirmationPanel`)

---

## 🔄 전체 플로우 다이어그램

```
사용자가 "Notion으로 공유" 버튼 클릭
         ↓
Notion 설정 확인 (checkNotionSetup)
         ↓
    ┌────┴────┐
    │         │
설정 있음   설정 없음
    │         │
    │         ├─→ [요구사항 페이지] 3가지 옵션 제공
    │         │   1. Notion 사용 가이드 보기
    │         │   2. 수동으로 Notion에 공유 (클립보드 복사)
    │         │   3. 다른 방법으로 공유
    │         │
    │         └─→ [견적서 페이지] 수동 공유로 바로 진행
    │
    ↓
버튼 상태 변경 ("Notion에 공유 중...")
    ↓
마크다운 콘텐츠 생성
    ↓
마크다운 → Notion 블록 변환
    ↓
Notion API로 페이지 생성 (children 포함)
    ↓
페이지 URL 반환
    ↓
성공 메시지 표시 + 브라우저에서 열기 옵션
    ↓
버튼 상태 복원
```

---

## 📄 1. 요구사항 명세서 공유 플로우

### 위치
- **페이지**: 요구사항 결과 페이지 (`RequirementsResultPanel.tsx`)
- **버튼**: "Notion으로 공유" 버튼

### 상세 플로우

#### Step 1: 버튼 클릭
```
사용자가 "Notion으로 공유" 버튼 클릭
→ handleShareNotion() 함수 실행
```

#### Step 2: Notion 설정 확인
```typescript
const notionSetup = checkNotionSetup();
// 환경 변수에서 API 키와 데이터베이스 ID 확인
// NEXT_PUBLIC_NOTION_API_KEY
// NEXT_PUBLIC_NOTION_DATABASE_ID
```

#### Step 3-A: 설정이 없는 경우

**3가지 옵션 제공 (prompt):**
```
1. Notion 사용 가이드 보기
2. 수동으로 Notion에 공유 (클립보드 복사)
3. 다른 방법으로 공유
```

**옵션 1: Notion 사용 가이드 보기**
```
→ showNotionGuide() 실행
→ Notion 가입/사용 방법 안내 모달 표시
→ 플로우 종료
```

**옵션 2: 수동으로 Notion에 공유**
```
→ shareToNotionManually() 실행
→ 마크다운 생성
→ 클립보드에 복사
→ 안내 메시지 표시:
   "마크다운이 클립보드에 복사되었습니다!
   1. notion.so 접속
   2. 새 페이지 생성
   3. 붙여넣기 (Ctrl+V)"
→ Notion 열기 옵션 제공
→ 플로우 종료
```

**옵션 3: 다른 방법으로 공유**
```
→ handleAlternativeShare() 실행
→ ShareOptionsModal 표시
→ 다양한 공유 옵션 제공:
   - 텍스트로 복사
   - 이메일로 공유
   - 카카오톡 공유
   - 슬랙 공유
   - Microsoft Teams
   - 구글 드라이브
→ 플로우 종료
```

#### Step 3-B: 설정이 있는 경우

**3-1. 로딩 상태 표시**
```typescript
버튼 텍스트: "Notion으로 공유" → "Notion에 공유 중..."
버튼 비활성화
```

**3-2. 마크다운 생성**
```typescript
generateRequirementsMarkdown(
  requirementsData,
  projectData,
  extractedRequirements,
  projectOverview,
  wireframe
)
```

**3-3. Notion API 호출**
```typescript
shareRequirementsToNotion(
  requirementsData,
  projectData,
  extractedRequirements,
  projectOverview,
  wireframe,
  notionConfig
)
```

**내부 처리:**
1. 마크다운 → Notion 블록 변환 (`convertMarkdownToBlocks`)
2. 페이지 속성 설정 (제목, 설명, 프로젝트 유형, 생성일)
3. Notion API로 페이지 생성 (`createPage` - children 포함)
4. 페이지 URL 생성 (`makePagePublic`)

**3-4. 성공 처리**
```
성공 메시지 표시:
"Notion에 성공적으로 공유되었습니다!
페이지 URL: [URL]
브라우저에서 열어보시겠습니까?"

→ 사용자가 "예" 선택 시
→ window.open(notionUrl, "_blank")
```

**3-5. 에러 처리**
```
에러 발생 시:
→ 에러 로그 출력
→ "Notion 공유에 실패했습니다. 다시 시도해주세요." 알림
```

**3-6. 버튼 상태 복원**
```typescript
버튼 텍스트: "Notion에 공유 중..." → "Notion으로 공유"
버튼 활성화
```

---

## 💰 2. 프로젝트 견적서 공유 플로우

### 위치
- **페이지**: 견적 확인 페이지 (`ConfirmationPanel.tsx`)
- **버튼**: "Notion으로 공유" 버튼 (다운로드 메뉴 내)

### 상세 플로우

#### Step 1: 버튼 클릭
```
사용자가 다운로드 메뉴 열기
→ "Notion으로 공유" 버튼 클릭
→ handleShareToNotion() 함수 실행
→ 다운로드 메뉴 닫기
```

#### Step 2: Notion 설정 확인
```typescript
const notionSetup = checkNotionSetup();
```

#### Step 3-A: 설정이 없는 경우

**수동 공유로 바로 진행** (옵션 선택 없음)
```
→ shareToNotionManually() 실행
→ 마크다운 생성 (generateEstimateMarkdown)
→ 클립보드에 복사
→ 안내 메시지 표시
→ 플로우 종료
```

#### Step 3-B: 설정이 있는 경우

**3-1. 로딩 상태 표시**
```typescript
버튼 텍스트: "Notion으로 공유" → "Notion에 공유 중..."
버튼 비활성화
```

**3-2. 마크다운 생성**
```typescript
generateEstimateMarkdown(
  estimateData,
  requirementsData,
  projectData,
  projectOverview,
  extractedRequirements
)
```

**3-3. Notion API 호출**
```typescript
shareEstimateToNotion(
  estimateData,
  requirementsData,
  projectData,
  projectOverview,
  notionConfig,
  extractedRequirements
)
```

**3-4. 성공 처리**
```
성공 메시지 표시:
"✨ 견적서가 Notion에 성공적으로 공유되었습니다!
페이지 URL: [URL]
마크다운을 복사하여 다른 페이지에 붙여넣고 싶으신가요?"

→ 사용자가 "예" 선택 시
→ 마크다운 클립보드 복사
→ "✅ 마크다운이 클립보드에 복사되었습니다!" 알림

→ 추가 확인:
"브라우저에서 Notion 페이지를 열어보시겠습니까?"
→ "예" 선택 시 window.open(notionUrl, "_blank")
```

**3-5. 에러 처리**
```
에러 발생 시:
→ 에러 로그 출력
→ "Notion 공유에 실패했습니다. 다시 시도해주세요." 알림
```

**3-6. 버튼 상태 복원**
```typescript
버튼 텍스트: "Notion에 공유 중..." → "Notion으로 공유"
버튼 활성화
```

---

## 🔧 Notion API 처리 상세

### 1. 설정 확인 (`checkNotionSetup`)
```typescript
1. 환경 변수에서 API 키와 데이터베이스 ID 읽기
2. API 키 형식 검증 (secret_로 시작)
3. 데이터베이스 ID 형식 검증 (UUID)
4. 설정 상태 반환
```

### 2. 마크다운 생성
- **요구사항 명세서**: `generateRequirementsMarkdown()`
- **견적서**: `generateEstimateMarkdown()`

### 3. 마크다운 → Notion 블록 변환
```typescript
convertMarkdownToBlocks(markdown)
→ 지원하는 마크다운 요소:
   - 헤더 (#, ##, ###)
   - 테이블 (| ... |)
   - 리스트 (- ...)
   - 구분선 (---)
   - 일반 텍스트
```

### 4. Notion 페이지 생성
```typescript
createPage(properties, children)
→ Notion API POST /v1/pages
→ parent: { database_id }
→ properties: { title, description, projectType, createdAt }
→ children: [블록 배열] ← 페이지 생성 시 직접 포함
```

### 5. 페이지 URL 생성
```typescript
makePagePublic(pageId)
→ https://notion.so/{pageId}
```

---

## 📊 플로우 비교표

| 항목 | 요구사항 명세서 | 견적서 |
|------|----------------|--------|
| **설정 없을 때** | 3가지 옵션 제공 | 수동 공유로 바로 진행 |
| **성공 메시지** | 간단한 알림 | 마크다운 복사 옵션 포함 |
| **마크다운 생성** | `generateRequirementsMarkdown` | `generateEstimateMarkdown` |
| **API 함수** | `shareRequirementsToNotion` | `shareEstimateToNotion` |

---

## ⚠️ 에러 처리

### 1. 설정 오류
- **원인**: 환경 변수 미설정 또는 형식 오류
- **처리**: 대안 공유 방법 제공

### 2. API 호출 실패
- **원인**: 
  - API 키 오류
  - 데이터베이스 권한 없음
  - 네트워크 오류
  - Notion API 오류
- **처리**: 
  - 에러 로그 출력
  - 사용자에게 실패 알림
  - 버튼 상태 복원

### 3. 마크다운 변환 실패
- **원인**: 지원하지 않는 마크다운 형식
- **처리**: 일반 텍스트로 처리

---

## 🔐 보안 고려사항

### 현재 구조
- **API 키 위치**: 클라이언트 환경 변수 (`NEXT_PUBLIC_NOTION_API_KEY`)
- **노출 여부**: ✅ 브라우저에 노출됨
- **권장 개선**: 백엔드 API 프록시 사용

### Notion 통합 권한
- 특정 데이터베이스에만 접근 가능하도록 제한
- 통합(Integration) 권한 최소화

---

## 📝 사용자 경험 개선 포인트

1. **로딩 상태**: 버튼 텍스트 변경 및 비활성화
2. **에러 메시지**: 명확한 안내 메시지
3. **대안 제공**: 설정이 없어도 수동 공유 가능
4. **성공 후 액션**: 페이지 열기 옵션 제공
5. **견적서 특화**: 마크다운 복사 옵션 추가

---

## 🔄 향후 개선 방향

1. **백엔드 프록시**: API 키를 서버에서 관리
2. **OAuth 인증**: 사용자별 Notion 연결
3. **템플릿 선택**: 다양한 Notion 템플릿 제공
4. **일괄 공유**: 여러 문서를 한 번에 공유
5. **공유 이력**: 공유한 문서 목록 관리

