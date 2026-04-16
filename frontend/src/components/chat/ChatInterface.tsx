"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  currentStep?: number;
  messages?: Message[];
  onMessagesChange?: (messages: Message[]) => void;
  onProjectUpdate?: (data: {
    description: string;
    serviceType: string;
    uploadedFiles: File[];
    messages: Message[];
  }) => void;
  aiResponse?: string; // AI 응답 메시지
  isLoading?: boolean; // API 응답 대기 중 여부
}

export function ChatInterface({
  initialMessage = "",
  serviceType = "",
  currentStep = 1,
  messages: externalMessages,
  onMessagesChange,
  onProjectUpdate,
  aiResponse,
  isLoading = false,
}: ChatInterfaceProps) {
  // 초기 메시지가 있으면 사용자 메시지로 추가
  const getInitialMessages = useCallback((): Message[] => {
    const baseMessages: Message[] = [
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
    ];

    // 초기 메시지가 있으면 사용자 메시지로 추가
    if (initialMessage && initialMessage.trim()) {
      const userMessage: Message = {
        id: "initial-user-message",
        type: "user" as const,
        content: initialMessage,
        icon: "👤",
      };

      // 사용자 메시지를 맨 앞에 추가
      return [userMessage, ...baseMessages];
    }

    return baseMessages;
  }, [initialMessage]);

  const [internalMessages, setInternalMessages] = useState<Message[]>(
    getInitialMessages()
  );

  // 타이핑 효과를 위한 상태
  const [typingMessage, setTypingMessage] = useState<string>("");
  const [isTypingMessage, setIsTypingMessage] = useState<boolean>(false);

  const [isTyping, setIsTyping] = useState(false);
  const [previousStep, setPreviousStep] = useState(currentStep);

  // 스크롤 영역 참조
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 스크롤을 최하단으로 이동하는 함수
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // 강제로 스크롤을 최하단으로 이동하는 함수 (즉시 실행)
  const forceScrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, []);

  // currentStep 변경 로그
  // useEffect(() => {
  //   console.log("ChatInterface - currentStep 변경:", currentStep);
  // }, [currentStep]);

  // initialMessage가 변경될 때 메시지 업데이트 (중복 호출 방지)
  useEffect(() => {
    if (initialMessage && initialMessage.trim()) {
      const updatedMessages = getInitialMessages();
      // 외부 메시지가 없을 때만 내부 상태 업데이트
      if (!externalMessages) {
        setInternalMessages(updatedMessages);
      }
      // onMessagesChange는 호출하지 않음 (중복 호출 방지)
    }
  }, [initialMessage, externalMessages, getInitialMessages]);

  // 외부에서 전달된 메시지가 있으면 사용, 없으면 내부 상태 사용
  const messages = externalMessages || internalMessages;

  // 메시지가 변경될 때마다 스크롤을 최하단으로 이동
  useEffect(() => {
    setTimeout(() => {
      forceScrollToBottom();
    }, 100);
  }, [messages, forceScrollToBottom]);

  // 타이핑 인디케이터가 변경될 때도 스크롤 이동
  useEffect(() => {
    if (isTyping) {
      setTimeout(() => {
        forceScrollToBottom();
      }, 50);
    }
  }, [isTyping, forceScrollToBottom]);

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

        // 단계 전환 시 스크롤을 하단으로 이동
        setTimeout(() => {
          forceScrollToBottom();
        }, 100);
      }

      setPreviousStep(currentStep);
    }
  }, [currentStep, previousStep, onMessagesChange, messages]);

  // aiResponse가 변경될 때 AI 메시지 추가 (타이핑 효과 포함)
  useEffect(() => {
    if (aiResponse && aiResponse.trim()) {
      // 이미 같은 내용의 AI 메시지가 있는지 확인
      const currentMessages = onMessagesChange ? messages : internalMessages;
      const lastMessage = currentMessages[currentMessages.length - 1];

      // 마지막 메시지가 AI 메시지이고 내용이 같으면 추가하지 않음
      if (
        lastMessage &&
        lastMessage.type === "ai" &&
        lastMessage.content === aiResponse
      ) {
        setIsTyping(false);
        return;
      }

      // 타이핑 효과 시작
      setIsTypingMessage(true);
      setTypingMessage("");

      let currentIndex = 0;
      const fullText = aiResponse;

      // 한 글자씩 타이핑
      const typingInterval = setInterval(() => {
        if (currentIndex < fullText.length) {
          setTypingMessage(fullText.substring(0, currentIndex + 1));
          currentIndex++;

          // 스크롤을 실시간으로 이동
          forceScrollToBottom();
        } else {
          // 타이핑 완료
          clearInterval(typingInterval);
          setIsTypingMessage(false);

          // 완전한 메시지를 배열에 추가
          const aiMessage = {
            id: `ai-${Date.now()}`,
            type: "ai" as const,
            content: fullText,
            icon: "🤖",
          };

          const updatedMessages = [...currentMessages, aiMessage];

          if (onMessagesChange) {
            onMessagesChange(updatedMessages);
          } else {
            setInternalMessages(updatedMessages);
          }

          // 타이핑 인디케이터 숨기기
          setIsTyping(false);

          // 최종 스크롤
          setTimeout(() => {
            forceScrollToBottom();
          }, 100);
        }
      }, 30); // 30ms 간격 (1초에 약 33글자)

      return () => clearInterval(typingInterval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiResponse, onMessagesChange]);

  const handleSendMessage = async (message: string) => {
    // 사용자 메시지를 메시지 배열에 추가
    const userMessage = {
      id: `user-${Date.now()}`,
      type: "user" as const,
      content: message,
      icon: "👤",
    };

    const updatedMessages = [...messages, userMessage];

    if (onMessagesChange) {
      onMessagesChange(updatedMessages);
    } else {
      setInternalMessages(updatedMessages);
    }

    // 사용자 메시지 전송 시 스크롤을 하단으로 이동
    setTimeout(() => {
      forceScrollToBottom();
    }, 50);

    // 타이핑 인디케이터 표시
    setIsTyping(true);

    try {
      // 프로젝트 개요 업데이트 트리거 (실제 API 호출은 useProjectOverview에서 처리)
      if (onProjectUpdate) {
        // 프로젝트 개요 업데이트 콜백 호출 (실제 API 호출은 부모 컴포넌트에서 처리)
        onProjectUpdate({
          description: message,
          serviceType: serviceType,
          uploadedFiles: [],
          messages: updatedMessages,
        });
      } else {
        // 기본 응답
        const aiMessage = {
          id: `ai-${Date.now()}`,
          type: "ai" as const,
          content:
            "감사합니다. 추가로 궁금한 점이 있으시면 언제든 말씀해주세요.",
          icon: "🤖",
        };

        const finalMessages = [...updatedMessages, aiMessage];

        if (onMessagesChange) {
          onMessagesChange(finalMessages);
        } else {
          setInternalMessages(finalMessages);
        }
      }
    } catch (error: any) {
      // 529 (Overloaded) 또는 503 에러 처리
      const errorContent = 
        (error.message && (error.message.includes('529') || error.message.includes('Overloaded') || error.message.includes('overloaded'))) ||
        (error.status === 503 || error.status === 529) ||
        (error.type === 'overloaded_error')
          ? "현재 사용량이 많아 서비스가 일시적으로 지연되고 있습니다. 잠시 후 다시 시도해주세요."
          : "죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해주세요.";

      const errorMessage = {
        id: `ai-${Date.now()}`,
        type: "ai" as const,
        content: errorContent,
        icon: "🤖",
      };

      const finalMessages = [...updatedMessages, errorMessage];

      if (onMessagesChange) {
        onMessagesChange(finalMessages);
      } else {
        setInternalMessages(finalMessages);
      }
    }
  };

  const handleOptionSelect = (option: { id: string; label: string }) => {
    // 옵션 선택도 사용자 메시지로 처리
    handleSendMessage(option.label);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 max-h-[calc(100vh-120px)] sm:max-h-[calc(100vh-120px)]">
      {/* Chat Messages - Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 pl-3 sm:pl-[30px] space-y-3 sm:space-y-4 min-h-0">
        {/* Step Header - Fixed */}
        <div className="bg-white border-1 border-[#E5E7EB] p-3 sm:p-4 pl-4 sm:pl-[90px] rounded-[12px] sm:rounded-[16px]">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-base sm:text-lg">
                {currentStep === 1
                  ? "💡"
                  : currentStep === 2
                  ? "📋"
                  : currentStep === 3
                  ? "⚙️"
                  : "✅"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                {currentStep === 1
                  ? "문제 정의"
                  : currentStep === 2
                  ? "요구사항 관리"
                  : currentStep === 3
                  ? "기능 구성"
                  : "최종 확인"}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 truncate sm:whitespace-normal">
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

        {/* 타이핑 중인 메시지 표시 */}
        {isTypingMessage && typingMessage && (
          <MessageBubble
            message={{
              id: "typing-message",
              type: "ai" as const,
              content: typingMessage,
              icon: "🤖",
            }}
          />
        )}

        {/* Typing Indicator */}
        {isTyping && !isTypingMessage && <TypingIndicator />}

        {/* 스크롤 앵커 */}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="bg-white border-t border-gray-200 p-3 sm:p-4 pl-3 sm:pl-[30px]">
        <ChatInput
          onSendMessage={handleSendMessage}
          currentStep={currentStep}
          disabled={isLoading || isTyping}
          placeholder={
            isTyping
              ? "AI가 응답을 생성하고 있습니다..."
              : currentStep === 1
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
