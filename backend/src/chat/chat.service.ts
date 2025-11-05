import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from '../entities/chat-message.entity';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { ExtractRequirementsDto } from './dto/extract-requirements.dto';
import { UpdateRequirementsDto } from './dto/update-requirements.dto';
import { RecommendationsDto } from './dto/recommendations.dto';

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
      // Claude API 529 에러의 경우 원본 에러 전달 (재시도 실패)
      if (error instanceof Error && error.message.includes('529')) {
        throw error; // 원본 에러 전달하여 프론트엔드에서 처리 가능하도록
      }
      throw new Error('Failed to process chat message');
    }
  }

  async extractRequirements(extractRequirementsDto: ExtractRequirementsDto) {
    try {
      const requirements = await this.extractRequirementsFromHistory(extractRequirementsDto.history || []);
      return requirements;
    } catch (error) {
      console.error('Requirements extraction error:', error);
      // Claude API 529 에러의 경우 원본 에러 전달
      if (error instanceof Error && error.message.includes('529')) {
        throw error;
      }
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
      // Claude API 529 에러의 경우 원본 에러 전달
      if (error instanceof Error && error.message.includes('529')) {
        throw error;
      }
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
        
        // 529 (Overloaded) 에러의 경우 재시도 로직 추가
        // 529는 API가 일시적으로 과부하된 경우이므로 재시도 유용
        // 429는 계정의 rate limit 또는 acceleration limit이므로 재시도해도 실패
        if (response.status === 529) {
          console.log('Claude API 529 (Overloaded) 에러 - 재시도 시도');
          // 짧은 지연 후 재시도
          await new Promise(resolve => setTimeout(resolve, 2000));
          
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
              messages: messages
            })
          });
          
          if (retryResponse.ok) {
            console.log('재시도 성공');
            const retryData = await retryResponse.json();
            
            if (!retryData.content || !retryData.content[0] || !retryData.content[0].text) {
              throw new Error('Invalid response format from Claude API');
            }
            
            const retryResponseText = retryData.content[0].text;
            let jsonText = retryResponseText;
            
            const jsonBlockMatch = retryResponseText.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonBlockMatch) {
              jsonText = jsonBlockMatch[1];
            }
            
            try {
              const jsonResponse = JSON.parse(jsonText);
              return {
                content: jsonResponse.content || retryResponseText,
                metadata: { 
                  timestamp: new Date().toISOString(),
                  model: 'claude-sonnet-4-20250514'
                },
                projectOverview: jsonResponse.projectOverview || null
              };
            } catch (parseError) {
              return {
                content: retryResponseText,
                metadata: { 
                  timestamp: new Date().toISOString(),
                  model: 'claude-sonnet-4-20250514'
                },
                projectOverview: null
              };
            }
          }
        }
        
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

  private parseRecommendationsFromText(text: string): Array<{ title: string; description: string; priority: string }> {
    const recommendations: Array<{ title: string; description: string; priority: string }> = [];
    
    // 여러 추천 항목을 구분하기 위해 번호나 항목 구분자로 분리
    // 패턴 1: "1. 제목: ...", "2. 제목: ..." 형식
    // 패턴 2: "제목: ...", "설명: ...", "우선순위: ..." 형식 (반복)
    
    // 번호로 시작하는 패턴으로 항목 분리
    const items = text.split(/(?=\d+\.\s*(?:제목|Title|요구사항|Feature))/i);
    
    for (const item of items) {
      if (!item.trim()) continue;
      
      let title = '';
      let description = '';
      let priority = 'medium';
      
      // 제목 추출 (여러 패턴 시도)
      const titlePatterns = [
        /(?:제목|Title)[:：]\s*(.+?)(?:\n|$)/i,
        /^\d+\.\s*(.+?)(?:\n|$)/,
        /^[-*]\s*(.+?)(?:\n|$)/,
      ];
      
      for (const pattern of titlePatterns) {
        const match = item.match(pattern);
        if (match && match[1]) {
          title = match[1].trim();
          break;
        }
      }
      
      // 설명 추출
      const descPatterns = [
        /(?:설명|Description)[:：]\s*(.+?)(?:\n(?:우선순위|Priority)|$)/is,
        /(?:제목|Title)[:：].*?\n(.+?)(?:\n(?:우선순위|Priority)|$)/is,
      ];
      
      for (const pattern of descPatterns) {
        const match = item.match(pattern);
        if (match && match[1]) {
          description = match[1].trim();
          break;
        }
      }
      
      // 설명이 없으면 제목 다음 줄을 설명으로 사용
      if (!description && title) {
        const lines = item.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(title)) {
            if (i + 1 < lines.length && lines[i + 1].trim() && !lines[i + 1].match(/(?:우선순위|Priority)[:：]/i)) {
              description = lines[i + 1].trim();
            }
            break;
          }
        }
      }
      
      // 우선순위 추출
      const priorityMatch = item.match(/(?:우선순위|Priority)[:：]\s*(high|medium|low)/i);
      if (priorityMatch && priorityMatch[1]) {
        priority = priorityMatch[1].toLowerCase();
      }
      
      // 제목과 설명이 모두 있으면 추가
      if (title && description) {
        recommendations.push({ title, description, priority });
      }
    }
    
    // 번호 패턴이 없으면 전체 텍스트를 하나의 추천으로 처리
    if (recommendations.length === 0 && text.trim().length > 0) {
      const lines = text.trim().split('\n').filter(l => l.trim());
      if (lines.length > 0) {
        const firstLine = lines[0].trim();
        const rest = lines.slice(1).join(' ').trim();
        recommendations.push({
          title: firstLine.substring(0, 100),
          description: rest || firstLine,
          priority: 'medium'
        });
      }
    }
    
    return recommendations;
  }

  async getRecommendations(recommendationsDto: RecommendationsDto, res: any) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    const { categoryTitle, existingRequirements = [], projectData = {} } = recommendationsDto;

    // 기존 요구사항 목록 생성
    const existingRequirementsText = existingRequirements.length > 0
      ? existingRequirements.map((req, idx) => `${idx + 1}. ${req.title}: ${req.description}`).join('\n')
      : '없음';

    const systemPrompt = `당신은 SI 프로젝트 요구사항 분석 전문가입니다.
특정 카테고리에 대한 새로운 요구사항을 추천해주세요.

프로젝트 정보:
- 설명: ${projectData.description || '없음'}
- 서비스 타입: ${projectData.serviceType || '없음'}

카테고리: ${categoryTitle}

기존 요구사항:
${existingRequirementsText}

중요 지침:
1. 기존 요구사항과 중복되지 않는 새로운 요구사항을 3-5개 추천하세요.
2. 각 요구사항은 구체적이고 실현 가능해야 합니다.
3. 카테고리와 관련된 실용적인 기능이나 요구사항을 제안하세요.
4. 각 요구사항은 다음 형식으로 작성하세요:
   제목: [요구사항 제목]
   설명: [상세 설명]
   우선순위: [high|medium|low]
5. 여러 요구사항을 추천할 때는 각각을 명확히 구분하세요.`;

    try {
      // SSE 헤더 설정
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          stream: true, // 스트리밍 활성화
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: `${categoryTitle} 카테고리에 대한 새로운 요구사항을 3-5개 추천해주세요. 각 요구사항은 제목, 설명, 우선순위를 포함해야 합니다.`
            }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        res.write(`data: ${JSON.stringify({ type: 'error', message: `API Error: ${response.status}` })}\n\n`);
        res.end();
        return;
      }

      // 현재 추천 항목 추적
      let currentRecommendation: { title?: string; description?: string; priority?: string } = {};
      let accumulatedText = '';
      let buffer = '';
      const sentRecommendations = new Set<string>(); // 전송한 추천 항목 추적 (title 기준)

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        res.write(`data: ${JSON.stringify({ type: 'error', message: 'No reader available' })}\n\n`);
        res.end();
        return;
      }

      console.log('스트리밍 시작');

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('스트리밍 완료 (done=true)');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              console.log('Claude API 스트리밍 완료');
              // 마지막 추천 항목 처리
              if (currentRecommendation.title && currentRecommendation.description) {
                if (!currentRecommendation.priority) {
                  currentRecommendation.priority = 'medium';
                }
                res.write(`data: ${JSON.stringify({ type: 'recommendation', field: 'priority', value: currentRecommendation.priority })}\n\n`);
              }
              res.write('data: [DONE]\n\n');
              res.end();
              return;
            }

            try {
              const json = JSON.parse(data);
              
              // Claude API 스트리밍 이벤트 타입 확인
              // Claude API는 delta.type이 'text' 또는 'text_delta'일 수 있음
              if (json.type === 'content_block_delta' && 
                  (json.delta?.type === 'text' || json.delta?.type === 'text_delta') && 
                  json.delta?.text) {
                const text = json.delta.text;
                accumulatedText += text;
                
                // 스트리밍 중에는 파싱하지 않고 텍스트만 누적
                // 최종 파싱은 스트리밍 완료 후에만 수행
              } else if (json.type === 'message_start' || json.type === 'content_block_start') {
                // 메시지 시작 이벤트는 무시 (로그 제거)
              } else if (json.type === 'message_delta' || json.type === 'content_block_stop') {
                // 메시지 델타나 블록 종료 이벤트는 무시 (로그 제거)
              } else if (json.type === 'content_block_delta') {
                // text_delta 타입이 아닌 다른 delta 타입은 무시 (로그 제거)
              }
            } catch (e) {
              // JSON 파싱 실패 무시 (스트리밍 중일 수 있음)
              console.log('JSON 파싱 실패 (무시):', data.substring(0, 100));
            }
          }
        }
      }

      // 스트리밍 완료 시 최종 파싱
      console.log('누적 텍스트 (전체):', accumulatedText);
      console.log('누적 텍스트 (처음 500자):', accumulatedText.substring(0, 500));
      const finalRecommendations = this.parseRecommendationsFromText(accumulatedText);
      console.log('파싱된 추천 항목 수:', finalRecommendations.length);
      console.log('파싱된 추천 항목:', finalRecommendations);
      
      if (finalRecommendations.length > 0) {
        // 모든 완성된 추천 항목 전송 (중복 제거)
        for (const rec of finalRecommendations) {
          if (rec.title && rec.description) {
            // 제목 정리 (마크다운 제거, 앞뒤 공백 제거)
            const cleanTitle = rec.title.trim().replace(/^\*\*\s*/, '').replace(/\*\*$/, '').trim();
            
            if (!sentRecommendations.has(cleanTitle)) {
              console.log('최종 추천 항목 전송:', rec);
              sentRecommendations.add(cleanTitle);
              
              // 설명 정리 (마크다운 제거)
              let cleanDescription = rec.description.trim();
              // 마크다운 헤더 제거 (##, ### 등)
              cleanDescription = cleanDescription.replace(/^#+\s*/gm, '');
              // 볼드 제거 (**)
              cleanDescription = cleanDescription.replace(/\*\*/g, '');
              // 제목 라인 제거 (제목: 형식)
              cleanDescription = cleanDescription.replace(/^제목[:：]\s*.+$/gmi, '');
              // 설명 라인 제거 (설명: 형식)
              cleanDescription = cleanDescription.replace(/^설명[:：]\s*/gmi, '');
              // 우선순위 라인 제거
              cleanDescription = cleanDescription.replace(/^우선순위[:：]\s*.+$/gmi, '');
              // 빈 줄 정리
              cleanDescription = cleanDescription.replace(/\n\s*\n/g, '\n').trim();
              
              res.write(`data: ${JSON.stringify({ type: 'recommendation', field: 'title', value: cleanTitle })}\n\n`);
              res.write(`data: ${JSON.stringify({ type: 'recommendation', field: 'description', value: cleanDescription })}\n\n`);
              res.write(`data: ${JSON.stringify({ type: 'recommendation', field: 'priority', value: rec.priority || 'medium' })}\n\n`);
            }
          }
        }
      } else {
        // 파싱 실패 시 원본 텍스트를 설명으로 사용
        console.log('파싱 실패 - 원본 텍스트 사용');
        if (accumulatedText.trim().length > 0) {
          const lines = accumulatedText.trim().split('\n').filter(l => l.trim().length > 0);
          if (lines.length > 0) {
            const firstLine = lines[0].trim().replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
            const cleanText = accumulatedText.trim().replace(/^#+\s*/gm, '').replace(/\*\*/g, '');
            res.write(`data: ${JSON.stringify({ type: 'recommendation', field: 'title', value: firstLine.substring(0, 100) })}\n\n`);
            res.write(`data: ${JSON.stringify({ type: 'recommendation', field: 'description', value: cleanText })}\n\n`);
            res.write(`data: ${JSON.stringify({ type: 'recommendation', field: 'priority', value: 'medium' })}\n\n`);
          }
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
      console.log('스트리밍 응답 전송 완료');
    } catch (error) {
      console.error('추천 요청 오류:', error);
      res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
      res.end();
    }
  }
}

