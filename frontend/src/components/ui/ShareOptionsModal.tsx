"use client";

import { useState } from "react";
import { ShareOption, ShareData } from "@/lib/shareAlternatives";

interface ShareOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareData: ShareData;
  shareOptions: ShareOption[];
}

export function ShareOptionsModal({
  isOpen,
  onClose,
  shareData,
  shareOptions,
}: ShareOptionsModalProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleOptionClick = (option: ShareOption) => {
    setSelectedOption(option.id);
    option.action();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            📤 공유 방법 선택
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {shareData.title}
            </h3>
            <p className="text-sm text-gray-600">
              다음 중 원하는 공유 방법을 선택하세요:
            </p>
          </div>

          {/* Share Options */}
          <div className="space-y-3">
            {shareOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleOptionClick(option)}
                disabled={!option.available}
                className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                  option.available
                    ? "border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer"
                    : "border-gray-100 bg-gray-50 cursor-not-allowed opacity-50"
                }`}
              >
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{option.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {option.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {option.description}
                    </div>
                  </div>
                  {option.available && (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Notion Guide Link */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start">
              <span className="text-blue-500 text-xl mr-3">💡</span>
              <div>
                <h4 className="font-medium text-blue-900 mb-1">
                  Notion을 처음 사용하시나요?
                </h4>
                <p className="text-sm text-blue-700 mb-2">
                  Notion은 웹 브라우저에서 무료로 사용할 수 있는 강력한 문서 도구입니다.
                </p>
                <button
                  onClick={() => {
                    // Notion 가이드 표시
                    const { showNotionGuide } = require("@/lib/shareAlternatives");
                    showNotionGuide();
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Notion 사용 가이드 보기 →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
