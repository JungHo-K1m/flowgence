import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from '../entities/chat-message.entity';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { ExtractRequirementsDto } from './dto/extract-requirements.dto';
import { UpdateRequirementsDto } from './dto/update-requirements.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private chatMessageRepository: Repository<ChatMessage>,
    private configService: ConfigService,
  ) {}

  async createMessage(createChatMessageDto: CreateChatMessageDto) {
    try {
      // Claude API 호출
      const aiResponse = await this.callClaudeAPI(createChatMessageDto.message, createChatMessageDto.history || []);
      
      // 메시지 저장
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
      console.error('Chat service error:', error);
      throw new Error('Failed to process chat message');
    }
  }

  async extractRequirements(extractRequirementsDto: ExtractRequirementsDto) {
    try {
      const requirements = await this.extractRequirementsFromHistory(extractRequirementsDto.history || []);
      return requirements;
    } catch (error) {
      console.error('Requirements extraction error:', error);
      throw new Error('Failed to extract requirements');
    }
  }

  private parseRequirementsResponse(data: any) {
    if (!data.content || !data.content[0] || !data.content[0].text) {
      throw new Error('Invalid response format from Claude API');
    }

    const responseText = data.content[0].text;
    
    console.log('=== 요구사항 추출 API 응답 디버깅 ===');
    console.log('응답 텍스트:', responseText.substring(0, 300) + '...');
    console.log('응답 길이:', responseText.length);
    
    // 마크다운 코드 블록에서 JSON 추출
    let jsonText = responseText;
    
    // ```json ... ``` 형태의 코드 블록에서 JSON 추출
    const jsonBlockMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      jsonText = jsonBlockMatch[1];
      console.log('코드 블록에서 JSON 추출 성공:', jsonText.substring(0, 200) + '...');
    } else {
      console.log('코드 블록 없음, 원본 텍스트 사용');
    }
    
    // JSON 응답 파싱
    try {
      const result = JSON.parse(jsonText);
      console.log('요구사항 추출 JSON 파싱 성공');
      return result;
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError);
      console.error('추출된 JSON 텍스트:', jsonText.substring(0, 500));
      console.error('원본 응답 텍스트:', responseText.substring(0, 500));
      throw new Error('요구사항 추출 응답 파싱 실패');
    }
  }

  async updateRequirements(updateRequirementsDto: UpdateRequirementsDto) {
    try {
      const updatedRequirements = await this.updateRequirementsFromChat(
        updateRequirementsDto.existingRequirements,
        updateRequirementsDto.history || []
      );
      return updatedRequirements;
    } catch (error) {
      console.error('Requirements update error:', error);
      throw new Error('Failed to update requirements');
    }
  }

  async getMessagesByProject(projectId: string) {
    return this.chatMessageRepository.find({
      where: { projectId },
      order: { createdAt: 'ASC' },
    });
  }

  private async callClaudeAPI(message: string, history: any[]) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    // 대화 히스토리를 Claude API 형식으로 변환
    const messages = history.map(msg => ({
      role: msg.role || (msg.type === 'user' ? 'user' : 'assistant'),
      content: msg.content || msg.message
    }));

    // 현재 메시지 추가
    messages.push({
      role: 'user',
      content: message
    });

    const systemPrompt = `당신은 SI 프로젝트 요구사항 분석 전문가입니다. 
사용자와의 대화를 통해 프로젝트 개요를 실시간으로 업데이트하고, 
반드시 아래 JSON 형식으로만 응답해주세요.

중요 지침:
1. 이전 대화 내용을 모두 고려하여 프로젝트 개요를 누적적으로 업데이트하세요.
2. 새로운 정보만 추가하지 말고, 기존 정보와 새로운 정보를 통합하세요.
3. keyFeatures 배열에는 이전에 언급된 모든 기능들을 포함하세요.
4. 비즈니스 모델 정보를 분석하여 수익 모델을 제안하세요.
5. aiAnalysis 섹션에는 프로젝트의 강점, 개선 제안, 주의사항을 구체적으로 분석하여 3개의 insights를 제공하세요.
6. aiAnalysis의 insights는 프로젝트의 타겟 사용자, 비즈니스 모델, 기술 스택, 시장 경쟁력을 종합적으로 고려하여 작성하세요.
7. 응답은 반드시 유효한 JSON 형식이어야 하며, 다른 텍스트나 설명은 포함하지 마세요.

응답 형식:
{
  "content": "사용자에게 보여줄 자연어 응답",
  "projectOverview": {
    "serviceCoreElements": {
      "title": "프로젝트 제목",
      "description": "프로젝트 설명",
      "keyFeatures": ["이전에 언급된 모든 핵심 기능들", "새로 추가된 기능"],
      "targetUsers": ["타겟 사용자1", "타겟 사용자2"],
      "projectScale": "소규모/중규모/대규모",
      "techComplexity": "단순/보통/복잡", 
      "estimatedDuration": "예상 개발 기간 (예: 2-3개월)",
      "requiredTeam": ["프론트엔드 개발자", "백엔드 개발자", "UI/UX 디자이너"],
      "techStack": {
        "frontend": ["React", "Next.js", "TypeScript"],
        "backend": ["Node.js", "NestJS", "PostgreSQL"],
        "database": ["PostgreSQL", "Redis"],
        "infrastructure": ["AWS", "Vercel", "Railway"]
      },
      "businessModel": {
        "revenueStreams": ["주요 수익원 1", "주요 수익원 2"],
        "monetizationStrategy": "수익화 전략 설명",
        "pricingModel": "가격 모델 (예: 구독, 수수료, 일회성)",
        "targetMarketSize": "타겟 시장 규모",
        "competitiveAdvantage": "경쟁 우위 요소"
      }
    },
    "userJourney": {
      "steps": [
        {
          "step": 1,
          "title": "단계 제목",
          "description": "단계 설명", 
          "userAction": "사용자 행동",
          "systemResponse": "시스템 응답",
          "estimatedHours": "예상 소요 시간",
          "requiredSkills": ["필요한 기술 스택"]
        }
      ]
    },
    "aiAnalysis": {
      "insights": [
        {
          "type": "strength",
          "icon": "✔",
          "message": "프로젝트의 강점이나 긍정적인 분석 내용"
        },
        {
          "type": "suggestion",
          "icon": "💡",
          "message": "개선 제안이나 추가 기능 아이디어"
        },
        {
          "type": "warning",
          "icon": "⚠",
          "message": "주의해야 할 사항이나 핵심 고려 요소"
        }
      ]
    }
  }
}`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          system: systemPrompt,
          messages: messages
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Claude API error details:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Claude API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.content || !data.content[0] || !data.content[0].text) {
        throw new Error('Invalid response format from Claude API');
      }

      const responseText = data.content[0].text;
      
      console.log('=== Claude API 응답 디버깅 ===');
      console.log('응답 텍스트:', responseText);
      console.log('응답 길이:', responseText.length);
      
      // 마크다운 코드 블록에서 JSON 추출
      let jsonText = responseText;
      
      // ```json ... ``` 형태의 코드 블록에서 JSON 추출
      const jsonBlockMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonBlockMatch) {
        jsonText = jsonBlockMatch[1];
        console.log('코드 블록에서 JSON 추출:', jsonText.substring(0, 200) + '...');
      } else {
        // 코드 블록이 없는 경우 원본 텍스트 사용
        console.log('코드 블록 없음, 원본 텍스트 사용');
      }
      
      // JSON 응답 파싱 시도
      try {
        const jsonResponse = JSON.parse(jsonText);
        console.log('JSON 파싱 성공:', jsonResponse);
        console.log('projectOverview 존재:', !!jsonResponse.projectOverview);
        
        return {
          content: jsonResponse.content || responseText,
          metadata: { 
            timestamp: new Date().toISOString(),
            model: 'claude-sonnet-4-20250514'
          },
          projectOverview: jsonResponse.projectOverview || null
        };
      } catch (parseError) {
        console.log('JSON 파싱 실패:', parseError.message);
        console.log('추출된 JSON 텍스트:', jsonText.substring(0, 500));
        console.log('원본 응답 텍스트:', responseText.substring(0, 500));
        
        // JSON 파싱 실패 시 기본 응답
        return {
          content: responseText,
          metadata: { 
            timestamp: new Date().toISOString(),
            model: 'claude-sonnet-4-20250514'
          },
          projectOverview: null
        };
      }
    } catch (error) {
      console.error('Claude API 호출 오류:', error);
      throw new Error(`Claude API 호출 실패: ${error.message}`);
    }
  }

  private async extractRequirementsFromHistory(history: any[]) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    // 대화 히스토리를 텍스트로 변환
    const conversationText = history.map(msg => 
      `${msg.role || (msg.type === 'user' ? '사용자' : 'AI')}: ${msg.content || msg.message}`
    ).join('\n');

    const systemPrompt = `당신은 SI 프로젝트 요구사항 분석 전문가입니다.
대화 내용을 분석하여 요구사항을 추출하고 계층적으로 분류해주세요.

중요: 응답은 반드시 유효한 JSON 형식이어야 하며, 다른 텍스트나 설명은 포함하지 마세요.

응답 형식:
{
  "categories": [
    {
      "category": "대분류 (예: 인증, 결제, 관리자)",
      "subCategories": [
        {
          "subcategory": "중분류 (예: 로그인, 회원가입)",
          "requirements": [
            {
              "title": "소분류 (예: 이메일/비밀번호 로그인)",
              "description": "상세 설명",
              "priority": "high|medium|low",
              "needsClarification": true|false,
              "clarificationQuestions": ["구체적인 질문1", "구체적인 질문2"]
            }
          ]
        }
      ]
    }
  ]
}`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: `다음 대화 내용을 분석하여 요구사항을 추출해주세요:\n\n${conversationText}`
            }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Claude API error details:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        
        // 500 에러의 경우 재시도 로직 추가
        if (response.status === 500) {
          console.log('Claude API 500 에러 - 재시도 시도');
          // 짧은 지연 후 재시도
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const retryResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 4000,
              system: systemPrompt,
              messages: [
                {
                  role: 'user',
                  content: `다음 대화 내용을 분석하여 요구사항을 추출해주세요:\n\n${conversationText}`
                }
              ]
            })
          });
          
          if (retryResponse.ok) {
            console.log('재시도 성공');
            const retryData = await retryResponse.json();
            return this.parseRequirementsResponse(retryData);
          }
        }
        
        throw new Error(`Claude API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return this.parseRequirementsResponse(data);
    } catch (error) {
      console.error('요구사항 추출 오류:', error);
      throw new Error(`요구사항 추출 실패: ${error.message}`);
    }
  }

  private async updateRequirementsFromChat(existingRequirements: any, history: any[]) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    // 대화 히스토리를 텍스트로 변환
    const conversationText = history.map(msg => 
      `${msg.role || (msg.type === 'user' ? '사용자' : 'AI')}: ${msg.content || msg.message}`
    ).join('\n');

    const systemPrompt = `당신은 SI 프로젝트 요구사항 분석 전문가입니다.
기존 요구사항과 새로운 대화 내용을 분석하여 요구사항을 업데이트해주세요.

중요: 응답은 반드시 유효한 JSON 형식이어야 하며, 다른 텍스트나 설명은 포함하지 마세요.

기존 요구사항:
${JSON.stringify(existingRequirements, null, 2)}

새로운 대화 내용:
${conversationText}

업데이트 규칙:
1. 사용자가 기존 요구사항에 대한 구체적인 설명이나 추가 정보를 제공한 경우, 해당 요구사항의 needsClarification을 false로 설정하고 clarificationQuestions를 빈 배열로 설정하세요.
2. 사용자가 요구사항의 내용을 수정하거나 보완한 경우, 해당 요구사항은 자동으로 승인된 것으로 간주하여 needsClarification을 false로 설정하세요.
3. 새로운 요구사항이 추가된 경우에만 needsClarification을 true로 설정하고 적절한 명확화 질문을 제공하세요.
4. 기존 요구사항의 description이 더 구체적이고 상세해진 경우, 이는 사용자가 명확화를 완료한 것으로 간주하세요.

응답 형식:
{
  "categories": [
    {
      "category": "대분류",
      "subCategories": [
        {
          "subcategory": "중분류",
          "requirements": [
            {
              "title": "소분류",
              "description": "상세 설명",
              "priority": "high|medium|low",
              "needsClarification": true|false,
              "clarificationQuestions": ["질문1", "질문2"]
            }
          ]
        }
      ]
    }
  ],
  "updatedAt": "2025-09-24T12:00:00.000Z",
  "message": "업데이트 완료 메시지"
}`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: '기존 요구사항을 새로운 대화 내용을 바탕으로 업데이트해주세요.'
            }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Claude API error details:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Claude API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.content || !data.content[0] || !data.content[0].text) {
        throw new Error('Invalid response format from Claude API');
      }

      const responseText = data.content[0].text;
      
      console.log('=== 요구사항 업데이트 API 응답 디버깅 ===');
      console.log('응답 텍스트:', responseText.substring(0, 300) + '...');
      console.log('응답 길이:', responseText.length);
      
      // 마크다운 코드 블록에서 JSON 추출
      let jsonText = responseText;
      
      // ```json ... ``` 형태의 코드 블록에서 JSON 추출
      const jsonBlockMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonBlockMatch) {
        jsonText = jsonBlockMatch[1];
        console.log('코드 블록에서 JSON 추출 성공:', jsonText.substring(0, 200) + '...');
      } else {
        console.log('코드 블록 없음, 원본 텍스트 사용');
      }
      
      // JSON 응답 파싱
      try {
        const result = JSON.parse(jsonText);
        console.log('요구사항 업데이트 JSON 파싱 성공');
        return result;
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError);
        console.error('추출된 JSON 텍스트:', jsonText.substring(0, 500));
        console.error('원본 응답 텍스트:', responseText.substring(0, 500));
        throw new Error('요구사항 업데이트 응답 파싱 실패');
      }
    } catch (error) {
      console.error('요구사항 업데이트 오류:', error);
      throw new Error(`요구사항 업데이트 실패: ${error.message}`);
    }
  }
}
