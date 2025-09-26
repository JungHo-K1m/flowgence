// Notion 설정 관리
// Notion API 키와 데이터베이스 ID를 관리하는 설정 파일

export interface NotionConfig {
  apiKey: string;
  databaseId: string;
}

// 환경 변수에서 Notion 설정 가져오기
export function getNotionConfig(): NotionConfig | null {
  const apiKey = process.env.NEXT_PUBLIC_NOTION_API_KEY;
  const databaseId = process.env.NEXT_PUBLIC_NOTION_DATABASE_ID;

  if (!apiKey || !databaseId) {
    console.warn('Notion API 설정이 완료되지 않았습니다.');
    return null;
  }

  return {
    apiKey,
    databaseId,
  };
}

// Notion 설정 검증
export function validateNotionConfig(config: NotionConfig): boolean {
  if (!config.apiKey || !config.databaseId) {
    return false;
  }

  // API 키 형식 검증 (Notion API 키는 'secret_'로 시작)
  if (!config.apiKey.startsWith('secret_')) {
    return false;
  }

  // 데이터베이스 ID 형식 검증 (UUID 형식)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(config.databaseId)) {
    return false;
  }

  return true;
}

// Notion 설정 가이드 메시지
export function getNotionSetupGuide(): string {
  return `
Notion API 설정이 필요합니다:

1. Notion 개발자 포털에서 새로운 통합 생성:
   https://www.notion.com/my-integrations

2. 환경 변수 설정 (.env.local 파일에 추가):
   NEXT_PUBLIC_NOTION_API_KEY=secret_your_api_key_here
   NEXT_PUBLIC_NOTION_DATABASE_ID=your_database_id_here

3. Notion 데이터베이스 생성 및 권한 설정:
   - 새로운 데이터베이스 생성
   - 통합에 데이터베이스 접근 권한 부여
   - 데이터베이스 ID 복사

4. 데이터베이스 속성 설정:
   - title (제목): Title 타입
   - description (설명): Rich text 타입
   - projectType (프로젝트 유형): Select 타입
   - createdAt (생성일): Date 타입
`;
}

// Notion 설정 상태 확인
export function checkNotionSetup(): {
  isConfigured: boolean;
  message: string;
  config?: NotionConfig;
} {
  const config = getNotionConfig();
  
  if (!config) {
    return {
      isConfigured: false,
      message: 'Notion API 설정이 필요합니다.',
    };
  }

  if (!validateNotionConfig(config)) {
    return {
      isConfigured: false,
      message: 'Notion API 설정이 올바르지 않습니다.',
    };
  }

  return {
    isConfigured: true,
    message: 'Notion API 설정이 완료되었습니다.',
    config,
  };
}
