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
      <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg max-w-[80%]">
        <span className="text-2xl">{message.icon}</span>
        <div>
          <h3 className="font-semibold text-blue-900">{message.content}</h3>
          <p className="text-sm text-blue-700">{message.description}</p>
        </div>
      </div>
    );
  }

  if (message.type === "ai") {
    return (
      <div className="flex items-start space-x-3 max-w-[80%]">
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
          <span className="text-lg">{message.icon}</span>
        </div>
        <div className="flex-1">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <p className="text-gray-900">{message.content}</p>
            {message.description && (
              <p className="text-sm text-gray-600 mt-2">
                {message.description}
              </p>
            )}
          </div>

          {/* Options */}
          {message.options && (
            <div className="mt-3 flex flex-wrap gap-2">
              {message.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => onOptionSelect?.(option)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm transition-colors duration-200"
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
      <div className="flex justify-end">
        <div className="bg-blue-600 text-white px-4 py-2 rounded-lg max-w-[60%]">
          <div className="flex items-center space-x-2">
            <span className="text-sm">👤</span>
            <span>{message.content}</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
