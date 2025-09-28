"use client";

import { useState, useEffect } from "react";
import { useProjectAPI } from "@/hooks/useProjectAPI";

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
  const { getProjects, loading, error } = useProjectAPI();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("latest");

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    filterAndSortProjects();
  }, [projects, statusFilter, sortOrder]);

  const loadProjects = async () => {
    try {
      const data = await getProjects();
      setProjects(data || []);
    } catch (err) {
      console.error("프로젝트 로드 실패:", err);
    }
  };

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
    const inProgress = projects.filter(
      (p) => p.status === "in_progress"
    ).length;
    const completed = projects.filter((p) => p.status === "completed").length;
    const totalEstimated = projects
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + 8000000, 0); // 임시로 8백만원씩 계산
    const pendingApproval = projects.filter((p) => p.status === "draft").length;

    return { inProgress, completed, totalEstimated, pendingApproval };
  };

  const stats = getProjectStats();

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

      {/* Project List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              프로젝트 목록
            </h2>
            <div className="flex space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">모든 상태</option>
                <option value="in_progress">진행중</option>
                <option value="completed">완료</option>
                <option value="draft">임시저장</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="latest">최신순</option>
                <option value="oldest">오래된순</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">프로젝트가 없습니다</div>
              <p className="text-gray-400 mt-2">새 프로젝트를 시작해보세요</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-200 hover:border-gray-300"
                >
                  {/* Project Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {project.title}
                        </h3>
                        {getStatusBadge(project.status)}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {project.description}
                      </p>
                    </div>
                  </div>

                  {/* Project Details */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">프로젝트 ID</span>
                      <span className="font-medium text-gray-900">
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
                      <button className="flex-1 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center">
                        <span className="mr-2">📥</span>
                        견적서 다운로드
                      </button>
                    )}
                    <button className="flex-1 px-4 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors duration-200">
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
