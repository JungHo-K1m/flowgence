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
      `${this.configService.get<string>('BACKEND_URL') || 'http://localhost:3001'}/notion/oauth/callback`;

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
   * state 암호화 (간단한 예시, 실제로는 더 강력한 암호화 사용 권장)
   */
  private encryptState(userId: string): string {
    const secret = this.configService.get<string>('NOTION_OAUTH_STATE_SECRET') || 'default-secret';
    const cipher = crypto.createCipher('aes-256-cbc', secret);
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
      const decipher = crypto.createDecipher('aes-256-cbc', secret);
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
    const targetDatabaseId = databaseId || connection?.databaseId;

    if (!targetDatabaseId) {
      throw new HttpException('Notion 데이터베이스 ID가 설정되지 않았습니다.', HttpStatus.BAD_REQUEST);
    }

    // 마크다운을 블록으로 변환
    const blocks = this.convertMarkdownToBlocks(markdown);

    // 페이지 생성
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
        children: blocks,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new HttpException(
        `Notion API 오류: ${response.status} - ${JSON.stringify(errorData)}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const page = await response.json();
    return `https://notion.so/${page.id.replace(/-/g, '')}`;
  }
}

