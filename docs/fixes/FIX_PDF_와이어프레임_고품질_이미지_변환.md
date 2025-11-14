# 🔧 PDF 와이어프레임 고품질 이미지 변환

**날짜**: 2025-11-14  
**작업자**: AI Assistant  
**이슈**: PDF에서 와이어프레임 품질이 떨어짐

---

## 🐛 **문제 상황**

### 사용자 보고
- PDF 파일에서 확인한 와이어프레임 품질이 웹에서 확인한 것보다 훨씬 떨어짐
- 이미지처럼 저장해서 올릴 수 있는지 문의

### 근본 원인
```typescript
// ❌ Before: HTML/CSS로 렌더링된 와이어프레임이 PDF로 변환되면서 품질 손실
const wireframeHTML = renderWireframeSection(wireframe); // HTML 문자열
// → 브라우저 print 기능으로 PDF 변환 시 품질 저하
```

**문제점**:
1. **HTML/CSS 렌더링**: 와이어프레임이 HTML/CSS로 렌더링되어 PDF에 포함됨
2. **브라우저 Print 기능**: 브라우저의 print 기능으로 PDF 변환 시 품질 손실
3. **해상도 제한**: CSS 렌더링은 고해상도 지원이 제한적

---

## ✅ **해결 방법**

### 1️⃣ **html-to-image 라이브러리 설치**

```bash
npm install html-to-image
```

**이유**: HTML 요소를 고해상도 이미지로 변환하기 위해

---

### 2️⃣ **와이어프레임 이미지 생성 유틸리티 추가**

**`frontend/src/lib/wireframeImageGenerator.ts`** 생성:

```typescript
import { toPng } from "html-to-image";
import { WireframeSpec } from "@/types/wireframe";

/**
 * 와이어프레임을 고해상도 PNG 이미지로 변환
 * @param wireframe - 와이어프레임 스펙
 * @param scale - 확대 비율 (기본 2배, 고해상도용)
 * @returns Base64 인코딩된 PNG 이미지
 */
export async function wireframeToImage(
  wireframe: WireframeSpec,
  scale: number = 2,
): Promise<string> {
  // 와이어프레임을 HTML로 렌더링
  const wireframeHTML = renderWireframeToHTML(wireframe, scale);

  // 임시 DOM 요소 생성
  const container = document.createElement("div");
  container.style.width = "1200px"; // 충분한 너비 (고해상도용)
  container.style.backgroundColor = "white";
  container.innerHTML = wireframeHTML;

  // DOM에 추가 (렌더링을 위해 필요)
  document.body.appendChild(container);

  // DOM이 완전히 렌더링될 때까지 대기
  await new Promise((resolve) => setTimeout(resolve, 100));

  // 이미지로 변환 (고해상도)
  const dataUrl = await toPng(container, {
    quality: 1.0,
    pixelRatio: Math.max(scale, 2), // 최소 2배 해상도
    backgroundColor: "white",
    width: container.scrollWidth,
    height: container.scrollHeight,
    cacheBust: true,
  });

  // DOM에서 제거
  document.body.removeChild(container);

  return dataUrl;
}
```

**특징**:
- ✅ **고해상도**: `pixelRatio: 2` 이상으로 고품질 이미지 생성
- ✅ **Base64 인코딩**: 데이터 URL로 반환하여 HTML에 직접 삽입 가능
- ✅ **스타일 보존**: HTML/CSS 스타일이 이미지에 그대로 반영

---

### 3️⃣ **마크다운 생성기 수정**

**`frontend/src/lib/requirementsMarkdownGenerator.ts`**:

