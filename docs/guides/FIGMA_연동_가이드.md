# Figma 연동 구현 가이드

**날짜**: 2025-01-12  
**작성자**: AI Assistant  
**목적**: 와이어프레임을 Figma로 자동 전송하여 디자이너가 편집 가능하게 만들기

---

## 🎯 목표

```
LoFi 와이어프레임 (JSON)
        ↓
    Figma API
        ↓
편집 가능한 Figma 파일
        ↓
사용자가 Figma에서 편집
```

---

## 📋 사전 준비

### 1. Figma 계정 생성
1. [Figma 회원가입](https://www.figma.com/signup) (무료)
2. 계정 생성 완료

### 2. Figma Access Token 발급

**방법 A: Personal Access Token (개발/테스트용)**
```
1. Figma 로그인 → Settings
2. Account → Personal access tokens
3. "Generate new token" 클릭
4. 이름: "Flowgence API"
5. 토큰 복사 (다시 볼 수 없으니 안전하게 보관!)
```

**방법 B: OAuth (프로덕션용, 향후)**
```
1. Figma 개발자 포털에서 앱 등록
2. OAuth 플로우 구현
3. 사용자별 토큰 관리
```

### 3. 환경 변수 설정

```bash
# backend/.env
FIGMA_ACCESS_TOKEN=figd_your_token_here

# frontend/.env.local (필요시)
NEXT_PUBLIC_FIGMA_ENABLED=true
```

---

## 🏗️ 구현 아키텍처

### 전체 흐름

```
1. 사용자가 "Figma로 내보내기" 버튼 클릭
   ↓
2. 프론트엔드 → 백엔드 API 호출
   ↓
3. 백엔드가 와이어프레임 JSON 조회
   ↓
4. JSON → Figma 노드 구조로 변환
   ↓
5. Figma API 호출하여 파일 생성
   ↓
6. Figma 편집 링크 반환
   ↓
7. 사용자를 Figma로 리다이렉트
```

---

## 💻 백엔드 구현

### Step 1: Figma DTO 생성

```typescript
// backend/src/wireframes/dto/export-to-figma.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class ExportToFigmaDto {
  @IsString()
  @IsNotEmpty()
  projectId: string;
}
```

### Step 2: Figma 서비스 추가

```typescript
// backend/src/wireframes/wireframes.service.ts

async exportToFigma(projectId: string) {
  console.log('=== Figma 내보내기 시작 ===');
  
  try {
    // 1. 기존 와이어프레임 조회
    const wireframe = await this.getLatestWireframe(projectId);
    if (!wireframe) {
      throw new Error('와이어프레임이 존재하지 않습니다');
    }

    // 2. 프로젝트 정보 조회
    const { data: project } = await this.supabase
      .from('projects')
      .select('title, description')
      .eq('id', projectId)
      .single();

    // 3. Figma 파일 생성
    const figmaFile = await this.createFigmaFile(
      wireframe.spec,
      project?.title || '제목 없음'
    );

    // 4. Figma 링크 저장 (선택사항)
    await this.supabase
      .from('wireframes')
      .update({ 
        figma_url: figmaFile.url,
        figma_file_key: figmaFile.key,
      })
      .eq('id', wireframe.id);

    console.log('=== Figma 내보내기 완료 ===');
    return {
      ok: true,
      figma_url: figmaFile.url,
      figma_key: figmaFile.key,
    };
  } catch (error) {
    console.error('Figma 내보내기 실패:', error);
    throw error;
  }
}

private async createFigmaFile(spec: any, projectName: string) {
  const figmaToken = this.configService.get<string>('FIGMA_ACCESS_TOKEN');
  if (!figmaToken) {
    throw new Error('FIGMA_ACCESS_TOKEN이 설정되지 않았습니다');
  }

  // Figma 노드 구조로 변환
  const figmaNodes = this.convertSpecToFigmaNodes(spec);

  // Figma API 호출
  const response = await fetch('https://api.figma.com/v1/files', {
    method: 'POST',
    headers: {
      'X-Figma-Token': figmaToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `Flowgence - ${projectName}`,
      role: 'owner',
      // Figma 파일 구조
      document: {
        type: 'DOCUMENT',
        children: [
          {
            type: 'CANVAS',
            name: spec.screen.name || '화면',
            backgroundColor: { r: 0.95, g: 0.95, b: 0.95, a: 1 },
            children: [
              // 디바이스 프레임
              {
                type: 'FRAME',
                name: `${spec.viewport.device} - ${spec.viewport.width}x${spec.viewport.height}`,
                x: 100,
                y: 100,
                width: spec.viewport.width,
                height: spec.viewport.height,
                backgroundColor: { r: 1, g: 1, b: 1, a: 1 },
                children: figmaNodes,
              },
            ],
          },
        ],
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Figma API 오류: ${error}`);
  }

  const data = await response.json();
  
  return {
    key: data.key,
    url: `https://www.figma.com/file/${data.key}`,
  };
}

