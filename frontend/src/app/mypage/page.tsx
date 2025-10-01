"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { useProjectResume } from "@/hooks/useProjectResume";

interface Project {
  id: string;
  title: string;
  description: string;
  serviceType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function MyPage() {
  const { user } = useAuthContext();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("latest");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoaded = useRef(false);
  const { resumeProject } = useProjectResume();

  const loadProjects = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      console.log("Loading projects for user:", user.id);

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Loaded projects:", data);

      // 데이터 형식 변환
      const formattedProjects: Project[] = (data || []).map((project: any) => ({
        id: project.id,
        title: project.title || "제목 없음",
        description: project.description || "설명 없음",
        serviceType: project.service_type || "웹사이트",
        status: project.status || "draft",
        createdAt: project.created_at,
        updatedAt: project.updated_at,
      }));

      console.log("Formatted projects:", formattedProjects);
      setProjects(formattedProjects);
    } catch (err) {
      console.error("프로젝트 로드 실패:", err);
      setError(
        err instanceof Error
          ? err.message
          : "프로젝트를 불러오는데 실패했습니다"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && !hasLoaded.current) {
      hasLoaded.current = true;
      loadProjects();
    }
  }, [user]);

  useEffect(() => {
    filterAndSortProjects();
  }, [projects, statusFilter, sortOrder]);

  const filterAndSortProjects = () => {
    let filtered = [...projects];

    // 상태별 필터링
    if (statusFilter !== "all") {
      filtered = filtered.filter((project) => project.status === statusFilter);
    }

    // 정렬
    filtered.sort((a, b) => {
      if (sortOrder === "latest") {
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      } else {
        return (
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        );
      }
    });

    setFilteredProjects(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: "완료", className: "bg-green-100 text-green-800" },
      in_progress: { label: "진행중", className: "bg-blue-100 text-blue-800" },
      draft: { label: "임시저장", className: "bg-gray-100 text-gray-800" },
      requirements_review: {
        label: "요구사항 검토",
        className: "bg-yellow-100 text-yellow-800",
      },
      requirements_extraction: {
        label: "요구사항 추출",
        className: "bg-orange-100 text-orange-800",
      },
      estimation: {
        label: "견적 산출",
        className: "bg-purple-100 text-purple-800",
      },
      contract: {
        label: "계약 진행",
        className: "bg-indigo-100 text-indigo-800",
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
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

  const getProjectStats = () => {
    console.log("Calculating stats for projects:", projects);

    // 진행중인 프로젝트: requirements_review, requirements_extraction, estimation, contract, in_progress
    const inProgress = projects.filter((p) =>
      [
        "requirements_review",
        "requirements_extraction",
        "estimation",
        "contract",
        "in_progress",
      ].includes(p.status)
    ).length;

    // 완료된 프로젝트
    const completed = projects.filter((p) => p.status === "completed").length;

    // 총 견적금액 (완료된 프로젝트만)
    const totalEstimated = projects
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + 8000000, 0); // 임시로 8백만원씩 계산

    // 승인 대기: draft 상태
    const pendingApproval = projects.filter((p) => p.status === "draft").length;

    const stats = { inProgress, completed, totalEstimated, pendingApproval };
    console.log("Calculated stats:", stats);
    return stats;
  };

  const stats = getProjectStats();

  // 최근 6개 프로젝트만 표시
  const recentProjects = filteredProjects.slice(0, 6);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">프로젝트를 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">
          프로젝트를 불러오는데 실패했습니다: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">프로젝트 대시보드</h1>
        <p className="text-gray-600 mt-1">프로젝트 현황을 한눈에 확인하세요</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <span className="text-blue-600 text-xl">▶️</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.inProgress}
              </p>
              <p className="text-sm text-gray-600">진행중인 프로젝트</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
              <span className="text-green-600 text-xl">✅</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.completed}
              </p>
              <p className="text-sm text-gray-600">완료된 프로젝트</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
              <span className="text-purple-600 text-xl">💰</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalEstimated.toLocaleString()}원
              </p>
              <p className="text-sm text-gray-600">총 견적금액</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
              <span className="text-orange-600 text-xl">⏰</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.pendingApproval}
              </p>
              <p className="text-sm text-gray-600">승인 대기</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              최근 프로젝트
            </h2>
            {projects.length > 6 && (
              <Link
                href="/mypage/in-progress"
                className="text-sm text-[#6366F1] hover:text-[#4F46E5] font-medium flex items-center"
              >
                전체 보기 ({projects.length}개)
                <span className="ml-1">→</span>
              </Link>
            )}
          </div>
        </div>

        <div className="p-6">
          {recentProjects.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">프로젝트가 없습니다</div>
              <p className="text-gray-400 mt-2">새 프로젝트를 시작해보세요</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-200 hover:border-gray-300 overflow-hidden"
                >
                  {/* Project Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate flex-1 min-w-0 max-w-[12ch] overflow-hidden">
                          {project.title}
                        </h3>
                        <div className="flex-shrink-0">
                          {getStatusBadge(project.status)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 break-words break-all hyphens-auto leading-relaxed">
                        {project.description}
                      </p>
                    </div>
                  </div>

                  {/* Project Details */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">프로젝트 ID</span>
                      <span
                        className="font-medium text-gray-900 truncate max-w-[120px]"
                        title={`#${project.id}`}
                      >
                        #{project.id}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">요구사항</span>
                      <span className="font-medium text-gray-900">8개</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">견적</span>
                      <span className="font-medium text-gray-900">
                        {project.status === "completed"
                          ? "8,000,000원"
                          : "미산출"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">수정일</span>
                      <span className="font-medium text-gray-900">
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    {project.status === "completed" && (
                      <button className="flex-1 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center truncate">
                        <span className="mr-2 flex-shrink-0">📥</span>
                        <span className="truncate">견적서 다운로드</span>
                      </button>
                    )}
                    <button
                      onClick={() => resumeProject(project.id)}
                      className="flex-1 px-4 py-2 text-sm text-white bg-[#6366F1] hover:bg-[#4F46E5] rounded-md transition-colors duration-200 truncate"
                    >
                      {project.status === "completed"
                        ? "상세보기"
                        : "작성 이어하기"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
