import { Controller, Post, Body, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ChatService } from './chat.service';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { ExtractRequirementsDto } from './dto/extract-requirements.dto';
import { UpdateRequirementsDto } from './dto/update-requirements.dto';
import { RecommendationsDto } from './dto/recommendations.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  async createMessage(@Body() createChatMessageDto: CreateChatMessageDto) {
    return this.chatService.createMessage(createChatMessageDto);
  }

  @Post('requirements/extract')
  async extractRequirements(@Body() extractRequirementsDto: ExtractRequirementsDto) {
    return this.chatService.extractRequirements(extractRequirementsDto);
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
    this.chatService.getRecommendations(recommendationsDto, res).catch((error) => {
      console.error('추천 요청 처리 중 오류:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message || 'Internal server error' });
      }
    });
  }
}
