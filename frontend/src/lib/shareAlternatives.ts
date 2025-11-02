// Notion 대안 공유 방법들
// Notion을 모르거나 사용할 수 없는 사용자를 위한 대안 제공

export interface ShareOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  action: () => void;
  available: boolean;
}

export interface ShareData {
  title: string;
  content: string;
  markdown: string;
  html: string;
}

// 클립보드에 텍스트 복사
export function copyToClipboard(text: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        resolve(true);
      }).catch(() => {
        resolve(false);
      });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        resolve(successful);
      } catch (err) {
        document.body.removeChild(textArea);
        resolve(false);
      }
    }
  });
}

// 이메일 공유
export function shareViaEmail(data: ShareData): void {
  const subject = encodeURIComponent(data.title);
  const body = encodeURIComponent(
    `안녕하세요,\n\n${data.title}를 공유드립니다.\n\n${data.content}\n\n감사합니다.`
  );
  
  const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
  window.open(mailtoLink);
}

// 카카오톡 공유 (웹 링크)
export function shareViaKakao(data: ShareData): void {
  // 카카오톡 공유는 실제로는 링크 공유만 가능
  // 여기서는 클립보드에 복사 후 안내
  const shareText = `${data.title}\n\n${data.content}`;
  
  copyToClipboard(shareText).then((success) => {
    if (success) {
      alert(
        `카카오톡 공유를 위해 내용이 클립보드에 복사되었습니다.\n\n` +
        `카카오톡에서 붙여넣기하여 공유하세요.\n\n` +
        `📱 모바일: 카카오톡 앱에서 붙여넣기\n` +
        `💻 PC: 카카오톡 PC 버전에서 붙여넣기`
      );
    } else {
      alert('클립보드 복사에 실패했습니다. 수동으로 복사해주세요.');
    }
  });
}

// 슬랙 공유 (웹 링크)
export function shareViaSlack(data: ShareData): void {
  const shareText = `${data.title}\n\n${data.content}`;
  
  copyToClipboard(shareText).then((success) => {
    if (success) {
      alert(
        `슬랙 공유를 위해 내용이 클립보드에 복사되었습니다.\n\n` +
        `슬랙에서 붙여넣기하여 공유하세요.\n\n` +
        `💻 웹: slack.com 접속 후 붙여넣기\n` +
        `📱 모바일: 슬랙 앱에서 붙여넣기`
      );
    } else {
      alert('클립보드 복사에 실패했습니다. 수동으로 복사해주세요.');
    }
  });
}

// 구글 드라이브 공유 (HTML 파일 생성)
export function shareViaGoogleDrive(data: ShareData): void {
  // HTML 파일 생성
  const htmlContent: string = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title}</title>
    <style>
        body {
            font-family: 'Malgun Gothic', '맑은 고딕', Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: #333;
            background: white;
        }
        h1, h2, h3, h4 {
            color: #2563eb;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #e5e7eb;
            padding: 12px;
            text-align: left;
        }
        th {
            background-color: #f8fafc;
            font-weight: 600;
        }
        .download-link {
            display: inline-block;
            margin: 20px 0;
            padding: 10px 20px;
            background-color: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <h1>${data.title}</h1>
    <div>${data.html}</div>
    <a href="#" 
       download="${data.title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}.html" 
       class="download-link">
        📥 HTML 파일로 다운로드
    </a>
</body>
</html>`;

  // HTML 파일 다운로드
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  alert(
    `HTML 파일이 다운로드되었습니다.\n\n` +
    `구글 드라이브에 업로드하여 공유하세요:\n\n` +
    `1. drive.google.com 접속\n` +
    `2. "새로 만들기" → "파일 업로드"\n` +
    `3. 다운로드된 HTML 파일 선택\n` +
    `4. 업로드 후 공유 설정`
  );
}

// 마이크로소프트 팀즈 공유
export function shareViaTeams(data: ShareData): void {
  const shareText = `${data.title}\n\n${data.content}`;
  
  copyToClipboard(shareText).then((success) => {
    if (success) {
      alert(
        `Microsoft Teams 공유를 위해 내용이 클립보드에 복사되었습니다.\n\n` +
        `Teams에서 붙여넣기하여 공유하세요.\n\n` +
        `💻 웹: teams.microsoft.com 접속 후 붙여넣기\n` +
        `📱 모바일: Teams 앱에서 붙여넣기`
      );
    } else {
      alert('클립보드 복사에 실패했습니다. 수동으로 복사해주세요.');
    }
  });
}

// 일반 텍스트 공유
export function shareAsText(data: ShareData): void {
  const shareText = `${data.title}\n\n${data.content}`;
  
  copyToClipboard(shareText).then((success) => {
    if (success) {
      alert(
        `텍스트가 클립보드에 복사되었습니다.\n\n` +
        `원하는 곳에 붙여넣기하여 공유하세요:\n\n` +
        `📧 이메일\n` +
        `💬 메신저 (카카오톡, 텔레그램 등)\n` +
        `📱 SMS\n` +
        `💻 문서 편집기 (워드, 구글 독스 등)`
      );
    } else {
      alert('클립보드 복사에 실패했습니다. 수동으로 복사해주세요.');
    }
  });
}

// 공유 옵션 목록 생성
export function getShareOptions(data: ShareData): ShareOption[] {
  return [
    {
      id: 'notion-manual',
      name: 'Notion에 수동 공유',
      description: '클립보드 복사 후 Notion에 붙여넣기',
      icon: '📝',
      action: () => shareToNotionManually(data),
      available: true,
    },
    {
      id: 'text',
      name: '텍스트로 복사',
      description: '클립보드에 텍스트 복사',
      icon: '📋',
      action: () => shareAsText(data),
      available: true,
    },
    {
      id: 'email',
      name: '이메일로 공유',
      description: '기본 이메일 앱으로 공유',
      icon: '📧',
      action: () => shareViaEmail(data),
      available: true,
    },
    {
      id: 'kakao',
      name: '카카오톡 공유',
      description: '카카오톡으로 공유',
      icon: '💬',
      action: () => shareViaKakao(data),
      available: true,
    },
    {
      id: 'slack',
      name: '슬랙 공유',
      description: '슬랙으로 공유',
      icon: '💼',
      action: () => shareViaSlack(data),
      available: true,
    },
    {
      id: 'teams',
      name: 'Microsoft Teams',
      description: 'Teams로 공유',
      icon: '👥',
      action: () => shareViaTeams(data),
      available: true,
    },
    {
      id: 'google-drive',
      name: '구글 드라이브',
      description: 'HTML 파일로 구글 드라이브 공유',
      icon: '☁️',
      action: () => shareViaGoogleDrive(data),
      available: true,
    },
  ];
}

// Notion에 수동으로 공유하는 방법
export function shareToNotionManually(data: ShareData): void {
  // 마크다운 형식으로 복사 (Notion이 마크다운을 자동으로 렌더링함)
  const shareText = `# ${data.title}\n\n${data.markdown}`;
  
  copyToClipboard(shareText).then((success) => {
    if (success) {
      alert(
        `✨ 견적서 마크다운이 클립보드에 복사되었습니다!\n\n` +
        `📋 다음 단계를 따라주세요:\n\n` +
        `1. notion.so 접속 (새 탭에서 열기)\n` +
        `2. 새 페이지 생성\n` +
        `3. 내용 영역에 붙여넣기 (Ctrl+V 또는 Cmd+V)\n` +
        `4. Notion이 자동으로 마크다운을 렌더링합니다!\n\n` +
        `💡 팁: Notion은 마크다운 형식을 자동으로 예쁘게 보여줍니다.\n\n` +
        `Notion을 열어보시겠습니까?`
      );
      
      // Notion 열기 옵션
      if (confirm("Notion을 새 탭에서 열어보시겠습니까?")) {
        window.open('https://notion.so', '_blank');
      }
    } else {
      alert('클립보드 복사에 실패했습니다. 수동으로 복사해주세요.');
    }
  });
}

