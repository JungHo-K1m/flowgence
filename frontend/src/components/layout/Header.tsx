"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { useRole } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";

export function Header() {
  const router = useRouter();
  const { user, loading, signOut } = useAuthContext();
  const { isAdmin } = useRole();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    localStorage.removeItem("flowgence_temp_state");
    localStorage.removeItem("flowgence_active_session");
    sessionStorage.removeItem("flowgence_resume_project");
    router.push("/");
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    localStorage.removeItem("flowgence_temp_state");
    localStorage.removeItem("flowgence_active_session");
    sessionStorage.removeItem("flowgence_resume_project");
    window.location.href = "/";
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const desktopLinkClass =
    "px-4 hover:text-blue-600 transition-colors duration-200 font-medium m-2 rounded-lg h-[40px] inline-flex items-center justify-center leading-none";
  const desktopPrimaryLinkClass =
    "text-[#6366F1] px-4 hover:text-blue-600 transition-colors duration-200 font-medium m-2 rounded-lg h-[40px] inline-flex items-center justify-center leading-none";
  const desktopButtonClass =
    "text-gray-700 hover:text-blue-600 px-4 transition-colors duration-200 font-medium m-2 rounded-lg h-[40px] inline-flex items-center justify-center leading-none";
  const authLinkClass =
    "text-gray-700 hover:text-blue-600 transition-colors duration-200 flex items-center h-[40px] leading-none";

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16 relative">
          <div className="flex items-center">
            <Link href="/" className="flex items-center" onClick={handleLogoClick}>
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

          <nav className="flex items-center">
            <div className="hidden md:flex items-center space-x-6">
              {loading ? (
                <div className="text-gray-500">로딩 중...</div>
              ) : user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-500 px-4 m-2 h-[40px] inline-flex items-center rounded-lg leading-none">
                    안녕하세요, {user.user_metadata?.full_name || user.email}님!
                  </span>
                  {isAdmin && (
                    <Link href="/admin" className={`text-gray-700 ${desktopLinkClass}`}>
                      관리자 페이지
                    </Link>
                  )}
                  <Link href="/contact" className={`text-gray-700 ${desktopLinkClass}`}>
                    문의하기
                  </Link>
                  <Link href="/mypage" className={desktopPrimaryLinkClass}>
                    마이페이지
                  </Link>
                  <Button onClick={handleSignOut} variant="outline" size="sm" className={desktopButtonClass}>
                    로그아웃
                  </Button>
                </div>
              ) : (
                <>
                  <Link href="/auth/login" className={authLinkClass}>
                    로그인
                  </Link>
                  <Link href="/auth/signup" className={authLinkClass}>
                    회원가입
                  </Link>
                  <Link href="/contact" className={authLinkClass}>
                    문의하기
                  </Link>
                </>
              )}
            </div>
            <button
              type="button"
              className="md:hidden p-2 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onClick={toggleMobileMenu}
              aria-label="모바일 메뉴 열기"
            >
              <span className="sr-only">메뉴 열기</span>
              <div className="w-5 h-0.5 bg-current mb-1" />
              <div className="w-5 h-0.5 bg-current mb-1" />
              <div className="w-5 h-0.5 bg-current" />
            </button>
          </nav>

          <div
            className={`md:hidden absolute top-16 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg transition-transform duration-300 ${
              isMobileMenuOpen ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none"
            }`}
          >
            <div className="p-4 space-y-4">
              {loading ? (
                <div className="text-gray-500">로딩 중...</div>
              ) : user ? (
                <div className="flex flex-col space-y-3 text-gray-700">
                  <span>안녕하세요, {user.user_metadata?.full_name || user.email}님!</span>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="px-3 py-2 rounded-md border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 transition-colors duration-200"
                      onClick={closeMobileMenu}
                    >
                      관리자 페이지
                    </Link>
                  )}
                  <Link
                    href="/contact"
                    className="px-3 py-2 rounded-md border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 transition-colors duration-200"
                    onClick={closeMobileMenu}
                  >
                    문의하기
                  </Link>
                  <Link
                    href="/mypage"
                    className="px-3 py-2 rounded-md border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 transition-colors duration-200"
                    onClick={closeMobileMenu}
                  >
                    마이페이지
                  </Link>
                  <Button
                    onClick={() => {
                      closeMobileMenu();
                      handleSignOut();
                    }}
                    variant="outline"
                    className="justify-center"
                  >
                    로그아웃
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col space-y-3 text-gray-700">
                  <Link
                    href="/auth/login"
                    className="px-3 py-2 rounded-md border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 transition-colors duration-200"
                    onClick={closeMobileMenu}
                  >
                    로그인
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="px-3 py-2 rounded-md border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 transition-colors duration-200"
                    onClick={closeMobileMenu}
                  >
                    회원가입
                  </Link>
                  <Link
                    href="/contact"
                    className="px-3 py-2 rounded-md border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 transition-colors duration-200"
                    onClick={closeMobileMenu}
                  >
                    문의하기
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

