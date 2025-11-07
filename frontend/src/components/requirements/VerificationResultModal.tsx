"use client";

interface Suggestion {
  type: "missing" | "duplicate" | "unclear" | "priority" | "conflict";
  severity: "low" | "medium" | "high";
  message: string;
  category?: string;
}

interface Warning {
  message: string;
  affectedRequirements: string[];
}

interface VerificationResult {
  status: "ok" | "warning" | "error";
  score: number;
  suggestions: Suggestion[];
  warnings: Warning[];
  summary: {
    totalRequirements: number;
    issuesFound: number;
    criticalIssues: number;
  };
}

interface VerificationResultModalProps {
  isOpen: boolean;
  result: VerificationResult;
  onClose: () => void;
  onProceed: () => void;
  onGoBack: () => void;
}

export function VerificationResultModal({
  isOpen,
  result,
  onClose,
  onProceed,
  onGoBack,
}: VerificationResultModalProps) {
  if (!isOpen || !result) return null;

  const getStatusInfo = () => {
    switch (result.status) {
      case "ok":
        return {
          title: "✅ 검증 완료",
          description: "요구사항이 잘 정리되었습니다!",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          textColor: "text-green-800",
        };
      case "warning":
        return {
          title: "⚠️ 개선 권장",
          description: "몇 가지 개선 사항이 발견되었습니다.",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          textColor: "text-yellow-800",
        };
      case "error":
        return {
          title: "❌ 수정 필요",
          description: "요구사항을 수정해주세요.",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          textColor: "text-red-800",
        };
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">높음</span>;
      case "medium":
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">중간</span>;
      case "low":
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">낮음</span>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "missing":
        return "누락";
      case "duplicate":
        return "중복";
      case "unclear":
        return "불명확";
      case "priority":
        return "우선순위";
      case "conflict":
        return "충돌";
      default:
        return type;
    }
  };

  const statusInfo = getStatusInfo();
  const showProceedButton = result.status === "ok" || result.status === "warning";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className={`${statusInfo.bgColor} ${statusInfo.borderColor} border-b px-6 py-4`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-2xl font-bold ${statusInfo.textColor}`}>
                {statusInfo.title}
              </h2>
              <p className="text-gray-600 mt-1">{statusInfo.description}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">{result.score}점</div>
              <div className="text-sm text-gray-500">검증 점수</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-240px)] px-6 py-6">
          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">📊 검증 요약</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {result.summary.totalRequirements}
                </div>
                <div className="text-sm text-gray-600">총 요구사항</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {result.summary.issuesFound}
                </div>
                <div className="text-sm text-gray-600">발견된 문제</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {result.summary.criticalIssues}
                </div>
                <div className="text-sm text-gray-600">중요 문제</div>
              </div>
            </div>
          </div>

          {/* Warnings */}
          {result.warnings && result.warnings.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">⚠️ 경고사항</h3>
              <div className="space-y-3">
                {result.warnings.map((warning, index) => (
                  <div
                    key={index}
                    className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
                  >
                    <p className="text-gray-800">{warning.message}</p>
                    {warning.affectedRequirements.length > 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        영향받는 요구사항: {warning.affectedRequirements.join(", ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {result.suggestions && result.suggestions.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                💡 AI 제안사항 ({result.suggestions.length})
              </h3>
              <div className="space-y-3">
                {result.suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-700">
                          {getTypeLabel(suggestion.type)}
                        </span>
                        {getSeverityBadge(suggestion.severity)}
                      </div>
                      {suggestion.category && (
                        <span className="text-xs text-gray-500">
                          📂 {suggestion.category}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-800">{suggestion.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Issues */}
          {result.suggestions.length === 0 && result.warnings.length === 0 && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎉</div>
              <p className="text-lg text-gray-600">
                발견된 문제가 없습니다. 요구사항이 잘 정리되었습니다!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-between">
          <button
            onClick={onGoBack}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            이전으로 돌아가기
          </button>
          <div className="flex gap-3">
            {result.status === "error" ? (
              <button
                onClick={onClose}
                className="px-6 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                수정하기
              </button>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  수정하기
                </button>
                {showProceedButton && (
                  <button
                    onClick={onProceed}
                    className="px-6 py-2 text-white bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-colors font-medium shadow-lg"
                  >
                    계속 진행
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

