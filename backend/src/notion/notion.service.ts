import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotionConnection } from '../entities/notion-connection.entity';
import * as crypto from 'crypto';

@Injectable()
export class NotionService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly notionApiUrl = 'https://api.notion.com/v1';

  constructor(
    @InjectRepository(NotionConnection)
    private readonly notionConnectionRepository: Repository<NotionConnection>,
    private readonly configService: ConfigService,
  ) {
    this.clientId = this.configService.get<string>('NOTION_CLIENT_ID') || '';
    this.clientSecret = this.configService.get<string>('NOTION_CLIENT_SECRET') || '';
    this.redirectUri = this.configService.get<string>('NOTION_REDIRECT_URI') || 
      `${this.configService.get<string>('BACKEND_URL') || 'http://localhost:3001'}/api/notion/oauth/callback`;

    if (!this.clientId || !this.clientSecret) {
      console.warn('Notion OAuth 설정이 완료되지 않았습니다. NOTION_CLIENT_ID와 NOTION_CLIENT_SECRET을 설정해주세요.');
    }
  }

  /**
   * OAuth 인증 URL 생성
   */
  async getAuthorizationUrl(userId: string): Promise<string> {
    if (!this.clientId) {
      throw new HttpException('Notion OAuth가 설정되지 않았습니다.', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // state에 userId를 포함 (보안을 위해 암호화 권장)
    const state = this.encryptState(userId);
    
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      owner: 'user',
      state: state,
    });

    return `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;
  }

  /**
   * 인증 코드를 액세스 토큰으로 교환
   */
  async exchangeCodeForToken(code: string, userId: string): Promise<NotionConnection> {
    if (!this.clientSecret) {
      throw new HttpException('Notion OAuth가 설정되지 않았습니다.', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    try {
      // Notion API에 토큰 요청
      const response = await fetch('https://api.notion.com/v1/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: this.redirectUri,
        }),
        // Basic Auth: client_id:client_secret을 base64 인코딩
      });

      // Basic Auth 헤더 추가
      const authHeader = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      const authResponse = await fetch('https://api.notion.com/v1/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${authHeader}`,
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: this.redirectUri,
        }),
      });

      if (!authResponse.ok) {
        const errorData = await authResponse.json();
        throw new HttpException(
          errorData.error_description || '토큰 교환 실패',
          HttpStatus.BAD_REQUEST,
        );
      }

      const tokenData = await authResponse.json();

      // 기존 연결이 있으면 업데이트, 없으면 생성
      let connection = await this.notionConnectionRepository.findOne({
        where: { userId },
      });

      if (connection) {
        connection.accessToken = tokenData.access_token;
        connection.workspaceId = tokenData.workspace_id;
        connection.workspaceName = tokenData.workspace_name;
        connection.botId = tokenData.bot_id;
        connection.connectedAt = new Date();
        // Notion OAuth 토큰은 만료 시간이 없을 수 있음
        connection.expiresAt = tokenData.expires_at ? new Date(tokenData.expires_at) : null;
      } else {
        connection = this.notionConnectionRepository.create({
          userId,
          accessToken: tokenData.access_token,
          workspaceId: tokenData.workspace_id,
          workspaceName: tokenData.workspace_name,
          botId: tokenData.bot_id,
          connectedAt: new Date(),
          expiresAt: tokenData.expires_at ? new Date(tokenData.expires_at) : null,
        });
      }

      return await this.notionConnectionRepository.save(connection);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || '토큰 교환 실패',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 사용자 ID로 연결 정보 조회
   */
  async getConnectionByUserId(userId: string): Promise<NotionConnection | null> {
    return await this.notionConnectionRepository.findOne({
      where: { userId },
    });
  }

  /**
   * 사용자의 액세스 토큰 조회
   */
  async getAccessToken(userId: string): Promise<string | null> {
    const connection = await this.getConnectionByUserId(userId);
    
    if (!connection) {
      return null;
    }

    // 토큰 만료 확인
    if (connection.expiresAt && connection.expiresAt < new Date()) {
      // 토큰이 만료되었으면 연결 해제 또는 갱신 필요
      console.warn(`Notion 토큰이 만료되었습니다. userId: ${userId}`);
      return null;
    }

    return connection.accessToken;
  }

  /**
   * 연결 해제
   */
  async deleteConnection(userId: string): Promise<void> {
    await this.notionConnectionRepository.delete({ userId });
  }

  /**
   * 연결 정보 업데이트
   */
  async updateConnection(connection: NotionConnection): Promise<NotionConnection> {
    return await this.notionConnectionRepository.save(connection);
  }

  /**
   * 데이터베이스 ID 정제 (URL에서 UUID만 추출)
   * Notion URL 형식: https://notion.so/workspace/2ae5e4a9-cdbe-8092-91a9-fb7b396dc631?v=...
   * 또는: 2ae5e4a9cdbe809291a9fb7b396dc631?v=...
   */
  sanitizeDatabaseId(input: string): string | null {
    if (!input) {
      return null;
    }

    // 쿼리 파라미터 제거
    const withoutQuery = input.split('?')[0].split('#')[0].trim();

    // UUID 패턴 매칭 (하이픈 포함 또는 없음)
    // 형식: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36자) 또는 xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (32자)
    const uuidPattern = /([0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12})/i;
    const match = withoutQuery.match(uuidPattern);

    if (!match) {
      return null;
    }

    let uuid = match[1];

    // 하이픈 제거 후 다시 추가 (Notion API는 하이픈 포함 UUID를 요구)
    uuid = uuid.replace(/-/g, '');
    if (uuid.length !== 32) {
      return null;
    }

    // 하이픈 포함 형식으로 변환: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    return `${uuid.slice(0, 8)}-${uuid.slice(8, 12)}-${uuid.slice(12, 16)}-${uuid.slice(16, 20)}-${uuid.slice(20, 32)}`;
  }

  /**
   * state 암호화 (간단한 예시, 실제로는 더 강력한 암호화 사용 권장)
   */
  private encryptState(userId: string): string {
    const secret = this.configService.get<string>('NOTION_OAUTH_STATE_SECRET') || 'default-secret';
    // secret을 32바이트 키로 변환 (간단한 해시 사용)
    const key = crypto.createHash('sha256').update(secret).digest();
    // 고정 IV 사용 (실제로는 랜덤 IV를 사용하고 함께 저장해야 함)
    const iv = Buffer.alloc(16, 0); // 16바이트 0으로 채운 IV
    
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(userId, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * state 복호화
   */
  async extractUserIdFromState(state: string): Promise<string | null> {
    try {
      const secret = this.configService.get<string>('NOTION_OAUTH_STATE_SECRET') || 'default-secret';
      // secret을 32바이트 키로 변환 (간단한 해시 사용)
      const key = crypto.createHash('sha256').update(secret).digest();
      // 고정 IV 사용 (암호화 시 사용한 것과 동일)
      const iv = Buffer.alloc(16, 0); // 16바이트 0으로 채운 IV
      
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(state, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('State 복호화 실패:', error);
      return null;
    }
  }

  /**
   * 마크다운을 Notion 블록으로 변환 (간단한 버전)
   */
  private convertMarkdownToBlocks(markdown: string): any[] {
    const lines = markdown.split('\n');
    const blocks: any[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('# ')) {
        blocks.push({
          type: 'heading_1',
          heading_1: { rich_text: [{ text: { content: trimmed.substring(2) } }] },
        });
      } else if (trimmed.startsWith('## ')) {
        blocks.push({
          type: 'heading_2',
          heading_2: { rich_text: [{ text: { content: trimmed.substring(3) } }] },
        });
      } else if (trimmed.startsWith('### ')) {
        blocks.push({
          type: 'heading_3',
          heading_3: { rich_text: [{ text: { content: trimmed.substring(4) } }] },
        });
      } else if (trimmed.startsWith('- ')) {
        blocks.push({
          type: 'bulleted_list_item',
          bulleted_list_item: { rich_text: [{ text: { content: trimmed.substring(2) } }] },
        });
      } else {
        blocks.push({
          type: 'paragraph',
          paragraph: { rich_text: [{ text: { content: trimmed } }] },
        });
      }
    }

    return blocks;
  }

  /**
   * Notion에 페이지 생성 및 공유
   */
  async shareToNotion(
    userId: string,
    title: string,
    markdown: string,
    description?: string,
    projectType?: string,
    databaseId?: string,
  ): Promise<string> {
    const accessToken = await this.getAccessToken(userId);
    if (!accessToken) {
      throw new HttpException('Notion 계정이 연결되지 않았습니다.', HttpStatus.UNAUTHORIZED);
    }

    // 연결 정보에서 데이터베이스 ID 가져오기 (없으면 기본값 사용)
    const connection = await this.getConnectionByUserId(userId);
    const rawDatabaseId = databaseId || connection?.databaseId;

    if (!rawDatabaseId) {
      throw new HttpException(
        'Notion 데이터베이스 ID가 설정되지 않았습니다. 설정 페이지에서 데이터베이스를 생성하고 ID를 입력해주세요.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 데이터베이스 ID 정제 (URL에서 UUID만 추출)
    const targetDatabaseId = this.sanitizeDatabaseId(rawDatabaseId);
    
    if (!targetDatabaseId) {
      throw new HttpException(
        '데이터베이스 ID 형식이 올바르지 않습니다. UUID 형식(예: 2ae5e4a9-cdbe-8092-91a9-fb7b396dc631)을 확인해주세요.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 마크다운을 블록으로 변환
    const blocks = this.convertMarkdownToBlocks(markdown);

    // Notion API 제한: 한 번에 최대 100개 블록만 전송 가능
    const MAX_BLOCKS_PER_REQUEST = 100;
    const initialBlocks = blocks.slice(0, MAX_BLOCKS_PER_REQUEST);
    const remainingBlocks = blocks.slice(MAX_BLOCKS_PER_REQUEST);

    // 페이지 생성 (첫 100개 블록 포함)
    const response = await fetch(`${this.notionApiUrl}/pages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { database_id: targetDatabaseId },
        properties: {
          title: {
            title: [{ text: { content: title } }],
          },
          ...(description && {
            description: {
              rich_text: [{ text: { content: description } }],
            },
          }),
          ...(projectType && {
            projectType: {
              select: { name: projectType },
            },
          }),
          createdAt: {
            date: { start: new Date().toISOString().split('T')[0] },
          },
        },
        children: initialBlocks,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // 404 에러인 경우 더 명확한 메시지 제공
      if (response.status === 404) {
        const errorMessage = errorData.message || '데이터베이스를 찾을 수 없습니다.';
        throw new HttpException(
          `데이터베이스를 찾을 수 없습니다. 데이터베이스 ID가 올바른지 확인하고, Notion에서 데이터베이스를 통합(Flowgence)과 공유했는지 확인해주세요. (${errorMessage})`,
          HttpStatus.NOT_FOUND,
        );
      }
      
      throw new HttpException(
        `Notion API 오류: ${response.status} - ${JSON.stringify(errorData)}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const page = await response.json();
    const pageId = page.id;

    // 나머지 블록들을 청크로 나누어 추가
    if (remainingBlocks.length > 0) {
      for (let i = 0; i < remainingBlocks.length; i += MAX_BLOCKS_PER_REQUEST) {
        const chunk = remainingBlocks.slice(i, i + MAX_BLOCKS_PER_REQUEST);
        
        const appendResponse = await fetch(`${this.notionApiUrl}/blocks/${pageId}/children`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28',
          },
          body: JSON.stringify({
            children: chunk,
          }),
        });

        if (!appendResponse.ok) {
          const errorData = await appendResponse.json().catch(() => ({}));
          // 페이지는 이미 생성되었으므로 경고만 로그하고 계속 진행
          console.warn(
            `Notion 블록 추가 실패 (청크 ${i / MAX_BLOCKS_PER_REQUEST + 1}): ${appendResponse.status} - ${JSON.stringify(errorData)}`,
          );
        }
      }
    }

    return `https://notion.so/${pageId.replace(/-/g, '')}`;
  }
}

