import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { ExtractRequirementsDto } from './dto/extract-requirements.dto';
import { UpdateRequirementsDto } from './dto/update-requirements.dto';

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
}
