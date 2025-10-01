import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useProjectRestore } from "./useProjectRestore";

/**
 * 프로젝트 상태에 따라 적절한 단계로 복귀하는 훅
 */
export function useProjectResume() {
  const router = useRouter();
  const { getStepFromStatus } = useProjectRestore();

  /**
   * 프로젝트 ID를 받아서 해당 프로젝트를 이어서 작업
   * 프로젝트 상태에 따라 적절한 단계로 이동
   */
  const resumeProject = async (projectId: string) => {
    try {
      const supabase = createClient();

      // 프로젝트 데이터 조회
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (projectError) throw projectError;
      if (!project) throw new Error("프로젝트를 찾을 수 없습니다");

      // 채팅 메시지 조회
      const { data: messages, error: messagesError } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;

      // 요구사항 조회
      const { data: requirements, error: requirementsError } = await supabase
        .from("requirements")
        .select("*")
        .eq("project_id", projectId);

      if (requirementsError) throw requirementsError;

      // 프로젝트 데이터를 sessionStorage에 저장
      const projectData = {
        projectId: project.id,
        title: project.title,
        description: project.description,
        serviceType: project.service_type,
        status: project.status,
        overview: project.overview || {},
        requirements: project.requirements || {},
        chatMessages: messages || [],
        extractedRequirements: requirements || [],
        timestamp: Date.now(),
      };

      sessionStorage.setItem(
        "flowgence_resume_project",
        JSON.stringify(projectData)
      );

      // 프로젝트 상태에 따라 적절한 단계로 이동
      const targetStep = getStepFromStatus(project.status);
      const targetUrl = getUrlFromStep(targetStep);

      // 메인 페이지로 이동 (쿼리 파라미터로 단계 전달)
      router.push(`${targetUrl}?resume=${projectId}&step=${targetStep}`);
    } catch (error) {
      console.error("프로젝트 복구 실패:", error);
      alert(
        "프로젝트를 불러오는데 실패했습니다. 다시 시도해주세요."
      );
    }
  };

  /**
   * 단계 번호에서 URL로 변환
   */
  const getUrlFromStep = (step: number): string => {
    // 모든 단계가 메인 페이지에서 처리됨
    return "/";
  };

  return {
    resumeProject,
    getStepFromStatus,
  };
}

