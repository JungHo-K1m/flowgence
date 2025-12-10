"use client";

import { ReactNode, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthContext } from "@/components/providers/AuthProvider";

interface MyPageLayoutProps {
  children: ReactNode;
}

export default function MyPageLayout({ children }: MyPageLayoutProps) {
  const pathname = usePathname();
  const { user } = useAuthContext();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const menuItems = [
    {
      href: "/mypage",
      label: "프로젝트 대시보드",
      icon: "🏠",
    },
    {
      href: "/mypage/in-progress",
      label: "진행중인 프로젝트",
      icon: "📄",
    },
    {
      href: "/mypage/completed",
      label: "완료된 프로젝트",
      icon: "✅",
    },
    {
      href: "/mypage/settings",
      label: "설정",
      icon: "⚙️",
    },
  ];

  const toggleMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen((prev) => !prev);
  }, []);

  const handleMenuClick = useCallback(() => {
    setIsMobileSidebarOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 sticky top-0 z-20">
        <button
          onClick={toggleMobileSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="font-semibold text-gray-900">마이페이지</span>
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
          <span className="text-gray-600 text-sm">
            {(user?.user_metadata?.full_name || user?.email || "U")
              .charAt(0)
              .toUpperCase()}
          </span>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <div className="flex">
        {/* Left Sidebar - Desktop always visible, Mobile slide-out */}
        <div className={`
          fixed md:relative inset-y-0 left-0 z-40
          w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen
          transform transition-transform duration-300 ease-in-out
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}>
          <div className="p-4 md:p-6">
            {/* Mobile Close Button */}
            <div className="md:hidden flex justify-end mb-4">
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* User Profile */}
            <div className="flex items-center mb-6 md:mb-8">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                <span className="text-gray-600 text-base md:text-lg">
                  {(user?.user_metadata?.full_name || user?.email || "U")
                    .charAt(0)
                    .toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gray-900 text-sm md:text-base truncate">
                  {user?.user_metadata?.full_name || user?.email || "사용자"}
                </p>
                <p className="text-xs md:text-sm text-gray-500">프로젝트 매니저</p>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-1 md:space-y-2">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleMenuClick}
                    className={`flex items-center px-3 py-2.5 md:py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="p-4 md:p-6 lg:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
