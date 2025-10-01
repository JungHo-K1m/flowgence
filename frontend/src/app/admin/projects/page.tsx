"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

interface Project {
  id: string;
  title: string;
  userName: string;
  status: string;
  createdAt: string;
  estimateDate: string;
  estimate: string;
  requirementsCount: number;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [searchTerm, categoryFilter, statusFilter, projects]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      const { data: projects, error } = await supabase
        .from("projects")
        .select(
          `
          *,
          profiles:user_id (
            full_name,
            email
          )
        `
        )
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const formattedProjects: Project[] = (projects || []).map((p) => ({
        id: p.id,
        title: p.title || "제목 없음",
        userName: p.profiles?.full_name || p.profiles?.email || "알 수 없음",
        status: p.status || "draft",
        createdAt: p.created_at,
        estimateDate: p.updated_at,
        estimate:
          p.status === "completed"
            ? `${(8000000).toLocaleString()}원`
            : "미산출",
        requirementsCount: 8, // 임시 하드코딩
      }));

      setProjects(formattedProjects);
      setFilteredProjects(formattedProjects);
    } catch (error) {
      console.error("프로젝트 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = [...projects];

    // 검색 필터
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(
        (project) =>
          project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.userName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 상태 필터
    if (statusFilter !== "all") {
      filtered = filtered.filter((project) => project.status === statusFilter);
    }

    setFilteredProjects(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; className: string }
    > = {
      completed: { label: "완료", className: "bg-green-100 text-green-800" },
      in_progress: { label: "진행중", className: "bg-blue-100 text-blue-800" },
      draft: { label: "임시저장", className: "bg-gray-100 text-gray-800" },
      requirements_review: {
        label: "요구사항검토",
        className: "bg-yellow-100 text-yellow-800",
      },
      requirements_extraction: {
        label: "요구사항추출",
        className: "bg-orange-100 text-orange-800",
      },
      estimation: {
        label: "견적산출",
        className: "bg-purple-100 text-purple-800",
      },
      contract: {
        label: "계약진행",
        className: "bg-indigo-100 text-indigo-800",
      },
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
        <div className="text-gray-500">프로젝트 데이터를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">프로젝트 모니터링</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
          >
            <option value="all">카테고리</option>
            <option value="food">음식 배달</option>
            <option value="realestate">부동산</option>
            <option value="work">업무 관리</option>
            <option value="education">온라인 교육</option>
            <option value="shopping">쇼핑몰</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
          >
            <option value="all">카테고리</option>
            <option value="requirements_review">요구사항 검토</option>
            <option value="requirements_extraction">요구사항 추출</option>
            <option value="estimation">견적 산출</option>
            <option value="contract">계약 진행</option>
            <option value="in_progress">진행중</option>
            <option value="completed">완료</option>
            <option value="draft">임시저장</option>
          </select>

          <div className="flex-1">
            <input
              type="text"
              placeholder="검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
            />
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  프로젝트명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  사용자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  생성일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  수정일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  견적금액
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  요구사항 개수
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    {searchTerm
                      ? "검색 결과가 없습니다"
                      : "프로젝트가 없습니다"}
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {project.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {project.userName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(project.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(project.estimateDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {project.estimate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {project.requirementsCount}
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
        {filteredProjects.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                총 {filteredProjects.length}개 프로젝트
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

