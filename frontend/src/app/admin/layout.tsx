"use client";

import { ReactNode } from "react";
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

  return (
    <AdminOnly
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              접근 권한 없음
            </h1>
            <p className="text-gray-600">
              이 페이지는 관리자만 접근할 수 있습니다.
            </p>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          {/* Left Sidebar */}
          <div className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
            <div className="p-6">
              {/* Logo */}
              <Link href="/" className="flex items-center mb-8">
                <div className="w-10 h-10 bg-[#6366F1] rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-xl font-bold">F</span>
                </div>
                <span className="text-xl font-bold text-gray-900">
                  FLOWGENCE
                </span>
              </Link>

              {/* User Profile */}
              <div className="flex items-center mb-8 pb-6 border-b border-gray-200">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                  <span className="text-gray-600 text-lg">
                    {(user?.user_metadata?.full_name || user?.email || "A")
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {user?.user_metadata?.full_name || user?.email || "관리자"}
                  </p>
                  <p className="text-sm text-gray-500">관리자</p>
                </div>
              </div>

              {/* Navigation Menu */}
              <nav className="space-y-2">
                {menuItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.disabled ? "#" : item.href}
                      className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                        isActive
                          ? "bg-[#6366F1] text-white"
                          : item.disabled
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                      onClick={(e) => {
                        if (item.disabled) e.preventDefault();
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
          <div className="flex-1">
            {/* Top Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-4">
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
            <div className="p-8">{children}</div>
          </div>
        </div>
      </div>
    </AdminOnly>
  );
}

