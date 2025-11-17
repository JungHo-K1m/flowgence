import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Body,
  Res,
  Req,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { NotionService } from './notion.service';
import { NotionOAuthCallbackDto } from './dto/notion-oauth-callback.dto';
import { ShareRequirementsDto } from './dto/share-requirements.dto';
import { ShareEstimateDto } from './dto/share-estimate.dto';
import { UpdateDatabaseIdDto } from './dto/update-database-id.dto';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';

@Controller('notion')
export class NotionController {
  constructor(private readonly notionService: NotionService) {}

  /**
   * Notion OAuth 인증 시작
   * OAuth URL을 반환 (프론트엔드에서 직접 리디렉션)
   */
  @Get('oauth/authorize')
  @UseGuards(SupabaseAuthGuard)
  async authorize(@Req() req: Request) {
    try {
      const userId = (req as any).user?.id; // 인증 미들웨어에서 주입된 사용자 ID
      
      if (!userId) {
        throw new HttpException('인증이 필요합니다.', HttpStatus.UNAUTHORIZED);
      }

      const redirectUrl = await this.notionService.getAuthorizationUrl(userId);
      return {
        success: true,
        redirectUrl,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'OAuth 인증 시작 실패',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Notion OAuth 콜백 처리
   * 인증 코드를 액세스 토큰으로 교환하고 저장
   */
  @Get('oauth/callback')
  async callback(
    @Query() query: NotionOAuthCallbackDto,
    @Res() res: Response,
  ) {
    try {
      const { code, state } = query;

      if (!code) {
        throw new HttpException('인증 코드가 없습니다.', HttpStatus.BAD_REQUEST);
      }

      // state에서 userId 추출 (보안을 위해 암호화된 state 사용 권장)
      const userId = state ? await this.notionService.extractUserIdFromState(state) : null;

      if (!userId) {
        throw new HttpException('유효하지 않은 요청입니다.', HttpStatus.BAD_REQUEST);
      }

      // 액세스 토큰 교환 및 저장
      const connection = await this.notionService.exchangeCodeForToken(code, userId);

      // 프론트엔드로 리디렉션 (성공 페이지)
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/mypage/settings?notion_connected=true`);
    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/mypage/settings?notion_error=${encodeURIComponent(error.message)}`);
    }
  }

  /**
   * 현재 사용자의 Notion 연결 정보 조회
   */
  @Get('connection')
  @UseGuards(SupabaseAuthGuard)
  async getConnection(@Req() req: Request) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new HttpException('인증이 필요합니다.', HttpStatus.UNAUTHORIZED);
      }

      const connection = await this.notionService.getConnectionByUserId(userId);
      
      if (!connection) {
        return {
          connected: false,
          message: 'Notion 계정이 연결되지 않았습니다.',
        };
      }

      return {
        connected: true,
        workspaceName: connection.workspaceName,
        connectedAt: connection.connectedAt,
        databaseId: connection.databaseId,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '연결 정보 조회 실패',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 데이터베이스 ID 업데이트
   */
  @Post('connection/database')
  @UseGuards(SupabaseAuthGuard)
  async updateDatabaseId(@Body() dto: UpdateDatabaseIdDto, @Req() req: Request) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new HttpException('인증이 필요합니다.', HttpStatus.UNAUTHORIZED);
      }

      const connection = await this.notionService.getConnectionByUserId(userId);
      
      if (!connection) {
        throw new HttpException('Notion 계정이 연결되지 않았습니다.', HttpStatus.BAD_REQUEST);
      }

      connection.databaseId = dto.databaseId || null;
      await this.notionService.updateConnection(connection);

      return {
        success: true,
        message: '데이터베이스 ID가 업데이트되었습니다.',
        databaseId: connection.databaseId,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || '데이터베이스 ID 업데이트 실패',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Notion 연결 해제
   */
  @Delete('connection')
  @UseGuards(SupabaseAuthGuard)
  async disconnect(@Req() req: Request) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new HttpException('인증이 필요합니다.', HttpStatus.UNAUTHORIZED);
      }

      await this.notionService.deleteConnection(userId);

      return {
        success: true,
        message: 'Notion 연결이 해제되었습니다.',
      };
    } catch (error) {
      throw new HttpException(
        error.message || '연결 해제 실패',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 요구사항을 Notion에 공유
   */
  @Post('share/requirements')
  @UseGuards(SupabaseAuthGuard)
  async shareRequirements(@Body() dto: ShareRequirementsDto, @Req() req: Request) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new HttpException('인증이 필요합니다.', HttpStatus.UNAUTHORIZED);
      }

      const pageUrl = await this.notionService.shareToNotion(
        userId,
        dto.title,
        dto.markdown,
        dto.description,
        dto.projectType,
        dto.databaseId,
      );

      return {
        success: true,
        pageUrl,
        message: 'Notion에 성공적으로 공유되었습니다.',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Notion 공유 실패',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 견적서를 Notion에 공유
   */
  @Post('share/estimate')
  @UseGuards(SupabaseAuthGuard)
  async shareEstimate(@Body() dto: ShareEstimateDto, @Req() req: Request) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new HttpException('인증이 필요합니다.', HttpStatus.UNAUTHORIZED);
      }

      const pageUrl = await this.notionService.shareToNotion(
        userId,
        dto.title,
        dto.markdown,
        dto.description,
        dto.projectType,
        dto.databaseId,
      );

      return {
        success: true,
        pageUrl,
        message: 'Notion에 성공적으로 공유되었습니다.',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Notion 공유 실패',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

