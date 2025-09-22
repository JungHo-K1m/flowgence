"use client";

import { AdminOnly } from "@/components/auth/RoleGuard";

export default function AdminPage() {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            관리자 페이지는 현재 준비중입니다.
          </h1>
          <p className="text-gray-600">곧 더 많은 기능을 제공할 예정입니다.</p>
        </div>
      </div>
    </AdminOnly>
  );
}
