// Notion OAuth 관련 유틸리티 함수

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface NotionConnection {
  connected: boolean;
  workspaceName?: string;
  connectedAt?: string;
  databaseId?: string;
  message?: string;
}

/**
 * 현재 사용자의 Notion 연결 정보 조회
 */
export async function getNotionConnection(): Promise<NotionConnection> {
  try {
    const response = await fetch(`${API_BASE_URL}/notion/connection`, {
      method: 'GET',
      credentials: 'include', // 쿠키 포함
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('인증이 필요합니다.');
      }
      throw new Error('연결 정보 조회 실패');
    }

    return await response.json();
  } catch (error) {
    console.error('Notion 연결 정보 조회 실패:', error);
    return {
      connected: false,
      message: error instanceof Error ? error.message : '연결 정보 조회 실패',
    };
  }
}

/**
 * Notion OAuth 인증 시작
 * 사용자를 Notion OAuth 인증 페이지로 리디렉션
 */
export async function startNotionOAuth(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/notion/oauth/authorize`, {
      method: 'GET',
      credentials: 'include',
      redirect: 'follow', // 리디렉션을 따라감
    });

    if (!response.ok) {
      throw new Error('OAuth 인증 시작 실패');
    }

    // 리디렉션 URL로 이동
    if (response.redirected) {
      window.location.href = response.url;
    }
  } catch (error) {
    console.error('Notion OAuth 시작 실패:', error);
    throw error;
  }
}

/**
 * Notion 연결 해제
 */
export async function disconnectNotion(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/notion/connection`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('연결 해제 실패');
    }
  } catch (error) {
    console.error('Notion 연결 해제 실패:', error);
    throw error;
  }
}

/**
 * 사용자의 Notion 액세스 토큰 조회 (백엔드에서 처리)
 * 실제로는 백엔드 API를 통해 Notion API를 호출해야 함
 */
export async function getNotionAccessToken(): Promise<string | null> {
  try {
    const connection = await getNotionConnection();
    if (!connection.connected) {
      return null;
    }

    // 백엔드에서 토큰을 사용하여 Notion API를 호출하도록 수정 필요
    // 현재는 프론트엔드에서 직접 토큰을 사용하지 않음
    return null;
  } catch (error) {
    console.error('Notion 액세스 토큰 조회 실패:', error);
    return null;
  }
}

