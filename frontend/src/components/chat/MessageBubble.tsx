"use client";

interface MessageBubbleProps {
  message: {
    id: string;
    type: "system" | "ai" | "user";
    content: string;
    description?: string;
    icon?: string;
    options?: Array<{ id: string; label: string }>;
  };
  onOptionSelect?: (option: { id: string; label: string }) => void;
}

export function MessageBubble({ message, onOptionSelect }: MessageBubbleProps) {
  if (message.type === "system") {
    return (
      <div className="flex items-start space-x-2 sm:space-x-3 p-3 sm:p-4 bg-blue-50 rounded-lg max-w-full sm:max-w-[90%]">
        <span className="text-xl sm:text-2xl flex-shrink-0">{message.icon}</span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-blue-900 text-sm sm:text-base">{message.content}</h3>
          <p className="text-xs sm:text-sm text-blue-700">{message.description}</p>
        </div>
      </div>
    );
  }

  if (message.type === "ai") {
    return (
      <div className="flex items-start space-x-2 sm:space-x-3">
        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-base sm:text-lg">{message.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="p-3 sm:p-4 rounded-lg shadow-sm border inline-block max-w-full sm:max-w-[90%]"
            style={{ backgroundColor: "#EAEBFA", borderColor: "#E5E7EB" }}
          >
            <p className="text-gray-900 break-words text-sm sm:text-base">{message.content}</p>
            {message.description && (
              <p className="text-xs sm:text-sm text-gray-600 mt-2 break-words">
                {message.description}
              </p>
            )}
          </div>

          {/* Options */}
          {message.options && (
            <div className="mt-2 sm:mt-3 flex flex-wrap gap-1.5 sm:gap-2">
              {message.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => onOptionSelect?.(option)}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-xs sm:text-sm transition-colors duration-200"
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (message.type === "user") {
    return (
      <div className="flex items-end justify-end space-x-2">
        <div
          className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border inline-block max-w-[85%] sm:max-w-[90%]"
          style={{ backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" }}
        >
          <span className="text-gray-900 break-words text-sm sm:text-base">{message.content}</span>
        </div>
        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-base sm:text-lg">{message.icon || "👤"}</span>
        </div>
      </div>
    );
  }

  return null;
}
