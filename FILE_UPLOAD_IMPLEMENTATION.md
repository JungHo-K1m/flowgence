# 파일 업로드 기능 구현 완료

## 📋 구현 개요

Flowgence 프로젝트에 PDF 및 이미지 파일 업로드 및 텍스트 추출 기능을 추가했습니다.

## ✨ 구현된 기능

### 1. PDF 텍스트 추출
- **라이브러리**: `pdfjs-dist` (Mozilla PDF.js)
- **기능**: PDF 파일에서 모든 페이지의 텍스트를 추출
- **처리 방식**: 클라이언트 사이드에서 처리 (브라우저 기반)

### 2. 이미지 파일 처리
- **지원 형식**: PNG, JPEG, JPG, GIF
- **기능**: 기본 파일명 정보 제공
- **향후 확장**: AI 기반 이미지 분석 기능 추가 가능

### 3. 텍스트 파일 처리
- **지원 형식**: 텍스트 파일, 마크다운, CSV
- **기능**: 파일 내용 직접 읽기

### 4. 파일 검증
- **크기 제한**: 최대 10MB
- **타입 검증**: 지원 파일 형식만 허용
- **에러 처리**: 상세한 에러 메시지 제공

### 5. 사용자 인터페이스
- **로딩 상태**: 파일 처리 중 스피너 표시
- **성공 메시지**: 처리 완료 알림
- **에러 메시지**: 명확한 에러 정보 및 닫기 버튼

## 🗂️ 파일 구조

```
frontend/src/
├── lib/
│   └── fileProcessor.ts       # 파일 처리 유틸리티 함수
├── app/
│   └── page.tsx               # 메인 페이지 (파일 업로드 UI 통합)
└── components/
    └── project/
        └── FileUpload.tsx     # 파일 업로드 컴포넌트
```

## 📝 주요 함수

### `extractTextFromPDF(file: File): Promise<string>`
- PDF 파일에서 텍스트 추출
- 브라우저에서만 실행 (서버 사이드 렌더링 방지)

### `extractImageDescription(file: File): Promise<string>`
- 이미지 파일 설명 추출
- 향후 AI 기반 분석 기능 확장 가능

### `extractContentFromFiles(files: File[]): Promise<string>`
- 여러 파일의 내용을 통합하여 반환
- 파일별 에러 처리 포함

### `validateFileSize(file: File, maxSizeMB: number): boolean`
- 파일 크기 검증

### `validateFileType(file: File, allowedTypes: string[]): boolean`
- 파일 타입 검증

## 🔄 사용 흐름

1. **파일 선택**: 사용자가 PDF 또는 이미지 파일 선택
2. **검증**: 파일 크기 및 형식 검증
3. **처리**: 파일 내용 추출
4. **통합**: 추출된 내용을 프로젝트 설명에 자동 추가
5. **피드백**: 처리 결과를 사용자에게 표시

## 📦 외부 라이브러리

PDF 처리를 위해 **CDN에서 pdf.js를 동적으로 로드**합니다.
- **CDN**: Cloudflare CDN
- **버전**: 4.0.379
- **로딩 방식**: 브라우저에서 스크립트 태그로 동적 로드
- **장점**: Next.js 번들링 이슈 회피, 로딩 시간 단축

## 🎯 사용 방법

### 파일 업로드로 프로젝트 시작
1. 메인 페이지에서 파일 업로드 영역으로 이동
2. "파일 선택하기" 버튼 클릭 또는 드래그 앤 드롭
3. PDF 또는 이미지 파일 선택
4. 자동으로 파일 내용이 추출되어 프로젝트 설명에 추가
5. "시작하기" 버튼으로 프로젝트 생성 시작

## ⚠️ 제한 사항

### 현재 지원되지 않는 기능
- Word 문서 (.doc, .docx)
- Excel 파일 (.xls, .xlsx)
- OCR 기능 (이미지에서 텍스트 추출)
- 서버 사이드 파일 저장

### 향후 개선 가능 사항
1. **서버 사이드 파일 저장**: AWS S3 또는 Cloudflare R2 연동
2. **OCR 기능**: 이미지 내 텍스트 추출
3. **문서 파싱**: Word, Excel 파일 처리
4. **AI 기반 이미지 분석**: 이미지 내용 자동 분석
5. **파일 미리보기**: 업로드된 파일 미리보기 기능

## 🔧 설정

### 지원되는 파일 형식
```typescript
SUPPORTED_FILE_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "text/plain",
  "text/markdown",
  "text/csv",
];
```

### 최대 파일 크기
```typescript
MAX_FILE_SIZE_MB = 10;
```

## 🐛 알려진 이슈 및 해결 방법

### Next.js 15 + pdf.js 호환성 문제
**문제**: Next.js 15에서 pdfjs-dist npm 패키지를 동적 import 시 `Object.defineProperty called on non-object` 오류 발생

**해결**: CDN에서 pdf.js를 동적으로 로드하는 방식으로 변경
- npm 패키지 대신 CDN 스크립트 태그 사용
- Next.js 번들링 시스템과의 충돌 회피
- 모든 브라우저에서 안정적으로 작동

### 기타 주의사항
- pdf.js는 클라이언트 사이드에서만 작동합니다
- 서버 사이드 렌더링 시 에러가 발생할 수 있으므로 `typeof window` 체크 필요
- 대용량 PDF 파일은 처리 시간이 오래 걸릴 수 있습니다
- 첫 PDF 로드 시 CDN 스크립트 로딩 시간 추가

## 📊 테스트 체크리스트

- [x] PDF 파일 업로드 및 텍스트 추출
- [x] 이미지 파일 업로드
- [x] 텍스트 파일 업로드
- [x] 파일 크기 초과 시 에러 처리
- [x] 지원하지 않는 파일 형식 에러 처리
- [x] 로딩 상태 표시
- [x] 성공 메시지 표시
- [x] 에러 메시지 표시
- [x] 추출된 내용 프로젝트 설명 통합
- [x] 브라우저 호환성 확인

## 🎉 완료

메인 페이지에서 파일 업로드를 통해 PDF 또는 이미지를 업로드하고, 자동으로 텍스트를 추출하여 프로젝트 설명에 통합하는 기능이 완전히 구현되었습니다.

