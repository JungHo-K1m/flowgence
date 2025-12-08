"use client";

interface FinalConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function FinalConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
}: FinalConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 mx-2">
        <div className="flex items-center mb-3 sm:mb-4">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="ml-2 sm:ml-3 text-base sm:text-lg font-medium text-gray-900">최종 확인</h3>
        </div>

        <div className="mb-4 sm:mb-6">
          <p className="text-sm sm:text-base text-gray-600">
            해당 프로젝트에 대하여 견적 요청을 진행하겠습니까?
          </p>
          <p className="text-xs sm:text-sm text-gray-500 mt-2">
            확인하시면 최종 요구사항 결과 페이지로 이동합니다.
          </p>
        </div>

        <div className="flex justify-end space-x-2 sm:space-x-3">
          <button
            onClick={onClose}
            className="px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
