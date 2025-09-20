"use client";

export function TypingIndicator() {
  return (
    <div className="flex items-start space-x-3">
      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
        <span className="text-lg">🤖</span>
      </div>
      <div className="flex-1">
        <div
          className="p-4 rounded-lg shadow-sm border inline-block max-w-[60%]"
          style={{ backgroundColor: "#EAEBFA", borderColor: "#E5E7EB" }}
        >
          <div className="flex items-center space-x-1">
            <span className="text-gray-500 text-sm">AI가 입력 중</span>
            <div className="flex space-x-1">
              <div
                className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              ></div>
              <div
                className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              ></div>
              <div
                className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
