import { Controller, Post, Body, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ChatService } from './chat.service';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { ExtractRequirementsDto } from './dto/extract-requirements.dto';
import { UpdateRequirementsDto } from './dto/update-requirements.dto';
import { RecommendationsDto } from './dto/recommendations.dto';
import { VerifyRequirementsDto } from './dto/verify-requirements.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  async createMessage(@Body() createChatMessageDto: CreateChatMessageDto) {
    try {
      return await this.chatService.createMessage(createChatMessageDto);
    } catch (error: any) {
      // 529 (Overloaded) 에러 처리
      if (error.status === 529 || error.type === 'overloaded_error' || 
          (error instanceof Error && (error.message.includes('529') || error.message.includes('overloaded')))) {
        throw {
          statusCode: 503,
          message: '현재 사용량이 많아 서비스가 일시적으로 지연되고 있습니다. 잠시 후 다시 시도해주세요.',
          error: 'Service Temporarily Unavailable',
          type: 'overloaded_error'
        };
      }
      throw error;
    }
  }

  @Post('requirements/extract')
  async extractRequirements(@Body() extractRequirementsDto: ExtractRequirementsDto) {
    try {
      return await this.chatService.extractRequirements(extractRequirementsDto);
    } catch (error: any) {
      // 529 (Overloaded) 에러 처리
      if (error.status === 529 || error.type === 'overloaded_error' || 
          (error instanceof Error && (error.message.includes('529') || error.message.includes('overloaded')))) {
        throw {
          statusCode: 503,
          message: '현재 사용량이 많아 서비스가 일시적으로 지연되고 있습니다. 잠시 후 다시 시도해주세요.',
          error: 'Service Temporarily Unavailable',
          type: 'overloaded_error'
        };
      }
      throw error;
    }
  }

  @Post('requirements/update')
  async updateRequirements(@Body() updateRequirementsDto: UpdateRequirementsDto) {
    return this.chatService.updateRequirements(updateRequirementsDto);
  }

  @Get('messages/:projectId')
  async getMessages(@Param('projectId') projectId: string) {
    return this.chatService.getMessagesByProject(projectId);
  }

  @Post('requirements/recommendations')
  getRecommendations(
    @Body() recommendationsDto: RecommendationsDto,
    @Res() res: Response,
  ) {
    // @Res() 데코레이터를 사용할 때는 return하지 않음 (응답을 직접 처리)
    this.chatService.getRecommendations(recommendationsDto, res).catch((error: any) => {
      console.error('추천 요청 처리 중 오류:', error);
      if (!res.headersSent) {
        // 529 (Overloaded) 에러 처리
        if (error.status === 529 || error.type === 'overloaded_error' || 
            (error instanceof Error && (error.message.includes('529') || error.message.includes('overloaded')))) {
          res.status(503).json({ 
            error: '현재 사용량이 많아 서비스가 일시적으로 지연되고 있습니다. 잠시 후 다시 시도해주세요.',
            type: 'overloaded_error'
          });
        } else {
          res.status(500).json({ error: error.message || 'Internal server error' });
        }
      }
    });
  }

  @Post('requirements/verify')
  async verifyRequirements(@Body() verifyRequirementsDto: VerifyRequirementsDto) {
    try {
      return await this.chatService.verifyRequirements(verifyRequirementsDto);
    } catch (error: any) {
      console.error('요구사항 검증 중 오류:', error);
      // 529 (Overloaded) 에러 처리
      if (error.status === 529 || error.type === 'overloaded_error' || 
          (error instanceof Error && (error.message.includes('529') || error.message.includes('overloaded')))) {
        throw {
          statusCode: 503,
          message: '현재 사용량이 많아 서비스가 일시적으로 지연되고 있습니다. 잠시 후 다시 시도해주세요.',
          error: 'Service Temporarily Unavailable',
          type: 'overloaded_error'
        };
      }
      throw error;
    }
  }
}
