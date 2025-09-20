"use client";

import { useState } from "react";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";

interface Message {
  id: string;
  type: "system" | "ai" | "user";
  content: string;
  description?: string;
  icon?: string;
  options?: Array<{ id: string; label: string }>;
}

interface ChatInterfaceProps {
  initialMessage?: string;
  serviceType?: string;
  onNextStep?: () => void;
  currentStep?: number;
}

export function ChatInterface({
  initialMessage = "",
  serviceType = "",
  onNextStep,
  currentStep = 1,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "system" as const,
      content: "문제 정의",
      description: "해결하고자 하는 핵심 문제를 파악합니다",
      icon: "💡",
    },
    {
      id: "2",
      type: "ai" as const,
      content:
        "좋아요! 좀 더 구체적으로 이해하기 위해 몇 가지 질문을 드릴게요.",
      icon: "🤖",
    },
    {
      id: "3",
      type: "ai" as const,
      content: "당신의 서비스는 어떤 문제를 해결하고 싶나요?",
      description: "아래 옵션을 선택하거나 직접 입력해주세요.",
      icon: "🤖",
      options: [
        { id: "price", label: "가격 문제" },
        { id: "convenience", label: "편리성 문제" },
        { id: "dissatisfaction", label: "기존 서비스 불만" },
        { id: "unknown", label: "잘 모르겠음" },
      ],
    },
  ]);

  const handleSendMessage = (message: string) => {
    // 사용자 메시지를 메시지 배열에 추가
    const userMessage = {
      id: `user-${Date.now()}`,
      type: "user" as const,
      content: message,
      icon: "👤",
    };

    setMessages((prev) => [...prev, userMessage]);

    // AI 응답 추가 (실제로는 API 호출)
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          type: "ai" as const,
          content:
            "감사합니다. 추가로 궁금한 점이 있으시면 언제든 말씀해주세요.",
          icon: "🤖",
        },
      ]);
    }, 1000);
  };

  const handleOptionSelect = (option: { id: string; label: string }) => {
    // 옵션 선택도 사용자 메시지로 처리
    handleSendMessage(option.label);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Chat Header */}
      {/* <div className="bg-white border-b border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900">프로젝트 분석</h2>
        <p className="text-sm text-gray-600">
          AI가 프로젝트를 분석하고 있습니다
        </p>
      </div> */}

      {/* Chat Messages - Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-4 pl-[90px] space-y-4">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onOptionSelect={handleOptionSelect}
          />
        ))}
      </div>

      {/* Chat Input */}
      <div className="bg-white border-t border-gray-200 p-4 pl-[90px]">
        <ChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
}
