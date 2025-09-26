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
  // 먼저 테이블을 처리
  let html = markdown;
  
  // 테이블 영역을 찾아서 처리
  html = html.replace(/(\|.*\|(?:\s*\|.*\|)*)/gims, (tableMatch) => {
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
    
    // 줄바꿈
    .replace(/\n/gim, '<br>');

  // 리스트 래핑
  html = html.replace(/(<li>.*<\/li>)/gims, '<ul>$1</ul>');
  
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
            body {
                margin: 0;
                padding: 15px;
            }
            
            h1 {
                page-break-after: avoid;
            }
            
            h2, h3 {
                page-break-after: avoid;
            }
            
            table {
                page-break-inside: avoid;
                break-inside: avoid;
            }
            
            thead {
                display: table-header-group;
            }
            
            tbody {
                display: table-row-group;
            }
            
            tr {
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

      // 문서 로드 완료 후 인쇄
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          
          // 인쇄 완료 후 창 닫기
          setTimeout(() => {
            printWindow.close();
            resolve();
          }, 1000);
        }, 500);
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
