"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ServiceTypeButtons } from "@/components/project/ServiceTypeButtons";
import { FileUpload } from "@/components/project/FileUpload";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { ProjectOverviewPanel } from "@/components/project/ProjectOverviewPanel";
import { RequirementsPanel } from "@/components/requirements/RequirementsPanel";
import { RequirementsLoading } from "@/components/requirements/RequirementsLoading";
import { ConfirmationPanel } from "@/components/project/ConfirmationPanel";
import { RequirementsResultPanel } from "@/components/project/RequirementsResultPanel";
import { FinalConfirmationModal } from "@/components/project/FinalConfirmationModal";
import { ProgressBar } from "@/components/layout/ProgressBar";
import { LoginRequiredModal } from "@/components/auth/LoginRequiredModal";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useStatePersistence } from "@/hooks/useStatePersistence";
import { SimpleRequirementModal } from "@/components/requirements/SimpleRequirementModal";
import { CategoryDeleteConfirmModal } from "@/components/requirements/CategoryDeleteConfirmModal";
import { useRequirementsExtraction } from "@/hooks/useRequirementsExtraction";
import { useRequirementsUpdate } from "@/hooks/useRequirementsUpdate";
import { useProjectStorage } from "@/hooks/useProjectStorage";
import {
  ExtractedRequirements,
  RequirementCategory,
  Requirement,
} from "@/types/requirements";
import { useProjectOverview } from "@/hooks/useProjectOverview";

interface Message {
  id: string;
  type: "system" | "ai" | "user";
  content: string;
  description?: string;
  icon?: string;
  options?: Array<{ id: string; label: string }>;
}

