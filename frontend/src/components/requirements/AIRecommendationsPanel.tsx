"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

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

  // 모달이 열릴 때마다 추천 요청
  useEffect(() => {
    if (categoryTitle) {
      hasLoadedRef.current = false;
      fetchRecommendations();
      hasLoadedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryTitle]);

  const fetchRecommendations = async () => {
    if (isLoading || isStreaming) return;

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
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${backendUrl}/chat/requirements/recommendations`, {
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
      const recommendationsList: AIRecommendation[] = [];
      let currentRec: Partial<AIRecommendation> = {};

      if (reader) {
        console.log('스트리밍 시작 - reader 생성됨');
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('스트리밍 완료 (done=true)');
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          console.log('스트리밍 청크 수신:', chunk.substring(0, 100));
          buffer += chunk;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                setIsStreaming(false);
                if (currentRec.title && currentRec.description) {
                  recommendationsList.push({
                    ...currentRec,
                    id: Date.now().toString() + Math.random().toString(36).substring(7),
                    category: categoryTitle.toLowerCase(),
                    priority: currentRec.priority || 'medium',
                  } as AIRecommendation);
                }
                setRecommendations(recommendationsList);
                setCurrentRecommendation({});
                setStreamingText("");
                return;
              }

              try {
                const json = JSON.parse(data);
                console.log('수신된 SSE 이벤트:', json);
                if (json.type === 'recommendation') {
                  if (json.field === 'title') {
                    // 이전 추천이 완성되었으면 저장
                    if (currentRec.title && currentRec.description && currentRec.description.length > 10) {
                      // 설명이 너무 짧으면 제외 (불완전한 항목)
                      const existingIndex = recommendationsList.findIndex(r => r.title === currentRec.title);
                      if (existingIndex < 0) {
                        recommendationsList.push({
                          ...currentRec,
                          id: Date.now().toString() + Math.random().toString(36).substring(7),
                          category: categoryTitle.toLowerCase(),
                          priority: currentRec.priority || 'medium',
                        } as AIRecommendation);
                        setRecommendations([...recommendationsList]);
                      }
                    }
                    // 새 추천 시작
                    currentRec = { title: json.value };
                    setCurrentRecommendation({ ...currentRec });
                  } else if (json.field === 'description') {
                    // description은 완성된 값으로 받음 (백엔드에서 완성된 항목만 전송)
                    currentRec.description = json.value;
                    setCurrentRecommendation({ ...currentRec });
                    setStreamingText(json.value || '');
                    
                    // title과 description이 모두 있고, 설명이 충분히 길면 목록에 추가 (중복 방지)
                    if (currentRec.title && 
                        currentRec.description && 
                        currentRec.description.length > 10 && // 최소 길이 체크
                        !recommendationsList.find(r => r.title === currentRec.title)) {
                      const newRec = {
                        ...currentRec,
                        id: Date.now().toString() + Math.random().toString(36).substring(7),
                        category: categoryTitle.toLowerCase(),
                        priority: currentRec.priority || 'medium',
                      } as AIRecommendation;
                      recommendationsList.push(newRec);
                      setRecommendations([...recommendationsList]);
                      console.log('추천 항목 추가됨:', newRec);
                    }
                  } else if (json.field === 'priority') {
                    currentRec.priority = json.value;
                    setCurrentRecommendation({ ...currentRec });
                    
                    // priority가 설정되면 완성된 것으로 간주하고 목록 업데이트
                    if (currentRec.title && currentRec.description && currentRec.description.length > 10) {
                      const existingIndex = recommendationsList.findIndex(r => r.title === currentRec.title);
                      if (existingIndex >= 0) {
                        recommendationsList[existingIndex].priority = json.value;
                        setRecommendations([...recommendationsList]);
                      } else {
                        recommendationsList.push({
                          ...currentRec,
                          id: Date.now().toString() + Math.random().toString(36).substring(7),
                          category: categoryTitle.toLowerCase(),
                          priority: json.value,
                        } as AIRecommendation);
                        setRecommendations([...recommendationsList]);
                      }
                    }
                  }
                } else if (json.type === 'error') {
                  console.error('추천 API 에러:', json.message);
                  setIsLoading(false);
                  setIsStreaming(false);
                  setRecommendations([]);
                }
              } catch (e) {
                // JSON 파싱 실패 무시 (스트리밍 중일 수 있음)
                console.log('JSON 파싱 실패:', e, data.substring(0, 100));
              }
            }
          }
        }
      }

      setIsStreaming(false);
      if (currentRec.title && currentRec.description) {
        recommendationsList.push({
          ...currentRec,
          id: Date.now().toString() + Math.random().toString(36).substring(7),
          category: categoryTitle.toLowerCase(),
          priority: currentRec.priority || 'medium',
        } as AIRecommendation);
      }
      setRecommendations(recommendationsList);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('요청이 취소되었습니다.');
      } else {
        console.error('추천 요청 실패:', error);
        setIsLoading(false);
        setIsStreaming(false);
        // 에러 시 빈 배열 유지
        setRecommendations([]);
        setCurrentRecommendation({});
        setStreamingText("");
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleAddRecommendation = (recommendation: AIRecommendation) => {
    onAddRequirement({
      title: recommendation.title,
      description: recommendation.description,
      category: recommendation.category,
      priority: recommendation.priority || "medium",
    });
    // 추가된 요구사항을 리스트에서 제거
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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
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
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
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
                  {recommendation.title}
                </h4>
                <p className="text-sm text-gray-600">
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
