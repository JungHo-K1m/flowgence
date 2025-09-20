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
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <div
                className="w-2 h-2 bg-purple-300 rounded-full animate-pulse"
                style={{ animationDelay: "0.5s" }}
              ></div>
              <div
                className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"
                style={{ animationDelay: "1s" }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
