"use client";

import { useState } from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { LoginRequiredModal } from "@/components/auth/LoginRequiredModal";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  placeholder?: string;
  currentStep?: number;
  disabled?: boolean;
}

export function ChatInput({
  onSendMessage,
  placeholder = "여기에 답변을 입력하세요",
  currentStep = 1,
  disabled = false,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const { user } = useAuthGuard();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || !message.trim()) {
      return;
    }
    console.log("ChatInput - 현재 단계:", currentStep, "사용자:", !!user);

    // 1단계에서는 로그인 없이 채팅 허용, 2단계부터는 로그인 요구
    if (currentStep === 1) {
      // 1단계: 로그인 없이 채팅 허용
      console.log("1단계: 로그인 없이 채팅 허용");
      onSendMessage(message.trim());
      setMessage("");
    } else {
      // 2단계 이상: 로그인 요구
      console.log("2단계 이상: 로그인 요구");
      if (!user) {
        console.log("사용자 없음 - 로그인 모달 표시");
        setShowLoginModal(true);
      } else {
        console.log("로그인된 사용자 - 채팅 전송");
        onSendMessage(message.trim());
        setMessage("");
      }
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
            disabled ? "bg-gray-100 cursor-not-allowed" : ""
          }`}
          style={
            {
              "--tw-ring-color": "#6366F1",
            } as React.CSSProperties
          }
        />
        <button
          type="submit"
          disabled={disabled}
          className={`text-white px-6 py-2 rounded-lg transition-colors duration-200 ${
            disabled ? "bg-gray-400 cursor-not-allowed" : ""
          }`}
          style={{
            backgroundColor: disabled ? "#9CA3AF" : "#6366F1",
          }}
        >
          {disabled ? "처리 중..." : "보내기"}
        </button>
      </form>

      {/* 로그인 안내 모달 */}
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="로그인이 필요한 서비스입니다"
        description="채팅 기능을 사용하려면 로그인이 필요합니다. 로그인 후 계속 진행하시겠습니까?"
        targetStep={currentStep}
        projectData={{
          description: message.trim(),
          serviceType: "채팅 메시지",
          uploadedFiles: [],
          chatMessages: [],
          requirements: [],
          projectOverview: null,
        }}
      />
    </>
  );
}