private convertSpecToFigmaNodes(spec: any): any[] {
  return spec.screen.elements.map((el: any) => {
    // 타입별 색상 매핑
    const colorMap: Record<string, { r: number; g: number; b: number }> = {
      navbar: { r: 0.4, g: 0.4, b: 0.9 },  // 인디고
      button: { r: 0.3, g: 0.5, b: 0.9 },  // 블루
      input: { r: 0.95, g: 0.95, b: 0.95 }, // 회색
      list: { r: 0.97, g: 0.97, b: 0.97 },  // 연회색
      card: { r: 1, g: 1, b: 1 },           // 흰색
      text: { r: 0.2, g: 0.2, b: 0.2 },     // 검정
    };

    const color = colorMap[el.type] || { r: 0.9, g: 0.9, b: 0.9 };

    return {
      type: 'FRAME',
      name: el.label || el.type,
      x: el.x,
      y: el.y,
      width: el.w,
      height: el.h,
      backgroundColor: { ...color, a: 1 },
      cornerRadius: el.type === 'button' ? 8 : 4,
      children: [
        // 텍스트 레이블 추가
        {
          type: 'TEXT',
          name: 'Label',
          x: 8,
          y: el.h / 2 - 8,
          width: el.w - 16,
          height: 16,
          characters: el.label || el.type.toUpperCase(),
          style: {
            fontFamily: 'Inter',
            fontWeight: 500,
            fontSize: 12,
            textAlignHorizontal: 'CENTER',
            textAlignVertical: 'CENTER',
          },
          fills: [{ type: 'SOLID', color: { r: 0.2, g: 0.2, b: 0.2 } }],
        },
      ],
    };
  });
}
```

### Step 3: 컨트롤러 엔드포인트 추가

```typescript
// backend/src/wireframes/wireframes.controller.ts

@Post('export-figma')
async exportToFigma(@Body() dto: ExportToFigmaDto) {
  try {
    const result = await this.wireframesService.exportToFigma(dto.projectId);
    return {
      status: 'success',
      ...result,
    };
  } catch (error) {
    console.error('Figma 내보내기 오류:', error);
    return {
      status: 'error',
      message: error.message || 'Figma 내보내기 실패',
    };
  }
}
```

---

## 🎨 프론트엔드 구현

### Step 1: API Route 생성

```typescript
// frontend/src/app/api/wireframes/export-figma/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json();

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/wireframes/export-figma`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ projectId }),
    });

    const data = await response.json();

    if (data.status === 'error') {
      return NextResponse.json(
        { status: 'error', message: data.message },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Figma 내보내기 API 오류:', error);
    return NextResponse.json(
      { status: 'error', message: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
```

### Step 2: React Hook 추가

