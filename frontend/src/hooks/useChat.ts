import { useState, useCallback } from 'react';
import { Message } from '@/types/chat';
import { isDevelopmentMode } from '@/lib/dummyData';

// 개발 모드용 더미 AI 응답
const DUMMY_AI_RESPONSES = [
  "좋은 아이디어네요! 해당 기능을 구현하기 위해 몇 가지 추가 정보가 필요합니다.",
  "이해했습니다. 프로젝트 개요에 반영하겠습니다.",
  "해당 요구사항을 요구사항 목록에 추가했습니다. 우선순위를 정해주시겠어요?",
  "그 부분은 기술적으로 충분히 가능합니다. 세부 구현 방식을 논의해볼까요?",
  "좋습니다! 사용자 경험을 고려하여 UI/UX도 함께 설계해드릴게요."
];

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (content: string, projectId: string) => {
    setIsLoading(true);

    try {
      // 개발 모드: 더미 응답 반환
      if (isDevelopmentMode()) {
        console.log('[DEV MODE] 더미 채팅 응답 사용');
        await new Promise(resolve => setTimeout(resolve, 800)); // 로딩 시뮬레이션

        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content,
          timestamp: new Date(),
        };

        const randomResponse = DUMMY_AI_RESPONSES[Math.floor(Math.random() * DUMMY_AI_RESPONSES.length)];
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: randomResponse,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage, aiMessage]);
        setIsLoading(false);
        return { message: randomResponse };
      }

      // Railway 백엔드 API 호출
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${backendUrl}/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          message: content,
          history: messages,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // 사용자 메시지 추가
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date(),
      };

      // AI 응답 추가
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || 'AI 응답을 받았습니다.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage, aiMessage]);
      
      return data;
    } catch (error) {
      console.error('Chat error:', error);
      
      // 에러 메시지 추가
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '죄송합니다. 연결에 문제가 발생했습니다.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  };
}
