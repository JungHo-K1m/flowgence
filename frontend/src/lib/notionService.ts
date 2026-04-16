import { WireframeSpec } from "@/types/wireframe";

// Notion API 서비스
// Notion API를 사용하여 페이지를 생성하고 콘텐츠를 추가하는 서비스

interface NotionBlock {
  type: string;
  [key: string]: any;
}

interface NotionPageProperties {
  title: string;
  description?: string;
  projectType?: string;
  createdAt?: string;
}

interface NotionConfig {
  apiKey: string;
  databaseId: string;
}

class NotionService {
  private apiKey: string;
  private databaseId: string;
  private baseUrl = 'https://api.notion.com/v1';

  constructor(config: NotionConfig) {
    this.apiKey = config.apiKey;
    this.databaseId = config.databaseId;
  }

  // Notion 페이지 생성 (Notion 공식 문서에 따라 children을 직접 포함)
  async createPage(properties: NotionPageProperties, children: NotionBlock[]): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/pages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({
          parent: {
            database_id: this.databaseId,
          },
          properties: {
            title: {
              title: [
                {
                  text: {
                    content: properties.title,
                  },
                },
              ],
            },
            ...(properties.description && {
              description: {
                rich_text: [
                  {
                    text: {
                      content: properties.description,
                    },
                  },
                ],
              },
            }),
            ...(properties.projectType && {
              projectType: {
                select: {
                  name: properties.projectType,
                },
              },
            }),
            ...(properties.createdAt && {
              createdAt: {
                date: {
                  start: properties.createdAt,
                },
              },
            }),
          },
          // Notion 공식 문서에 따라 children을 페이지 생성 시 직접 포함
          children: children && children.length > 0 ? children : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Notion API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const page = await response.json();
      return page.id;
    } catch (error) {
      throw error;
    }
  }