```typescript
// frontend/src/hooks/useWireframe.ts (기존 파일에 추가)

export function useWireframe() {
  const [wireframe, setWireframe] = useState<WireframeSpec | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false); // 추가
  const [error, setError] = useState<string | null>(null);

  // ... 기존 코드 ...

  const exportToFigma = async (projectId: string) => {
    setIsExporting(true);
    setError(null);

    try {
      console.log("Figma로 내보내기:", projectId);

      const response = await fetch("/api/wireframes/export-figma", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectId }),
      });

      const data = await response.json();

      if (data.status === "error") {
        throw new Error(data.message || "Figma 내보내기 실패");
      }

      console.log("Figma 내보내기 성공:", data.figma_url);
      
      // Figma로 리다이렉트
      window.open(data.figma_url, '_blank');
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류";
      console.error("Figma 내보내기 오류:", errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setIsExporting(false);
    }
  };

  return {
    wireframe,
    isGenerating,
    isExporting, // 추가
    error,
    generateWireframe,
    exportToFigma, // 추가
    clearWireframe,
  };
}
```

### Step 3: UI 버튼 추가

```tsx
// frontend/src/components/project/ConfirmationPanel.tsx

{wireframe && !isGeneratingWireframe && (
  <div className="space-y-6">
    {/* 기존 와이어프레임 표시 */}
    <div className="flex justify-center bg-gray-50 rounded-lg p-8">
      <LoFiCanvas spec={wireframe} scale={0.8} />
    </div>

    {/* Figma 내보내기 버튼 추가 */}
    <div className="flex justify-center gap-4">
      <button
        onClick={onRegenerateWireframe}
        className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
      >
        🔄 다시 생성
      </button>
      
      <button
        onClick={() => {
          if (savedProjectId) {
            exportToFigma(savedProjectId);
          }
        }}
        disabled={isExportingToFigma}
        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isExportingToFigma ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>내보내는 중...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
            </svg>
            <span>Figma로 내보내기</span>
          </>
        )}
      </button>
    </div>

    {/* 안내 메시지 */}
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <span className="text-purple-600 text-xl">🎨</span>
        <div className="flex-1 text-sm text-purple-800">
          <p className="font-medium mb-1">Figma로 내보내기</p>
          <ul className="list-disc list-inside space-y-1 text-purple-700">
            <li>Figma에서 자유롭게 편집 가능합니다</li>
            <li>색상, 폰트, 이미지를 추가할 수 있습니다</li>
            <li>팀원과 실시간으로 협업할 수 있습니다</li>
            <li>개발자에게 디자인을 쉽게 전달할 수 있습니다</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
)}
```

---

## 🗄️ DB 마이그레이션

```sql
-- supabase/migrations/20250112_add_figma_columns.sql

-- wireframes 테이블에 Figma 관련 컬럼 추가
ALTER TABLE wireframes 
ADD COLUMN IF NOT EXISTS figma_url TEXT,
ADD COLUMN IF NOT EXISTS figma_file_key TEXT,
ADD COLUMN IF NOT EXISTS exported_to_figma_at TIMESTAMPTZ;

-- 인덱스 추가 (선택사항)
CREATE INDEX IF NOT EXISTS idx_wireframes_figma_file_key 
ON wireframes(figma_file_key) 
WHERE figma_file_key IS NOT NULL;

-- 코멘트 추가
COMMENT ON COLUMN wireframes.figma_url IS 'Figma 파일 편집 URL';
COMMENT ON COLUMN wireframes.figma_file_key IS 'Figma 파일 고유 키';
COMMENT ON COLUMN wireframes.exported_to_figma_at IS 'Figma 내보내기 일시';
```

---

## 🧪 테스트

### 1. 백엔드 API 테스트

```bash
# Figma 토큰 확인
curl -H "X-Figma-Token: YOUR_TOKEN" \
  https://api.figma.com/v1/me

# 내보내기 테스트
curl -X POST http://localhost:3001/wireframes/export-figma \
  -H "Content-Type: application/json" \
  -d '{"projectId":"your-project-id"}'
```

### 2. 프론트엔드 테스트

1. 와이어프레임 생성
2. "Figma로 내보내기" 버튼 클릭
3. 새 탭에서 Figma 파일 열림 확인
4. Figma에서 편집 가능 확인

---

## 🎨 Figma에서 추가 작업

### 1. 컬러 팔레트 적용
```
1. Figma에서 파일 열기
2. 우측 패널 → Styles → Colors
3. 브랜드 컬러 추가
4. 요소에 적용
```

### 2. 타이포그래피 설정
```
1. Text Styles 생성
2. Heading, Body, Caption 등 정의
3. 모든 텍스트에 적용
```

