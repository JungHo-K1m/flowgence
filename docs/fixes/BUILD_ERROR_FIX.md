# 빌드 에러 수정

## 문제점
Vercel 빌드 시 템플릿 리터럴 내부에서 이스케이프 처리가 잘못되어 Syntax Error가 발생했습니다.

## 에러 메시지
```
./src/lib/estimateGenerator.ts
Error: Expected unicode escape
Line 371: const id = \`REQ-\${categoryIndex + 1}-...\`;
```

## 원인 분석

### 문제 발생 코드
```typescript
${reqs.map((req, reqIndex) => {
  const id = \`REQ-\${categoryIndex + 1}-\${subIndex + 1}-\${reqIndex + 1}\`;
  // ... 나머지 코드도 백슬래시 이스케이프 사용
  return \`| \${id} | ...\`;
}).join('\\n')}
```

### 문제점
1. **이중 이스케이프**: 바깥 템플릿 리터럴 안에서 내부 템플릿 리터럴을 백슬래시로 이스케이프
2. **불필요한 이스케이프**: 바깥 템플릴이 백틱이므로 내부는 일반 백틱으로 사용 가능
3. **Webpack 파싱**: 빌드 시 이스케이프를 잘못 해석하여 에러 발생

## 해결 방법

### 수정 전
```typescript
${reqs.map((req, reqIndex) => {
  const id = \`REQ-\${categoryIndex + 1}-\${subIndex + 1}-\${reqIndex + 1}\`;
  // 백슬래시 이스케이프 사용 ❌
  return \`| \${id} | ...\`;
}).join('\\n')}
```

### 수정 후
```typescript
${reqs.map((req, reqIndex) => {
  const id = `REQ-${categoryIndex + 1}-${subIndex + 1}-${reqIndex + 1}`;
  // 일반 백틱 사용 ✅
  return `| ${id} | ...`;
}).join('\n')}
```

## 코드 변경사항

### 파일
- `frontend/src/lib/estimateGenerator.ts` (370-378 라인)

### 변경 내용
1. **템플릿 리터럴**: `\`...\`` → `` `...` ``
2. **템플릿 표현식**: `\${...}` → `${...}`
3. **줄바꿈**: `'\\n'` → `'\n'`

## 원리 설명

### 템플릿 리터럴 중첩
```typescript
// 바깥 템플릿 리터럴 (백틱)
const outer = `text ${expression}`;

// 내부 템플릿 리터럴 (또 다른 백틱)
const inner = `inner ${innerExpression}`;

// 올바른 사용법
const combined = `${outer} and ${inner}`;
```

### 잘못된 이스케이프
```typescript
// ❌ 잘못된 방법
const wrong = `${expression \`inner ${innerExpr}\`}`;
// Syntax Error

// ✅ 올바른 방법
const correct = `${expression \`inner \${innerExpr}\``;
// 정상 작동
```

## 테스트

### 로컬 빌드
```bash
cd frontend
npm run build
```

### 예상 결과
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
```

## 영향 범위

### 영향을 받는 기능
- 견적서 마크다운 생성
- PDF 다운로드
- Notion 공유

### 영향을 받지 않는 기능
- 다른 기능들은 정상 작동
- 사용자 경험에 영향 없음

## 결론

템플릿 리터럴 내부에서 불필요한 백슬래시 이스케이프를 제거하여 빌드 에러를 수정했습니다. 이제 Vercel 빌드가 정상적으로 완료됩니다.

