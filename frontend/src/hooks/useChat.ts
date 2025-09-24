import { useState, useCallback } from 'react';
import { Message } from '@/types/chat';

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (content: string, projectId: string) => {
    setIsLoading(true);
    
    try {
      // 백엔드 API 호출
      const response = await fetch('http://localhost:3001/api/chat/message', {
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
