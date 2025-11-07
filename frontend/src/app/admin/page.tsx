"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { RequirementsResultPanel } from "@/components/project/RequirementsResultPanel";
import { ExtractedRequirements } from "@/types/requirements";

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

interface ProjectDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  requirements?: {
    categories?: any[];
    totalCount?: number;
    extractedAt?: string;
    needsReview?: boolean;
    [key: string]: any;
  } | null;
  project_overview?: ProjectOverview | null;
  profiles?: {
    full_name?: string | null;
    email?: string | null;
  };
}

interface ProjectOverview {
  estimation?: {
    totalCost?: string;
  };
  serviceCoreElements?: {
    title: string;
    description: string;
    keyFeatures: string[];
    targetUsers: string[];
    estimatedDuration: string;
  };
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
  const [selectedProject, setSelectedProject] = useState<ProjectDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 프로젝트 견적 금액 계산 함수
  const getEstimateAmount = (project: { 
    requirements?: ExtractedRequirements | null; 
    project_overview?: ProjectOverview | null; 
  }): number => {
    // AI가 생성한 견적이 있으면 해당 금액 사용
    if (project.project_overview?.estimation?.totalCost) {
      const totalCostStr = project.project_overview.estimation.totalCost;
      const cost = parseInt(totalCostStr.replace(/[^0-9]/g, "")) || 0;
      if (cost > 0) return cost;
    }
    
    // AI 견적이 없으면 요구사항당 100만원으로 계산 (임시)
    if (project.requirements) {
      const requirementCount = project.requirements.totalCount || 0;
      return requirementCount * 1000000;
    }
    
    return 0;
  };

  const getRequirementCount = (project: { requirements?: ExtractedRequirements | null }): number => {
    return project.requirements?.totalCount || 0;
  };

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
      
      // 실제 견적금액 합계 계산
      const totalEstimate = (projects || []).reduce((sum, project) => {
        return sum + getEstimateAmount(project);
      }, 0);
      
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

          const estimateAmount = getEstimateAmount(p);

          return {
            id: p.id,
            title: p.title || "제목 없음",
            userName: p.profiles?.full_name || p.profiles?.email || "알 수 없음",
            estimate:
              estimateAmount > 0 ? `₩${estimateAmount.toLocaleString()}` : "견적 산출중",
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

  const openProjectDetail = async (projectId: string) => {
    setIsDetailOpen(true);
    setDetailLoading(true);
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .eq("id", projectId)
        .single();

      if (error) throw error;

      setSelectedProject(data as ProjectDetail);
    } catch (error) {
      console.error("프로젝트 상세 정보 로드 실패:", error);
      alert("프로젝트 정보를 불러올 수 없습니다.");
      setIsDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeProjectDetail = () => {
    setIsDetailOpen(false);
    setSelectedProject(null);
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
                      <button
                        onClick={() => openProjectDetail(review.id)}
                        className="text-sm text-[#6366F1] hover:text-[#4F46E5]"
                      >
                        상세보기
                      </button>
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

      {isDetailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">프로젝트 상세</h2>
              <button
                onClick={closeProjectDetail}
                className="text-gray-500 hover:text-gray-800"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-4rem)]">
              {detailLoading ? (
                <div className="p-8 text-center text-gray-500">
                  프로젝트 정보를 불러오는 중...
                </div>
              ) : selectedProject ? (
                <div className="space-y-6 p-6">
                  <section className="border border-gray-200 rounded-lg p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-2xl font-semibold text-gray-900 mb-1">
                          {selectedProject.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {selectedProject.profiles?.full_name ||
                            selectedProject.profiles?.email ||
                            "알 수 없음"}
                        </p>
                      </div>
                      {getStatusBadge(selectedProject.status)}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                      <div className="space-y-1">
                        <p className="text-gray-500">요청일</p>
                        <p>
                          {new Date(selectedProject.created_at).toLocaleDateString(
                            "ko-KR",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-gray-500">최종 수정일</p>
                        <p>
                          {new Date(selectedProject.updated_at).toLocaleDateString(
                            "ko-KR",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </p>
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <p className="text-gray-500">프로젝트 설명</p>
                        <p className="text-gray-900">
                          {selectedProject.description || "설명 없음"}
                        </p>
                      </div>
                    </div>
                  </section>

                  {selectedProject.project_overview?.serviceCoreElements && (
                    <section className="border border-gray-200 rounded-lg p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        🎯 프로젝트 개요
                      </h3>
                      <div className="space-y-4 text-sm text-gray-800">
                        <div>
                          <p className="text-gray-500 mb-1">서비스명</p>
                          <p className="text-gray-900">
                            {selectedProject.project_overview.serviceCoreElements.title ||
                              selectedProject.title}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">서비스 설명</p>
                          <p className="text-gray-900">
                            {selectedProject.project_overview.serviceCoreElements
                              .description ||
                              selectedProject.description ||
                              "설명 없음"}
                          </p>
                        </div>
                        {selectedProject.project_overview.serviceCoreElements
                          .keyFeatures &&
                          selectedProject.project_overview.serviceCoreElements
                            .keyFeatures.length > 0 && (
                            <div>
                              <p className="text-gray-500 mb-2">핵심 기능</p>
                              <ul className="list-disc list-inside space-y-1 text-gray-900">
                                {selectedProject.project_overview.serviceCoreElements.keyFeatures.map(
                                  (feature, index) => (
                                    <li key={index}>{feature}</li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-gray-500 mb-1">타겟 유저</p>
                            <p className="text-gray-900">
                              {selectedProject.project_overview.serviceCoreElements.targetUsers?.join(
                                ", "
                              ) || "미정"}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1">예상 개발 기간</p>
                            <p className="text-gray-900">
                              {selectedProject.project_overview.serviceCoreElements
                                .estimatedDuration || "미정"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </section>
                  )}

                  <section className="border border-gray-200 rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      💰 견적 정보
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-800">
                      <div className="space-y-1">
                        <p className="text-gray-500">총 견적금액</p>
                        <p className="text-2xl font-bold text-[#6366F1]">
                          {getEstimateAmount(selectedProject)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-gray-500">요구사항 개수</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {getRequirementCount(selectedProject)}개
                        </p>
                      </div>
                    </div>
                  </section>

                  <section className="border border-gray-200 rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      📝 요구사항 상세
                    </h3>
                    {selectedProject.requirements ? (
                      <div className="border border-gray-200 rounded-lg">
                        <RequirementsResultPanel
                          projectData={{
                            description: selectedProject.description || "",
                            serviceType:
                              selectedProject.project_overview?.serviceCoreElements?.title ||
                              "",
                            uploadedFiles: [] as File[],
                            chatMessages: [],
                          }}
                          extractedRequirements={{
                            categories: selectedProject.requirements.categories || [],
                            extractedAt: selectedProject.requirements.extractedAt || selectedProject.created_at,
                            needsReview: selectedProject.requirements.needsReview ?? false,
                            totalCount: selectedProject.requirements.totalCount || 0,
                          }}
                          projectOverview={
                            selectedProject.project_overview || undefined
                          }
                        />
                      </div>
                    ) : (
                      <p className="text-gray-500">
                        요구사항 데이터가 아직 등록되지 않았습니다.
                      </p>
                    )}
                  </section>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  프로젝트 정보를 찾을 수 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
