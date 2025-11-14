// PDF 생성 및 다운로드 유틸리티

interface PDFOptions {
  filename?: string;
  title?: string;
  author?: string;
  subject?: string;
}

export async function downloadMarkdownAsPDF(
  markdown: string,
  options: PDFOptions = {}
): Promise<void> {
  const {
    filename = `견적서_${new Date().toISOString().split('T')[0]}.pdf`,
    title = "프로젝트 견적서",
    author = "Flowgence",
    subject = "프로젝트 견적서"
  } = options;

  try {
    // 마크다운을 HTML로 변환
    const html = markdownToHtml(markdown);
    
    // PDF 생성을 위한 HTML 문서 생성
    const htmlDocument = createHTMLDocument(html, title, author, subject);
    
    // 브라우저의 인쇄 기능을 사용하여 PDF 생성
    await printToPDF(htmlDocument, filename);
    
  } catch (error) {
    console.error('PDF 생성 중 오류 발생:', error);
    throw new Error('PDF 생성에 실패했습니다.');
  }
}

// 마크다운을 HTML로 변환
function markdownToHtml(markdown: string): string {
  // HTML 태그가 포함된 부분을 먼저 추출 (이미지, div 등)
  const htmlBlocks: string[] = [];
  let html = markdown;
  
  // img 태그를 먼저 처리 (Base64 데이터 URL이 매우 길 수 있음)
  html = html.replace(/<img[^>]*>/gim, (match) => {
    const placeholder = `__HTML_BLOCK_${htmlBlocks.length}__`;
    htmlBlocks.push(match);
    return placeholder;
  });
  
  // HTML 블록을 임시 플레이스홀더로 교체 (중첩된 태그 처리)
  // 여러 줄에 걸친 HTML 블록을 정확히 매칭 (div 등)
  // 먼저 닫는 태그가 있는 블록 처리
  html = html.replace(/<([a-zA-Z][a-zA-Z0-9]*)[^>]*>[\s\S]*?<\/\1>/gim, (match) => {
    // 이미 플레이스홀더인 경우 건너뛰기
    if (match.includes('__HTML_BLOCK_')) {
      return match;
    }
    const placeholder = `__HTML_BLOCK_${htmlBlocks.length}__`;
    htmlBlocks.push(match);
    return placeholder;
  });
  
  // 자체 닫는 태그도 처리 (br, hr, input, meta, link 등) - img는 이미 처리됨
  html = html.replace(/<([a-zA-Z][a-zA-Z0-9]*)[^>]*\/?>/gim, (match, tagName) => {
    // 플레이스홀더가 아니고, 자체 닫는 태그인 경우
    if (!match.includes('__HTML_BLOCK_') && 
        (match.endsWith('/>') || ['br', 'hr', 'input', 'meta', 'link'].includes(tagName.toLowerCase()))) {
      const placeholder = `__HTML_BLOCK_${htmlBlocks.length}__`;
      htmlBlocks.push(match);
      return placeholder;
    }
    return match;
  });
  
  // 테이블 영역을 찾아서 처리
  html = html.replace(/(\|.*\|(?:\s*\|.*\|)*)/gim, (tableMatch) => {
    const lines = tableMatch.trim().split('\n');
    let tableHtml = '<table class="table">';
    
    lines.forEach((line, index) => {
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
        
        if (index === 0) {
          // 헤더 행
          tableHtml += '<thead><tr>';
          cells.forEach(cell => {
            tableHtml += `<th>${cell}</th>`;
          });
          tableHtml += '</tr></thead><tbody>';
        } else if (line.includes('---')) {
          // 구분선 무시
          return;
        } else {
          // 데이터 행
          tableHtml += '<tr>';
          cells.forEach(cell => {
            tableHtml += `<td>${cell}</td>`;
          });
          tableHtml += '</tr>';
        }
      }
    });
    
    tableHtml += '</tbody></table>';
    return tableHtml;
  });
  
  // 나머지 마크다운 변환
  html = html
    // 헤더 변환
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
    
    // 텍스트 스타일
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    
    // 리스트 변환
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    
    // 줄바꿈 (HTML 블록 플레이스홀더는 제외)
    .replace(/\n/gim, '<br>');

  // 리스트 래핑
  html = html.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');
  
  // HTML 블록을 다시 삽입
  htmlBlocks.forEach((block, index) => {
    html = html.replace(`__HTML_BLOCK_${index}__`, block);
  });
  
  return html;
}

