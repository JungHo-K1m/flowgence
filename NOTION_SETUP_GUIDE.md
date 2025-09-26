# Notion API 설정 가이드

이 가이드는 Flowgence에서 Notion으로 문서를 공유하는 기능을 사용하기 위한 설정 방법을 설명합니다.

## 📋 목차

1. [Notion 통합 생성](#notion-통합-생성)
2. [데이터베이스 생성](#데이터베이스-생성)
3. [환경 변수 설정](#환경-변수-설정)
4. [권한 설정](#권한-설정)
5. [테스트](#테스트)

## 🔧 Notion 통합 생성

### 1. Notion 개발자 포털 접속

1. [Notion 개발자 포털](https://www.notion.com/my-integrations)에 접속합니다.
2. Notion 계정으로 로그인합니다.

### 2. 새로운 통합 생성

1. **"New integration"** 버튼을 클릭합니다.
2. 통합 정보를 입력합니다:
   - **Name**: `Flowgence Integration`
   - **Logo**: 선택사항 (Flowgence 로고 업로드 가능)
   - **Associated workspace**: 사용할 워크스페이스 선택
3. **"Submit"** 버튼을 클릭합니다.

### 3. API 키 복사

1. 생성된 통합 페이지에서 **"Internal Integration Token"**을 복사합니다.
2. 이 토큰은 `secret_`으로 시작하는 형태입니다.
3. 이 토큰을 안전하게 보관합니다.

## 🗄️ 데이터베이스 생성

### 1. 새로운 데이터베이스 생성

1. Notion에서 새로운 페이지를 생성합니다.
2. **"Add a page"** 또는 **"New page"**를 클릭합니다.
3. 페이지 제목을 입력합니다 (예: "Flowgence Projects").

### 2. 데이터베이스로 변환

1. 페이지 내에서 **"/"**를 입력합니다.
2. **"Database"**를 선택합니다.
3. **"Full page"** 또는 **"Inline"**을 선택합니다.

### 3. 데이터베이스 속성 설정

다음 속성들을 추가합니다:

| 속성명        | 타입      | 설명          |
| ------------- | --------- | ------------- |
| `title`       | Title     | 프로젝트 제목 |
| `description` | Rich text | 프로젝트 설명 |
| `projectType` | Select    | 프로젝트 유형 |
| `createdAt`   | Date      | 생성일        |

### 4. 데이터베이스 ID 복사

1. 데이터베이스 URL을 복사합니다.
2. URL에서 데이터베이스 ID를 추출합니다:
   ```
   https://www.notion.so/your-workspace/DATABASE_ID?v=VIEW_ID
   ```
3. `DATABASE_ID` 부분을 복사합니다 (32자리 UUID 형식).

## ⚙️ 환경 변수 설정

### 1. .env.local 파일 생성

프로젝트 루트에 `.env.local` 파일을 생성합니다:

```bash
# Notion API 설정
NEXT_PUBLIC_NOTION_API_KEY=secret_your_api_key_here
NEXT_PUBLIC_NOTION_DATABASE_ID=your_database_id_here
```

### 2. 실제 값으로 교체

- `secret_your_api_key_here`를 실제 API 키로 교체
- `your_database_id_here`를 실제 데이터베이스 ID로 교체

### 3. 환경 변수 확인

```bash
# 개발 서버 재시작
npm run dev
```

## 🔐 권한 설정

### 1. 데이터베이스 권한 설정

1. 생성한 데이터베이스 페이지로 이동합니다.
2. 우측 상단의 **"Share"** 버튼을 클릭합니다.
3. **"Add people, emails, groups, or integrations"**를 클릭합니다.
4. 생성한 통합 이름을 검색하여 추가합니다.
5. 권한을 **"Can edit"**로 설정합니다.

### 2. 통합 권한 확인

1. [Notion 개발자 포털](https://www.notion.com/my-integrations)로 돌아갑니다.
2. 생성한 통합을 클릭합니다.
3. **"Capabilities"** 섹션에서 필요한 권한이 활성화되어 있는지 확인합니다.

## 🧪 테스트

### 1. 설정 확인

1. Flowgence 애플리케이션을 실행합니다.
2. 프로젝트를 생성하고 요구사항을 도출합니다.
3. **"최종 계약확인 페이지"**로 이동합니다.
4. **"Notion으로 공유"** 버튼을 클릭합니다.

### 2. 성공 확인

- 성공적으로 공유되면 Notion 페이지 URL이 표시됩니다.
- 브라우저에서 Notion 페이지를 열어 내용을 확인합니다.
- 데이터베이스에 새로운 항목이 추가되었는지 확인합니다.

## 🚨 문제 해결

### 일반적인 문제들

#### 1. "Notion API 설정이 필요합니다" 오류

**원인**: 환경 변수가 설정되지 않았거나 잘못되었습니다.

**해결방법**:

- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- 환경 변수 이름이 정확한지 확인
- 개발 서버를 재시작

#### 2. "Notion API 설정이 올바르지 않습니다" 오류

**원인**: API 키 또는 데이터베이스 ID 형식이 잘못되었습니다.

**해결방법**:

- API 키가 `secret_`으로 시작하는지 확인
- 데이터베이스 ID가 32자리 UUID 형식인지 확인
- 공백이나 특수문자가 없는지 확인

#### 3. "권한이 없습니다" 오류

**원인**: 통합에 데이터베이스 접근 권한이 없습니다.

**해결방법**:

- 데이터베이스 공유 설정에서 통합을 추가
- 통합 권한을 "Can edit"로 설정
- 통합이 올바른 워크스페이스에 연결되어 있는지 확인

#### 4. "페이지 생성 실패" 오류

**원인**: 데이터베이스 속성 설정이 잘못되었습니다.

**해결방법**:

- 데이터베이스에 필요한 속성이 모두 있는지 확인
- 속성 타입이 올바른지 확인
- 데이터베이스가 비어있지 않은지 확인

## 📚 추가 정보

### Notion API 문서

- [Notion API 공식 문서](https://developers.notion.com/)
- [Notion API 레퍼런스](https://developers.notion.com/reference)
- [Notion API 예제](https://developers.notion.com/docs/getting-started)

### 지원되는 기능

- ✅ 요구사항 명세서 공유
- ✅ 프로젝트 견적서 공유
- ✅ 마크다운 콘텐츠 변환
- ✅ 테이블 및 리스트 지원
- ✅ 페이지 자동 생성

### 제한사항

- ❌ 파일 첨부 (PDF, 이미지 등)
- ❌ 복잡한 마크다운 문법
- ❌ 사용자 정의 블록 타입
- ❌ 실시간 협업 기능

## 🆘 지원

문제가 지속되면 다음을 확인해주세요:

1. [Notion API 상태 페이지](https://status.notion.com/)
2. [Flowgence GitHub Issues](https://github.com/your-repo/issues)
3. [Notion 커뮤니티 포럼](https://www.notion.so/community)

---

**마지막 업데이트**: 2024년 12월
