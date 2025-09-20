"use client";

import { useState } from "react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
}

export function ChatInput({ onSendMessage }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="여기에 답변을 입력하세요"
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
        style={{
          '--tw-ring-color': '#6366F1'
        } as React.CSSProperties}
      />
      <button
        type="submit"
        className="text-white px-6 py-2 rounded-lg transition-colors duration-200"
        style={{
          backgroundColor: "#6366F1"
        }}
      >
        보내기
      </button>
    </form>
  );
}
