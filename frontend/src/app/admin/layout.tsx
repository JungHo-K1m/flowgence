"use client";

import { ReactNode, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { AdminOnly } from "@/components/auth/RoleGuard";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { user } = useAuthContext();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const menuItems = [
    {
      href: "/admin",
      label: "대시보드",
      icon: "🏠",
    },
    {
      href: "/admin/users",
      label: "사용자 관리",
      icon: "👥",
    },
    {
      href: "/admin/projects",
      label: "프로젝트 모니터링",
      icon: "📊",
    },
    {
      href: "/admin/estimates",
      label: "견적/계약",
      icon: "📄",
      disabled: true,
    },
    {
      href: "/admin/settings",
      label: "설정",
      icon: "⚙️",
      disabled: true,
    },
  ];

  const toggleMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen((prev) => !prev);
  }, []);

  const handleMenuClick = useCallback((disabled?: boolean) => {
    if (!disabled) {
      setIsMobileSidebarOpen(false);
    }
  }, []);

  return (
    <AdminOnly
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-xl md:text-2xl font-bold text-red-600 mb-4">
              접근 권한 없음
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              이 페이지는 관리자만 접근할 수 있습니다.
            </p>
          </div>
        </div>
      }
    >
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
          <span className="font-semibold text-gray-900">관리자</span>
          <div className="w-10 h-10 bg-[#6366F1] rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">
              {(user?.user_metadata?.full_name || user?.email || "A")
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
          {/* Left Sidebar */}
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

              {/* Logo */}
              <Link href="/" className="flex items-center mb-6 md:mb-8" onClick={() => setIsMobileSidebarOpen(false)}>
                <div className="w-8 h-8 md:w-10 md:h-10 bg-[#6366F1] rounded-full flex items-center justify-center mr-2 md:mr-3">
                  <span className="text-white text-lg md:text-xl font-bold">F</span>
                </div>
                <span className="text-lg md:text-xl font-bold text-gray-900">
                  FLOWGENCE
                </span>
              </Link>

              {/* User Profile */}
              <div className="flex items-center mb-6 md:mb-8 pb-4 md:pb-6 border-b border-gray-200">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                  <span className="text-gray-600 text-base md:text-lg">
                    {(user?.user_metadata?.full_name || user?.email || "A")
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm md:text-base truncate">
                    {user?.user_metadata?.full_name || user?.email || "관리자"}
                  </p>
                  <p className="text-xs md:text-sm text-gray-500">관리자</p>
                </div>
              </div>

              {/* Navigation Menu */}
              <nav className="space-y-1 md:space-y-2">
                {menuItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.disabled ? "#" : item.href}
                      className={`flex items-center px-3 py-2.5 md:py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                        isActive
                          ? "bg-[#6366F1] text-white"
                          : item.disabled
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                      onClick={(e) => {
                        if (item.disabled) {
                          e.preventDefault();
                        } else {
                          handleMenuClick(item.disabled);
                        }
                      }}
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
            {/* Top Header - Desktop only */}
            <div className="hidden md:block bg-white border-b border-gray-200 px-4 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1"></div>
                <div className="flex items-center space-x-4">
                  <Link
                    href="/mypage"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    마이페이지
                  </Link>
                  <Link
                    href="/"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    문의하기
                  </Link>
                </div>
              </div>
            </div>

            {/* Page Content */}
            <div className="p-4 md:p-6 lg:p-8">{children}</div>
          </div>
        </div>
      </div>
    </AdminOnly>
  );
}