// HTML 문서 생성
function createHTMLDocument(html: string, title: string, author: string, subject: string): string {
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="author" content="${author}">
    <meta name="subject" content="${subject}">
    <style>
        body {
            font-family: 'Malgun Gothic', '맑은 고딕', Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: #333;
            background: white;
        }
        
        h1 {
            color: #2563eb;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 10px;
            margin-bottom: 30px;
        }
        
        h2 {
            color: #1e40af;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 8px;
            margin-top: 30px;
            margin-bottom: 20px;
        }
        
        h3 {
            color: #374151;
            margin-top: 25px;
            margin-bottom: 15px;
        }
        
        h4 {
            color: #4b5563;
            margin-top: 20px;
            margin-bottom: 10px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 14px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            overflow: hidden;
        }
        
        table th,
        table td {
            border: 1px solid #e5e7eb;
            padding: 12px 16px;
            text-align: left;
            vertical-align: top;
        }
        
        table th {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-weight: 600;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        table tr:nth-child(even) {
            background-color: #f8fafc;
        }
        
        table tr:nth-child(odd) {
            background-color: white;
        }
        
        table tr:hover {
            background-color: #e0f2fe;
            transition: background-color 0.2s ease;
        }
        
        /* 우선순위별 색상 구분 */
        .priority-mandatory {
            background-color: #fef2f2;
            border-left: 4px solid #ef4444;
        }
        
        .priority-recommended {
            background-color: #fffbeb;
            border-left: 4px solid #f59e0b;
        }
        
        .priority-optional {
            background-color: #f0fdf4;
            border-left: 4px solid #10b981;
        }
        
        /* 우선순위 배지 */
        .priority-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .priority-badge.mandatory {
            background-color: #ef4444;
            color: white;
        }
        
        .priority-badge.recommended {
            background-color: #f59e0b;
            color: white;
        }
        
        .priority-badge.optional {
            background-color: #10b981;
            color: white;
        }
        
        /* ID 스타일 */
        .requirement-id {
            font-family: 'Courier New', monospace;
            font-weight: 600;
            color: #6366f1;
            background-color: #f1f5f9;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
        }
        
        /* 설명 텍스트 개선 */
        .requirement-description {
            line-height: 1.5;
            color: #4b5563;
        }
        
        /* 요구사항명 스타일 */
        .requirement-name {
            font-weight: 600;
            color: #1f2937;
        }
        
        .wireframe-preview {
            display: flex;
            flex-direction: column;
            gap: 24px;
            margin: 24px 0;
        }
        
        .wireframe-preview,
        .mermaid-preview {
            text-align: center;
            margin: 24px 0;
            page-break-inside: avoid;
            break-inside: avoid;
        }
        
        .wireframe-preview img,
        .mermaid-preview img {
            max-width: 100% !important;
            width: auto !important;
            height: auto !important;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            display: block !important;
            margin: 0 auto;
            page-break-inside: avoid;
            break-inside: avoid;
            object-fit: contain;
        }

        .wireframe-device-group {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .wireframe-device-heading {
            font-size: 18px;
            font-weight: 700;
            color: #1f2937;
            margin: 0;
        }
        
        .wireframe-screen {
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            padding: 16px;
            background: linear-gradient(135deg, rgba(238,242,255,0.6), rgba(236,253,245,0.6));
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.6), 0 8px 24px rgba(15,23,42,0.08);
            page-break-inside: avoid;
        }
        
        .wireframe-screen-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 12px;
        }
        
        .wireframe-screen-title {
            font-size: 16px;
            font-weight: 700;
            color: #1f2937;
            letter-spacing: 0.3px;
        }
        
        .wireframe-screen-meta {
            font-size: 12px;
            color: #6b7280;
            font-weight: 500;
        }
        
        .wireframe-canvas-wrapper {
            display: flex;
            justify-content: center;
            padding: 16px;
            background: white;
            border-radius: 12px;
            border: 1px dashed rgba(99,102,241,0.3);
        }
        
        .wireframe-canvas {
            position: relative;
            border: 6px solid #0f172a;
            border-radius: 24px;
            background: #fff;
            box-shadow: 0 12px 35px rgba(15,23,42,0.15);
            overflow: hidden;
        }
        
        .wireframe-element {
            position: absolute;
            border: 2px solid #cbd5f5;
            border-radius: 12px;
            background: rgba(255,255,255,0.92);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 4px;
            box-shadow: 0 2px 8px rgba(15,23,42,0.12);
            transition: transform 0.2s ease;
        }
        
        .wireframe-element .wireframe-element-content {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 10px;
            font-weight: 600;
            color: #1f2937;
            text-transform: uppercase;
        }
        
        .wireframe-element .wireframe-element-icon {
            font-size: 10px;
            opacity: 0.6;
        }
        
        .wireframe-element.type-navbar {
            background: rgba(99,102,241,0.15);
            border-color: rgba(79,70,229,0.5);
        }
        
        .wireframe-element.type-footer {
            background: rgba(15,23,42,0.08);
            border-color: rgba(15,23,42,0.4);
        }
        
        .wireframe-element.type-button {
            background: rgba(37,99,235,0.15);
            border-color: rgba(37,99,235,0.55);
        }
        
        .wireframe-element.type-input,
        .wireframe-element.type-select,
        .wireframe-element.type-checkbox,
        .wireframe-element.type-radio {
            background: rgba(255,255,255,0.95);
            border-color: rgba(148,163,184,0.6);
        }
        
        .wireframe-element.type-list,
        .wireframe-element.type-card,
        .wireframe-element.type-table {
            background: rgba(236,254,255,0.8);
            border-color: rgba(14,165,233,0.5);
        }
        
        .wireframe-element.type-text {
            background: rgba(226,232,240,0.6);
            border-color: rgba(148,163,184,0.5);
        }
        
        .wireframe-element.type-image {
            background: rgba(226,232,240,0.42);
            border-color: rgba(148,163,184,0.35);
            border-style: dashed;
        }
        
        .wireframe-element.type-chip,
        .wireframe-element.type-icon {
            background: rgba(244,114,182,0.16);
            border-color: rgba(236,72,153,0.4);
        }
        
        .wireframe-element.type-divider {
            background: rgba(15,23,42,0.08);
            border-color: transparent;
        }
        
        .wireframe-element.type-divider .wireframe-element-content {
            display: none;
        }
        
        .wireframe-element.type-divider::after {
            content: "";
            position: absolute;
            left: 8px;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            height: 2px;
            background: rgba(15,23,42,0.25);
        }
        
        .wireframe-element:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(79,70,229,0.18);
        }
        
        ul {
            margin: 15px 0;
            padding-left: 20px;
        }
        
        li {
            margin: 5px 0;
        }
        
        strong {
            color: #1f2937;
        }
        
        hr {
            border: none;
            border-top: 2px solid #e5e7eb;
            margin: 30px 0;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        @media print {
            @page {
                margin: 24mm 16mm 20mm;
            }
            
            body {
                margin: 0;
                padding: 15px;
            }
            
            h1 {
                page-break-after: avoid;
                break-after: avoid;
            }
            
            h2, h3, h4 {
                page-break-after: avoid;
                break-after: avoid;
            }
            
            table {
                page-break-inside: avoid;
                break-inside: avoid;
            }
            
            thead {
                display: table-header-group;
            }
            
            tfoot {
                display: table-footer-group;
            }
            
            tbody {
                display: table-row-group;
            }
            
            tr {
                page-break-inside: avoid;
                break-inside: avoid;
            }
            
            .card, .wireframe-screen {
                page-break-inside: avoid;
                break-inside: avoid;
            }
            
            .wireframe-preview img,
            .mermaid-preview img {
                max-width: 100% !important;
                height: auto !important;
                page-break-inside: avoid;
                break-inside: avoid;
            }
            
            /* 큰 테이블의 경우 페이지 나누기 허용 */
            table.large-table {
                page-break-inside: auto;
                break-inside: auto;
            }
            
            /* 섹션 간 페이지 나누기 */
            .section-break {
                page-break-before: always;
                break-before: page;
            }
            
            /* 인쇄 시 헤더/푸터 커스텀 */
            .header, .footer {
                font-size: 11px;
                color: #667085;
            }
        }
    </style>
</head>
<body>
    ${html}
</body>
</html>`;
}

// 브라우저 인쇄 기능을 사용하여 PDF 생성
async function printToPDF(htmlDocument: string, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // 새 창 열기
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        reject(new Error('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.'));
        return;
      }

      // HTML 문서 작성
      printWindow.document.write(htmlDocument);
      printWindow.document.close();

      // 이미지 로드 완료 대기 함수
      const waitForImages = (): Promise<void> => {
        return new Promise((imgResolve) => {
          const images = printWindow.document.querySelectorAll('img');
          if (images.length === 0) {
            imgResolve();
            return;
          }

          let loadedCount = 0;
          const totalImages = images.length;

          const checkComplete = () => {
            loadedCount++;
            if (loadedCount === totalImages) {
              imgResolve();
            }
          };

          images.forEach((img) => {
            // Base64 이미지는 이미 로드되어 있음
            if (img.src.startsWith('data:')) {
              checkComplete();
            } else {
              if (img.complete) {
                checkComplete();
              } else {
                img.onload = checkComplete;
                img.onerror = checkComplete; // 에러가 나도 계속 진행
              }
            }
          });
        });
      };

      // 문서 로드 완료 후 이미지 로드 대기
      printWindow.onload = async () => {
        try {
          // 이미지 요소 확인 및 디버깅
          const images = printWindow.document.querySelectorAll('img');
          console.log('PDF 생성 - 이미지 개수:', images.length);
          images.forEach((img, index) => {
            console.log(`이미지 ${index + 1}:`, {
              srcLength: img.src.length,
              srcPreview: img.src.substring(0, 100),
              isBase64: img.src.startsWith('data:'),
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight,
              complete: img.complete,
            });
          });

          // 이미지 로드 완료 대기 (최대 5초)
          await Promise.race([
            waitForImages(),
            new Promise((resolve) => setTimeout(resolve, 5000))
          ]);

          // 이미지 로드 후 다시 확인
          images.forEach((img, index) => {
            if (img.complete) {
              console.log(`이미지 ${index + 1} 로드 완료:`, {
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight,
              });
            }
          });

          // 추가 대기 시간 (렌더링 완료 보장)
          setTimeout(() => {
            printWindow.print();
            
            // 인쇄 완료 후 창 닫기
            setTimeout(() => {
              printWindow.close();
              resolve();
            }, 1000);
          }, 500);
        } catch (error) {
          console.error('이미지 로드 대기 중 오류:', error);
          // 오류가 나도 인쇄 진행
          setTimeout(() => {
            printWindow.print();
            setTimeout(() => {
              printWindow.close();
              resolve();
            }, 1000);
          }, 500);
        }
      };

      printWindow.onerror = () => {
        reject(new Error('PDF 생성 중 오류가 발생했습니다.'));
      };

    } catch (error) {
      reject(error);
    }
  });
}

// 대안: HTML을 Blob으로 변환하여 다운로드
export function downloadHTMLAsFile(html: string, filename: string = '견적서.html'): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

// 대안: 마크다운 파일로 다운로드
export function downloadMarkdownAsFile(markdown: string, filename: string = '견적서.md'): void {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