// Notion 사용 가이드 표시
export function showNotionGuide(): void {
  const guideContent = `
# 📱 Notion 사용 가이드

## 🌐 웹 브라우저에서 Notion 사용하기

### 1. 웹 브라우저로 Notion 접속
- **Chrome, Firefox, Safari, Edge** 등 모든 브라우저에서 사용 가능
- 주소창에 **notion.so** 입력하여 접속
- 또는 **notion.com** 접속

### 2. 계정 생성 (무료)
- **"Sign up"** 또는 **"가입하기"** 클릭
- 이메일 주소로 간편 가입
- Google, Apple 계정으로도 가입 가능

### 3. 모바일에서도 사용 가능
- **iOS**: App Store에서 "Notion" 검색 후 다운로드
- **Android**: Google Play Store에서 "Notion" 검색 후 다운로드
- **웹 브라우저**: 모바일 브라우저에서도 완전히 사용 가능

## 💡 Notion이란?

### 주요 기능
- 📝 **문서 작성**: 마크다운 기반의 강력한 문서 편집기
- 📊 **데이터베이스**: 표, 칸반, 갤러리 등 다양한 뷰
- 🔗 **링크 공유**: 문서를 다른 사람과 쉽게 공유
- 📱 **크로스 플랫폼**: 웹, 모바일, 데스크톱 모든 환경에서 동기화

### 왜 Notion을 사용하나요?
- ✅ **무료**: 개인 사용자는 완전 무료
- ✅ **협업**: 팀원들과 실시간으로 문서 공유 및 편집
- ✅ **접근성**: 어디서든 웹 브라우저로 접근 가능
- ✅ **템플릿**: 다양한 문서 템플릿 제공

## 🚀 빠른 시작

### 1단계: 계정 생성
1. [notion.so](https://notion.so) 접속
2. 이메일로 가입
3. 워크스페이스 생성

### 2단계: 첫 문서 만들기
1. **"New page"** 클릭
2. 제목 입력
3. 내용 작성 시작

### 3단계: 공유하기
1. 우측 상단 **"Share"** 버튼 클릭
2. **"Copy link"** 클릭
3. 링크를 다른 사람에게 전송

## 📞 도움이 필요하신가요?

### 온라인 도움말
- [Notion 공식 가이드](https://www.notion.so/guides)
- [Notion 튜토리얼](https://www.notion.so/tutorials)
- [Notion 커뮤니티](https://www.notion.so/community)

### 한국어 지원
- Notion은 한국어를 완전히 지원합니다
- 모든 메뉴와 기능이 한국어로 제공됩니다
`;

  // 새 창에서 가이드 표시
  const newWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
  if (newWindow) {
    newWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Notion 사용 가이드</title>
        <style>
          body {
            font-family: 'Malgun Gothic', '맑은 고딕', Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: #333;
            background: white;
          }
          h1, h2, h3, h4 {
            color: #2563eb;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
          }
          ul, ol {
            margin: 15px 0;
            padding-left: 20px;
          }
          li {
            margin: 5px 0;
          }
          .highlight {
            background-color: #f0f9ff;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #2563eb;
            margin: 20px 0;
          }
          a {
            color: #2563eb;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div style="white-space: pre-line;">${guideContent}</div>
      </body>
      </html>
    `);
    newWindow.document.close();
  }
}
