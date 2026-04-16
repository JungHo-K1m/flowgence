"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { isDevelopmentMode } from "@/lib/dummyData";
import { API_BASE_URL } from '@/lib/constants';

interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  priority?: "high" | "medium" | "low";
}

interface Requirement {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: "high" | "medium" | "low";
}

interface AIRecommendationsPanelProps {
  onAddRequirement: (requirement: Omit<Requirement, "id">) => void;
  requirements?: Requirement[];
  categoryTitle?: string;
  projectData?: {
    description?: string;
    serviceType?: string;
  };
}

export function AIRecommendationsPanel({
  onAddRequirement,
  requirements = [],
  categoryTitle = "",
  projectData,
}: AIRecommendationsPanelProps) {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [currentRecommendation, setCurrentRecommendation] = useState<Partial<AIRecommendation>>({});
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasLoadedRef = useRef(false);
  const addedRecommendationsRef = useRef<Set<string>>(new Set()); // 추가된 추천 항목 추적

  // 모달이 열릴 때마다 추천 요청
  useEffect(() => {
    if (categoryTitle) {
      hasLoadedRef.current = false;
      addedRecommendationsRef.current.clear(); // 카테고리 변경 시 추가된 항목 초기화
      setRecommendations([]); // 추천 목록 초기화
      fetchRecommendations();
      hasLoadedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryTitle]);

  const fetchRecommendations = async () => {
    if (isLoading || isStreaming) return;

    // 개발 모드에서는 API 호출하지 않음
    if (isDevelopmentMode()) {
      setRecommendations([]);
      return;
    }

    setIsLoading(true);
    setStreamingText("");
    setCurrentRecommendation({});
    setRecommendations([]);

    // 이전 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${API_BASE_URL}/chat/requirements/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryTitle,
          existingRequirements: requirements.map(r => ({
            title: r.title,
            description: r.description,
          })),
          projectData: {
            description: projectData?.description || '',
            serviceType: projectData?.serviceType || '',
          },
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      setIsLoading(false);
      setIsStreaming(true);

      // 스트리밍 처리
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const completedRecommendations = new Map<string, AIRecommendation>(); // 완성된 추천 항목 (title 기준)
      let currentRec: Partial<AIRecommendation> = {};

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                setIsStreaming(false);
                // 마지막 추천 항목 처리
                if (currentRec.title && currentRec.description && currentRec.description.length > 10) {
                  const titleKey = currentRec.title.trim().toLowerCase().replace(/^[:\s]+/, '').replace(/[:\s]+$/, '');
                  if (!completedRecommendations.has(titleKey) && !addedRecommendationsRef.current.has(titleKey)) {
                    completedRecommendations.set(titleKey, {
                      ...currentRec,
                      id: Date.now().toString() + Math.random().toString(36).substring(7),
                      category: categoryTitle.toLowerCase(),
                      priority: currentRec.priority || 'medium',
                      description: simplifyDescription(currentRec.description),
                    } as AIRecommendation);
                  }
                }
                // 완성된 추천 항목들을 state에 추가 (중복 제거)
                const newRecommendations = Array.from(completedRecommendations.values());
                setRecommendations((prev) => {
                  const existingTitles = new Set(prev.map(r => r.title.trim().toLowerCase().replace(/^[:\s]+/, '').replace(/[:\s]+$/, '')));
                  const uniqueNew = newRecommendations.filter(r => {
                    const cleanTitle = r.title.trim().toLowerCase().replace(/^[:\s]+/, '').replace(/[:\s]+$/, '');
                    return !existingTitles.has(cleanTitle) && !addedRecommendationsRef.current.has(cleanTitle);
                  });
                  uniqueNew.forEach(r => {
                    const cleanTitle = r.title.trim().toLowerCase().replace(/^[:\s]+/, '').replace(/[:\s]+$/, '');
                    addedRecommendationsRef.current.add(cleanTitle);
                  });
                  return [...prev, ...uniqueNew];
                });
                setCurrentRecommendation({});
                setStreamingText("");
                return;
              }

              try {
                const json = JSON.parse(data);
                if (json.type === 'recommendation') {
                  if (json.field === 'title') {
                    // 이전 추천이 완성되었으면 저장
                    if (currentRec.title && currentRec.description && currentRec.description.length > 10) {
                      const titleKey = currentRec.title.trim().toLowerCase().replace(/^[:\s]+/, '').replace(/[:\s]+$/, '');
                      if (!completedRecommendations.has(titleKey) && !addedRecommendationsRef.current.has(titleKey)) {
                        completedRecommendations.set(titleKey, {
                          ...currentRec,
                          id: Date.now().toString() + Math.random().toString(36).substring(7),
                          category: categoryTitle.toLowerCase(),
                          priority: currentRec.priority || 'medium',
                          description: simplifyDescription(currentRec.description),
                        } as AIRecommendation);
                      }
                    }
                    // 새 추천 시작
                    currentRec = { title: json.value };
                    setCurrentRecommendation({ ...currentRec });
                  } else if (json.field === 'description') {
                    // description은 완성된 값으로 받음
                    currentRec.description = json.value;
                    setCurrentRecommendation({ ...currentRec });
                    setStreamingText(json.value || '');
                    
                    // 완성된 항목을 Map에 저장 (중복 방지) - 스트리밍 중에는 Map에만 저장, state 업데이트는 하지 않음
                    if (currentRec.title && 
                        currentRec.description && 
                        currentRec.description.length > 10) {
                      const titleKey = currentRec.title.trim().toLowerCase().replace(/^[:\s]+/, '').replace(/[:\s]+$/, '');
                      if (!completedRecommendations.has(titleKey) && !addedRecommendationsRef.current.has(titleKey)) {
                        completedRecommendations.set(titleKey, {
                          ...currentRec,
                          id: Date.now().toString() + Math.random().toString(36).substring(7),
                          category: categoryTitle.toLowerCase(),
                          priority: currentRec.priority || 'medium',
                          description: simplifyDescription(currentRec.description),
                        } as AIRecommendation);
                      }
                    }
                  } else if (json.field === 'priority') {
                    currentRec.priority = json.value;
                    setCurrentRecommendation({ ...currentRec });
                    
                    // priority가 설정되면 완성된 것으로 간주 - Map에만 저장
                    if (currentRec.title && currentRec.description && currentRec.description.length > 10) {
                      const titleKey = currentRec.title.trim().toLowerCase().replace(/^[:\s]+/, '').replace(/[:\s]+$/, '');
                      if (completedRecommendations.has(titleKey)) {
                        // 이미 있는 항목의 priority 업데이트
                        const existing = completedRecommendations.get(titleKey)!;
                        existing.priority = json.value;
                      } else if (!addedRecommendationsRef.current.has(titleKey)) {
                        // 새 항목 추가
                        completedRecommendations.set(titleKey, {
                          ...currentRec,
                          id: Date.now().toString() + Math.random().toString(36).substring(7),
                          category: categoryTitle.toLowerCase(),
                          priority: json.value,
                          description: simplifyDescription(currentRec.description),
                        } as AIRecommendation);
                      }
                    }
                  }
                } else if (json.type === 'error') {
                  setIsLoading(false);
                  setIsStreaming(false);
                  setRecommendations([]);
                  
                  // 529 (Overloaded) 에러 처리
                  if (json.code === 529 || json.errorType === 'overloaded_error' ||
                      (json.message && (json.message.includes('529') || json.message.includes('Overloaded') || json.message.includes('사용량이 많아')))) {
                    alert('현재 사용량이 많아 서비스가 일시적으로 지연되고 있습니다. 잠시 후 다시 시도해주세요.');
                  }
                }
              } catch (e) {
                // JSON 파싱 실패 무시 (스트리밍 중일 수 있음)
              }
            }
          }
        }
      }

      // 스트리밍 완료 후 최종 처리
      setIsStreaming(false);
      if (currentRec.title && currentRec.description && currentRec.description.length > 10) {
        const titleKey = currentRec.title.trim().toLowerCase().replace(/^[:\s]+/, '').replace(/[:\s]+$/, '');
        if (!completedRecommendations.has(titleKey) && !addedRecommendationsRef.current.has(titleKey)) {
          completedRecommendations.set(titleKey, {
            ...currentRec,
            id: Date.now().toString() + Math.random().toString(36).substring(7),
            category: categoryTitle.toLowerCase(),
            priority: currentRec.priority || 'medium',
            description: simplifyDescription(currentRec.description),
          } as AIRecommendation);
        }
      }
      
      // 완성된 추천 항목들을 state에 추가 (중복 제거)
      const newRecommendations = Array.from(completedRecommendations.values());
      setRecommendations((prev) => {
        const existingTitles = new Set(prev.map(r => r.title.trim().toLowerCase().replace(/^[:\s]+/, '').replace(/[:\s]+$/, '')));
        const uniqueNew = newRecommendations.filter(r => {
          const cleanTitle = r.title.trim().toLowerCase().replace(/^[:\s]+/, '').replace(/[:\s]+$/, '');
          return !existingTitles.has(cleanTitle) && !addedRecommendationsRef.current.has(cleanTitle);
        });
        uniqueNew.forEach(r => {
          const cleanTitle = r.title.trim().toLowerCase().replace(/^[:\s]+/, '').replace(/[:\s]+$/, '');
          addedRecommendationsRef.current.add(cleanTitle);
        });
        return [...prev, ...uniqueNew];
      });
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // silently ignore
      } else {
        setIsLoading(false);
        setIsStreaming(false);
        // 에러 시 빈 배열 유지
        setRecommendations([]);
        setCurrentRecommendation({});
        setStreamingText("");
        
        // 529 (Overloaded) 에러 처리
        if (error.status === 503 || error.status === 529 || error.type === 'overloaded_error' ||
            (error.message && (error.message.includes('529') || error.message.includes('Overloaded') || error.message.includes('사용량이 많아')))) {
          alert('현재 사용량이 많아 서비스가 일시적으로 지연되고 있습니다. 잠시 후 다시 시도해주세요.');
        }
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  // 설명 단순화 함수 (최대 150자로 제한)
  const simplifyDescription = (description: string): string => {
    // 마크다운 제거
    const simplified = description
      .replace(/\*\*/g, '') // 볼드 제거
      .replace(/^#+\s*/gm, '') // 헤더 제거
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // 링크 제거
      .trim();
    
    // 첫 문장 또는 최대 150자로 제한
    const firstSentence = simplified.split(/[.。]\s+/)[0];
    if (firstSentence.length <= 150) {
      return firstSentence;
    }
    
    // 150자로 자르고 말줄임표 추가
    return simplified.substring(0, 150).replace(/\s+\S*$/, '') + '...';
  };

  const handleAddRecommendation = (recommendation: AIRecommendation) => {
    onAddRequirement({
      title: recommendation.title,
      description: recommendation.description,
      category: recommendation.category,
      priority: recommendation.priority || "medium",
    });
    // 추가된 요구사항을 리스트에서 제거
    const titleKey = recommendation.title.trim().toLowerCase();
    addedRecommendationsRef.current.add(titleKey);
    setRecommendations((prev) => 
      prev.filter((rec) => rec.id !== recommendation.id)
    );
  };

  // 추가된 요구사항과 중복되는 추천 필터링
  useEffect(() => {
    if (requirements.length > 0) {
      const existingTitles = new Set(requirements.map(r => r.title.toLowerCase().trim()));
      setRecommendations((prev) => 
        prev.filter((rec) => !existingTitles.has(rec.title.toLowerCase().trim()))
      );
    }
  }, [requirements]);

  // 새로고침 버튼 클릭 시
  const handleRefresh = () => {
    hasLoadedRef.current = false;
    fetchRecommendations();
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">추천 기능</h3>
          <Button
            variant="outline"
            size="sm"
            className="p-2"
            onClick={handleRefresh}
            disabled={isLoading || isStreaming}
          >
            🔄
          </Button>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          AI가 추천하는 기능을 드래그해서 오른쪽에 추가하세요.
        </p>
      </div>

      {/* Recommendations List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">AI가 추천 기능을 생성 중입니다...</p>
            </div>
          </div>
        )}

        {isStreaming && currentRecommendation.title && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="flex flex-col space-y-1 mt-1">
                <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
              </div>

              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">
                  {currentRecommendation.title}
                  <span className="ml-2 text-xs text-blue-600 animate-pulse">생성 중...</span>
                </h4>
                <p className="text-sm text-gray-600">
                  {currentRecommendation.description || streamingText}
                  {isStreaming && <span className="animate-pulse">▋</span>}
                </p>
              </div>
            </div>
          </div>
        )}

        {recommendations.map((recommendation) => (
          <div
            key={recommendation.id}
            className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow cursor-grab active:cursor-grabbing"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(
                "text/plain",
                JSON.stringify(recommendation)
              );
            }}
          >
            <div className="flex items-start space-x-3">
              {/* Drag Handle */}
              <div className="flex flex-col space-y-1 mt-1">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              </div>

              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">
                  {recommendation.title.replace(/^\*\*\s*/, '').replace(/\*\*$/, '').trim()}
                </h4>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {recommendation.description}
                </p>
              </div>

              {/* Add Button */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAddRecommendation(recommendation)}
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                +
              </Button>
            </div>
          </div>
        ))}

        {!isLoading && !isStreaming && recommendations.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            추천 기능이 없습니다.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          변경사항은 자동 저장됩니다
        </p>
      </div>
    </div>
  );
}
