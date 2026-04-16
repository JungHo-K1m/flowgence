"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { useProjectResume } from "@/hooks/useProjectResume";
import { generateEstimateMarkdown } from "@/lib/estimateGenerator";
import { downloadMarkdownAsPDF } from "@/lib/pdfGenerator";
import { ExtractedRequirements } from "@/types/requirements";

interface Project {
  id: string;
  title: string;
  description: string;
  serviceType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  project_overview?: any;
  requirements?: any;
  rawData?: any;
}

export default function CompletedProjects() {
  const { user } = useAuthContext();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
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
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const formattedProjects: Project[] = (data || []).map((project: any) => ({
        id: project.id,
        title: project.title || "제목 없음",
        description: project.description || "설명 없음",
        serviceType: project.service_type || "웹사이트",
        status: project.status || "draft",
        createdAt: project.created_at,
        updatedAt: project.updated_at,
        project_overview: project.project_overview,
        requirements: project.requirements,
        rawData: project,
      }));

      setProjects(formattedProjects);
    } catch (err) {
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
    sortProjects();
  }, [projects, sortOrder]);

  // 프로젝트 요구사항 수 계산 함수
  const getRequirementCount = (project: Project): number => {
    if (!project.requirements) return 0;
    const extractedRequirements = project.requirements as ExtractedRequirements;
    return extractedRequirements.totalCount || 0;
  };

  // 프로젝트 견적 금액 계산 함수
  const getEstimateAmount = (project: Project): number => {
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

  const handleDownloadEstimate = async (project: Project) => {
    try {
      if (!project.requirements || !project.project_overview) {
        alert("견적서를 생성할 데이터가 없습니다.");
        return;
      }

      // 필요한 데이터 준비
      const extractedRequirements = project.requirements as ExtractedRequirements;
      const projectOverview = project.project_overview;
      
      // AI 견적 또는 기본값으로 baseEstimate 계산
      const baseEstimate = projectOverview?.estimation?.totalCost
        ? parseInt(projectOverview.estimation.totalCost.replace(/[^0-9]/g, "")) || 85000000
        : 85000000;
      
      // 기본 데이터
      const teamSize = projectOverview?.serviceCoreElements?.requiredTeam?.length || 6;
      const teamBreakdown = projectOverview?.serviceCoreElements?.requiredTeam?.join(", ") ||
        "개발자 4명, 디자이너 1명, PM 1명";
      
      const estimateData = {
        baseEstimate,
        discount: 0,
        finalEstimate: baseEstimate,
        stages: [
          { name: "기획 및 설계", duration: projectOverview?.estimation?.timeline?.planning || "2주", percentage: 20, cost: Math.round(baseEstimate * 0.2) },
          { name: "개발", duration: projectOverview?.estimation?.timeline?.development || "6주", percentage: 50, cost: Math.round(baseEstimate * 0.5) },
          { name: "테스트", duration: projectOverview?.estimation?.timeline?.testing || "2주", percentage: 15, cost: Math.round(baseEstimate * 0.15) },
          { name: "배포 및 안정화", duration: projectOverview?.estimation?.timeline?.deployment || "2주", percentage: 15, cost: Math.round(baseEstimate * 0.15) },
        ],
        payments: [
          { stage: "계약 시", percentage: 30, amount: Math.round(baseEstimate * 0.3) },
          { stage: "중간 검수", percentage: 40, amount: Math.round(baseEstimate * 0.4) },
          { stage: "최종 납품", percentage: 30, amount: Math.round(baseEstimate * 0.3) },
        ],
        projectOverview: {
          duration: projectOverview?.serviceCoreElements?.estimatedDuration || "12주",
          period: "2025년 1월~4월",
          personnel: teamSize,
          breakdown: teamBreakdown,
          warranty: "1년",
          warrantyDetail: "무상 유지보수",
        },
      };
      
      const requirementsData = {
        total: extractedRequirements.totalCount || 0,
        mandatory: extractedRequirements.categories?.reduce((acc, cat) =>
          acc + (cat.subCategories?.reduce((subAcc, sub) =>
            subAcc + (sub.requirements?.filter((r) => r.priority === "high").length || 0), 0
          ) || 0), 0
        ) || 0,
        recommended: extractedRequirements.categories?.reduce((acc, cat) =>
          acc + (cat.subCategories?.reduce((subAcc, sub) =>
            subAcc + (sub.requirements?.filter((r) => r.priority === "medium").length || 0), 0
          ) || 0), 0
        ) || 0,
        optional: extractedRequirements.categories?.reduce((acc, cat) =>
          acc + (cat.subCategories?.reduce((subAcc, sub) =>
            subAcc + (sub.requirements?.filter((r) => r.priority === "low").length || 0), 0
          ) || 0), 0
        ) || 0,
        projectType: project.serviceType,
        estimatedUsers: projectOverview?.serviceCoreElements?.targetUsers?.join(", ") || "미정",
        duration: projectOverview?.serviceCoreElements?.estimatedDuration || "미정",
      };
      
      const projectDataForEstimate = {
        description: project.description,
        serviceType: project.serviceType,
        uploadedFiles: [],
        chatMessages: [],
      };

      // 마크다운 생성
      const markdown = generateEstimateMarkdown(
        estimateData,
        requirementsData,
        projectDataForEstimate,
        projectOverview,
        extractedRequirements
      );

      // PDF 다운로드
      await downloadMarkdownAsPDF(markdown, {
        filename: `견적서_${project.serviceType}_${new Date().toISOString().split("T")[0]}.pdf`,
        title: `${project.serviceType} 프로젝트 견적서`,
        author: "Flowgence",
        subject: "프로젝트 견적서",
      });
    } catch (error) {
      alert("견적서 다운로드에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const sortProjects = () => {
    const sorted = [...projects].sort((a, b) => {
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

    setFilteredProjects(sorted);
  };

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">완료된 프로젝트</h1>
        <p className="text-gray-600 mt-1">
          완료된 프로젝트들을 확인하세요 ({projects.length}개)
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              프로젝트 목록
            </h2>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
            >
              <option value="latest">최신순</option>
              <option value="oldest">오래된순</option>
            </select>
          </div>
        </div>

        <div className="p-6">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">
                완료된 프로젝트가 없습니다
              </div>
              <p className="text-gray-400 mt-2">프로젝트를 완료해보세요</p>
              <Link href="/project/new">
                <button className="mt-4 px-6 py-2 bg-[#6366F1] text-white rounded-lg hover:bg-[#4F46E5] transition-colors duration-200">
                  + 새 프로젝트 시작하기
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-200 hover:border-gray-300 overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate flex-1 min-w-0 max-w-[12ch] overflow-hidden">
                          {project.title}
                        </h3>
                        <div className="flex-shrink-0">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            완료
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 break-words break-all hyphens-auto leading-relaxed">
                        {project.description}
                      </p>
                    </div>
                  </div>

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
                      <span className="font-medium text-gray-900">
                        {getRequirementCount(project) || 0}개
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">견적</span>
                      <span className="font-medium text-gray-900">
                        {getEstimateAmount(project).toLocaleString()}원
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">완료일</span>
                      <span className="font-medium text-gray-900">
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button 
                      onClick={() => handleDownloadEstimate(project)}
                      className="flex-1 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center truncate"
                    >
                      <span className="mr-2 flex-shrink-0">📥</span>
                      <span className="truncate">견적서 다운로드</span>
                    </button>
                    <button
                      onClick={() => resumeProject(project.id)}
                      className="flex-1 px-4 py-2 text-sm text-white bg-[#6366F1] hover:bg-[#4F46E5] rounded-md transition-colors duration-200 truncate"
                    >
                      상세보기
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
