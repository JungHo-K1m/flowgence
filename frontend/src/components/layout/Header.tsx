"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { useRole } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";

export function Header() {
  const { user, loading, signOut } = useAuthContext();
  const { isAdmin } = useRole();

  const handleSignOut = async () => {
    await signOut();

    // 로그아웃 시 모든 저장된 상태 초기화
    localStorage.removeItem("flowgence_temp_state");
    sessionStorage.removeItem("flowgence_resume_project");

    // 메인 페이지로 리다이렉트
    window.location.href = "/";
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();

    // 모든 저장된 상태 초기화
    localStorage.removeItem("flowgence_temp_state");
    sessionStorage.removeItem("flowgence_resume_project");

    // 메인 페이지로 리다이렉트
    window.location.href = "/";
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center"
              onClick={handleLogoClick}
            >
              <div className="relative w-[124px] h-[37px]">
                <Image
                  src="/images/flowgence-logo.png"
                  alt="Flowgence Logo"
                  fill
                  className="object-contain"
                />
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-6">
            {loading ? (
              <div className="text-gray-500">로딩 중...</div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">
                  안녕하세요, {user.user_metadata?.full_name || user.email}님!
                </span>
                <Link
                  href="/mypage"
                  className="bg-[#6366F1] text-white px-8 hover:bg-[#6366F1] transition-colors duration-200 font-medium m-2 rounded-lg h-[40px] flex items-center justify-center"
                >
                  마이페이지
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="text-gray-700 hover:text-blue-600 transition-colors duration-200"
                  >
                    관리자
                  </Link>
                )}
                <Link
                  href="/contact"
                  className="text-gray-700 hover:text-blue-600 transition-colors duration-200"
                >
                  문의하기
                </Link>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                  className="text-gray-700 hover:text-blue-600"
                >
                  로그아웃
                </Button>
              </div>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-gray-700 hover:text-blue-600 transition-colors duration-200"
                >
                  로그인
                </Link>
                <Link
                  href="/auth/signup"
                  className="text-gray-700 hover:text-blue-600 transition-colors duration-200"
                >
                  회원가입
                </Link>
                <Link
                  href="/contact"
                  className="text-gray-700 hover:text-blue-600 transition-colors duration-200"
                >
                  문의하기
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
