"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

interface User {
  id: string;
  email: string;
  fullName: string;
  company: string;
  role: string;
  createdAt: string;
  projectCount: number;
  status: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        (user) =>
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.company.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      // 사용자 프로필 조회 (디버깅 로그 추가)
      console.log("사용자 프로필 조회 시작...");
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("프로필 조회 결과:", { profiles, error: profilesError });

      if (profilesError) {
        console.error("프로필 조회 에러:", profilesError);
        throw profilesError;
      }

      if (!profiles || profiles.length === 0) {
        console.warn("프로필 데이터가 없습니다");
        setUsers([]);
        setFilteredUsers([]);
        setLoading(false);
        return;
      }

      // 각 사용자의 프로젝트 수 조회
      console.log(`${profiles.length}명의 사용자에 대해 프로젝트 수 조회 중...`);
      const usersWithProjects = await Promise.all(
        profiles.map(async (profile) => {
          const { count, error: countError } = await supabase
            .from("projects")
            .select("*", { count: "exact", head: true })
            .eq("user_id", profile.id);

          if (countError) {
            console.error(
              `사용자 ${profile.id}의 프로젝트 수 조회 실패:`,
              countError
            );
          }

          return {
            id: profile.id,
            email: profile.email || "이메일 없음",
            fullName: profile.full_name || profile.email || "이름 없음",
            company: profile.company || "회사 미등록",
            role: profile.role || "user",
            createdAt: profile.created_at,
            projectCount: count || 0,
            status: "활성", // 임시로 모두 활성 상태
          };
        })
      );

      console.log("최종 사용자 데이터:", usersWithProjects);
      setUsers(usersWithProjects);
      setFilteredUsers(usersWithProjects);
    } catch (error) {
      console.error("사용자 로드 실패:", error);
      // 에러 발생해도 빈 배열로 설정하여 UI는 표시
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { label: string; className: string }> = {
      admin: { label: "Admin", className: "bg-red-100 text-red-800" },
      user: { label: "User", className: "bg-blue-100 text-blue-800" },
      client: { label: "Client", className: "bg-gray-100 text-gray-800" },
    };

    const config = roleConfig[role] || {
      label: role,
      className: "bg-gray-100 text-gray-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> =
      {
        활성: { label: "활성", className: "bg-green-100 text-green-800" },
        임시저장: { label: "임시저장", className: "bg-gray-100 text-gray-800" },
      };

    const config = statusConfig[status] || {
      label: status,
      className: "bg-gray-100 text-gray-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">사용자 데이터를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">사용자 관리</h1>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="이메일 또는 이름으로 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
            />
            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  이메일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  이름
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  회사
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  역할
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  가입일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  프로젝트 수
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    {searchTerm
                      ? "검색 결과가 없습니다"
                      : "사용자가 없습니다"}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.fullName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.company}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {user.projectCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button className="text-[#6366F1] hover:text-[#4F46E5] font-medium">
                        상세보기
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredUsers.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                총 {filteredUsers.length}명의 사용자
              </p>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900">
                  이전
                </button>
                <button className="px-3 py-1 text-sm bg-[#6366F1] text-white rounded">
                  1
                </button>
                <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900">
                  2
                </button>
                <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900">
                  3
                </button>
                <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900">
                  다음
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

