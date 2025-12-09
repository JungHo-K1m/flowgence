"use client";

import { useState, useEffect } from "react";
import { getDevelopmentModeStatus, toggleDevelopmentMode } from "@/lib/dummyData";

export function DevModeToggle() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 개발 환경에서만 표시
    if (process.env.NODE_ENV === 'development') {
      setIsVisible(true);
      setIsEnabled(getDevelopmentModeStatus());
    }
  }, []);

  if (!isVisible) return null;

  const handleToggle = () => {
    const newState = !isEnabled;
    toggleDevelopmentMode(newState);
  };

  return (
    <div className="fixed bottom-20 right-4 z-50">
      <div className="bg-gray-900 text-white rounded-lg shadow-lg p-3 text-sm">
        <div className="flex items-center gap-3">
          <span className="font-medium">🧪 Dev Mode</span>
          <button
            onClick={handleToggle}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              isEnabled ? "bg-green-500" : "bg-gray-600"
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                isEnabled ? "left-7" : "left-1"
              }`}
            />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {isEnabled ? "더미 데이터 사용 중" : "실제 API 사용 중"}
        </p>
      </div>
    </div>
  );
}
