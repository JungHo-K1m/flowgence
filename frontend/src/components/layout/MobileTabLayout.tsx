"use client";

import { useState } from "react";

interface MobileTabLayoutProps {
  chatContent: React.ReactNode;
  panelContent: React.ReactNode;
  panelTitle?: string;
  defaultTab?: "chat" | "panel";
}

export function MobileTabLayout({
  chatContent,
  panelContent,
  panelTitle = "프로젝트 개요",
  defaultTab = "chat",
}: MobileTabLayoutProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "panel">(defaultTab);

  return (
    <div className="flex flex-col h-full md:hidden">
      {/* Tab Header */}
      <div className="flex border-b border-gray-200 bg-white flex-shrink-0 shadow-sm">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 py-3 text-sm font-medium transition-all duration-200 relative ${
            activeTab === "chat"
              ? "text-[#6366F1] bg-indigo-50/50"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>채팅</span>
          </div>
          {activeTab === "chat" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6366F1]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("panel")}
          className={`flex-1 py-3 text-sm font-medium transition-all duration-200 relative ${
            activeTab === "panel"
              ? "text-[#6366F1] bg-indigo-50/50"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{panelTitle}</span>
          </div>
          {activeTab === "panel" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6366F1]" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden relative">
        {/* Chat Tab */}
        <div
          className={`absolute inset-0 transition-all duration-300 ease-in-out ${
            activeTab === "chat"
              ? "opacity-100 translate-x-0 pointer-events-auto"
              : "opacity-0 -translate-x-4 pointer-events-none"
          }`}
        >
          {chatContent}
        </div>

        {/* Panel Tab */}
        <div
          className={`absolute inset-0 transition-all duration-300 ease-in-out ${
            activeTab === "panel"
              ? "opacity-100 translate-x-0 pointer-events-auto"
              : "opacity-0 translate-x-4 pointer-events-none"
          }`}
        >
          {panelContent}
        </div>
      </div>
    </div>
  );
}