### 3. Components 변환
```
1. 반복되는 요소 선택 (예: 버튼)
2. Ctrl+Alt+K → Create Component
3. 인스턴스로 복제
```

### 4. Auto Layout 적용
```
1. Frame 선택
2. Shift+A → Auto Layout
3. Padding, Gap 설정
4. 반응형 디자인 구성
```

---

## 🚀 고급 기능 (향후)

### 1. 양방향 동기화
```typescript
// Figma Webhooks 활용
// Figma에서 편집 → 자동으로 우리 DB 업데이트
```

### 2. AI 플러그인 자동 실행
```typescript
// Figma Plugin API 활용
// 파일 생성 시 자동으로 AI 디자인 적용
```

### 3. 버전 관리
```typescript
// Figma Version History API
// 여러 버전 비교 및 복원
```

---

## ⚠️ 주의사항

### 1. API 제한
- Figma API: 100 requests/min
- 토큰 유효기간: 없음 (수동 삭제 전까지)
- 파일 크기: 제한 없음

### 2. 보안
```typescript
// ❌ 프론트엔드에 토큰 노출 금지
const token = process.env.FIGMA_ACCESS_TOKEN; // 백엔드에서만

// ✅ 백엔드에서 토큰 관리
// ✅ 사용자별 권한 확인
```

### 3. 에러 처리
```typescript
try {
  await exportToFigma(projectId);
} catch (error) {
  if (error.message.includes('401')) {
    // 토큰 만료
    alert('Figma 인증이 만료되었습니다. 관리자에게 문의하세요.');
  } else if (error.message.includes('429')) {
    // Rate limit
    alert('잠시 후 다시 시도해주세요.');
  } else {
    alert('Figma 내보내기 실패: ' + error.message);
  }
}
```

---

## 📊 예상 결과

### Before (LoFi)
```
┌──────────────────┐
│ ≡ NAVBAR         │
│ ⌨ INPUT          │
│ ▶ BUTTON         │
│ ☰ LIST           │
└──────────────────┘
```

### After (Figma)
```
┌──────────────────┐
│ 🎨 디자인된 헤더  │  ← 실제 색상
│ [검색어 입력]     │  ← 실제 입력창
│ 🔍 검색하기       │  ← 브랜드 컬러 버튼
│ 📋 목록 카드들    │  ← 실제 콘텐츠
└──────────────────┘
```

---

## ✅ 체크리스트

### 설정
- [ ] Figma 계정 생성
- [ ] Access Token 발급
- [ ] 환경 변수 설정 (`.env`)

### 백엔드
- [ ] DTO 생성 (`ExportToFigmaDto`)
- [ ] 서비스 메서드 추가 (`exportToFigma`)
- [ ] 노드 변환 로직 (`convertSpecToFigmaNodes`)
- [ ] 컨트롤러 엔드포인트 추가

### 프론트엔드
- [ ] API Route 생성 (`export-figma/route.ts`)
- [ ] Hook 메서드 추가 (`exportToFigma`)
- [ ] UI 버튼 추가
- [ ] 로딩/에러 처리

### DB
- [ ] 마이그레이션 실행 (Figma 컬럼 추가)

### 테스트
- [ ] API 토큰 검증
- [ ] 파일 생성 테스트
- [ ] Figma 편집 가능 확인

---

## 💡 Tips

### 1. 테스트 시
```
- 먼저 간단한 와이어프레임으로 테스트
- Figma 개발자 도구로 API 응답 확인
- 토큰은 절대 Git에 커밋하지 않기
```

### 2. 프로덕션 배포 시
```
- 환경 변수 Railway/Vercel에 설정
- 에러 로깅 강화 (Sentry 등)
- Rate limit 모니터링
```

### 3. 사용자 경험
```
- 내보내기 중 로딩 표시
- 성공 시 Figma 자동 오픈
- 실패 시 명확한 에러 메시지
```

---

**작성일**: 2025-01-12  
**예상 소요 시간**: 2-3시간  
**난이도**: ⭐⭐⭐ (중급)

