"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

interface DashboardStats {
  totalProjects: number;
  completedProjects: number;
  totalEstimate: number;
  pendingApproval: number;
}

interface RecentProject {
  id: string;
  title: string;
  userName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface PendingReview {
  id: string;
  title: string;
  userName: string;
  estimate: string;
  daysWaiting: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    completedProjects: 0,
    totalEstimate: 0,
    pendingApproval: 0,
  });
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      // 전체 프로젝트 조회
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .order("updated_at", { ascending: false });

      if (projectsError) throw projectsError;

      // 통계 계산
      const totalProjects = projects?.length || 0;
      const completedProjects =
        projects?.filter((p) => p.status === "completed").length || 0;
      const totalEstimate =
        (projects?.filter((p) => p.status === "completed").length || 0) *
        8000000;
      const pendingApproval =
        projects?.filter((p) => p.status === "draft").length || 0;

      setStats({
        totalProjects,
        completedProjects,
        totalEstimate,
        pendingApproval,
      });

      // 최근 프로젝트 (3개)
      const recent: RecentProject[] = (projects || []).slice(0, 3).map((p) => ({
        id: p.id,
        title: p.title || "제목 없음",
        userName: p.profiles?.full_name || p.profiles?.email || "알 수 없음",
        status: p.status || "draft",
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      }));
      setRecentProjects(recent);

      // 승인 대기 검토 (3개)
      const pending: PendingReview[] = (projects || [])
        .filter((p) =>
          ["requirements_review", "estimation", "contract"].includes(p.status)
        )
        .slice(0, 3)
        .map((p) => {
          const createdDate = new Date(p.created_at);
          const today = new Date();
          const diffTime = Math.abs(today.getTime() - createdDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          return {
            id: p.id,
            title: p.title || "제목 없음",
            userName: p.profiles?.full_name || p.profiles?.email || "알 수 없음",
            estimate:
              p.status === "completed" ? "₩15,000,000" : "견적 산출중",
            daysWaiting: diffDays,
          };
        });
      setPendingReviews(pending);
    } catch (error) {
      console.error("대시보드 데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
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
        <div className="text-gray-500">데이터를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <input
          type="text"
          placeholder="검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1] w-64"
        />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <span className="text-2xl">▶️</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalProjects}
              </p>
              <p className="text-sm text-gray-600">진행중인 프로젝트</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
              <span className="text-2xl">✅</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.completedProjects}
              </p>
              <p className="text-sm text-gray-600">완료된 프로젝트</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
              <span className="text-2xl">💰</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalEstimate.toLocaleString()}원
              </p>
              <p className="text-sm text-gray-600">총 견적금액</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
              <span className="text-2xl">⏰</span>
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

      {/* Recent Projects & Pending Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                최근 프로젝트
              </h2>
              <Link
                href="/admin/projects"
                className="text-sm text-[#6366F1] hover:text-[#4F46E5] font-medium"
              >
                전체보기 →
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentProjects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  프로젝트가 없습니다
                </div>
              ) : (
                recentProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {project.title}
                        </h3>
                        {getStatusBadge(project.status)}
                      </div>
                      <p className="text-sm text-gray-600">
                        {project.userName} •{" "}
                        {new Date(project.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Pending Reviews */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              승인 대기 검토
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {pendingReviews.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  승인 대기 중인 프로젝트가 없습니다
                </div>
              ) : (
                pendingReviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {review.title}
                      </h3>
                      <Link
                        href={`/admin/projects/${review.id}`}
                        className="text-sm text-[#6366F1] hover:text-[#4F46E5]"
                      >
                        상세보기
                      </Link>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {review.estimate} • {review.daysWaiting}일 전 발송
                    </p>
                    <p className="text-sm text-gray-600">{review.userName}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