  // 페이지에 콘텐츠 블록 추가
  async addBlocksToPage(pageId: string, blocks: NotionBlock[]): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/blocks/${pageId}/children`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({
          children: blocks,
        }),
      });

      if (!response.ok) {
        throw new Error(`Notion API error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      throw error;
    }
  }

  // 마크다운 텍스트를 Notion 블록으로 변환
  convertMarkdownToBlocks(markdown: string): NotionBlock[] {
    const lines = markdown.split('\n');
    const blocks: NotionBlock[] = [];
    let currentTableRows: any[] = [];
    let inTable = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // 빈 줄 무시
      if (!line) {
        if (inTable && currentTableRows.length > 0) {
          blocks.push({
            type: 'table',
            table: {
              table_width: currentTableRows[0]?.table_row?.cells?.length || 3,
              has_column_header: true,
              has_row_header: false,
              children: currentTableRows,
            },
          });
          currentTableRows = [];
          inTable = false;
        }
        continue;
      }

      // 헤더 처리
      if (line.startsWith('# ')) {
        blocks.push({
          type: 'heading_1',
          heading_1: {
            rich_text: [{ text: { content: line.substring(2) } }],
          },
        });
      } else if (line.startsWith('## ')) {
        blocks.push({
          type: 'heading_2',
          heading_2: {
            rich_text: [{ text: { content: line.substring(3) } }],
          },
        });
      } else if (line.startsWith('### ')) {
        blocks.push({
          type: 'heading_3',
          heading_3: {
            rich_text: [{ text: { content: line.substring(4) } }],
          },
        });
      } else if (line.startsWith('#### ')) {
        blocks.push({
          type: 'heading_3',
          heading_3: {
            rich_text: [{ text: { content: line.substring(5) } }],
          },
        });
      }
      // 테이블 처리
      else if (line.startsWith('|') && line.endsWith('|')) {
        if (line.includes('---')) {
          // 테이블 헤더 구분선 무시
          continue;
        }

        inTable = true;
        const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
        
        currentTableRows.push({
          type: 'table_row',
          table_row: {
            cells: cells.map(cell => [{
              type: 'text',
              text: {
                content: this.stripHtmlTags(cell),
              },
            }]),
          },
        });
      }
      // 리스트 처리
      else if (line.startsWith('- ')) {
        blocks.push({
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ text: { content: line.substring(2) } }],
          },
        });
      }
      // 구분선 처리
      else if (line.startsWith('---')) {
        blocks.push({
          type: 'divider',
          divider: {},
        });
      }
      // 일반 텍스트 처리
      else {
        blocks.push({
          type: 'paragraph',
          paragraph: {
            rich_text: [{ text: { content: line } }],
          },
        });
      }
    }

    // 마지막 테이블 처리
    if (inTable && currentTableRows.length > 0) {
      blocks.push({
        type: 'table',
        table: {
          table_width: currentTableRows[0]?.table_row?.cells?.length || 3,
          has_column_header: true,
          has_row_header: false,
          children: currentTableRows,
        },
      });
    }

    return blocks;
  }

  // HTML 태그 제거
  private stripHtmlTags(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }

  // 페이지 공개 설정
  async makePagePublic(pageId: string): Promise<string> {
    try {
      // Notion API v1에서는 페이지 공개 설정을 직접 지원하지 않음
      // 대신 페이지 URL을 반환하여 사용자가 수동으로 공개 설정할 수 있도록 함
      return `https://notion.so/${pageId.replace(/-/g, '')}`;
    } catch (error) {
      throw error;
    }
  }

  // Notion 사용 가이드 생성
  generateNotionGuide(): string {
    return `
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
  }
}

// Notion 서비스 인스턴스 생성
export function createNotionService(apiKey: string, databaseId: string): NotionService {
  return new NotionService({ apiKey, databaseId });
}

// 요구사항 명세서를 Notion에 공유
export async function shareRequirementsToNotion(
  requirementsData: any,
  projectData: any,
  extractedRequirements: any,
  projectOverview: any,
  wireframe: WireframeSpec | null | undefined,
  notionConfig: { apiKey: string; databaseId: string }
): Promise<string> {
  try {
    const notionService = createNotionService(notionConfig.apiKey, notionConfig.databaseId);
    
    // 페이지 속성 설정
    const pageProperties: NotionPageProperties = {
      title: `${requirementsData.projectName} - 요구사항 명세서`,
      description: `프로젝트 요구사항 명세서 (${projectData.serviceType})`,
      projectType: projectData.serviceType,
      createdAt: new Date().toISOString().split('T')[0],
    };

    // 마크다운 콘텐츠 생성
    const { generateRequirementsMarkdown } = await import('./requirementsMarkdownGenerator');
    const markdown = generateRequirementsMarkdown(
      requirementsData,
      projectData,
      extractedRequirements,
    projectOverview,
    wireframe
    );

    // 마크다운을 Notion 블록으로 변환
    const blocks = notionService.convertMarkdownToBlocks(markdown);

    // 페이지 생성 (Notion 공식 문서에 따라 children을 직접 포함하여 1번의 API 호출로 처리)
    const pageId = await notionService.createPage(pageProperties, blocks);

    // 페이지 URL 반환
    return await notionService.makePagePublic(pageId);
  } catch (error) {
    throw error;
  }
}

// 견적서를 Notion에 공유
export async function shareEstimateToNotion(
  estimateData: any,
  requirementsData: any,
  projectData: any,
  projectOverview: any,
  notionConfig: { apiKey: string; databaseId: string },
  extractedRequirements?: any
): Promise<string> {
  try {
    const notionService = createNotionService(notionConfig.apiKey, notionConfig.databaseId);
    
    // 페이지 속성 설정
    const pageProperties: NotionPageProperties = {
      title: `${projectData.serviceType} - 프로젝트 견적서`,
      description: `프로젝트 견적서 (총 ${estimateData.finalEstimate.toLocaleString('ko-KR')}원)`,
      projectType: projectData.serviceType,
      createdAt: new Date().toISOString().split('T')[0],
    };

    // 마크다운 콘텐츠 생성
    const { generateEstimateMarkdown } = await import('./estimateGenerator');
    const markdown = generateEstimateMarkdown(
      estimateData,
      requirementsData,
      projectData,
      projectOverview,
      extractedRequirements
    );

    // 마크다운을 Notion 블록으로 변환
    const blocks = notionService.convertMarkdownToBlocks(markdown);

    // 페이지 생성 (Notion 공식 문서에 따라 children을 직접 포함하여 1번의 API 호출로 처리)
    const pageId = await notionService.createPage(pageProperties, blocks);

    // 페이지 URL 반환
    return await notionService.makePagePublic(pageId);
  } catch (error) {
    throw error;
  }
}