```typescript
export function generateRequirementsMarkdown(
  requirementsData: RequirementsData,
  projectData: ProjectData,
  extractedRequirements?: any,
  projectOverview?: any,
  wireframe?: WireframeSpec | null,
  wireframeImage?: string // ✅ Base64 인코딩된 와이어프레임 이미지
): string {
  // ...
  ${renderWireframeSection(wireframe, wireframeImage)} // ✅ 이미지 전달
  // ...
}

function renderWireframeSection(
  wireframe?: WireframeSpec | null, 
  wireframeImage?: string
): string {
  // ✅ 이미지가 제공되면 이미지 사용 (고품질)
  if (wireframeImage) {
    return `
## 🖼️ 와이어프레임 미리보기

<div class="wireframe-preview" style="text-align: center;">
  <img src="${wireframeImage}" alt="와이어프레임" 
       style="max-width: 100%; height: auto; 
              border: 1px solid #e5e7eb; border-radius: 8px; 
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
</div>

---
`;
  }

  // 이미지가 없으면 기존 HTML 렌더링 사용 (폴백)
  // ...
}
```

**특징**:
- ✅ **이미지 우선**: 이미지가 제공되면 고품질 이미지 사용
- ✅ **HTML 폴백**: 이미지 변환 실패 시 기존 HTML 렌더링 사용

---

### 4️⃣ **PDF 다운로드 로직 수정**

**`frontend/src/components/project/RequirementsResultPanel.tsx`**:

```typescript
import { wireframeToImage } from "@/lib/wireframeImageGenerator";

const handleExportPDF = async () => {
  try {
    // ✅ 와이어프레임이 있으면 고해상도 이미지로 변환
    let wireframeImage: string | undefined;
    if (wireframe) {
      try {
        console.log("와이어프레임을 이미지로 변환 중...");
        wireframeImage = await wireframeToImage(wireframe, 2); // 2배 해상도
        console.log("와이어프레임 이미지 변환 완료");
      } catch (imageError) {
        console.warn("와이어프레임 이미지 변환 실패, HTML 렌더링 사용:", imageError);
        // 이미지 변환 실패 시 기존 HTML 렌더링 사용
      }
    }

    const markdown = generateRequirementsMarkdown(
      requirementsData,
      projectData,
      extractedRequirements,
      projectOverview,
      wireframe,
      wireframeImage // ✅ 고해상도 이미지 전달
    );

    await downloadMarkdownAsPDF(markdown, {
      filename: `요구사항명세서_${projectData.serviceType}_${
        new Date().toISOString().split("T")[0]
      }.pdf`,
      title: `${projectData.serviceType} 프로젝트 요구사항 명세서`,
      author: "Flowgence",
      subject: "프로젝트 요구사항 명세서",
    });
  } catch (error) {
    console.error("PDF 다운로드 실패:", error);
    alert("PDF 다운로드에 실패했습니다. 다시 시도해주세요.");
  }
};
```

**특징**:
- ✅ **비동기 변환**: PDF 다운로드 전에 와이어프레임을 이미지로 변환
- ✅ **에러 핸들링**: 이미지 변환 실패 시 기존 HTML 렌더링 사용
- ✅ **로딩 표시**: 변환 중 로그 출력 (향후 로딩 UI 추가 가능)

---

## 📊 **데이터 흐름**

### Before (품질 저하)
```
와이어프레임 스펙 → HTML/CSS 렌더링 → 마크다운 생성
                                          ↓
                                    브라우저 Print 기능
                                          ↓
                                    ❌ 품질 저하된 PDF
```

### After (고품질)
```
와이어프레임 스펙 → 이미지 변환 (고해상도) → Base64 인코딩
                                          ↓
                                    마크다운 생성 (이미지 포함)
                                          ↓
                                    브라우저 Print 기능
                                          ↓
                                    ✅ 고품질 PDF (이미지)
```

---

## 🧪 **테스트 방법**

### 1. PDF 다운로드 테스트
```
1. 프로젝트 완료 페이지 → "PDF 다운로드" 클릭
2. 콘솔 로그 확인:
   - "와이어프레임을 이미지로 변환 중..."
   - "와이어프레임 이미지 변환 완료"
3. PDF 파일 확인:
   - 와이어프레임이 고품질 이미지로 표시되는지 확인
   - 텍스트와 요소가 선명하게 보이는지 확인
```

