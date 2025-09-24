"use client";

interface RequirementsLoadingProps {
  stage?: "extracting" | "updating" | "saving" | "processing";
}

export function RequirementsLoading({
  stage = "processing",
}: RequirementsLoadingProps) {
  const getStageInfo = () => {
    switch (stage) {
      case "extracting":
        return {
          title: "요구사항을 추출하고 있습니다",
          description:
            "AI가 프로젝트 내용을 분석하여 요구사항을 도출하고 있습니다",
          icon: "🧠",
          color: "purple",
        };
      case "updating":
        return {
          title: "요구사항을 업데이트하고 있습니다",
          description:
            "채팅 내용을 바탕으로 기존 요구사항을 업데이트하고 있습니다",
          icon: "🔄",
          color: "green",
        };
      case "saving":
        return {
          title: "데이터를 저장하고 있습니다",
          description:
            "프로젝트 정보와 요구사항을 데이터베이스에 저장하고 있습니다",
          icon: "💾",
          color: "blue",
        };
      default:
        return {
          title: "요구사항을 처리하고 있습니다",
          description:
            "AI가 프로젝트 내용을 바탕으로 요구사항을 생성하고 있습니다",
          icon: "📋",
          color: "purple",
        };
    }
  };

  const stageInfo = getStageInfo();
  const colorClasses = {
    purple: {
      border: "border-purple-200 border-t-purple-600",
      bg: "bg-purple-600",
      bgLight: "bg-purple-400",
      bgLighter: "bg-purple-300",
    },
    green: {
      border: "border-green-200 border-t-green-600",
      bg: "bg-green-600",
      bgLight: "bg-green-400",
      bgLighter: "bg-green-300",
    },
    blue: {
      border: "border-blue-200 border-t-blue-600",
      bg: "bg-blue-600",
      bgLight: "bg-blue-400",
      bgLighter: "bg-blue-300",
    },
  };

  const colors = colorClasses[stageInfo.color as keyof typeof colorClasses];

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
            <div
              className={`w-16 h-16 border-4 ${colors.border} rounded-full animate-spin`}
            ></div>

            {/* Center Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">{stageInfo.icon}</span>
            </div>
          </div>

          <div className="mt-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {stageInfo.title}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {stageInfo.description}
            </p>

            {/* Progress Dots */}
            <div className="flex items-center justify-center space-x-2">
              <div
                className={`w-2 h-2 ${colors.bg} rounded-full animate-pulse`}
              ></div>
              <div
                className={`w-2 h-2 ${colors.bgLight} rounded-full animate-pulse`}
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className={`w-2 h-2 ${colors.bgLighter} rounded-full animate-pulse`}
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
