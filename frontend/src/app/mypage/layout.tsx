"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthContext } from "@/components/providers/AuthProvider";
import Image from "next/image";

interface MyPageLayoutProps {
  children: ReactNode;
}

export default function MyPageLayout({ children }: MyPageLayoutProps) {
  const pathname = usePathname();
  const { user } = useAuthContext();

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
          <div className="p-6">
            {/* Logo */}
            {/* <Link href="/" className="flex items-center mb-8">
              <div className="relative w-[124px] h-[37px]">
                <Image
                  src="/images/flowgence-logo.png"
                  alt="Flowgence Logo"
                  fill
                  className="object-contain"
                />
              </div>
            </Link> */}

            {/* User Profile */}
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                <span className="text-gray-600 text-lg">
                  {(user?.user_metadata?.full_name || user?.email || "U")
                    .charAt(0)
                    .toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {user?.user_metadata?.full_name || user?.email || "사용자"}
                </p>
                <p className="text-sm text-gray-500">프로젝트 매니저</p>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-2">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
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
        <div className="flex-1">
          <div className="p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
