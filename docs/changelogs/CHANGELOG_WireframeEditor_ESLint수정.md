# Changelog - WireframeEditor ESLint 에러 수정

## 날짜
2025-01-12

## 변경 사항

### 수정된 파일
- `frontend/src/components/wireframe/WireframeEditor.tsx`

### 문제
Vercel 빌드 중 ESLint 에러 발생:
```
./src/components/wireframe/WireframeEditor.tsx
136:24  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
136:40  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
137:24  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
137:40  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
138:24  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
138:37  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
139:24  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
139:35  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
```

### 해결
136-139번 라인의 JSX 텍스트 내 따옴표(`"`)를 HTML 엔티티(`&quot;`)로 교체:

**수정 전:**
```tsx
<ul className="mt-2 text-xs text-blue-700 space-y-1 list-disc list-inside">
  <li>크기 변경: "검색 버튼을 50% 더 크게"</li>
  <li>위치 이동: "로그인 버튼을 화면 하단으로"</li>
  <li>요소 추가: "하단에 저장 버튼 추가"</li>
  <li>색상 변경: "상단바를 파란색으로" (향후 지원)</li>
</ul>
```

**수정 후:**
```tsx
<ul className="mt-2 text-xs text-blue-700 space-y-1 list-disc list-inside">
  <li>크기 변경: &quot;검색 버튼을 50% 더 크게&quot;</li>
  <li>위치 이동: &quot;로그인 버튼을 화면 하단으로&quot;</li>
  <li>요소 추가: &quot;하단에 저장 버튼 추가&quot;</li>
  <li>색상 변경: &quot;상단바를 파란색으로&quot; (향후 지원)</li>
</ul>
```

## 영향 범위
- Vercel 배포 성공
- 사용자에게 표시되는 내용은 동일 (브라우저가 `&quot;`를 `"`로 렌더링)

## 테스트
- ESLint 검증 통과 확인
- Vercel 빌드 성공 예상

## 관련 이슈
- `react/no-unescaped-entities` ESLint 규칙 위반

## 참고
동일한 문제가 이전에 `ConfirmationPanel.tsx`에서도 발생했으며 동일한 방법으로 해결되었습니다.

