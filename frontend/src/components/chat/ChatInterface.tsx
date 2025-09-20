"use client";

import { useState } from "react";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { TypingIndicator } from "./TypingIndicator";

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
      type: "ai" as const,
      content:
        "좋아요! 좀 더 구체적으로 이해하기 위해 몇 가지 질문을 드릴게요. 이 서비스는 사용자들이 어떤 문제를 해결하고 싶어하는지, 그리고 기존 서비스에서 어떤 불편함을 겪고 있는지 파악하는 것이 중요합니다. 또한 타겟 고객층의 특성과 니즈를 정확히 이해해야 더 나은 솔루션을 제안할 수 있습니다.",
      icon: "🤖",
    },
    {
      id: "2",
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

  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = (message: string) => {
    // 사용자 메시지를 메시지 배열에 추가
    const userMessage = {
      id: `user-${Date.now()}`,
      type: "user" as const,
      content: message,
      icon: "👤",
    };

    setMessages((prev) => [...prev, userMessage]);

    // 타이핑 인디케이터 표시
    setIsTyping(true);

    // AI 응답 추가 (실제로는 API 호출)
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          type: "ai" as const,
          content:
            "감사합니다. 추가로 궁금한 점이 있으시면 언제든 말씀해주세요. 프로젝트의 세부사항을 더 명확하게 파악하기 위해 추가적인 정보가 필요하시면 언제든지 요청해주시기 바랍니다. 우리는 최상의 솔루션을 제공하기 위해 최선을 다하겠습니다.",
          icon: "🤖",
        },
      ]);
    }, 2000); // 2초로 늘려서 타이핑 효과 확인 가능
  };

  const handleOptionSelect = (option: { id: string; label: string }) => {
    // 옵션 선택도 사용자 메시지로 처리
    handleSendMessage(option.label);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Chat Messages - Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-4 pl-[90px] space-y-4">
        {/* Problem Definition Header - Fixed */}
        <div className="bg-white border-1 border-[#E5E7EB] p-4 pl-[90px] rounded-[16px]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-lg">💡</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">문제 정의</h3>
              <p className="text-sm text-gray-600">
                해결하고자 하는 핵심 문제를 파악합니다
              </p>
            </div>
          </div>
        </div>
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onOptionSelect={handleOptionSelect}
          />
        ))}

        {/* Typing Indicator */}
        {isTyping && <TypingIndicator />}
      </div>

      {/* Chat Input */}
      <div className="bg-white border-t border-gray-200 p-4 pl-[90px]">
        <ChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
}
