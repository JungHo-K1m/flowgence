"use client";

import { useState } from "react";
import { WireframeSpec } from "@/types/wireframe";
import { LoFiCanvas } from "./LoFiCanvas";

interface WireframeEditorProps {
  wireframe: WireframeSpec;
  projectId: string;
  isApplying: boolean;
  onApplyEdit: (prompt: string) => Promise<void>;
}

export function WireframeEditor({
  wireframe,
  projectId,
  isApplying,
  onApplyEdit,
}: WireframeEditorProps) {
  const [prompt, setPrompt] = useState("");

  const handleApply = async () => {
    if (!prompt.trim()) {
      alert("수정 내용을 입력해주세요");
      return;
    }

    try {
      await onApplyEdit(prompt);
      setPrompt(""); // 성공 시 입력창 초기화
    } catch (error) {
      // 에러는 부모 컴포넌트에서 처리
    }
  };

  // 예시 프롬프트 (첫 번째 화면 이름 사용)
  const firstScreenName = wireframe.screens[0]?.name || "홈 화면";
  const examplePrompts = [
    `${firstScreenName}의 검색 버튼을 더 크게`,
    `${firstScreenName}의 리스트 높이 늘리기`,
    `${firstScreenName}의 상단바를 파란색으로`,
    `${firstScreenName}에 하단 버튼 추가`,
  ];

  return (
    <div className="space-y-6">
      {/* 와이어프레임 표시 */}
      <div className="bg-gray-50 rounded-lg p-8 border border-gray-200">
        <LoFiCanvas spec={wireframe} scale={0.8} />
      </div>

      {/* AI 편집 UI */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-2xl">✨</span>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">
              AI로 수정하기
            </h3>
            <p className="text-sm text-gray-600">
              수정하고 싶은 내용을 자연어로 입력하세요
            </p>
          </div>
        </div>

        {/* 안내 메시지 */}
        {wireframe.screens && wireframe.screens.length > 1 && (
          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
            💡 여러 화면이 있습니다. 수정할 화면을 명시하세요. (예: &quot;홈 화면의 검색 버튼을 더 크게&quot;)
          </div>
        )}

        {/* 프롬프트 입력 */}
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="예: 홈 화면의 검색 버튼을 더 크게 만들어줘, 상세 화면의 리스트 높이를 늘려줘"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          rows={3}
          disabled={isApplying}
        />

        {/* 수정 버튼 */}
        <button
          onClick={handleApply}
          disabled={!prompt.trim() || isApplying}
          className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isApplying ? (
            <>
              <svg
                className="animate-spin h-5 w-5"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>AI가 수정 중...</span>
            </>
          ) : (
            <>
              <span>✨</span>
              <span>AI로 수정하기</span>
            </>
          )}
        </button>

        {/* 예시 프롬프트 */}
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">
            💡 빠른 수정 예시:
          </p>
          <div className="flex flex-wrap gap-2">
            {examplePrompts.map((example, index) => (
              <button
                key={index}
                onClick={() => setPrompt(example)}
                disabled={isApplying}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* 안내 메시지 */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-medium">💡 Tip:</span> 구체적으로 말할수록 정확하게 수정됩니다!
          </p>
          <ul className="mt-2 text-xs text-blue-700 space-y-1 list-disc list-inside">
            <li>크기 변경: &quot;검색 버튼을 50% 더 크게&quot;</li>
            <li>위치 이동: &quot;로그인 버튼을 화면 하단으로&quot;</li>
            <li>요소 추가: &quot;하단에 저장 버튼 추가&quot;</li>
            <li>색상 변경: &quot;상단바를 파란색으로&quot; (향후 지원)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

