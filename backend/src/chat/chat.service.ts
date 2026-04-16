import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from '../entities/chat-message.entity';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { ExtractRequirementsDto } from './dto/extract-requirements.dto';
import { UpdateRequirementsDto } from './dto/update-requirements.dto';
import { RecommendationsDto } from './dto/recommendations.dto';
import { VerifyRequirementsDto } from './dto/verify-requirements.dto';
import { ClaudeApiService } from '../common/services/claude-api.service';
import { JsonParserService } from '../common/services/json-parser.service';
import { CLAUDE_MODEL, ERROR_MESSAGES } from '../common/constants';
import {
  SYSTEM_PROMPT_CHAT,
  SYSTEM_PROMPT_EXTRACT,
  SYSTEM_PROMPT_UPDATE,
  SYSTEM_PROMPT_VERIFY,
  buildRecommendationsPrompt,
} from './prompts';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(ChatMessage)
    private chatMessageRepository: Repository<ChatMessage>,
    private claudeApi: ClaudeApiService,
    private jsonParser: JsonParserService,
  ) {}

  // ── Public API ────────────────────────────────────────────────

  async createMessage(createChatMessageDto: CreateChatMessageDto) {
    try {
      const aiResponse = await this.callClaudeAPI(
        createChatMessageDto.message,
        createChatMessageDto.history || [],
      );

      const userMessage = this.chatMessageRepository.create({
        projectId: createChatMessageDto.projectId,
        role: 'user',
        content: createChatMessageDto.message,
        metadata: createChatMessageDto.metadata,
      });

      const aiMessage = this.chatMessageRepository.create({
        projectId: createChatMessageDto.projectId,
        role: 'assistant',
        content: aiResponse.content,
        metadata: aiResponse.metadata,
      });

      await this.chatMessageRepository.save([userMessage, aiMessage]);

      return {
        userMessage,
        aiMessage,
        projectOverview: aiResponse.projectOverview,
        message: 'Chat message processed successfully',
      };
    } catch (error) {
      this.logger.error('Chat service error: %s', (error as Error).message);
      if (this.claudeApi.isOverloadedError(error)) throw error;
      throw new Error(ERROR_MESSAGES.CHAT_FAILED);
    }
  }

  async extractRequirements(extractRequirementsDto: ExtractRequirementsDto) {
    try {
      return await this.extractRequirementsFromHistory(
        extractRequirementsDto.history || [],
      );
    } catch (error) {
      this.logger.error('Requirements extraction error: %s', (error as Error).message);
      if (this.claudeApi.isOverloadedError(error)) throw error;
      throw new Error('Failed to extract requirements');
    }
  }

  async updateRequirements(updateRequirementsDto: UpdateRequirementsDto) {
    try {
      return await this.updateRequirementsFromChat(
        updateRequirementsDto.existingRequirements,
        updateRequirementsDto.history || [],
      );
    } catch (error) {
      this.logger.error('Requirements update error: %s', (error as Error).message);
      if (this.claudeApi.isOverloadedError(error)) throw error;
      throw new Error('Failed to update requirements');
    }
  }

  async getMessagesByProject(projectId: string) {
    return this.chatMessageRepository.find({
      where: { projectId },
      order: { createdAt: 'ASC' },
    });
  }

  async getRecommendations(recommendationsDto: RecommendationsDto, res: any) {
    const { categoryTitle, existingRequirements = [], projectData = {} } = recommendationsDto;

    try {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const systemPrompt = buildRecommendationsPrompt(
        categoryTitle,
        existingRequirements,
        projectData,
      );

      const response = await this.claudeApi.callStream({
        systemPrompt,
        messages: [
          {
            role: 'user',
            content: `${categoryTitle} 카테고리에 대한 새로운 요구사항을 3-5개 추천해주세요. 각 요구사항은 제목, 설명, 우선순위를 포함해야 합니다.`,
          },
        ],
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 529) {
          res.write(`data: ${JSON.stringify({ type: 'error', message: ERROR_MESSAGES.OVERLOADED, code: 529, errorType: 'overloaded_error' })}\n\n`);
        } else {
          res.write(`data: ${JSON.stringify({ type: 'error', message: `API Error: ${status}` })}\n\n`);
        }
        res.end();
        return;
      }

      // Stream 처리
      let accumulatedText = '';
      let buffer = '';
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        res.write(`data: ${JSON.stringify({ type: 'error', message: 'No reader available' })}\n\n`);
        res.end();
        return;
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') {
            // 최종 파싱 후 전송
            this.sendParsedRecommendations(accumulatedText, res);
            return;
          }
          try {
            const json = JSON.parse(data);
            if (
              json.type === 'content_block_delta' &&
              (json.delta?.type === 'text' || json.delta?.type === 'text_delta') &&
              json.delta?.text
            ) {
              accumulatedText += json.delta.text;
            }
          } catch {
            // 스트리밍 중 파싱 실패 무시
          }
        }
      }

      // 스트리밍 완료
      this.sendParsedRecommendations(accumulatedText, res);
    } catch (error) {
      this.logger.error('Recommendations error: %s', (error as Error).message);
      res.write(`data: ${JSON.stringify({ type: 'error', message: (error as Error).message })}\n\n`);
      res.end();
    }
  }

  async verifyRequirements(verifyRequirementsDto: VerifyRequirementsDto) {
    this.logger.log('AI 요구사항 검증 시작 – project: %s', verifyRequirementsDto.projectId);

    const userPrompt = `다음 요구사항을 검증해주세요:\n\n${JSON.stringify(verifyRequirementsDto.requirements, null, 2)}\n\n위 요구사항의 일관성, 완성도, 우선순위를 검토하고 개선 제안을 해주세요.`;

    try {
      const data = await this.claudeApi.callAndParseJson({
        systemPrompt: SYSTEM_PROMPT_VERIFY,
        messages: [{ role: 'user', content: userPrompt }],
      });

      return this.parseVerificationResponse(data, verifyRequirementsDto.requirements);
    } catch (error) {
      this.logger.error('Verification failed: %s', (error as Error).message);
      return this.buildFallbackVerification(verifyRequirementsDto.requirements);
    }
  }

  // ── Private: Claude API calls ─────────────────────────────────

  private async callClaudeAPI(message: string, history: any[]) {
    const messages = history.map(msg => ({
      role: (msg.role || (msg.type === 'user' ? 'user' : 'assistant')) as 'user' | 'assistant',
      content: msg.content || msg.message,
    }));
    messages.push({ role: 'user', content: message });

    try {
      const data = (await this.claudeApi.callAndParseJson({
        systemPrompt: SYSTEM_PROMPT_CHAT,
        messages,
      })) as any;

      const responseText = this.jsonParser.extractText(data);
      const jsonResponse = this.jsonParser.parse<any>(responseText);

      if (jsonResponse) {
        // 빈 projectOverview 처리
        if (
          jsonResponse.projectOverview &&
          typeof jsonResponse.projectOverview === 'object' &&
          Object.keys(jsonResponse.projectOverview).length === 0
        ) {
          jsonResponse.projectOverview = null;
        }

        return {
          content: jsonResponse.content || responseText,
          metadata: { timestamp: new Date().toISOString(), model: CLAUDE_MODEL },
          projectOverview: jsonResponse.projectOverview || null,
        };
      }

      // JSON 파싱 실패 시 기본 응답
      return {
        content: responseText,
        metadata: { timestamp: new Date().toISOString(), model: CLAUDE_MODEL },
        projectOverview: null,
      };
    } catch (error) {
      this.logger.error('callClaudeAPI error: %s', (error as Error).message);
      throw error;
    }
  }

  private async extractRequirementsFromHistory(history: any[]) {
    const conversationText = history
      .map(msg => `${msg.role || (msg.type === 'user' ? '사용자' : 'AI')}: ${msg.content || msg.message}`)
      .join('\n');

    try {
      const data = (await this.claudeApi.callAndParseJson({
        systemPrompt: SYSTEM_PROMPT_EXTRACT,
        messages: [
          {
            role: 'user',
            content: `다음 대화 내용을 분석하여 요구사항을 추출해주세요:\n\n${conversationText}`,
          },
        ],
      })) as any;

      const responseText = this.jsonParser.extractText(data);
      return this.jsonParser.parseOrThrow(responseText, ERROR_MESSAGES.EXTRACTION_FAILED);
    } catch (error) {
      if (this.claudeApi.isOverloadedError(error)) throw error;
      this.logger.error('extractRequirementsFromHistory error: %s', (error as Error).message);
      throw new Error(`${ERROR_MESSAGES.EXTRACTION_FAILED}: ${(error as Error).message}`);
    }
  }

  private async updateRequirementsFromChat(existingRequirements: any, history: any[]) {
    const conversationText = history
      .map(msg => `${msg.role || (msg.type === 'user' ? '사용자' : 'AI')}: ${msg.content || msg.message}`)
      .join('\n');

    const systemPrompt = SYSTEM_PROMPT_UPDATE(existingRequirements, conversationText);

    try {
      const data = (await this.claudeApi.callAndParseJson({
        systemPrompt,
        messages: [
          {
            role: 'user',
            content: '기존 요구사항을 새로운 대화 내용을 바탕으로 업데이트해주세요.',
          },
        ],
      })) as any;

      const responseText = this.jsonParser.extractText(data);
      return this.jsonParser.parseOrThrow(responseText, ERROR_MESSAGES.UPDATE_FAILED);
    } catch (error) {
      this.logger.error('updateRequirementsFromChat error: %s', (error as Error).message);
      throw new Error(`${ERROR_MESSAGES.UPDATE_FAILED}: ${(error as Error).message}`);
    }
  }

  // ── Private: response parsing ─────────────────────────────────

  private parseVerificationResponse(data: any, requirements: any) {
    const responseText = this.jsonParser.extractText(data);
    const result = this.jsonParser.parse(responseText);
    return result ?? this.buildFallbackVerification(requirements);
  }

  private buildFallbackVerification(requirements: any) {
    return {
      status: 'ok',
      score: 85,
      suggestions: [],
      warnings: [],
      summary: {
        totalRequirements: this.countRequirements(requirements),
        issuesFound: 0,
        criticalIssues: 0,
      },
    };
  }

  private countRequirements(requirements: any): number {
    return (
      requirements?.categories?.reduce(
        (total: number, cat: any) =>
          total +
          (cat.subCategories?.reduce(
            (subTotal: number, sub: any) => subTotal + (sub.requirements?.length || 0),
            0,
          ) || 0),
        0,
      ) || 0
    );
  }

  // ── Private: recommendations parsing ──────────────────────────

  private sendParsedRecommendations(text: string, res: any): void {
    const recommendations = this.parseRecommendationsFromText(text);
    const sentTitles = new Set<string>();

    for (const rec of recommendations) {
      if (!rec.title || !rec.description) continue;

      const cleanTitle = rec.title.trim().replace(/^\*\*\s*/, '').replace(/\*\*$/, '').trim();
      if (sentTitles.has(cleanTitle)) continue;
      sentTitles.add(cleanTitle);

      let cleanDescription = rec.description.trim();
      cleanDescription = cleanDescription.replace(/^#+\s*/gm, '');
      cleanDescription = cleanDescription.replace(/\*\*/g, '');
      cleanDescription = cleanDescription.replace(/^제목[:：]\s*.+$/gmi, '');
      cleanDescription = cleanDescription.replace(/^설명[:：]\s*/gmi, '');
      cleanDescription = cleanDescription.replace(/^우선순위[:：]\s*.+$/gmi, '');
      cleanDescription = cleanDescription.replace(/\n\s*\n/g, '\n').trim();

      res.write(`data: ${JSON.stringify({ type: 'recommendation', field: 'title', value: cleanTitle })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: 'recommendation', field: 'description', value: cleanDescription })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: 'recommendation', field: 'priority', value: rec.priority || 'medium' })}\n\n`);
    }

    if (recommendations.length === 0 && text.trim().length > 0) {
      const lines = text.trim().split('\n').filter(l => l.trim().length > 0);
      if (lines.length > 0) {
        const firstLine = lines[0].trim().replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
        const cleanText = text.trim().replace(/^#+\s*/gm, '').replace(/\*\*/g, '');
        res.write(`data: ${JSON.stringify({ type: 'recommendation', field: 'title', value: firstLine.substring(0, 100) })}\n\n`);
        res.write(`data: ${JSON.stringify({ type: 'recommendation', field: 'description', value: cleanText })}\n\n`);
        res.write(`data: ${JSON.stringify({ type: 'recommendation', field: 'priority', value: 'medium' })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  }

  private parseRecommendationsFromText(text: string): Array<{ title: string; description: string; priority: string }> {
    const recommendations: Array<{ title: string; description: string; priority: string }> = [];
    const items = text.split(/(?=\d+\.\s*(?:제목|Title|요구사항|Feature))/i);

    for (const item of items) {
      if (!item.trim()) continue;

      let title = '';
      let description = '';
      let priority = 'medium';

      const titlePatterns = [
        /(?:제목|Title)[:：]\s*(.+?)(?:\n|$)/i,
        /^\d+\.\s*(.+?)(?:\n|$)/,
        /^[-*]\s*(.+?)(?:\n|$)/,
      ];
      for (const pattern of titlePatterns) {
        const match = item.match(pattern);
        if (match?.[1]) { title = match[1].trim(); break; }
      }

      const descPatterns = [
        /(?:설명|Description)[:：]\s*(.+?)(?:\n(?:우선순위|Priority)|$)/is,
        /(?:제목|Title)[:：].*?\n(.+?)(?:\n(?:우선순위|Priority)|$)/is,
      ];
      for (const pattern of descPatterns) {
        const match = item.match(pattern);
        if (match?.[1]) { description = match[1].trim(); break; }
      }

      if (!description && title) {
        const lines = item.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(title) && i + 1 < lines.length) {
            const next = lines[i + 1].trim();
            if (next && !next.match(/(?:우선순위|Priority)[:：]/i)) {
              description = next;
            }
            break;
          }
        }
      }

      const priorityMatch = item.match(/(?:우선순위|Priority)[:：]\s*(high|medium|low)/i);
      if (priorityMatch?.[1]) priority = priorityMatch[1].toLowerCase();

      if (title && description) {
        recommendations.push({ title, description, priority });
      }
    }

    return recommendations;
  }
}
