import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
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
            <Link
              href="/auth/login"
              className="text-gray-700 hover:text-blue-600 transition-colors duration-200"
            >
              로그인
            </Link>
            <Link
              href="/contact"
              className="text-gray-700 hover:text-blue-600 transition-colors duration-200"
            >
              문의하기
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
