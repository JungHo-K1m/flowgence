"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthContext } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

interface Project {
  id: string;
  title: string;
  description: string;
  serviceType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function CompletedProjects() {
  const { user } = useAuthContext();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [sortOrder, setSortOrder] = useState("latest");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoaded = useRef(false);

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
      }));

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
    sortProjects();
  }, [projects, sortOrder]);

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
                      <span className="font-medium text-gray-900">8개</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">견적</span>
                      <span className="font-medium text-gray-900">
                        8,000,000원
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
                    <button className="flex-1 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center truncate">
                      <span className="mr-2 flex-shrink-0">📥</span>
                      <span className="truncate">견적서 다운로드</span>
                    </button>
                    <button className="flex-1 px-4 py-2 text-sm text-white bg-[#6366F1] hover:bg-[#4F46E5] rounded-md transition-colors duration-200 truncate">
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
