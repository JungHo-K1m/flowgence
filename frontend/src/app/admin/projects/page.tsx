"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import { ExtractedRequirements } from "@/types/requirements";
import { RequirementsResultPanel } from "@/components/project/RequirementsResultPanel";

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

interface Project {
  id: string;
  title: string;
  userName: string;
  status: string;
  createdAt: string;
  estimateDate: string;
  estimate: string;
  requirementsCount: number;
  requirements?: ExtractedRequirements;
  project_overview?: ProjectOverview;
}

interface ProjectDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  requirements?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    categories?: any[];
    totalCount?: number;
    extractedAt?: string;
    needsReview?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  } | null;
  project_overview?: ProjectOverview | null;
  profiles?: {
    full_name?: string | null;
    email?: string | null;
  };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedProject, setSelectedProject] = useState<ProjectDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterProjects();
    // 필터 변경 시 첫 페이지로 이동
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, projects]);

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProjects.slice(startIndex, endIndex);
  }, [filteredProjects, currentPage, itemsPerPage]);

  // 페이지 변경
  const handlePageChange = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  // 페이지당 항목 수 변경
  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1); // 첫 페이지로 이동
  };

  // 페이지 번호 배열 생성 (최대 5개)
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  // 프로젝트 요구사항 수 계산 함수
  const getRequirementCount = (project: { requirements?: ExtractedRequirements | null }): number => {
    if (!project.requirements) return 0;
    const extractedRequirements = project.requirements as ExtractedRequirements;
    return extractedRequirements.totalCount || 0;
  };

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
      const extractedRequirements = project.requirements as ExtractedRequirements;
      const requirementCount = extractedRequirements.totalCount || 0;
      return requirementCount * 1000000;
    }
    
    return 0;
  };

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

      const formattedProjects: Project[] = (projects || []).map((p) => {
        const requirementCount = getRequirementCount(p);
        const estimateAmount = getEstimateAmount(p);

        return {
          id: p.id,
          title: p.title || "제목 없음",
          userName: p.profiles?.full_name || p.profiles?.email || "알 수 없음",
          status: p.status || "draft",
          createdAt: p.created_at,
          estimateDate: p.updated_at,
          estimate: estimateAmount > 0 ? `${estimateAmount.toLocaleString()}원` : "미산출",
          requirementsCount: requirementCount,
          requirements: p.requirements,
          project_overview: p.project_overview,
        };
      });

      setProjects(formattedProjects);
      setFilteredProjects(formattedProjects);
    } catch (error) {
      // silently ignore
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

  // 프로젝트 상세 보기 열기
  const openProjectDetail = async (id: string) => {
    setIsDetailOpen(true);
    setDetailLoading(true);
    
    try {
      const supabase = createClient();
      const { data: project, error } = await supabase
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
        .eq("id", id)
        .single();

      if (error) throw error;

      setSelectedProject(project);
    } catch (error) {
      setSelectedProject(null);
    } finally {
      setDetailLoading(false);
    }
  };

  // 프로젝트 상세 보기 닫기
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
        <div className="flex items-center gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1] min-w-[150px]"
          >
            <option value="all">전체 상태</option>
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
              placeholder="프로젝트명 또는 사용자명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 whitespace-nowrap">표시 개수:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
            >
              <option value={10}>10개</option>
              <option value={30}>30개</option>
              <option value={50}>50개</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-[25%]">
                  프로젝트명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-[15%]">
                  사용자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-[10%]">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-[10%]">
                  생성일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-[10%]">
                  수정일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-[12%]">
                  견적금액
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-[10%] text-center">
                  요구사항 개수
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-[8%]">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedProjects.length === 0 ? (
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
                paginatedProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 max-w-xs truncate" title={project.title}>
                        {project.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="max-w-[200px] truncate" title={project.userName}>
                        {project.userName}
                      </div>
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
                      <div className="truncate" title={project.estimate}>
                        {project.estimate}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {project.requirementsCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button 
                        onClick={() => openProjectDetail(project.id)}
                        className="text-[#6366F1] hover:text-[#4F46E5] font-medium"
                      >
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
                총 {filteredProjects.length}개 프로젝트 (
                {(currentPage - 1) * itemsPerPage + 1}-
                {Math.min(currentPage * itemsPerPage, filteredProjects.length)}개 표시)
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 text-sm rounded ${
                    currentPage === 1
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  이전
                </button>
                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 text-sm rounded ${
                      currentPage === page
                        ? "bg-[#6366F1] text-white"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 text-sm rounded ${
                    currentPage === totalPages
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  다음
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 프로젝트 상세 모달 */}
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
                  {/* 프로젝트 기본 정보 */}
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

                  {/* 프로젝트 개요 */}
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

                  {/* 견적 정보 */}
                  <section className="border border-gray-200 rounded-lg p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      💰 견적 정보
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-800">
                      <div className="space-y-1">
                        <p className="text-gray-500">총 견적금액</p>
                        <p className="text-2xl font-bold text-[#6366F1]">
                          {getEstimateAmount({
                            requirements: selectedProject.requirements as ExtractedRequirements | null,
                            project_overview: selectedProject.project_overview
                          }).toLocaleString()}원
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-gray-500">요구사항 개수</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {getRequirementCount({
                            requirements: selectedProject.requirements as ExtractedRequirements | null
                          })}개
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* 요구사항 상세 */}
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
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            (selectedProject.project_overview || undefined) as any
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