export default function HomePage() {
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
  const [chatMessages, setChatMessages] = useState<Message[]>([]);

  // useProjectOverview 훅 사용
  const {
    overview,
    updateOverview,
    isLoading: isOverviewLoading,
  } = useProjectOverview();

  // 요구사항 추출 및 저장 훅 사용
  const {
    extractRequirements,
    isLoading: isExtractingRequirements,
    extractedRequirements,
  } = useRequirementsExtraction();

  // 요구사항 업데이트 훅 사용
  const {
    updateRequirements: updateRequirementsFromChat,
    isLoading: isUpdatingRequirements,
  } = useRequirementsUpdate();

  const {
    saveProjectWithMessages,
    saveRequirements,
    isLoading: isSaving,
    error: saveError,
    savedProjectId,
  } = useProjectStorage();

  // 요구사항 편집 모달 상태
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string>("");
  // 로컬 편집용 요구사항 상태 (AI 추출 값을 기반으로 편집 반영)
  const [editableRequirements, setEditableRequirements] =
    useState<ExtractedRequirements | null>(null);

  // 통합 로딩 상태 (요구사항 추출 + 업데이트 + 저장)
  const isProcessing =
    isExtractingRequirements ||
    isUpdatingRequirements ||
    isSaving ||
    isRequirementsLoading;

  // 디버깅용 로그 (1단계 버튼 활성화 상태 확인)
  useEffect(() => {
    console.log("=== 1단계 버튼 활성화 상태 디버깅 ===");
    console.log("overview 존재 여부:", !!overview);
    console.log("overview 데이터:", overview);
    console.log("isOverviewLoading:", isOverviewLoading);
    console.log("=====================================");
  }, [overview, isOverviewLoading]);

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

  // 편집된 요구사항을 DB에 저장
  const saveEditedRequirements = useCallback(
    async (updatedRequirements: ExtractedRequirements) => {
      if (!savedProjectId) {
        console.warn("저장된 프로젝트 ID가 없습니다. DB 저장을 건너뜁니다.");
        return;
      }

      try {
        console.log("편집된 요구사항 DB 저장 시작:", savedProjectId);
        const result = await saveRequirements(
          savedProjectId,
          updatedRequirements
        );

        if (result.status === "success") {
          console.log("편집된 요구사항 DB 저장 성공");
          // 성공 토스트 표시 (추후 구현)
        } else {
          console.error("편집된 요구사항 DB 저장 실패:", result.message);
          // 실패 토스트 표시 (추후 구현)
          throw new Error(result.message || "저장에 실패했습니다");
        }
      } catch (error) {
        console.error("편집된 요구사항 DB 저장 중 오류:", error);
        // 오류 토스트 표시 (추후 구현)
        throw error;
      }
    },
    [savedProjectId, saveRequirements]
  );

  // onProjectUpdate 콜백을 useCallback으로 감싸서 불필요한 리렌더링 방지
  const handleProjectUpdate = useCallback(
    async (data: {
      description: string;
      serviceType: string;
      uploadedFiles: File[];
      messages: Message[];
    }) => {
      console.log("프로젝트 개요 업데이트 트리거:", data);
      console.log("updateOverview 함수 호출 시작");

      // 1. 프로젝트 개요 업데이트
      await updateOverview(
        {
          description: data.description,
          serviceType: data.serviceType,
          uploadedFiles: data.uploadedFiles,
        },
        data.messages
      );
      console.log("updateOverview 함수 호출 완료");

      // 2. 요구사항이 이미 추출되어 있다면 업데이트
      const currentRequirements = editableRequirements || extractedRequirements;
      if (currentRequirements && savedProjectId) {
        console.log("요구사항 업데이트 시작");
        console.log("현재 요구사항 상태:", {
          hasEditableRequirements: !!editableRequirements,
          hasExtractedRequirements: !!extractedRequirements,
          totalCount: currentRequirements.totalCount,
        });

        try {
          const updatedRequirements = await updateRequirementsFromChat(
            {
              description: data.description,
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
          console.log("요구사항 업데이트 및 저장 완료");
        } catch (error) {
          console.error("요구사항 업데이트 실패:", error);
          // 업데이트 실패해도 프로젝트 개요는 업데이트되었으므로 계속 진행
        }
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
      if (!base?.categories)
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
      const target = base.categories.find(
        (cat: RequirementCategory) =>
          cat.majorCategory && normalizeId(cat.majorCategory) === categoryId
      );
      if (!target) return [];
      const flat = target.subCategories?.flatMap((sub) =>
        (sub.requirements || []).map((req: Requirement, index: number) => ({
          id: req.id || `${target.majorCategory}-${sub.subCategory}-${index}`,
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
      return flat;
    },
    [editableRequirements, extractedRequirements, normalizeId]
  );

  // 모달 타이틀용 대분류 이름 가져오기
  const getCategoryTitle = useCallback(
    (categoryId: string) => {
      const base = editableRequirements || extractedRequirements;
      const target = base?.categories?.find(
        (cat: RequirementCategory) =>
          cat.majorCategory && normalizeId(cat.majorCategory) === categoryId
      );
      return target?.majorCategory || "기타";
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
          (category: RequirementCategory) =>
            category.majorCategory &&
            normalizeId(category.majorCategory) === categoryId
              ? { ...category, majorCategory: newTitle }
              : category
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
          cat.majorCategory && normalizeId(cat.majorCategory) === categoryId
      );

      if (targetCategory) {
        const requirementCount = targetCategory.subCategories.reduce(
          (total, sub) => total + (sub.requirements?.length || 0),
          0
        );

        setCategoryToDelete({
          id: categoryId,
          title: targetCategory.majorCategory,
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
      }>
    ) => {
      const base = editableRequirements || extractedRequirements;
      if (!base?.categories) return;

      const next = {
        ...base,
        categories: base.categories.map((cat: RequirementCategory) => {
          if (
            !cat.majorCategory ||
            normalizeId(cat.majorCategory) !== categoryId
          )
            return cat;

          // 기존 요구사항을 id -> 위치 매핑으로 빠르게 찾도록 준비
          const requirementIndexMap = new Map<
            string,
            { subIndex: number; reqIndex: number }
          >();
          cat.subCategories.forEach((sub, si: number) => {
            (sub.requirements || []).forEach((req: Requirement, ri: number) => {
              if (req.id)
                requirementIndexMap.set(req.id, { subIndex: si, reqIndex: ri });
            });
          });

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
          newSubCategories.forEach((sub) => {
            sub.requirements = sub.requirements.filter(
              (req: Requirement) => !req.id || keepIds.has(req.id)
            );
          });

          // 2) 업데이트/추가 처리
          updatedFlatList.forEach((item) => {
            const found = item.id && requirementIndexMap.get(item.id);
            if (found) {
              const { subIndex, reqIndex } = found;
              const prev =
                newSubCategories[subIndex].requirements[reqIndex] || {};
              newSubCategories[subIndex].requirements[reqIndex] = {
                ...prev,
                id: item.id,
                title: item.title,
                description: item.description,
                // 편집된 요구사항은 자동으로 승인 상태로 변경
                status: "approved",
                needsClarification: false,
                clarificationQuestions: [],
              };
            } else {
              // 새 항목은 첫 번째 중분류에 추가 (추후 UI에서 이동 기능 추가 가능)
              if (newSubCategories.length === 0) {
                newSubCategories.push({
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
          });

          return {
            ...cat,
            subCategories: newSubCategories,
          };
        }),
      };

      setEditableRequirements(next);

      // 변경사항을 즉시 DB에 저장 (낙관적 업데이트)
      await saveEditedRequirements(next);
    },
    [
      editableRequirements,
      extractedRequirements,
      normalizeId,
      saveEditedRequirements,
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

  // 인증 가드 및 상태 유지
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

  // showLoginModal 상태 디버깅
  useEffect(() => {
    console.log("showLoginModal 상태 변경:", showLoginModal);
  }, [showLoginModal]);
  const {} = useStatePersistence();
  const searchParams = useSearchParams();
  const targetStep = searchParams.get("step");

  // 로그인 후 상태 복원 및 자동 단계 이동
  const hasRestoredState = useRef(false);

  useEffect(() => {
    const handleLoginStateRestore = async () => {
      // 이미 복원했으면 중복 실행 방지 (단, tempState가 새로 나타난 경우는 예외)
      if (hasRestoredState.current && !hasTempState) {
        console.log("이미 상태 복원 완료 - 중복 실행 방지");
        return;
      }
      console.log("로그인 상태 복원 체크:", {
        user: !!user,
        hasTempState,
        tempState: !!tempState?.projectData,
        loading,
      });

      if (user && !loading) {
        if (hasTempState && tempState?.projectData) {
          console.log("로그인 후 상태 복원 시작:", tempState);

          try {
            // 1. 임시 상태를 실제 DB로 이전
            const result = await processLoginState();

            if (result && result.success) {
              console.log("로그인 후 상태 이전 성공:", result);

              // 2. UI 상태 복원
              const { projectData, targetStep: savedTargetStep } = tempState;

              setProjectDescription(projectData.description || "");
              setSelectedServiceType(projectData.serviceType || "");
              setUploadedFiles(projectData.uploadedFiles || []);
              setChatMessages(projectData.chatMessages || []);

              // 요구사항 데이터 복원
              if (result.extractedRequirements) {
                setEditableRequirements(result.extractedRequirements);
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
              console.log("기본 상태 복원 시도");
              const { projectData, targetStep: savedTargetStep } = tempState;

              setProjectDescription(projectData.description || "");
              setSelectedServiceType(projectData.serviceType || "");
              setUploadedFiles(projectData.uploadedFiles || []);
              setChatMessages(projectData.chatMessages || []);

              if (projectData.chatMessages?.length > 0) {
                setShowChatInterface(true);
              }

              const stepToMove = targetStep || savedTargetStep || 2;
              if (stepToMove === "2" || stepToMove === 2) {
                setShowRequirements(true);
                setCurrentStep(2);
              } else if (stepToMove === "3" || stepToMove === 3) {
                setShowConfirmation(true);
                setCurrentStep(3);
              }

              // 기본 복원 완료 플래그 설정
              hasRestoredState.current = true;
            }
          } catch (error) {
            console.error("로그인 후 상태 복원 중 오류:", error);
            // 오류 발생 시 기본 상태 복원
            const { projectData } = tempState;
            if (projectData) {
              setProjectDescription(projectData.description || "");
              setSelectedServiceType(projectData.serviceType || "");
              setUploadedFiles(projectData.uploadedFiles || []);
              setChatMessages(projectData.chatMessages || []);

              if (projectData.chatMessages?.length > 0) {
                setShowChatInterface(true);
              }

              setShowRequirements(true);
              setCurrentStep(2);
            }

            // 오류 복원 완료 플래그 설정
            hasRestoredState.current = true;
          }
        } else {
          // tempState가 없는 경우 - URL 파라미터로 단계 이동
          console.log("tempState 없음 - URL 파라미터로 단계 이동");
          if (targetStep === "2" || targetStep === "2") {
            setShowRequirements(true);
            setCurrentStep(2);

            // 요구사항이 없으면 추출 실행 (별도 useEffect에서 처리)
            if (!extractedRequirements && !editableRequirements) {
              console.log("요구사항 없음 - 추출 필요");
            }
          } else if (targetStep === "3" || targetStep === "3") {
            setShowConfirmation(true);
            setCurrentStep(3);
          } else if (targetStep === "4" || targetStep === "4") {
            setShowFinalResult(true);
            setCurrentStep(4);
          }

          // URL 파라미터 복원 완료 플래그 설정
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
    extractedRequirements,
    editableRequirements,
  ]);

  // 요구사항 추출을 위한 별도 useEffect
  const hasExtractedRequirements = useRef(false);

  useEffect(() => {
    const handleRequirementsExtraction = async () => {
      // 2단계이고 요구사항이 없고 아직 추출하지 않았으면 추출 실행
      if (
        currentStep === 2 &&
        showRequirements &&
        !extractedRequirements &&
        !editableRequirements &&
        !hasExtractedRequirements.current &&
        !isRequirementsLoading
      ) {
        console.log("요구사항 추출 시작");
        hasExtractedRequirements.current = true;
        setIsRequirementsLoading(true);

        try {
          const requirements = await extractRequirements(
            {
              description: projectDescription,
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
            setEditableRequirements(requirements);

            // 로그인된 사용자면 DB에 저장
            if (user && savedProjectId) {
              try {
                await saveRequirements(savedProjectId, requirements);
                console.log("요구사항 저장 완료");
              } catch (error) {
                console.error("요구사항 저장 실패:", error);
              }
            }
          }
        } catch (error) {
          console.error("요구사항 추출 실패:", error);
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

  const handleStart = () => {
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
  };

  const handleFileSelect = (files: File[]) => {
    setUploadedFiles(files);
    console.log("Selected files:", files);
  };

  const handleServiceTypeSelect = (serviceType: string) => {
    setSelectedServiceType(serviceType);
  };

  // 메시지 변경 핸들러 (useCallback으로 최적화)
  const handleMessagesChange = useCallback((newMessages: Message[]) => {
    setChatMessages(newMessages);
    // 프로젝트 개요 업데이트는 onProjectUpdate에서 처리하므로 여기서는 제거
  }, []);

  const handleNextStep = async () => {
    if (currentStep === 1) {
      // 프로젝트 개요에서 요구사항 관리로 전환 (즉시 페이지 전환)

      // 1단계에서 2단계로 넘어갈 때는 로그인 없이 진행 가능
      // 1. 즉시 페이지 전환
      setShowRequirements(true);
      setCurrentStep(2);
      setIsRequirementsLoading(true);

      try {
        console.log("1단계 → 2단계 전환: 요구사항 추출 시작");

        // 2. 요구사항 추출 (로그인 없이도 가능)
        const requirements = await extractRequirements(
          {
            description: projectDescription,
            serviceType: selectedServiceType,
            uploadedFiles,
            projectOverview: overview, // 프로젝트 개요 정보 추가
          },
          chatMessages.map((msg) => ({
            type: msg.type === "ai" ? "ai" : msg.type,
            content: msg.content,
          }))
        );

        console.log("요구사항 추출 완료:", requirements);

        // 로그인된 사용자만 프로젝트 데이터 저장
        if (user) {
          // 3. 프로젝트 데이터 저장
          const projectData = {
            title: projectDescription.substring(0, 100),
            description: projectDescription,
            serviceType: selectedServiceType,
            project_overview: overview,
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

          console.log("프로젝트 저장 시작");
          const projectResult = await saveProjectWithMessages(
            projectData,
            messages
          );

          if (projectResult.status === "success") {
            console.log("프로젝트 저장 성공:", projectResult.project_id);

            // 4. 요구사항 저장
            if (requirements) {
              console.log("요구사항 저장 시작");
              const requirementsResult = await saveRequirements(
                projectResult.project_id,
                requirements
              );

              if (requirementsResult.status === "success") {
                console.log("요구사항 저장 성공");
                setEditableRequirements(requirements);
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
          console.log("로그인하지 않은 사용자: 로컬 상태로만 저장");
          setEditableRequirements(requirements);
        }
      } catch (error) {
        console.error("요구사항 추출 또는 저장 중 오류:", error);
      } finally {
        setIsRequirementsLoading(false);
      }
    } else if (currentStep === 2) {
      // 2단계에서 3단계로 넘어갈 때는 로그인 필요
      requireAuth(
        () => {
          setShowRequirements(false);
          setShowConfirmation(true);
          setCurrentStep(3);
        },
        {
          title: projectDescription.substring(0, 100),
          description: projectDescription,
          serviceType: selectedServiceType,
          uploadedFiles,
          chatMessages,
          requirements: editableRequirements || [],
          projectOverview: overview,
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

  const handleFinalConfirm = () => {
    setShowFinalModal(false);
    setShowConfirmation(false);
    setShowFinalResult(true);
    setCurrentStep(4);
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

  return (
    <div className="min-h-screen bg-white">
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
          <div className="max-w-4xl mx-auto px-4 py-16">
            <div className="text-center">
              {/* Main Title */}
              <h1 className="text-[48px] font-bold text-black mb-4">
                당신이 만들고 싶은 서비스를 말하거나
                <br /> 자료를 업로드해보세요!
              </h1>

              {/* Subtitle */}
              <p className="text-[20px] text-[#4B5563] mb-12 max-w-2xl mx-auto">
                사업계획서 없이도 한 문장만 적어도 됩니다.
                <br />
                자료가 있다면 더 정확한 초안을 만들어 드려요.
              </p>

              {/* Text Input Section */}
              <div className="mb-8">
                <div className="relative max-w-[760px] w-full mx-auto mb-8 px-4 sm:px-0">
                  <div
                    className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:border-blue-500"
                    style={
                      {
                        "--tw-ring-color": "#6366F1",
                      } as React.CSSProperties
                    }
                  >
                    <input
                      type="text"
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      placeholder="예: 음식 배달 앱을 만들고 싶어요"
                      className="flex-1 px-6 py-4 bg-transparent border-0 focus:outline-none text-gray-700 placeholder-gray-500"
                    />
                    <button
                      onClick={handleStart}
                      className="bg-[#6366F1] text-white px-8 hover:bg-[#6366F1] transition-colors duration-200 font-medium m-2 rounded-lg h-[40px] flex items-center justify-center"
                    >
                      시작하기
                    </button>
                  </div>
                </div>

                {/* Service Type Buttons */}
                <ServiceTypeButtons
                  onSelect={handleServiceTypeSelect}
                  selectedType={selectedServiceType}
                />
              </div>

              {/* Separator */}
              <div className="flex items-center justify-center mb-8">
                <span className="text-gray-500 font-medium">또는</span>
              </div>

              {/* File Upload Section */}
              <div className="max-w-2xl mx-auto">
                <FileUpload onFileSelect={handleFileSelect} />
              </div>
            </div>
          </div>
        )}

      {/* Chat Interface with Slide Animation - Hide in confirmation and final result steps */}
      {!showConfirmation && !showFinalResult && (
        <div
          className={`transition-all duration-700 ease-in-out ${
            showChatInterface
              ? "opacity-100 translate-x-0"
              : "opacity-0 -translate-x-full pointer-events-none"
          }`}
        >
          <div className="flex h-screen">
            {/* Left Chat Interface */}
            <div
              className={`transition-all duration-700 ease-in-out ${
                showChatInterface ? "translate-x-0" : "-translate-x-full"
              } ${showRequirements ? "w-1/3" : "flex-1"}`}
            >
              <ChatInterface
                initialMessage=""
                serviceType={selectedServiceType}
                currentStep={currentStep}
                messages={chatMessages}
                onMessagesChange={handleMessagesChange}
                onProjectUpdate={handleProjectUpdate}
              />
            </div>

            {/* Right Panel - Project Overview or Requirements */}
            <div
              className={`border-l border-gray-200 transition-all duration-700 ease-in-out ${
                showChatInterface ? "translate-x-0" : "translate-x-full"
              } ${showRequirements ? "w-2/3" : "w-1/3"}`}
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
                    extractedRequirements={
                      editableRequirements || extractedRequirements
                    }
                    onOpenEditModal={(category) => {
                      setEditingCategory(category);
                      setShowEditModal(true);
                    }}
                    onDeleteCategory={handleCategoryDeleteRequest}
                    isNextButtonEnabled={isStep2ButtonEnabled}
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
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Panel - Full Screen */}
      {showConfirmation && (
        <div className="h-screen">
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
          />
        </div>
      )}

      {/* Final Result Panel - Full Screen */}
      {showFinalResult && (
        <div className="h-screen">
          <RequirementsResultPanel
            projectData={{
              description: projectDescription,
              serviceType: selectedServiceType,
              uploadedFiles,
              chatMessages,
            }}
            extractedRequirements={extractedRequirements}
            projectOverview={overview}
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
        onClose={() => setShowEditModal(false)}
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
    </div>
  );
}
