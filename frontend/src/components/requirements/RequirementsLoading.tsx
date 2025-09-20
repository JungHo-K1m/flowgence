"use client";

export function RequirementsLoading() {
  return (
    <div className="h-full bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          요구사항 카드
        </h2>

        {/* Search and Filter - Disabled during loading */}
        <div className="flex space-x-4 opacity-50">
          <select
            disabled
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100"
          >
            <option>전체 (0)</option>
          </select>

          <input
            type="text"
            placeholder="검색..."
            disabled
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100"
          />
        </div>
      </div>

      {/* Loading Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Loading Animation */}
        <div className="flex flex-col items-center justify-center h-full">
          <div className="relative">
            {/* Spinning Circle */}
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>

            {/* Center Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
          </div>

          <div className="mt-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              요구사항을 분석하고 있습니다
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              AI가 프로젝트 내용을 바탕으로 요구사항을 생성하고 있습니다
            </p>

            {/* Progress Dots */}
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
              <div
                className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="w-2 h-2 bg-purple-300 rounded-full animate-pulse"
                style={{ animationDelay: "0.4s" }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Disabled during loading */}
      <div className="border-t border-gray-200 p-4 flex justify-between">
        <button
          disabled
          className="px-6 py-3 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
        >
          이전 단계
        </button>

        <div className="flex items-center space-x-4">
          <button
            disabled
            className="px-4 py-2 text-gray-400 border border-gray-300 rounded-lg cursor-not-allowed"
          >
            + 새 요구사항
          </button>

          <button
            disabled
            className="px-6 py-3 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
          >
            다음 단계
          </button>
        </div>
      </div>
    </div>
  );
}
