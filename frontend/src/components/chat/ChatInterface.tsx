"use client";

import { useState, useEffect } from "react";
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
  messages?: Message[];
  onMessagesChange?: (messages: Message[]) => void;
}

export function ChatInterface({
  initialMessage = "",
  serviceType = "",
  onNextStep,
  currentStep = 1,
  messages: externalMessages,
  onMessagesChange,
}: ChatInterfaceProps) {
  const [internalMessages, setInternalMessages] = useState<Message[]>([
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
  const [previousStep, setPreviousStep] = useState(currentStep);

  // 외부에서 전달된 메시지가 있으면 사용, 없으면 내부 상태 사용
  const messages = externalMessages || internalMessages;

  // 단계 전환 시 AI 메시지 추가
  useEffect(() => {
    if (currentStep !== previousStep) {
      let stepMessage: Message | null = null;

      if (currentStep === 2 && previousStep === 1) {
        // 1단계 → 2단계: 요구사항 관리로 전환
        stepMessage = {
          id: `step-${currentStep}-${Date.now()}`,
          type: "ai" as const,
          content:
            "입력하신 프로젝트 내용을 바탕으로 요구사항 목록을 생성했습니다. 각 요구사항에 대해 더 자세히 설명하거나 수정하고 싶은 부분이 있으시면 말씀해주세요.",
          icon: "🤖",
        };
      } else if (currentStep === 3 && previousStep === 2) {
        // 2단계 → 3단계: 기능 구성으로 전환
        stepMessage = {
          id: `step-${currentStep}-${Date.now()}`,
          type: "ai" as const,
          content:
            "요구사항을 바탕으로 기능 구성을 진행하겠습니다. 어떤 기능부터 우선적으로 구현하고 싶으신지 알려주세요.",
          icon: "🤖",
        };
      } else if (currentStep === 4 && previousStep === 3) {
        // 3단계 → 4단계: 최종 확인으로 전환
        stepMessage = {
          id: `step-${currentStep}-${Date.now()}`,
          type: "ai" as const,
          content:
            "기능 구성을 완료했습니다. 최종 확인을 위해 추가 질문이 있으시면 말씀해주세요.",
          icon: "🤖",
        };
      }

      if (stepMessage) {
        if (onMessagesChange) {
          onMessagesChange([...messages, stepMessage]);
        } else {
          setInternalMessages((prev: Message[]) => [...prev, stepMessage]);
        }
      }

      setPreviousStep(currentStep);
    }
  }, [currentStep, previousStep, onMessagesChange, messages]);

  const handleSendMessage = (message: string) => {
    // 사용자 메시지를 메시지 배열에 추가
    const userMessage = {
      id: `user-${Date.now()}`,
      type: "user" as const,
      content: message,
      icon: "👤",
    };

    if (onMessagesChange) {
      onMessagesChange([...messages, userMessage]);
    } else {
      setInternalMessages((prev: Message[]) => [...prev, userMessage]);
    }

    // 타이핑 인디케이터 표시
    setIsTyping(true);

    // AI 응답 추가 (실제로는 API 호출)
    setTimeout(() => {
      setIsTyping(false);
      if (onMessagesChange) {
        onMessagesChange([
          ...messages,
          {
            id: `ai-${Date.now()}`,
            type: "ai" as const,
            content:
              "감사합니다. 추가로 궁금한 점이 있으시면 언제든 말씀해주세요. 프로젝트의 세부사항을 더 명확하게 파악하기 위해 추가적인 정보가 필요하시면 언제든지 요청해주시기 바랍니다. 우리는 최상의 솔루션을 제공하기 위해 최선을 다하겠습니다.",
            icon: "🤖",
          },
        ]);
      } else {
        setInternalMessages((prev: Message[]) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            type: "ai" as const,
            content:
              "감사합니다. 추가로 궁금한 점이 있으시면 언제든 말씀해주세요. 프로젝트의 세부사항을 더 명확하게 파악하기 위해 추가적인 정보가 필요하시면 언제든지 요청해주시기 바랍니다. 우리는 최상의 솔루션을 제공하기 위해 최선을 다하겠습니다.",
            icon: "🤖",
          },
        ]);
      }
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
        {/* Step Header - Fixed */}
        <div className="bg-white border-1 border-[#E5E7EB] p-4 pl-[90px] rounded-[16px]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-lg">
                {currentStep === 1
                  ? "💡"
                  : currentStep === 2
                  ? "📋"
                  : currentStep === 3
                  ? "⚙️"
                  : "✅"}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {currentStep === 1
                  ? "문제 정의"
                  : currentStep === 2
                  ? "요구사항 관리"
                  : currentStep === 3
                  ? "기능 구성"
                  : "최종 확인"}
              </h3>
              <p className="text-sm text-gray-600">
                {currentStep === 1
                  ? "해결하고자 하는 핵심 문제를 파악합니다"
                  : currentStep === 2
                  ? "요구사항을 상세히 정의하고 관리합니다"
                  : currentStep === 3
                  ? "구체적인 기능을 설계하고 구성합니다"
                  : "최종 결과를 확인하고 검토합니다"}
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
        <ChatInput
          onSendMessage={handleSendMessage}
          placeholder={
            currentStep === 1
              ? "자연어로 입력하여 프로젝트를 설명해보세요"
              : currentStep === 2
              ? "요구사항에 대해 자세히 설명해주세요"
              : currentStep === 3
              ? "기능 구성에 대해 질문해주세요"
              : "최종 확인을 위해 질문해주세요"
          }
        />
      </div>
    </div>
  );
}