### 2. 이미지 변환 실패 테스트
```
1. 네트워크 오류 또는 브라우저 제한 시뮬레이션
2. 콘솔 로그 확인:
   - "와이어프레임 이미지 변환 실패, HTML 렌더링 사용"
3. PDF 파일 확인:
   - 기존 HTML 렌더링이 정상적으로 표시되는지 확인
```

### 3. 해상도 테스트
```
1. PDF에서 와이어프레임 확대 (200% 이상)
2. 텍스트와 요소가 선명하게 보이는지 확인
3. 웹에서 확인한 품질과 동일한지 비교
```

---

## 📝 **변경된 파일**

| 파일 | 변경 내용 |
|------|----------|
| `frontend/package.json` | ✅ `html-to-image` 추가 |
| `frontend/src/lib/wireframeImageGenerator.ts` | ✅ **새 파일** - 와이어프레임 이미지 변환 유틸리티 |
| `frontend/src/lib/requirementsMarkdownGenerator.ts` | ✅ `wireframeImage` 파라미터 추가<br>✅ `renderWireframeSection` 수정 (이미지 우선) |
| `frontend/src/components/project/RequirementsResultPanel.tsx` | ✅ `wireframeToImage` import<br>✅ `handleExportPDF` 수정 (이미지 변환 추가) |

---

## 🎯 **영향 범위**

### ✅ 개선된 기능
- **PDF 품질**: 와이어프레임이 고품질 이미지로 PDF에 포함됨
- **해상도**: 최소 2배 해상도로 선명한 이미지 생성
- **호환성**: 이미지 변환 실패 시 기존 HTML 렌더링 사용 (폴백)

### ⚠️ 주의사항
- **성능**: 이미지 변환에 약 100-500ms 소요 (와이어프레임 크기에 따라 다름)
- **메모리**: 고해상도 이미지는 Base64 인코딩으로 메모리 사용량 증가
- **브라우저 호환성**: `html-to-image` 라이브러리는 최신 브라우저 지원

---

## 🔄 **후속 작업**

- [ ] **로딩 UI 추가**: 이미지 변환 중 로딩 표시
- [ ] **해상도 옵션**: 사용자가 해상도 선택 가능 (1x, 2x, 3x)
- [ ] **이미지 최적화**: Base64 이미지 크기 최적화 (압축)
- [ ] **에러 처리 개선**: 이미지 변환 실패 시 사용자에게 알림

---

## 🚀 **배포**

### 프론트엔드 (Vercel)
```bash
cd frontend
git add .
git commit -m "feat: PDF 와이어프레임 고품질 이미지 변환"
git push origin main
```

### 확인
```
1. Vercel 자동 배포 완료 대기 (약 2-3분)
2. https://app.flowgence.ai → 프로젝트 완료 페이지 → PDF 다운로드
3. PDF 파일에서 와이어프레임 품질 확인
```

---

## 💡 **참고사항**

### 해상도 설정
- **기본값**: `scale: 2` (2배 해상도)
- **권장값**: `scale: 2-3` (고품질)
- **최대값**: `scale: 4` (초고해상도, 파일 크기 증가)

### 이미지 형식
- **형식**: PNG (무손실)
- **인코딩**: Base64 (데이터 URL)
- **용도**: PDF 삽입, HTML 임베드

### 성능 최적화
- **캐싱**: 동일한 와이어프레임은 캐시 사용 가능
- **비동기**: 이미지 변환은 비동기로 처리하여 UI 블로킹 방지
- **메모리**: 사용 후 DOM 요소 제거하여 메모리 누수 방지

---

**작성일**: 2025-11-14  
**버전**: v1.0  
**태그**: #enhancement #pdf #wireframe #image #quality

