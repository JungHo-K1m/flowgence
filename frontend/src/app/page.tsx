"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  Suspense,
} from "react";
import { useSearchParams } from "next/navigation";
import { ServiceTypeButtons } from "@/components/project/ServiceTypeButtons";
import { FileUpload } from "@/components/project/FileUpload";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { ProjectOverviewPanel } from "@/components/project/ProjectOverviewPanel";
import { RequirementsPanel } from "@/components/requirements/RequirementsPanel";
import { RequirementsLoading } from "@/components/requirements/RequirementsLoading";
import { AIVerificationLoading } from "@/components/requirements/AIVerificationLoading";
import { VerificationResultModal } from "@/components/requirements/VerificationResultModal";
import { ConfirmationPanel } from "@/components/project/ConfirmationPanel";
import { useWireframe } from "@/hooks/useWireframe";
import { RequirementsResultPanel } from "@/components/project/RequirementsResultPanel";
import { FinalConfirmationModal } from "@/components/project/FinalConfirmationModal";
import { ProgressBar } from "@/components/layout/ProgressBar";
import { MobileTabLayout } from "@/components/layout/MobileTabLayout";
import { MobileRequirementsPanel } from "@/components/requirements/MobileRequirementsPanel";
import { LoginRequiredModal } from "@/components/auth/LoginRequiredModal";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useStatePersistence } from "@/hooks/useStatePersistence";
import { useSessionManager, SessionData } from "@/hooks/useSessionManager";
import { SimpleRequirementModal } from "@/components/requirements/SimpleRequirementModal";
import { CategoryDeleteConfirmModal } from "@/components/requirements/CategoryDeleteConfirmModal";
import { useRequirementsExtraction } from "@/hooks/useRequirementsExtraction";
import { useRequirementsUpdate } from "@/hooks/useRequirementsUpdate";
import { useProjectStorage } from "@/hooks/useProjectStorage";
import { useProjectResume } from "@/hooks/useProjectResume";
import { supabase } from "@/lib/supabase";
import {
  ExtractedRequirements,
  RequirementCategory,
  Requirement,
} from "@/types/requirements";
import { useProjectOverview } from "@/hooks/useProjectOverview";
import { useProjectRestore } from "@/hooks/useProjectRestore";
import {
  extractContentFromFiles,
  validateFileSize,
  validateFileType,
  SUPPORTED_FILE_TYPES,
  MAX_FILE_SIZE_MB,
} from "@/lib/fileProcessor";

interface Message {
  id: string;
  type: "system" | "ai" | "user";
  content: string;
  description?: string;
  icon?: string;
  options?: Array<{ id: string; label: string }>;
}

function HomePageContent() {
  const searchParams = useSearchParams();
  const [projectDescription, setProjectDescription] = useState("");
  const [selectedServiceType, setSelectedServiceType] = useState<string>("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [showChatInterface, setShowChatInterface] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showRequirements, setShowRequirements] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showFinalResult, setShowFinalResult] = useState(false);
  const [showFinalModal, setShowFinalModal] = useState(false);
  const [isRequirementsLoading, setIsRequirementsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false); // AI 검증 중 상태
  const [verificationResult, setVerificationResult] = useState<any>(null); // AI 검증 결과
  const [showVerificationModal, setShowVerificationModal] = useState(false); // AI 검증 결과 모달
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  
  // 와이어프레임 관련 상태
  const { wireframe, isGenerating, isApplying, error: wireframeError, generateWireframe, applyEdit, clearWireframe, setWireframe } = useWireframe();
  const hasResumedProject = useRef(false);
  const isProcessingStep1To2 = useRef(false); // 1단계 → 2단계 전환 중복 호출 방지
  
  // 파일 처리 관련 상태
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [fileProcessingMessage, setFileProcessingMessage] = useState("");
  const [fileProcessingError, setFileProcessingError] = useState("");
  const [fileContents, setFileContents] = useState<string>(""); // 파일 내용 별도 저장 (API 요청용)
  const [userComment, setUserComment] = useState<string>(""); // 사용자가 직접 입력한 코멘트
  const [fileNamesDisplay, setFileNamesDisplay] = useState<string>(""); // 파일명 표시용 (UI만)

  // 세션 관리
  const {
    saveSession,
    restoreSession,
    clearSession,
    startAutoSave,
    stopAutoSave,
    isRestoring,
  } = useSessionManager();
  
  const hasRestoredSession = useRef(false);

  // 페이지 로드 시 스크롤 위치 조정 제거 (전체 화면 레이아웃으로 변경)
  // useEffect(() => {
  //   // 채팅 UI가 있는 단계(2단계)에서는 스크롤하지 않음
  //   if (showChatInterface && showRequirements) {
  //     return; // 채팅 UI에서는 스크롤 위치 유지
  //   }

  //   // 메인 페이지(1단계)에서만 상단으로 스크롤
  //   if (
  //     !showChatInterface &&
  //     !showRequirements &&
  //     !showConfirmation &&
  //     !showFinalResult
  //   ) {
  //     // 즉시 스크롤
  //     window.scrollTo(0, 0);

  //     // 추가적으로 약간의 지연 후에도 스크롤 (일부 브라우저에서 지연 로딩으로 인한 문제 방지)
  //     const timeoutId = setTimeout(() => {
  //       window.scrollTo(0, 0);
  //     }, 100);

  //     return () => clearTimeout(timeoutId);
  //   }
  // }, [showChatInterface, showRequirements, showConfirmation, showFinalResult]);

  // useProjectOverview 훅 사용
  const {
    overview,
    updateOverview,
    setOverviewDirectly,
    isLoading: isOverviewLoading,
    aiMessage,
  } = useProjectOverview();

  // useProjectRestore 훅 사용 (공통 복원 로직)
  const { restoreProjectState } = useProjectRestore();

  // 요구사항 추출 및 저장 훅 사용
  const {
    extractRequirements,
    isLoading: isExtractingRequirements,
    extractedRequirements,
    updateExtractedRequirements,
  } = useRequirementsExtraction();

  // 세션 복원 로직 (페이지 로드 시 자동 실행)
  useEffect(() => {
    // DB에서 복원 중이거나 이미 복원했으면 건너뛰기
    if (hasResumedProject.current || hasRestoredSession.current) {
      return;
    }

    // URL 파라미터로 복원하는 경우도 건너뛰기
    const resumeProjectId = searchParams.get("resume");
    if (resumeProjectId) {
      return;
    }

    // 1단계 → 2단계 전환 중이면 세션 복원하지 않음
    if (isProcessingStep1To2.current) {
      return;
    }

      // 세션 복원
      const sessionData = restoreSession();
      if (sessionData) {
        hasRestoredSession.current = true;
        isRestoring.current = true;

      // 상태 복원
      setProjectDescription(sessionData.projectDescription);
      setUserComment(sessionData.userComment);
      setFileNamesDisplay(sessionData.fileNamesDisplay);
      setSelectedServiceType(sessionData.selectedServiceType);
      // 1단계 → 2단계 전환 중이 아닐 때만 currentStep 복원
      if (!isProcessingStep1To2.current) {
        setCurrentStep(sessionData.currentStep);
      }
      setChatMessages(sessionData.chatMessages || []);
      setEditableRequirements(sessionData.editableRequirements);
      if (sessionData.extractedRequirements && updateExtractedRequirements) {
        updateExtractedRequirements(sessionData.extractedRequirements);
      }
      setShowChatInterface(sessionData.showChatInterface);
      setShowRequirements(sessionData.showRequirements);
      setShowConfirmation(sessionData.showConfirmation);
      setShowFinalResult(sessionData.showFinalResult);
      setFileContents(sessionData.fileContents || "");

      // 파일 메타데이터 복원 (실제 File 객체는 복원 불가, 사용자에게 재업로드 안내 필요)
      if (sessionData.uploadedFiles && sessionData.uploadedFiles.length > 0) {
        // File 객체는 복원할 수 없으므로 fileNamesDisplay만 복원됨
        // 필요시 파일 재업로드 안내 메시지 표시 가능
      }

      // 개요 복원
      if (sessionData.overview && updateOverview) {
        updateOverview(
          {
            description: sessionData.projectDescription,
            serviceType: sessionData.selectedServiceType,
            uploadedFiles: [],
          },
          sessionData.chatMessages || []
        );
      }

      // 복원 완료
      setTimeout(() => {
        isRestoring.current = false;
      }, 500);
    }
  }, [searchParams, restoreSession, updateOverview, updateExtractedRequirements]);

  // 요구사항 업데이트 훅 사용
  const {
    updateRequirements: updateRequirementsFromChat,
    isLoading: isUpdatingRequirements,
  } = useRequirementsUpdate();

  const {
    saveProjectWithMessages,
    saveRequirements,
    updateProjectStatus,
    updateProjectOverview,
    isLoading: isSaving,
    error: saveError,
    savedProjectId,
    getProjectData,
    setSavedProjectId,
  } = useProjectStorage();

  // 프로젝트 복구 로직 (이어서 작업하기 - DB 저장된 프로젝트)
  useEffect(() => {
    const resumeProjectId = searchParams.get("resume");
    const targetStep = searchParams.get("step");

    if (resumeProjectId && targetStep && !hasResumedProject.current) {
      hasResumedProject.current = true;

      const resumeData = sessionStorage.getItem("flowgence_resume_project");
      if (resumeData) {
        try {
          const projectData = JSON.parse(resumeData);

          const step = parseInt(targetStep);

          // 프로젝트 ID 설정 (요구사항 편집 시 저장을 위해 필수)
          if (projectData.projectId) {
            setSavedProjectId(projectData.projectId);
          }

          // 공통 복원 로직 사용
          restoreProjectState(projectData, step, {
            setProjectDescription,
            setSelectedServiceType,
            setChatMessages,
            setCurrentStep,
            setShowChatInterface,
            setShowRequirements,
            setShowConfirmation,
            setShowFinalResult,
            updateOverview,
            setOverviewDirectly,
            updateExtractedRequirements,
            setEditableRequirements,
            setWireframe, // 와이어프레임 복원 추가
          });

          // 프로젝트 개요가 없으면 DB에서 다시 조회
          if (!projectData.overview && projectData.projectId) {
            getProjectData(projectData.projectId)
              .then((data) => {
                if (data?.project?.project_overview && setOverviewDirectly) {
                  setOverviewDirectly(data.project.project_overview);
                }
              })
              .catch((error) => {
                console.error("DB에서 프로젝트 개요 조회 실패:", error);
              });
          }

          // 복구 완료 후 sessionStorage 정리
          sessionStorage.removeItem("flowgence_resume_project");
        } catch (error) {
          console.error("프로젝트 복구 실패:", error);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    searchParams,
    restoreProjectState,
    updateOverview,
    setOverviewDirectly,
    updateExtractedRequirements,
    getProjectData,
    setSavedProjectId,
  ]);

  // 외부 URL 쿼리 파라미터로 프로젝트 초기화 (다른 사이트에서 링크로 접근)
  const hasInitializedFromQuery = useRef(false);

  // 요구사항 편집 모달 상태
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string>("");
  // 로컬 편집용 요구사항 상태 (AI 추출 값을 기반으로 편집 반영)
  const [editableRequirements, setEditableRequirements] =
    useState<ExtractedRequirements | null>(null);

  // 편집 모드 상태 (UI 편집 중인지 채팅 편집 중인지 구분)
  const [isEditingMode, setIsEditingMode] = useState(false);

  // 통합 로딩 상태 (요구사항 추출 + 업데이트 + 저장)
  const isProcessing =
    isExtractingRequirements ||
    isUpdatingRequirements ||
    isSaving ||
    isRequirementsLoading;

  // 디버깅용 로그 (1단계 버튼 활성화 상태 확인)
  // useEffect(() => {
  //   console.log("=== 1단계 버튼 활성화 상태 디버깅 ===");
  //   console.log("overview 존재 여부:", !!overview);
  //   console.log("overview 데이터:", overview);
  //   console.log("isOverviewLoading:", isOverviewLoading);
  //   console.log("=====================================");
  // }, [overview, isOverviewLoading]);

  // 2단계 버튼 활성화 조건: 요구사항 로딩 완료 + 결정 필요 요구사항 모두 편집 완료
  const isStep2ButtonEnabled = useMemo(() => {
    const currentRequirements = editableRequirements || extractedRequirements;

    // 요구사항이 로딩 중이면 비활성화
    if (isProcessing || !currentRequirements) {
      return false;
    }

    // 결정이 필요한 요구사항이 있는지 확인
    const needsClarificationRequirements =
      currentRequirements.categories?.flatMap(
        (category: RequirementCategory) =>
          category.subCategories?.flatMap((subCategory) =>
            (subCategory.requirements || []).filter(
              (req: Requirement) =>
                req.needsClarification && req.status !== "approved"
            )
          ) || []
      ) || [];

    // 결정이 필요한 요구사항이 모두 편집 완료되었는지 확인
    return needsClarificationRequirements.length === 0;
  }, [editableRequirements, extractedRequirements, isProcessing]);

  // 중분류 삭제 확인 모달 상태
  const [showCategoryDeleteModal, setShowCategoryDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{
    id: string;
    title: string;
    requirementCount: number;
  } | null>(null);

  // AI 추출 결과가 들어오면 편집용 상태 초기화
  useEffect(() => {
    if (extractedRequirements && !editableRequirements) {
      setEditableRequirements(extractedRequirements);
    }
  }, [extractedRequirements, editableRequirements]);

  // 인증 가드 및 상태 유지 (loadRecentProjects를 위해 먼저 선언)
  const {
    user,
    loading,
    showLoginModal,
    requireAuth,
    closeLoginModal,
    processLoginState,
    isProcessingLogin,
    tempState,
    hasTempState,
  } = useAuthGuard();

  // 최근 작업 목록 (로그인 유저 전용)
  const [recentProjects, setRecentProjects] = useState<Array<{
    id: string;
    title: string;
    updatedAt: string;
  }>>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);

  const hasLoadedRecent = useRef(false);
  const isLoadingRecentRef = useRef(false);
  const recentCooldownUntilRef = useRef<number>(0);
  
  // 최근 작업 목록 불러오기 함수 (재사용 가능하도록 분리)
  const loadRecentProjects = useCallback(async (force = false) => {
    // 인증 로딩 중에는 실행하지 않음
    if (loading) return;

    // 사용자 없으면 초기화 후 종료
    if (!user) {
      setRecentProjects([]);
      hasLoadedRecent.current = false;
      return;
    }
    
    // 쿨다운 중이면 실행하지 않음
    if (recentCooldownUntilRef.current > Date.now()) return;
    
    // 이미 로딩 중이면 실행하지 않음
    if (isLoadingRecentRef.current) return;
    
    // force가 false이고 이미 불러왔다면 재실행 방지
    if (!force && hasLoadedRecent.current) return;
    
    try {
      setIsLoadingRecent(true);
      isLoadingRecentRef.current = true;
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, updated_at, status")
        .eq("user_id", user.id)
        .in("status", [
          "requirements_review",
          "requirements_extraction",
          "estimation",
          "contract",
          "in_progress",
          "draft", // 초기 상태도 포함
        ]) // 진행중인 프로젝트만 포함 (마이페이지와 동일한 조건)
        .order("updated_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      const items = (data || []).map((p: any) => ({
        id: p.id,
        title: p.title || "제목 없음",
        updatedAt: p.updated_at,
      }));
      setRecentProjects(items);
      hasLoadedRecent.current = true;
    } catch (e) {
      console.error("최근 작업 불러오기 실패:", e);
      setRecentProjects([]);
      hasLoadedRecent.current = false;
      // 60초 쿨다운 설정 (연속 실패 방지)
      recentCooldownUntilRef.current = Date.now() + 60_000;
    } finally {
      setIsLoadingRecent(false);
      isLoadingRecentRef.current = false;
    }
  }, [user, loading]);

  // 최근 작업 목록 불러오기 (로그인 시)
  useEffect(() => {
    if (!loading && user?.id) {
      loadRecentProjects(false);
    }
  }, [user?.id, loading, loadRecentProjects]);

  // 편집된 요구사항을 DB에 저장
  const saveEditedRequirements = useCallback(
    async (updatedRequirements: ExtractedRequirements) => {

      if (!savedProjectId) {
        console.warn("⚠️ 저장된 프로젝트 ID가 없습니다. DB 저장을 건너뜁니다.", {
          savedProjectId,
          requirementsCount: updatedRequirements.totalCount,
        });
        return;
      }

      try {
        // 1. 요구사항 저장
        const result = await saveRequirements(
          savedProjectId,
          updatedRequirements
        );

        if (result.status === "success") {
          // 2. 프로젝트 개요도 함께 저장

          // 현재 overview state가 있으면 사용하고, 없으면 DB에서 조회
          let overviewToSave = overview;
          if (!overviewToSave && savedProjectId) {
            try {
              const projectData = await getProjectData(savedProjectId);
              if (projectData?.project?.project_overview) {
                overviewToSave = projectData.project.project_overview;
                // 조회한 overview를 state에도 설정
                if (setOverviewDirectly) {
                  setOverviewDirectly(overviewToSave);
                }
              } else {
                console.warn("DB에서도 프로젝트 개요를 찾을 수 없음");
              }
            } catch (fetchError) {
              console.error("DB에서 overview 조회 실패:", fetchError);
            }
          }

          if (overviewToSave) {
            try {
              await updateProjectOverview(savedProjectId, overviewToSave);
            } catch (overviewError) {
              console.error("❌ 프로젝트 개요 저장 실패:", {
                error: overviewError,
                projectId: savedProjectId,
                hasOverview: !!overviewToSave,
              });
              // 개요 저장 실패해도 요구사항은 저장되었으므로 계속 진행
            }
          } else {
            console.warn("⚠️ 프로젝트 개요가 없어서 저장하지 않습니다:", {
              hasOverviewState: !!overview,
              savedProjectId,
            });
          }

          // 성공 토스트 표시 (추후 구현)
          // 최근 작업 목록 갱신 (프로젝트 updated_at이 업데이트되었으므로)
          loadRecentProjects(true);
        } else {
          console.error("편집된 요구사항 DB 저장 실패:", {
            status: result.status,
            message: result.message,
          });
          // 실패 토스트 표시 (추후 구현)
          throw new Error(result.message || "저장에 실패했습니다");
        }
      } catch (error) {
        console.error("편집된 요구사항 DB 저장 중 오류:", error, {
          savedProjectId,
          errorType:
            error instanceof Error ? error.constructor.name : typeof error,
          errorMessage: error instanceof Error ? error.message : String(error),
        });
        // 오류 토스트 표시 (추후 구현)
        throw error;
      }
    },
    [savedProjectId, saveRequirements, updateProjectOverview, overview, loadRecentProjects, getProjectData, setOverviewDirectly]
  );

  // onProjectUpdate 콜백을 useCallback으로 감싸서 불필요한 리렌더링 방지
  const handleProjectUpdate = useCallback(
    async (data: {
      description: string;
      serviceType: string;
      uploadedFiles: File[];
      messages: Message[];
    }) => {
      // UI 편집 모드가 아닐 때만 채팅 업데이트 진행
      if (isEditingMode) {
        return;
      }

      // 채팅 편집 모드 시작
      setIsEditingMode(true);

      // 1. 프로젝트 개요 업데이트
      try {
        // API 요청 시에는 사용자 코멘트 + 파일 내용을 포함 (UI에는 파일명만 표시되지만 API에는 전체 내용 전송)
        const descriptionWithFileContents = (() => {
          // data.description에서 파일명 부분 제거 (사용자 코멘트만 추출)
          const fileSectionRegex = /\n\n\[업로드된 파일\]\n[\s\S]*$/;
          const pureComment = data.description.replace(fileSectionRegex, "").trim();
          
          // 사용자 코멘트 + 파일 내용 결합
          if (fileContents) {
            return pureComment
              ? `${pureComment}\n\n[업로드된 파일 내용]\n${fileContents}`
              : `[업로드된 파일 내용]\n${fileContents}`;
          }
          return pureComment;
        })();
        
        await updateOverview(
          {
            description: descriptionWithFileContents,
            serviceType: data.serviceType,
            uploadedFiles: data.uploadedFiles,
          },
          data.messages
        );
      } catch (error) {
        console.error("프로젝트 개요 업데이트 실패:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        // Claude API 529 (Overloaded) 에러 처리
        if (
          errorMessage.includes("529") ||
          errorMessage.includes("Overloaded")
        ) {
          setIsEditingMode(false);
          return; // useProjectOverview에서 이미 알림과 리다이렉트 처리됨
        }

        // 다른 에러는 그대로 전파
        throw error;
      }

      // 2. 요구사항이 이미 추출되어 있다면 업데이트
      const currentRequirements = editableRequirements || extractedRequirements;
      if (currentRequirements && savedProjectId) {

        try {
          // API 요청 시에는 사용자 코멘트 + 파일 내용을 포함
          const descriptionWithFileContents = (() => {
            // data.description에서 파일명 부분 제거 (사용자 코멘트만 추출)
            const fileSectionRegex = /\n\n\[업로드된 파일\]\n[\s\S]*$/;
            const pureComment = data.description.replace(fileSectionRegex, "").trim();
            
            // 사용자 코멘트 + 파일 내용 결합
            if (fileContents) {
              return pureComment
                ? `${pureComment}\n\n[업로드된 파일 내용]\n${fileContents}`
                : `[업로드된 파일 내용]\n${fileContents}`;
            }
            return pureComment;
          })();
          
          const updatedRequirements = await updateRequirementsFromChat(
            {
              description: descriptionWithFileContents,
              serviceType: data.serviceType,
              uploadedFiles: data.uploadedFiles,
              projectOverview: overview,
            },
            data.messages.map((msg) => ({
              type: msg.type === "ai" ? "ai" : msg.type,
              content: msg.content,
            })),
            currentRequirements
          );

          // 업데이트된 요구사항을 상태에 반영
          // 편집된 요구사항이 있다면 그것을 우선적으로 사용
          setEditableRequirements(updatedRequirements);

          // DB에 저장
          await saveEditedRequirements(updatedRequirements);
        } catch (error) {
          console.error("요구사항 업데이트 실패:", error);
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";

          // Claude API 529 (Overloaded) 에러 처리
          if (
            errorMessage.includes("529") ||
            errorMessage.includes("Overloaded")
          ) {
            alert(
              "현재 사용량이 많아 서비스가 일시적으로 지연되고 있습니다. 잠시 후 다시 시도해주세요."
            );
            window.location.href = "/";
            return;
          }

          // 업데이트 실패해도 프로젝트 개요는 업데이트되었으므로 계속 진행
        } finally {
          // 채팅 편집 모드 종료
          setIsEditingMode(false);
        }
      } else {
        // 채팅 편집 모드 종료
        setIsEditingMode(false);
      }
    },
    [
      updateOverview,
      editableRequirements,
      extractedRequirements,
      savedProjectId,
      updateRequirementsFromChat,
      overview,
      saveEditedRequirements,
      isEditingMode,
      fileContents,
    ]
  );

  // 카테고리 id 정규화 유틸리티
  const normalizeId = useCallback((name: string | undefined | null) => {
    if (!name) return "";
    return name.toLowerCase().replace(/\s+/g, "_");
  }, []);

  // 특정 대분류의 소분류 요구사항을 평탄화하여 모달에 제공
  const getModalRequirementsForCategory = useCallback(
    (categoryId: string) => {
      const base = editableRequirements || extractedRequirements;
      if (!base?.categories) {
        return [] as Array<{
          id: string;
          title: string;
          description: string;
          category: string;
          priority: "high" | "medium" | "low";
          needsClarification?: boolean;
          clarificationQuestions?: string[];
          status?: "approved" | "rejected" | "draft";
        }>;
      }

      const target = base.categories.find(
        (cat: RequirementCategory) =>
          (cat.majorCategory &&
            normalizeId(cat.majorCategory) === categoryId) ||
          (cat.category && normalizeId(cat.category) === categoryId)
      );

      if (!target) {
        return [];
      }

      const flat = target.subCategories?.flatMap((sub) =>
        (sub.requirements || []).map((req: Requirement, index: number) => ({
          id:
            req.id ||
            `${target.majorCategory || target.category}-${
              sub.subCategory || sub.subcategory
            }-${index}`,
          title: req.title,
          description: req.description,
          category: categoryId,
          // 모달 컴포넌트 타입 요구에 맞추기 위한 기본값 유지 (UI에서는 사용 안 함)
          priority: (req.priority === "high" || req.priority === "medium"
            ? req.priority
            : "low") as "high" | "medium" | "low",
          needsClarification: req.needsClarification || false,
          clarificationQuestions: req.clarificationQuestions || [],
          status: (req.status === "approved" ||
          req.status === "rejected" ||
          req.status === "draft"
            ? req.status
            : "draft") as "approved" | "rejected" | "draft",
        }))
      );

      return flat || [];
    },
    [editableRequirements, extractedRequirements, normalizeId]
  );

  // 모달 타이틀용 대분류 이름 가져오기
  const getCategoryTitle = useCallback(
    (categoryId: string) => {
      const base = editableRequirements || extractedRequirements;
      const target = base?.categories?.find(
        (cat: RequirementCategory) =>
          (cat.majorCategory &&
            normalizeId(cat.majorCategory) === categoryId) ||
          (cat.category && normalizeId(cat.category) === categoryId)
      );
      return target?.majorCategory || target?.category || "기타";
    },
    [editableRequirements, extractedRequirements, normalizeId]
  );

  const updateCategoryTitleInState = useCallback(
    (
      requirements: ExtractedRequirements,
      categoryId: string,
      newTitle: string
    ) => {
      if (!requirements?.categories) return requirements;

      return {
        ...requirements,
        categories: requirements.categories.map(
          (category: RequirementCategory) => {
            const matchesMajorCategory =
              category.majorCategory &&
              normalizeId(category.majorCategory) === categoryId;
            const matchesCategory =
              category.category &&
              normalizeId(category.category) === categoryId;

            if (matchesMajorCategory) {
              return { ...category, majorCategory: newTitle };
            } else if (matchesCategory) {
              return { ...category, category: newTitle };
            } else {
              return category;
            }
          }
        ),
      };
    },
    [normalizeId]
  );

  // 카테고리 제목 업데이트
  const handleCategoryTitleUpdate = useCallback(
    async (categoryId: string, newTitle: string) => {
      if (!editableRequirements) return;

      try {
        // 로컬 상태 즉시 업데이트
        const updatedRequirements = updateCategoryTitleInState(
          editableRequirements,
          categoryId,
          newTitle
        );
        setEditableRequirements(updatedRequirements);

        // DB 저장
        await saveEditedRequirements(updatedRequirements);
      } catch (error) {
        console.error("카테고리 제목 업데이트 실패:", error);
        throw error;
      }
    },
    [editableRequirements, saveEditedRequirements, updateCategoryTitleInState]
  );

  // 개별 요구사항 상태 변경 (결정 필요 → 승인)
  const handleRequirementStatusChange = useCallback(
    async (
      requirementId: string,
      newStatus: "approved" | "rejected" | "draft"
    ) => {
      if (!editableRequirements) return;

      try {
        const updatedRequirements = {
          ...editableRequirements,
          categories: editableRequirements.categories.map(
            (category: RequirementCategory) => ({
              ...category,
              subCategories: category.subCategories.map((subCategory) => ({
                ...subCategory,
                requirements: subCategory.requirements.map((req: Requirement) =>
                  req.id === requirementId
                    ? {
                        ...req,
                        status: newStatus,
                        needsClarification:
                          newStatus === "approved"
                            ? false
                            : req.needsClarification,
                        clarificationQuestions:
                          newStatus === "approved"
                            ? []
                            : req.clarificationQuestions,
                      }
                    : req
                ),
              })),
            })
          ),
        };

        setEditableRequirements(updatedRequirements);
        await saveEditedRequirements(updatedRequirements);
      } catch (error) {
        console.error("요구사항 상태 변경 실패:", error);
        throw error;
      }
    },
    [editableRequirements, saveEditedRequirements]
  );

  // 비기능 요구사항 추가 핸들러
  const handleAddNFR = useCallback(
    async (newNFR: {
      category: string;
      description: string;
      priority: "high" | "medium" | "low";
      metrics?: string;
    }) => {
      if (!editableRequirements) return;

      try {
        const nfrId = `nfr-${Date.now()}`;
        const updatedRequirements = {
          ...editableRequirements,
          nonFunctionalRequirements: [
            ...(editableRequirements.nonFunctionalRequirements || []),
            {
              id: nfrId,
              ...newNFR,
            },
          ],
        };

        setEditableRequirements(updatedRequirements);
        await saveEditedRequirements(updatedRequirements);
      } catch (error) {
        console.error("비기능 요구사항 추가 실패:", error);
        throw error;
      }
    },
    [editableRequirements, saveEditedRequirements]
  );

  // 비기능 요구사항 편집 핸들러
  const handleEditNFR = useCallback(
    async (
      nfrId: string,
      updatedNFR: {
        category: string;
        description: string;
        priority: "high" | "medium" | "low";
        metrics?: string;
      }
    ) => {
      if (!editableRequirements) return;

      try {
        const updatedRequirements = {
          ...editableRequirements,
          nonFunctionalRequirements: (
            editableRequirements.nonFunctionalRequirements || []
          ).map((nfr) =>
            nfr.id === nfrId
              ? {
                  ...nfr,
                  ...updatedNFR,
                }
              : nfr
          ),
        };

        setEditableRequirements(updatedRequirements);
        await saveEditedRequirements(updatedRequirements);
      } catch (error) {
        console.error("비기능 요구사항 편집 실패:", error);
        throw error;
      }
    },
    [editableRequirements, saveEditedRequirements]
  );

  // 비기능 요구사항 삭제 핸들러
  const handleDeleteNFR = useCallback(
    async (nfrId: string) => {
      if (!editableRequirements) return;

      try {
        const updatedRequirements = {
          ...editableRequirements,
          nonFunctionalRequirements: (
            editableRequirements.nonFunctionalRequirements || []
          ).filter((nfr) => nfr.id !== nfrId),
        };

        setEditableRequirements(updatedRequirements);
        await saveEditedRequirements(updatedRequirements);
      } catch (error) {
        console.error("비기능 요구사항 삭제 실패:", error);
        throw error;
      }
    },
    [editableRequirements, saveEditedRequirements]
  );

  // 중분류 삭제 핸들러
  const handleCategoryDelete = useCallback(
    async (categoryId: string) => {
      if (!editableRequirements) return;

      try {
        const updatedRequirements = {
          ...editableRequirements,
          categories: editableRequirements.categories.filter(
            (category: RequirementCategory) =>
              category.majorCategory &&
              normalizeId(category.majorCategory) !== categoryId
          ),
          totalCount:
            editableRequirements.totalCount -
            (editableRequirements.categories
              .find(
                (cat: RequirementCategory) =>
                  cat.majorCategory &&
                  normalizeId(cat.majorCategory) === categoryId
              )
              ?.subCategories.reduce(
                (total, sub) => total + (sub.requirements?.length || 0),
                0
              ) || 0),
        };

        setEditableRequirements(updatedRequirements);
        await saveEditedRequirements(updatedRequirements);

        // 모달 닫기
        setShowCategoryDeleteModal(false);
        setCategoryToDelete(null);
      } catch (error) {
        console.error("카테고리 삭제 실패:", error);
        throw error;
      }
    },
    [editableRequirements, saveEditedRequirements, normalizeId]
  );

  // 중분류 삭제 요청 핸들러
  const handleCategoryDeleteRequest = useCallback(
    (categoryId: string) => {
      const base = editableRequirements || extractedRequirements;
      if (!base?.categories) return;

      const targetCategory = base.categories.find(
        (cat: RequirementCategory) =>
          (cat.majorCategory &&
            normalizeId(cat.majorCategory) === categoryId) ||
          (cat.category && normalizeId(cat.category) === categoryId)
      );

      if (targetCategory) {
        const requirementCount = targetCategory.subCategories.reduce(
          (total, sub) => total + (sub.requirements?.length || 0),
          0
        );

        setCategoryToDelete({
          id: categoryId,
          title:
            targetCategory.majorCategory ||
            targetCategory.category ||
            "Unknown Category",
          requirementCount,
        });
        setShowCategoryDeleteModal(true);
      }
    },
    [editableRequirements, extractedRequirements, normalizeId]
  );

  // 모달에서 편집된 평탄화 리스트를 원본 구조에 반영
  const applyModalChangesToStructure = useCallback(
    async (
      categoryId: string,
      updatedFlatList: Array<{
        id: string;
        title: string;
        description: string;
        category: string;
        priority: "high" | "medium" | "low";
        needsClarification?: boolean;
        clarificationQuestions?: string[];
        status?: "approved" | "rejected" | "draft";
      }>
    ) => {
      const base = editableRequirements || extractedRequirements;
      if (!base?.categories) return;

      const next = {
        ...base,
        categories: base.categories.map((cat: RequirementCategory) => {
          if (
            !(
              (cat.majorCategory &&
                normalizeId(cat.majorCategory) === categoryId) ||
              (cat.category && normalizeId(cat.category) === categoryId)
            )
          )
            return cat;

          // 변환용 얕은 복사
          const newSubCategories = cat.subCategories.map((s) => ({
            ...s,
            requirements: [...(s.requirements || [])],
          }));

          // 1) 기존 요구사항 업데이트/삭제 처리
          //    유지할 id 집합
          const keepIds = new Set(
            updatedFlatList.filter((i) => i.id).map((i) => i.id)
          );

          // 삭제된 항목 제거
          newSubCategories.forEach((sub) => {
            sub.requirements = sub.requirements.filter(
              (req: Requirement) => !req.id || keepIds.has(req.id)
            );
          });

          // 2) 삭제 후 requirementIndexMap 재생성 (삭제 작업 후에 생성)
          // 중요: 삭제된 항목이 제거된 후에 매핑을 생성해야 올바른 인덱스 보장
          const requirementIndexMap = new Map<
            string,
            { subIndex: number; reqIndex: number }
          >();
          newSubCategories.forEach((sub, si: number) => {
            (sub.requirements || []).forEach((req: Requirement, ri: number) => {
              if (req.id) {
                requirementIndexMap.set(req.id, { subIndex: si, reqIndex: ri });
              }
            });
          });

          // 3) 중복 제거: ID를 기준으로 마지막 항목만 유지
          const uniqueUpdatedList = new Map<
            string,
            (typeof updatedFlatList)[0]
          >();
          updatedFlatList.forEach((item) => {
            if (item.id) {
              uniqueUpdatedList.set(item.id, item);
            }
          });


          // 4) 업데이트/추가 처리
          uniqueUpdatedList.forEach((item) => {
            const found = item.id && requirementIndexMap.get(item.id);
            if (found) {
              const { subIndex, reqIndex } = found;
              const prev =
                newSubCategories[subIndex].requirements[reqIndex] || {};
              // item에 status가 있으면 사용, 없으면 기존 값 유지
              newSubCategories[subIndex].requirements[reqIndex] = {
                ...prev,
                id: item.id,
                title: item.title,
                description: item.description,
                // item에 status가 있으면 사용, 없으면 기존 값 유지
                status: item.status || prev.status || "approved",
                // item에 needsClarification이 있으면 사용, 없으면 기존 값 유지
                needsClarification:
                  item.needsClarification !== undefined
                    ? item.needsClarification
                    : prev.needsClarification,
                // item에 clarificationQuestions가 있으면 사용, 없으면 기존 값 유지
                clarificationQuestions:
                  item.clarificationQuestions ||
                  prev.clarificationQuestions ||
                  [],
                // 다른 필드들은 기존 값 유지
                priority: item.priority || prev.priority || "medium",
              };
            } else {
              // ID 매핑 실패 시, 제목과 설명으로 기존 요구사항 찾기
              let existingRequirementFound = false;
              for (
                let subIndex = 0;
                subIndex < newSubCategories.length;
                subIndex++
              ) {
                const sub = newSubCategories[subIndex];
                for (
                  let reqIndex = 0;
                  reqIndex < sub.requirements.length;
                  reqIndex++
                ) {
                  const req = sub.requirements[reqIndex];
                  // 제목이 같은 경우 기존 요구사항으로 간주
                  if (req.title === item.title) {
                    // 기존 요구사항을 업데이트
                    newSubCategories[subIndex].requirements[reqIndex] = {
                      ...req,
                      id: item.id || req.id,
                      title: item.title,
                      description: item.description,
                      // item에 status가 있으면 사용, 없으면 기존 값 유지
                      status: item.status || req.status || "approved",
                      // item에 needsClarification이 있으면 사용, 없으면 기존 값 유지
                      needsClarification:
                        item.needsClarification !== undefined
                          ? item.needsClarification
                          : req.needsClarification,
                      // item에 clarificationQuestions가 있으면 사용, 없으면 기존 값 유지
                      clarificationQuestions:
                        item.clarificationQuestions ||
                        req.clarificationQuestions ||
                        [],
                      // 다른 필드들은 기존 값 유지
                      priority: item.priority || req.priority || "medium",
                    };
                    existingRequirementFound = true;
                    break;
                  }
                }
                if (existingRequirementFound) break;
              }

              // 기존 요구사항을 찾지 못한 경우에만 새로 추가
              if (!existingRequirementFound) {
                if (newSubCategories.length === 0) {
                  newSubCategories.push({
                    subcategory: "기본",
                    subCategory: "기본",
                    requirements: [],
                  });
                }
                newSubCategories[0].requirements.push({
                  id: item.id,
                  title: item.title,
                  description: item.description,
                  priority: "medium",
                  needsClarification: false,
                  clarificationQuestions: [],
                  status: "approved", // 새로 추가된 요구사항은 승인 상태로 설정
                });
              }
            }
          });

          // 5) 중복 제거 - 같은 title을 가진 요구사항 중 더 긴 설명을 가진 것만 유지
          newSubCategories.forEach((sub) => {
            const titleMap = new Map<string, Requirement>();
            sub.requirements.forEach((req) => {
              const existing = titleMap.get(req.title);
              if (
                !existing ||
                req.description.length > existing.description.length
              ) {
                titleMap.set(req.title, req);
              }
            });
            sub.requirements = Array.from(titleMap.values());
          });

          return {
            ...cat,
            subCategories: newSubCategories,
          };
        }),
      };

      // totalCount 재계산
      const newTotalCount = next.categories.reduce(
        (total, cat) =>
          total +
          cat.subCategories.reduce(
            (subTotal, sub) => subTotal + (sub.requirements?.length || 0),
            0
          ),
        0
      );
      next.totalCount = newTotalCount;

      // 즉시 UI 상태 업데이트
      setEditableRequirements(next);

      // extractedRequirements도 동기화 (메인 목록 즉시 업데이트를 위해)
      updateExtractedRequirements(next);

      // 변경사항을 즉시 DB에 저장 (낙관적 업데이트)
      try {
        await saveEditedRequirements(next);
      } catch (error) {
        console.error("편집된 요구사항 저장 실패:", error);
        // 저장 실패해도 UI는 업데이트된 상태 유지 (낙관적 업데이트)
        // 사용자에게는 저장 실패 알림이 필요할 수 있음 (추후 구현)
      }
    },
    [
      editableRequirements,
      extractedRequirements,
      normalizeId,
      saveEditedRequirements,
      updateExtractedRequirements,
    ]
  );

  // 프로젝트 개요 생성 함수 ref
  const generateOverviewRef = useRef<(() => void) | null>(null);

  // 프로젝트 개요 생성 함수
  const generateProjectOverview = useCallback(() => {
    if (generateOverviewRef.current) {
      generateOverviewRef.current();
    }
  }, []);

  const { resumeProject } = useProjectResume();

  const formatRelativeTime = useCallback((iso: string) => {
    const now = new Date();
    const then = new Date(iso);
    const diffMs = now.getTime() - then.getTime();
    const minutes = Math.floor(diffMs / (60 * 1000));
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }, []);

  // 로그아웃 시 상태 초기화
  const previousUser = useRef(user);
  useEffect(() => {
    // 로그인 → 로그아웃 전환 감지
    if (previousUser.current && !user && !loading) {
      const hasState =
        showChatInterface ||
        showRequirements ||
        showConfirmation ||
        showFinalResult;

      if (hasState) {
        setShowChatInterface(false);
        setShowRequirements(false);
        setShowConfirmation(false);
        setShowFinalResult(false);
        setCurrentStep(1);
        setProjectDescription("");
        setSelectedServiceType("");
        setUploadedFiles([]);
        setChatMessages([]);
        setEditableRequirements(null);
        setUserComment("");
        setFileNamesDisplay("");
        setFileContents("");
        // 세션도 삭제
        clearSession();
      }
    }
    previousUser.current = user;
  }, [
    user,
    loading,
    showChatInterface,
    showRequirements,
    showConfirmation,
    showFinalResult,
  ]);

  // showLoginModal 상태 디버깅
  // useEffect(() => {
  //   console.log("showLoginModal 상태 변경:", showLoginModal);
  // }, [showLoginModal]);
  const {} = useStatePersistence();
  const targetStep = searchParams.get("step");

  // 로그인 후 상태 복원 및 자동 단계 이동
  const hasRestoredState = useRef(false);

  useEffect(() => {
    const handleLoginStateRestore = async () => {
      // 이미 복원했으면 중복 실행 방지
      if (hasRestoredState.current) {
        return;
      }

      if (user && !loading) {
        // 로그인 유도 후 로그인한 사용자만 복구 (tempState가 있는 경우)
        if (hasTempState && tempState?.projectData) {
          // console.log("로그인 후 상태 복원 시작:", tempState);

          try {
            // 1. 임시 상태를 실제 DB로 이전
            const result = await processLoginState();

            if (result && result.success) {
              // console.log("로그인 후 상태 이전 성공:", result);

              // 2. UI 상태 복원
              const { projectData, targetStep: savedTargetStep } = tempState;

              const restoredDescription = projectData.description || "";
              
              // 복원된 설명에서 파일명 부분 분리
              const fileSectionRegex = /\n\n\[업로드된 파일\]\n([\s\S]*)$/;
              const fileSectionMatch = restoredDescription.match(fileSectionRegex);
              
              if (fileSectionMatch) {
                // 파일명 부분이 있는 경우
                let fileNames = fileSectionMatch[1].trim();
                // 이모지(📄) 제거하여 순수 파일명만 저장
                fileNames = fileNames
                  .split("\n")
                  .map((name) => name.replace(/^📄\s*/, "").trim())
                  .filter((name) => name)
                  .join("\n");
                
                const pureComment = restoredDescription.replace(fileSectionRegex, "").trim();
                
                setUserComment(pureComment);
                setFileNamesDisplay(fileNames);
                // 복원 시에는 저장된 형식 그대로 사용 (이모지 포함)
                setProjectDescription(restoredDescription);
              } else {
                // 파일명 부분이 없는 경우 (사용자 코멘트만)
                setUserComment(restoredDescription);
                setFileNamesDisplay("");
                setProjectDescription(restoredDescription);
              }
              
              setSelectedServiceType(projectData.serviceType || "");
              setUploadedFiles(projectData.uploadedFiles || []);
              setChatMessages(projectData.chatMessages || []);
              
              // 파일 내용은 복원하지 않음 (파일이 다시 업로드되어야 함)
              setFileContents("");

              // 요구사항 데이터 복원
              if (result.existingProjectData?.requirements) {
                setEditableRequirements(
                  result.existingProjectData.requirements
                );
              }

              // 채팅 인터페이스가 활성화되어 있었다면 복원
              if (projectData.chatMessages?.length > 0) {
                setShowChatInterface(true);
              }

              // 3. 단계 이동 (URL 파라미터 또는 저장된 targetStep 사용)
              const stepToMove =
                targetStep || savedTargetStep || result.targetStep;
              if (stepToMove === "2" || stepToMove === 2) {
                setShowRequirements(true);
                setCurrentStep(2);
              } else if (stepToMove === "3" || stepToMove === 3) {
                setShowConfirmation(true);
                setCurrentStep(3);
              } else if (stepToMove === "4" || stepToMove === 4) {
                setShowFinalResult(true);
                setCurrentStep(4);
              }

              // 복원 완료 플래그 설정
              hasRestoredState.current = true;
            } else {
              const errorMessage =
                result?.error || "알 수 없는 오류가 발생했습니다";
              console.error("로그인 후 상태 이전 실패:", errorMessage);
              // 실패해도 기본 상태 복원은 진행 (로그인은 성공했으므로)
              const { projectData, targetStep: savedTargetStep } = tempState;

              const stepToMove = parseInt(
                String(targetStep || savedTargetStep || 2)
              );

              // 공통 복원 로직 사용 (로그인 후 DB 저장 실패 시)
              restoreProjectState(
                {
                  description: projectData.description,
                  serviceType: projectData.serviceType,
                  chatMessages: projectData.chatMessages,
                },
                stepToMove,
                {
                  setProjectDescription,
                  setSelectedServiceType,
                  setChatMessages,
                  setCurrentStep,
                  setShowChatInterface,
                  setShowRequirements,
                  setShowConfirmation,
                  setShowFinalResult,
                }
              );

              // 기본 복원 완료 플래그 설정
              hasRestoredState.current = true;
            }
          } catch (error) {
            console.error("로그인 후 상태 복원 중 오류:", error);
            // 오류 발생 시 기본 상태 복원
            const { projectData } = tempState;
            if (projectData) {
              // 공통 복원 로직 사용 (오류 시 2단계로 이동)
              restoreProjectState(
                {
                  description: projectData.description,
                  serviceType: projectData.serviceType,
                  chatMessages: projectData.chatMessages,
                },
                2,
                {
                  setProjectDescription,
                  setSelectedServiceType,
                  setChatMessages,
                  setCurrentStep,
                  setShowChatInterface,
                  setShowRequirements,
                  setShowConfirmation,
                  setShowFinalResult,
                }
              );
            }

            // 오류 복원 완료 플래그 설정
            hasRestoredState.current = true;
          }
        } else if (targetStep) {
          // tempState가 없지만 URL 파라미터가 있는 경우만 단계 이동
          const stepToMove = parseInt(String(targetStep));

          // 공통 복원 로직 사용 (데이터 없이 단계만 이동)
          restoreProjectState({}, stepToMove, {
            setProjectDescription,
            setSelectedServiceType,
            setChatMessages,
            setCurrentStep,
            setShowChatInterface,
            setShowRequirements,
            setShowConfirmation,
            setShowFinalResult,
          });

          // URL 파라미터 복원 완료 플래그 설정
          hasRestoredState.current = true;
        } else {
          // tempState도 없고 URL 파라미터도 없으면 아무것도 하지 않음
          hasRestoredState.current = true;
        }
      }
    };

    handleLoginStateRestore();
  }, [
    user,
    loading,
    hasTempState,
    tempState,
    processLoginState,
    targetStep,
  ]);

  // 자동 세션 저장 설정
  useEffect(() => {
    // 복원 중이면 저장하지 않음
    if (isRestoring.current) {
      return;
    }

    // 자동 저장 시작
    startAutoSave(() => {
      // 현재 상태를 세션 데이터로 변환
      return {
        currentStep,
        projectDescription,
        userComment,
        fileNamesDisplay,
        selectedServiceType,
        uploadedFiles: uploadedFiles.map((file) => ({
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        })),
        chatMessages,
        editableRequirements,
        extractedRequirements,
        overview,
        showChatInterface,
        showRequirements,
        showConfirmation,
        showFinalResult,
        fileContents,
      };
    });

    return () => {
      stopAutoSave();
    };
  }, [
    currentStep,
    projectDescription,
    userComment,
    fileNamesDisplay,
    selectedServiceType,
    uploadedFiles,
    chatMessages,
    editableRequirements,
    extractedRequirements,
    overview,
    showChatInterface,
    showRequirements,
    showConfirmation,
    showFinalResult,
    fileContents,
    startAutoSave,
    stopAutoSave,
  ]);

  // 요구사항 추출을 위한 별도 useEffect
  const hasExtractedRequirements = useRef(false);

  useEffect(() => {
    const handleRequirementsExtraction = async () => {
        // 로그인 유도 후 로그인한 사용자는 이미 복구되었으므로 API 요청하지 않음
        if (user && hasTempState) {
          return;
        }

      // 2단계이고 요구사항이 없고 아직 추출하지 않았으면 추출 실행
      if (
        currentStep === 2 &&
        showRequirements &&
        !extractedRequirements &&
        !editableRequirements &&
        !hasExtractedRequirements.current &&
        !isRequirementsLoading
      ) {
        hasExtractedRequirements.current = true;
        setIsRequirementsLoading(true);

        try {
          // API 요청 시에는 사용자 코멘트 + 파일 내용을 포함 (UI에는 파일명만 표시되지만 API에는 전체 내용 전송)
          const descriptionWithFileContents = (() => {
            // projectDescription에서 파일명 부분 제거 (사용자 코멘트만 추출)
            const fileSectionRegex = /\n\n\[업로드된 파일\]\n[\s\S]*$/;
            const pureComment = projectDescription.replace(fileSectionRegex, "").trim();
            
            // 사용자 코멘트 + 파일 내용 결합
            if (fileContents) {
              return pureComment
                ? `${pureComment}\n\n[업로드된 파일 내용]\n${fileContents}`
                : `[업로드된 파일 내용]\n${fileContents}`;
            }
            return pureComment;
          })();
          
          const requirements = await extractRequirements(
            {
              description: descriptionWithFileContents,
              serviceType: selectedServiceType,
              uploadedFiles,
              projectOverview: overview,
            },
            chatMessages.map((msg) => ({
              type: msg.type === "ai" ? "ai" : msg.type,
              content: msg.content,
            }))
          );

          if (requirements) {
            // 요청자 및 날짜 정보 자동 설정
            const currentDate = new Date().toISOString();
            const requesterName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '익명';
            
            const enrichedRequirements = {
              ...requirements,
              categories: requirements.categories?.map((cat: any) => ({
                ...cat,
                subCategories: cat.subCategories?.map((sub: any) => ({
                  ...sub,
                  requirements: sub.requirements?.map((req: any) => ({
                    ...req,
                    requester: req.requester || requesterName,
                    initialRequestDate: req.initialRequestDate || currentDate,
                  }))
                }))
              }))
            };
            
            setEditableRequirements(enrichedRequirements);

            // 로그인된 사용자면 DB에 저장
            if (user && savedProjectId) {
              try {
                await saveRequirements(savedProjectId, enrichedRequirements);
              } catch (error) {
                console.error("요구사항 저장 실패:", error);
              }
            }
          }
        } catch (error) {
          console.error("요구사항 추출 실패:", error);
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";

          // Claude API 529 (Overloaded) 에러 처리
          if (
            errorMessage.includes("529") ||
            errorMessage.includes("Overloaded")
          ) {
            alert(
              "현재 사용량이 많아 서비스가 일시적으로 지연되고 있습니다. 잠시 후 다시 시도해주세요."
            );
            window.location.href = "/";
            return;
          }

          hasExtractedRequirements.current = false; // 실패 시 플래그 리셋
        } finally {
          setIsRequirementsLoading(false);
        }
      }
    };

    handleRequirementsExtraction();
  }, [
    currentStep,
    showRequirements,
    extractedRequirements,
    editableRequirements,
    isRequirementsLoading,
    extractRequirements,
    saveRequirements,
    savedProjectId,
    projectDescription,
    selectedServiceType,
    uploadedFiles,
    overview,
    chatMessages,
    user,
    hasTempState,
    fileContents,
  ]);

  const steps = [
    {
      id: 1,
      label: "프로젝트 개요",
      description: "Project Overview",
    },
    {
      id: 2,
      label: "요구사항 선택 + 대화",
      description: "Requirement Selection + Chat",
    },
    {
      id: 3,
      label: "기능 구성",
      description: "Feature Configuration",
    },
    {
      id: 4,
      label: "완료",
      description: "Complete",
    },
  ];

  const handleStart = useCallback(() => {
    // 채팅 인터페이스와 프로젝트 개요 패널 표시
    setShowChatInterface(true);
    setCurrentStep(1); // 1단계 유지

    // 초기 메시지 설정 (중복 호출 방지)
    const initialMessages: Message[] = [
      {
        id: "initial-user-message",
        type: "user",
        content: projectDescription,
        icon: "👤",
      },
      {
        id: "1",
        type: "ai",
        content:
          "좋아요! 좀 더 구체적으로 이해하기 위해 몇 가지 질문을 드릴게요. 이 서비스는 사용자들이 어떤 문제를 해결하고 싶어하는지, 그리고 기존 서비스에서 어떤 불편함을 겪고 있는지 파악하는 것이 중요합니다. 또한 타겟 고객층의 특성과 니즈를 정확히 이해해야 더 나은 솔루션을 제안할 수 있습니다.",
        icon: "🤖",
      },
      {
        id: "2",
        type: "ai",
        content: "당신의 서비스는 어떤 문제를 해결하고 싶나요?",
        description: "아래 옵션을 선택하거나 직접 입력해주세요.",
        icon: "🤖",
        options: [
          { id: "price", label: "가격 문제" },
          { id: "convenience", label: "편리성 문제" },
          { id: "dissatisfaction", label: "기존 서비스 불만" },
          { id: "unknown", label: "잘 모르겠음" },
        ],
      },
    ];
    setChatMessages(initialMessages);

    // 프로젝트 개요 생성
    setTimeout(() => {
      generateProjectOverview();
    }, 100); // 컴포넌트 마운트 후 실행
  }, [projectDescription, generateProjectOverview]);

  // 외부 URL 쿼리 파라미터로 프로젝트 자동 시작 처리
  useEffect(() => {
    // 이미 초기화되었으면 건너뛰기
    if (hasInitializedFromQuery.current) {
      return;
    }

    // resume 파라미터가 있으면 건너뛰기 (이어서 작업하기 우선)
    if (searchParams.get("resume")) {
      return;
    }

    const queryDescription = searchParams.get("description");
    const queryServiceType = searchParams.get("serviceType");
    const autoStart = searchParams.get("autoStart");

    // description이나 serviceType이 있으면 초기화
    if (queryDescription || queryServiceType) {
      hasInitializedFromQuery.current = true;

      // 프로젝트 설명 설정
      if (queryDescription) {
        setProjectDescription(queryDescription);
      }

      // 서비스 타입 설정
      if (queryServiceType) {
        setSelectedServiceType(queryServiceType);
      }

      // autoStart가 true이면 자동으로 시작
      if (autoStart === "true" || autoStart === "1") {
        // 약간의 지연 후 자동 시작 (상태 업데이트 완료 대기)
        setTimeout(() => {
          handleStart();
        }, 500);
      }
    }
  }, [searchParams, handleStart]);

  const handleFileSelect = async (files: File[]) => {
    // 에러 상태 초기화
    setFileProcessingError("");
    setFileProcessingMessage("");
    
    // 파일 검증
    const invalidFiles = files.filter(
      (file) => !validateFileType(file, SUPPORTED_FILE_TYPES)
    );
    
    if (invalidFiles.length > 0) {
      const invalidTypes = invalidFiles.map((f) => f.name).join(", ");
      setFileProcessingError(
        `지원하지 않는 파일 형식입니다: ${invalidTypes}\n지원 형식: PDF, 이미지 (PNG, JPEG, GIF), 텍스트 파일`
      );
      return;
    }
    
    // 파일 크기 검증
    const oversizedFiles = files.filter(
      (file) => !validateFileSize(file, MAX_FILE_SIZE_MB)
    );
    
    if (oversizedFiles.length > 0) {
      const oversizedNames = oversizedFiles.map((f) => f.name).join(", ");
      setFileProcessingError(
        `파일 크기가 너무 큽니다 (최대 ${MAX_FILE_SIZE_MB}MB): ${oversizedNames}`
      );
      return;
    }
    
    // 파일 처리 시작
    setIsProcessingFiles(true);
    setUploadedFiles(files);
    setFileProcessingMessage(
      `파일 처리 중... (${files.length}개 파일)`
    );
    
    try {
      // 파일 내용 추출
      const extractedContent = await extractContentFromFiles(files);
      
      // 파일 내용은 별도로 저장 (API 요청용)
      setFileContents(extractedContent);
      
      // 파일명만 저장 (UI 표시용) - 이모지 없이 순수 파일명만 저장
      const fileNames = files.map((file) => file.name).join("\n");
      setFileNamesDisplay(fileNames);
      
      // 프로젝트 설명 업데이트: 사용자 코멘트 + 파일명
      updateProjectDescriptionDisplay(userComment || "", fileNames);
      
      setFileProcessingMessage(
        `파일 처리 완료! (${files.length}개 파일)`
      );
      
      // 2초 후 메시지 자동 제거
      setTimeout(() => {
        setFileProcessingMessage("");
      }, 2000);
    } catch (error) {
      console.error("파일 처리 실패:", error);
      setFileProcessingError(
        error instanceof Error
          ? error.message
          : "파일 처리 중 오류가 발생했습니다"
      );
      
      // 파일 목록은 유지 (사용자가 다시 시도할 수 있도록)
    } finally {
      setIsProcessingFiles(false);
    }
  };

  // 서비스 타입 ID -> 한국어 이름 매핑
  const serviceTypeNames: { [key: string]: string } = {
    "food-delivery": "음식 배달 앱",
    "real-estate": "부동산 플랫폼",
    "work-management": "업무 관리 도구",
    "online-education": "온라인 교육",
    "shopping-mall": "쇼핑몰",
  };

  // 프로젝트 설명 표시 업데이트 함수 (사용자 코멘트 + 파일명 조합)
  const updateProjectDescriptionDisplay = useCallback(
    (comment: string, fileNames: string) => {
      if (fileNames) {
        // 파일명에 이모지 추가하여 표시
        const fileNamesWithIcon = fileNames
          .split("\n")
          .filter((name) => name.trim())
          .map((name) => `📄 ${name}`)
          .join("\n");
        
        if (comment.trim()) {
          // 사용자 코멘트와 파일명 모두 있는 경우
          setProjectDescription(`${comment}\n\n[업로드된 파일]\n${fileNamesWithIcon}`);
        } else {
          // 파일명만 있는 경우
          setProjectDescription(`[업로드된 파일]\n${fileNamesWithIcon}`);
        }
      } else {
        // 파일명이 없는 경우 (사용자 코멘트만)
        setProjectDescription(comment);
      }
    },
    []
  );

  // 텍스트 입력 핸들러 (파일명과 분리하여 사용자 코멘트만 처리)
  const handleDescriptionChange = useCallback(
    (value: string) => {
      // 입력창에는 사용자 코멘트만 표시하므로 value를 그대로 사용
      setUserComment(value);
      updateProjectDescriptionDisplay(value, fileNamesDisplay);
    },
    [fileNamesDisplay, updateProjectDescriptionDisplay]
  );

  // 파일 삭제 핸들러
  const handleFileRemove = useCallback(
    (fileName: string) => {
      // uploadedFiles에서 해당 파일 제거
      const updatedFiles = uploadedFiles.filter((file) => file.name !== fileName);
      setUploadedFiles(updatedFiles);

      // fileNamesDisplay에서 해당 파일명 제거 (정확한 파일명 매칭)
      const fileNamesArray = fileNamesDisplay
        .split("\n")
        .filter((name) => name.trim() && name.trim() !== fileName.trim());
      
      const updatedFileNames = fileNamesArray.join("\n");
      setFileNamesDisplay(updatedFileNames);

      // 프로젝트 설명 업데이트
      updateProjectDescriptionDisplay(userComment, updatedFileNames);

      // 파일이 모두 삭제되면 파일 내용도 초기화
      if (updatedFiles.length === 0) {
        setFileContents("");
      } else {
        // 남은 파일들의 내용만 추출하여 업데이트
        extractContentFromFiles(updatedFiles)
          .then((content) => {
            setFileContents(content);
          })
          .catch((error) => {
            console.error("파일 내용 추출 실패:", error);
            // 에러가 발생해도 파일 삭제는 성공으로 처리
          });
      }
    },
    [uploadedFiles, fileNamesDisplay, userComment, updateProjectDescriptionDisplay]
  );

  // 받침 유무에 따라 적절한 조사 반환 (을/를)
  const getParticle = (word: string): string => {
    if (!word || word.length === 0) return "을";

    const lastChar = word[word.length - 1];
    const lastCharCode = lastChar.charCodeAt(0);

    // 한글 유니코드 범위: 0xAC00 ~ 0xD7A3
    if (lastCharCode >= 0xac00 && lastCharCode <= 0xd7a3) {
      // 받침이 있는지 확인: (코드 - 0xAC00) % 28 !== 0이면 받침 있음
      const hasJongseong = (lastCharCode - 0xac00) % 28 !== 0;
      return hasJongseong ? "을" : "를";
    }

    // 한글이 아닌 경우 기본값
    return "을";
  };

  const handleServiceTypeSelect = (serviceType: string) => {
    setSelectedServiceType(serviceType);

    // 서비스 타입의 한국어 이름 가져오기
    const serviceName = serviceTypeNames[serviceType];

    if (serviceName) {
      // 받침에 따라 적절한 조사 선택
      const particle = getParticle(serviceName);

      // 입력란에 텍스트 자동 삽입
      const text = `${serviceName}${particle} 만들고 싶어요.`;
      setUserComment(text);
      updateProjectDescriptionDisplay(text, fileNamesDisplay);
    }
  };

  // 메시지 변경 핸들러 (useCallback으로 최적화)
  const handleMessagesChange = useCallback((newMessages: Message[]) => {
    setChatMessages(newMessages);
    // 프로젝트 개요 업데이트는 onProjectUpdate에서 처리하므로 여기서는 제거
  }, []);

  const handleNextStep = async () => {
    if (currentStep === 1) {
      // 중복 호출 방지
      if (isProcessingStep1To2.current) {
        return;
      }
      
      // 프로젝트 개요에서 요구사항 관리로 전환 (즉시 페이지 전환)

      // 1단계에서 2단계로 넘어갈 때는 로그인 없이 진행 가능
      isProcessingStep1To2.current = true;
      
      // 세션 자동 저장 임시 중지 (전환 완료 후 재개)
      stopAutoSave();
      
      // 1. 즉시 페이지 전환
      setShowRequirements(true);
      setCurrentStep(2);
      setIsRequirementsLoading(true);

      try {
        // 2. 요구사항 추출 (로그인 없이도 가능)
        // API 요청 시에는 사용자 코멘트 + 파일 내용을 포함 (UI에는 파일명만 표시되지만 API에는 전체 내용 전송)
        const descriptionWithFileContents = (() => {
          // projectDescription에서 파일명 부분 제거 (사용자 코멘트만 추출)
          const fileSectionRegex = /\n\n\[업로드된 파일\]\n[\s\S]*$/;
          const pureComment = projectDescription.replace(fileSectionRegex, "").trim();
          
          // 사용자 코멘트 + 파일 내용 결합
          if (fileContents) {
            return pureComment
              ? `${pureComment}\n\n[업로드된 파일 내용]\n${fileContents}`
              : `[업로드된 파일 내용]\n${fileContents}`;
          }
          return pureComment;
        })();
        
        const requirements = await extractRequirements(
          {
            description: descriptionWithFileContents,
            serviceType: selectedServiceType,
            uploadedFiles,
            projectOverview: overview, // 프로젝트 개요 정보 추가
          },
          chatMessages.map((msg) => ({
            type: msg.type === "ai" ? "ai" : msg.type,
            content: msg.content,
          }))
        );

        // 프로젝트 개요가 없으면 요구사항에서 기본 정보 추출하여 생성
        let overviewToSave = overview;
        if (!overviewToSave && requirements) {
          // 요구사항에서 기본 정보 추출
          const categories = requirements.categories || [];
          const allRequirements = categories.flatMap((cat: RequirementCategory) => 
            cat.subCategories?.flatMap((sub: { requirements?: Requirement[] }) => sub.requirements || []) || []
          );
          const mandatoryCount = allRequirements.filter((r: Requirement) => r.priority === 'high').length;
          
          overviewToSave = {
            serviceCoreElements: {
              title: projectDescription.substring(0, 50) || "프로젝트",
              description: projectDescription || "",
              keyFeatures: allRequirements.slice(0, 5).map((r: Requirement) => r.title),
              targetUsers: ["미정"],
              estimatedDuration: "미정",
              projectScale: mandatoryCount > 10 ? "대규모" : mandatoryCount > 5 ? "중규모" : "소규모",
              techComplexity: "보통",
            },
            userJourney: {
              steps: [],
            },
          };
          // state에도 설정
          if (setOverviewDirectly) {
            setOverviewDirectly(overviewToSave);
          }
        }

        // 로그인된 사용자만 프로젝트 데이터 저장
        if (user) {
          // 3. 프로젝트 데이터 저장 (프로젝트 개요 포함)
          const projectData = {
            title: projectDescription.substring(0, 100),
            description: projectDescription,
            serviceType: selectedServiceType,
            project_overview: overviewToSave, // 프로젝트 개요 포함 (없으면 기본값)
            uploadedFiles,
          };

          const messages = chatMessages.map((msg) => ({
            role: (msg.type === "user" ? "user" : "assistant") as
              | "user"
              | "assistant",
            content: msg.content,
            metadata: {
              message_index: chatMessages.indexOf(msg),
              timestamp: new Date().toISOString(),
            },
          }));

          const projectResult = await saveProjectWithMessages(
            projectData,
            messages
          );

          if (projectResult.status === "success") {
            setSavedProjectId(projectResult.project_id);

            // 프로젝트 개요가 있으면 명시적으로도 저장 (saveProjectWithMessages가 저장하지만, 확실히 하기 위해)
            if (overviewToSave) {
              try {
                await updateProjectOverview(projectResult.project_id, overviewToSave);
              } catch (overviewError) {
                console.error("프로젝트 개요 명시적 저장 실패:", overviewError);
                // 개요 저장 실패해도 계속 진행 (saveProjectWithMessages에서 이미 저장했을 수 있음)
              }
            }

            // 4. 요구사항 저장
            if (requirements) {
              // 요구사항 데이터 보강 (요청자 및 날짜 추가)
              const currentDate = new Date().toISOString();
              const requesterName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '익명';
              
              const enrichedRequirements = {
                ...requirements,
                categories: requirements.categories?.map((cat: any) => ({
                  ...cat,
                  subCategories: cat.subCategories?.map((sub: any) => ({
                    ...sub,
                    requirements: sub.requirements?.map((req: any) => ({
                      ...req,
                      requester: req.requester || requesterName,
                      initialRequestDate: req.initialRequestDate || currentDate,
                    }))
                  }))
                }))
              };
              
              const requirementsResult = await saveRequirements(
                projectResult.project_id,
                enrichedRequirements
              );

              if (requirementsResult.status === "success") {
                setEditableRequirements(enrichedRequirements);
              } else {
                console.error(
                  "요구사항 저장 실패:",
                  requirementsResult.message
                );
              }
            }
          } else {
            console.error("프로젝트 저장 실패:", projectResult.message);
          }
          } else {
            // 로그인하지 않은 사용자는 로컬 상태로만 저장
            // 요구사항 데이터 보강 (요청자 및 날짜 추가)
          const currentDate = new Date().toISOString();
          const requesterName = '익명';
          
          const enrichedRequirements = {
            ...requirements,
            categories: requirements.categories?.map((cat: any) => ({
              ...cat,
              subCategories: cat.subCategories?.map((sub: any) => ({
                ...sub,
                requirements: sub.requirements?.map((req: any) => ({
                  ...req,
                  requester: req.requester || requesterName,
                  initialRequestDate: req.initialRequestDate || currentDate,
                }))
              }))
            }))
          };
          
          setEditableRequirements(enrichedRequirements);
        }
      } catch (error) {
        console.error("요구사항 추출 또는 저장 중 오류:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        // Claude API 529 (Overloaded) 에러 처리
        if (
          errorMessage.includes("529") ||
          errorMessage.includes("Overloaded")
        ) {
          alert(
            "현재 사용량이 많아 서비스가 일시적으로 지연되고 있습니다. 잠시 후 다시 시도해주세요."
          );
          window.location.href = "/";
          return;
        }
      } finally {
        setIsRequirementsLoading(false);
        isProcessingStep1To2.current = false; // 처리 완료 플래그 해제
        
        // 세션 자동 저장 재개 (전환 완료 후)
        // 자동 저장은 useEffect에서 자동으로 재개되므로 여기서는 제거
        // setTimeout(() => {
        //   startAutoSave(() => {
        //     return {
        //       currentStep,
        //       projectDescription,
        //       userComment,
        //       fileNamesDisplay,
        //       selectedServiceType,
        //       uploadedFiles: uploadedFiles.map((file) => ({
        //         name: file.name,
        //         size: file.size,
        //         type: file.type,
        //         lastModified: file.lastModified,
        //       })),
        //       chatMessages,
        //       editableRequirements,
        //       extractedRequirements,
        //       overview,
        //       showChatInterface,
        //       showRequirements,
        //       showConfirmation,
        //       showFinalResult,
        //       fileContents,
        //     };
        //   });
        // }, 1000);
      }
    } else if (currentStep === 2) {
      // 2단계에서 3단계로 넘어갈 때는 로그인 필요 + AI 검증
        requireAuth(
        async () => {
          try {
            setIsVerifying(true);

            // AI 검증 API 호출
            const response = await fetch("/api/requirements/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                requirements: editableRequirements || extractedRequirements,
                projectId: savedProjectId,
              }),
            });

            const result = await response.json();

            // 검증 결과 저장
            setVerificationResult(result);

            // 검증 결과에 따른 처리
            if (result.status === "ok") {
              // OK: 자동으로 다음 단계 진행
              setIsVerifying(false);
              setShowRequirements(false);
              setShowConfirmation(true);
              setCurrentStep(3);
            } else if (result.status === "warning" || result.status === "error") {
              // WARNING/ERROR: 모달 표시하고 사용자 선택
              setIsVerifying(false);
              setShowVerificationModal(true);
            } else {
              // 예외 상황: 기본적으로 다음 단계 진행
              setIsVerifying(false);
              setShowRequirements(false);
              setShowConfirmation(true);
              setCurrentStep(3);
            }
          } catch (error) {
            console.error("AI 검증 중 오류:", error);
            // 검증 실패 시: 모달 표시
            setVerificationResult({
              status: "error",
              score: 0,
              suggestions: [{
                type: "unclear",
                severity: "high",
                message: "검증 중 오류가 발생했습니다. 요구사항을 다시 확인해주세요.",
              }],
              warnings: [],
              summary: {
                totalRequirements: 0,
                issuesFound: 1,
                criticalIssues: 1,
              },
            });
            setIsVerifying(false);
            setShowVerificationModal(true);
          }
        },
        {
          description: projectDescription,
          serviceType: selectedServiceType,
          uploadedFiles,
          chatMessages,
          requirements: Array.isArray(editableRequirements)
            ? editableRequirements
            : [],
          projectOverview: typeof overview === "string" ? overview : undefined,
        }
      );
    } else if (currentStep === 3) {
      // 3단계에서 최종 확인 모달 표시
      setShowFinalModal(true);
    } else {
      // 4단계 이후는 더 이상 진행하지 않음
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handleFinalConfirm = async () => {
    setShowFinalModal(false);
    setShowConfirmation(false);
    setShowFinalResult(true);
    setCurrentStep(4);

    // 프로젝트 상태를 completed로 업데이트
    if (user && savedProjectId) {
      try {
        await updateProjectStatus(savedProjectId, "completed");
      } catch (error) {
        console.error("프로젝트 상태 업데이트 실패:", error);
      }
    }

    // 프로젝트 완료 시 세션 삭제
    clearSession();
  };

  // 검증 모달 핸들러
  const handleVerificationProceed = () => {
    setShowVerificationModal(false);
    setShowRequirements(false);
    setShowConfirmation(true);
    setCurrentStep(3);
  };

  const handleVerificationGoBack = () => {
    setShowVerificationModal(false);
    // Step 2로 돌아가기 (이미 Step 2에 있음)
  };

  const handleVerificationClose = () => {
    setShowVerificationModal(false);
    // Step 2에 그대로 머물면서 요구사항 수정
  };

  const handlePrevStep = () => {
    if (currentStep === 2) {
      // 요구사항 관리에서 프로젝트 개요로 돌아가기
      setShowRequirements(false);
      setIsRequirementsLoading(false);
      setCurrentStep(1);
    } else if (currentStep === 3) {
      // 기능 구성에서 요구사항 관리로 돌아가기
      setShowConfirmation(false);
      setShowRequirements(true);
      setCurrentStep(2);
    } else if (currentStep === 4) {
      // 최종 결과에서 기능 구성으로 돌아가기
      setShowFinalResult(false);
      setShowConfirmation(true);
      setCurrentStep(3);
    } else {
      setCurrentStep((prev) => Math.max(prev - 1, 1));
    }
  };

  const isStartDisabled = userComment.trim().length === 0;
  const hasLandingExtras =
    uploadedFiles.length > 0 ||
    Boolean(fileProcessingMessage) ||
    Boolean(fileProcessingError) ||
    isProcessingFiles ||
    isLoadingRecent ||
    recentProjects.length > 0;
  const landingJustifyClass = hasLandingExtras
    ? "md:justify-start xl:justify-center"
    : "md:justify-center";

  return (
    <div className="flex-1 bg-white flex flex-col min-h-0 overflow-hidden">
      {/* Progress Bar - Show when any interface is active */}
      {(showChatInterface ||
        showRequirements ||
        showConfirmation ||
        showFinalResult) && (
        <ProgressBar currentStep={currentStep} steps={steps} />
      )}

      {/* Initial Landing Page - Only show when no interface is active */}
      {!showChatInterface &&
        !showRequirements &&
        !showConfirmation &&
        !showFinalResult && (
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
            <div
              className={`flex flex-1 flex-col items-center justify-start ${landingJustifyClass} w-full min-h-[calc(100vh-96px)] px-4 pt-24 pb-12 sm:py-12`}
            >
              <div className="max-w-4xl mx-auto w-full space-y-8">
                <div className="text-center">
                {/* Main Title */}
                <h1 className="text-2xl sm:text-3xl md:text-[40px] lg:text-[48px] font-bold text-black mb-4 leading-tight px-2 sm:px-0">
                  당신이 만들고 싶은 서비스를 말하거나
                  <br className="hidden sm:block" />
                  <span className="sm:hidden"> </span>자료를 업로드해보세요!
                </h1>

                {/* Subtitle */}
                <p className="text-sm sm:text-base md:text-lg text-[#4B5563] mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-4 sm:px-0">
                  사업계획서 없이도 한 문장만 적어도 됩니다.
                  <br className="hidden sm:block" />
                  <span className="sm:hidden"> </span>자료가 있다면 더 정확한 초안을 만들어 드려요.
                </p>

                {/* Text Input Section */}
                <div className="mb-4 sm:mb-6">
                  <div className="relative max-w-[760px] w-full mx-auto mb-4 sm:mb-6 px-2 sm:px-4 md:px-0">
                    <div
                      className="relative flex flex-col sm:flex-row items-stretch sm:items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:border-blue-500"
                      style={
                        {
                          "--tw-ring-color": "#6366F1",
                        } as React.CSSProperties
                      }
                    >
                      <input
                        type="text"
                        value={userComment}
                        onChange={(e) => handleDescriptionChange(e.target.value)}
                        placeholder="예: 음식 배달 앱을 만들고 싶어요"
                        className="flex-1 px-4 sm:px-6 py-3 sm:py-4 bg-transparent border-0 focus:outline-none text-gray-700 placeholder-gray-500 text-sm sm:text-base"
                      />
                      <button
                        onClick={() => {
                          if (isStartDisabled) {
                            return;
                          }
                          handleStart();
                        }}
                        disabled={isStartDisabled}
                        className={`bg-[#6366F1] text-white px-6 sm:px-8 transition-colors duration-200 font-medium m-2 rounded-lg h-[38px] sm:h-[40px] flex items-center justify-center whitespace-nowrap text-sm sm:text-base ${
                          isStartDisabled ? "opacity-60 cursor-not-allowed" : "hover:bg-[#6366F1]"
                        }`}
                      >
                        시작하기
                      </button>
                    </div>
                    
                    {/* Uploaded Files List - Show below input */}
                    {uploadedFiles.length > 0 && (
                      <div className="mt-2 sm:mt-3 max-w-[760px] w-full mx-auto px-0">
                        <div className="flex flex-wrap gap-2">
                          {uploadedFiles.map((file, index) => (
                            <div
                              key={`${file.name}-${index}`}
                              className="flex items-center gap-1.5 sm:gap-2 bg-blue-50 border border-blue-200 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
                            >
                              <svg
                                className="w-4 h-4 text-blue-600 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                />
                              </svg>
                              <span className="text-gray-700 truncate max-w-[120px] sm:max-w-[200px]">
                                {file.name}
                              </span>
                              <button
                                onClick={() => handleFileRemove(file.name)}
                                className="text-gray-400 hover:text-red-600 transition-colors flex-shrink-0 ml-1"
                                aria-label={`${file.name} 삭제`}
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Service Type Buttons */}
                  <ServiceTypeButtons
                    onSelect={handleServiceTypeSelect}
                    selectedType={selectedServiceType}
                  />
                </div>
              </div>

                {/* Separator */}
                <div className="flex items-center justify-center mb-8">
                  <span className="text-gray-500 font-medium">또는</span>
                </div>

                {/* File Upload Section */}
                <div className="max-w-2xl mx-auto">
                  <FileUpload onFileSelect={handleFileSelect} />
                  
                  {/* Recent Projects (Logged-in users only) */}
                  {user && (
                    <div className="mt-10">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-gray-700">최근 작업</h3>
                        {isLoadingRecent && (
                          <span className="text-xs text-gray-400">불러오는 중...</span>
                        )}
                      </div>
                      {recentProjects.length === 0 && !isLoadingRecent ? (
                        <p className="text-sm text-gray-500">최근 작업이 없습니다.</p>
                      ) : (
                        <ul className="space-y-2">
                          {recentProjects.map((p) => (
                            <li key={p.id}>
                              <button
                                className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-left"
                                onClick={() => resumeProject(p.id)}
                              >
                                <span className="text-gray-800 truncate mr-3">{p.title}</span>
                                <span className="text-xs text-gray-500 flex-shrink-0">
                                  {formatRelativeTime(p.updatedAt)}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {/* File Processing Status */}
                  {isProcessingFiles && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                        <span className="text-blue-700 font-medium">
                          {fileProcessingMessage}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* File Processing Success */}
                  {!isProcessingFiles && fileProcessingMessage && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center">
                        <svg
                          className="w-5 h-5 text-green-600 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-green-700 font-medium">
                          {fileProcessingMessage}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* File Processing Error */}
                  {fileProcessingError && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start">
                        <svg
                          className="w-5 h-5 text-red-600 mr-3 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <div className="flex-1">
                          <span className="text-red-700 font-medium">
                            파일 처리 오류
                          </span>
                          <p className="text-red-600 text-sm mt-1 whitespace-pre-line">
                            {fileProcessingError}
                          </p>
                        </div>
                        <button
                          onClick={() => setFileProcessingError("")}
                          className="text-red-600 hover:text-red-800 ml-2"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Chat Interface with Slide Animation - Hide in confirmation and final result steps */}
      {!showConfirmation && !showFinalResult && showChatInterface && (
        <div className="flex-1 transition-all duration-700 ease-in-out opacity-100 translate-x-0 overflow-hidden">
          {/* Mobile: Tab-based Layout */}
          <MobileTabLayout
            panelTitle={showRequirements ? "요구사항" : "프로젝트 개요"}
            chatContent={
              <ChatInterface
                initialMessage=""
                serviceType={selectedServiceType}
                currentStep={currentStep}
                messages={chatMessages}
                onMessagesChange={handleMessagesChange}
                onProjectUpdate={handleProjectUpdate}
                aiResponse={aiMessage || undefined}
                isLoading={isOverviewLoading || isEditingMode}
              />
            }
            panelContent={
              showRequirements ? (
                isProcessing ? (
                  <RequirementsLoading
                    stage={
                      isExtractingRequirements
                        ? "extracting"
                        : isUpdatingRequirements
                        ? "updating"
                        : isSaving
                        ? "saving"
                        : "processing"
                    }
                  />
                ) : (
                  <MobileRequirementsPanel
                    requirementsData={
                      editableRequirements || extractedRequirements || undefined
                    }
                    onNextStep={handleNextStep}
                    onOpenEditModal={(category) => {
                      setEditingCategory(category);
                      setShowEditModal(true);
                      setIsEditingMode(true);
                    }}
                    isNextButtonEnabled={isStep2ButtonEnabled}
                    isLoading={isOverviewLoading}
                  />
                )
              ) : (
                <ProjectOverviewPanel
                  projectDescription={projectDescription}
                  serviceType={selectedServiceType}
                  uploadedFiles={uploadedFiles}
                  onNextStep={handleNextStep}
                  currentStep={currentStep}
                  messages={chatMessages}
                  onGenerateOverview={generateOverviewRef}
                  realtimeOverview={overview || undefined}
                  isLoading={isOverviewLoading}
                />
              )
            }
          />

          {/* Desktop: Side-by-side Layout */}
          <div className="hidden md:flex h-full max-h-[calc(100vh-120px)]">
            {/* Left Chat Interface */}
            <div
              className={`transition-all duration-700 ease-in-out ${
                showRequirements ? "w-1/3" : "flex-1"
              }`}
            >
              <ChatInterface
                initialMessage=""
                serviceType={selectedServiceType}
                currentStep={currentStep}
                messages={chatMessages}
                onMessagesChange={handleMessagesChange}
                onProjectUpdate={handleProjectUpdate}
                aiResponse={aiMessage || undefined}
                isLoading={isOverviewLoading || isEditingMode}
              />
            </div>

            {/* Right Panel - Project Overview or Requirements */}
            <div
              className={`border-l border-gray-200 transition-all duration-700 ease-in-out h-full flex flex-col ${
                showRequirements ? "w-2/3" : "w-1/3"
              }`}
            >
              {showRequirements ? (
                isProcessing ? (
                  <RequirementsLoading
                    stage={
                      isExtractingRequirements
                        ? "extracting"
                        : isUpdatingRequirements
                        ? "updating"
                        : isSaving
                        ? "saving"
                        : "processing"
                    }
                  />
                ) : (
                  <RequirementsPanel
                    onNextStep={handleNextStep}
                    onPrevStep={handlePrevStep}
                    currentStep={currentStep}
                    projectData={{
                      description: projectDescription,
                      serviceType: selectedServiceType,
                      uploadedFiles,
                      chatMessages,
                    }}
                    requirementsData={
                      editableRequirements || extractedRequirements || undefined
                    }
                    onOpenEditModal={(category) => {
                      setEditingCategory(category);
                      setShowEditModal(true);
                      setIsEditingMode(true);
                    }}
                    onDeleteCategory={handleCategoryDeleteRequest}
                    onAddNFR={handleAddNFR}
                    onEditNFR={handleEditNFR}
                    onDeleteNFR={handleDeleteNFR}
                    isNextButtonEnabled={isStep2ButtonEnabled}
                    isLoading={isOverviewLoading}
                  />
                )
              ) : (
                <ProjectOverviewPanel
                  projectDescription={projectDescription}
                  serviceType={selectedServiceType}
                  uploadedFiles={uploadedFiles}
                  onNextStep={handleNextStep}
                  currentStep={currentStep}
                  messages={chatMessages}
                  onGenerateOverview={generateOverviewRef}
                  realtimeOverview={overview || undefined}
                  isLoading={isOverviewLoading}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Panel - Full Screen */}
      {showConfirmation && (
        <div className="flex-1">
          <ConfirmationPanel
            onNextStep={handleNextStep}
            onPrevStep={handlePrevStep}
            currentStep={currentStep}
            projectData={{
              description: projectDescription,
              serviceType: selectedServiceType,
              uploadedFiles,
              chatMessages,
            }}
            extractedRequirements={extractedRequirements}
            projectOverview={overview}
            wireframe={wireframe}
            isGeneratingWireframe={isGenerating}
            isApplyingEdit={isApplying}
            wireframeError={wireframeError}
            onGenerateWireframe={() => {
              if (savedProjectId) {
                generateWireframe(savedProjectId);
              } else {
                alert('프로젝트를 먼저 저장해주세요');
              }
            }}
            onRegenerateWireframe={() => {
              clearWireframe();
              if (savedProjectId) {
                generateWireframe(savedProjectId);
              }
            }}
            onApplyEdit={async (prompt: string) => {
              if (savedProjectId) {
                await applyEdit(savedProjectId, prompt);
              } else {
                alert('프로젝트를 먼저 저장해주세요');
              }
            }}
            savedProjectId={savedProjectId ?? undefined}
          />
        </div>
      )}

      {/* Final Result Panel - Full Screen */}
      {showFinalResult && (
        <div className="flex-1">
          <RequirementsResultPanel
            projectData={{
              description: projectDescription,
              serviceType: selectedServiceType,
              uploadedFiles,
              chatMessages,
            }}
            extractedRequirements={extractedRequirements}
            projectOverview={overview}
            wireframe={wireframe}
          />
        </div>
      )}

      {/* 로그인 안내 모달 */}
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={closeLoginModal}
        title="로그인이 필요한 서비스입니다"
        description="프로젝트 진행 및 요구사항 관리를 위해 로그인이 필요합니다. 로그인 후 계속 진행하시겠습니까?"
        isProcessing={isProcessingLogin}
      />

      {/* 요구사항 편집 모달 (선택된 대분류의 소분류 리스트 표시/편집) */}
      <SimpleRequirementModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setIsEditingMode(false); // UI 편집 모드 종료
          // 모달 닫힐 때 최근 작업 목록 갱신
          loadRecentProjects(true);
        }}
        requirements={getModalRequirementsForCategory(editingCategory)}
        onRequirementsChange={async (newRequirements) => {
          try {
            await applyModalChangesToStructure(
              editingCategory,
              newRequirements
            );
          } catch (error) {
            console.error("요구사항 변경 실패:", error);
          }
        }}
        categoryTitle={getCategoryTitle(editingCategory)}
        onCategoryTitleChange={async (newTitle) => {
          try {
            await handleCategoryTitleUpdate(editingCategory, newTitle);
          } catch (error) {
            console.error("카테고리 제목 변경 실패:", error);
            throw error;
          }
        }}
        onRequirementStatusChange={handleRequirementStatusChange}
        isSaving={isSaving}
        saveError={saveError}
        projectData={{
          description: projectDescription,
          serviceType: selectedServiceType,
        }}
      />

      {/* 최종 확인 모달 */}
      <FinalConfirmationModal
        isOpen={showFinalModal}
        onClose={() => setShowFinalModal(false)}
        onConfirm={handleFinalConfirm}
      />

      {/* 중분류 삭제 확인 모달 */}
      <CategoryDeleteConfirmModal
        isOpen={showCategoryDeleteModal}
        onClose={() => {
          setShowCategoryDeleteModal(false);
          setCategoryToDelete(null);
        }}
        onConfirm={() => {
          if (categoryToDelete) {
            handleCategoryDelete(categoryToDelete.id);
          }
        }}
        categoryTitle={categoryToDelete?.title || ""}
        requirementCount={categoryToDelete?.requirementCount || 0}
      />

      {/* AI 검증 로딩 화면 */}
      {isVerifying && <AIVerificationLoading />}

      {/* AI 검증 결과 모달 */}
      {showVerificationModal && verificationResult && (
        <VerificationResultModal
          isOpen={showVerificationModal}
          result={verificationResult}
          onClose={handleVerificationClose}
          onProceed={handleVerificationProceed}
          onGoBack={handleVerificationGoBack}
        />
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4">
            <div
              className="animate-spin rounded-full h-16 w-16 border-4 border-t-transparent"
              style={{ borderColor: "#6366F1", borderTopColor: "transparent" }}
            />
          </div>
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
