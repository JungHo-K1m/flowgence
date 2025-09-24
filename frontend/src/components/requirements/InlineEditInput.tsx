"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface InlineEditInputProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  onCancel?: () => void;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  isSaving?: boolean;
  saveError?: string | null;
  disabled?: boolean;
}

export function InlineEditInput({
  value,
  onSave,
  onCancel,
  className = "",
  placeholder = "",
  multiline = false,
  isSaving = false,
  saveError = null,
  disabled = false,
}: InlineEditInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // 외부에서 전달된 에러가 있으면 내부 에러 상태 업데이트
  useEffect(() => {
    if (saveError) {
      setError(saveError);
    }
  }, [saveError]);

  // 편집 모드 진입 시 포커스 및 텍스트 선택
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // 값이 변경되면 편집 값도 업데이트
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleStartEdit = () => {
    if (disabled) return;
    setEditValue(value);
    setIsEditing(true);
    setError(null);
  };

  const handleSave = async () => {
    if (editValue.trim() === value.trim()) {
      setIsEditing(false);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await onSave(editValue.trim());
      setIsEditing(false);
    } catch (err) {
      console.error("저장 실패:", err);
      setError(err instanceof Error ? err.message : "저장에 실패했습니다");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
    setError(null);
    onCancel?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !multiline && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    } else if (e.key === "Enter" && multiline && e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  // 편집 모드
  if (isEditing) {
    return (
      <div className="space-y-2">
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className} ${
              error ? "border-red-500" : ""
            }`}
            placeholder={placeholder}
            rows={3}
            disabled={isProcessing}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className} ${
              error ? "border-red-500" : ""
            }`}
            placeholder={placeholder}
            disabled={isProcessing}
          />
        )}

        {/* 액션 버튼들 */}
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isProcessing}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            {isProcessing ? (
              <div className="flex items-center space-x-1">
                <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full"></div>
                <span>저장중...</span>
              </div>
            ) : (
              "✓"
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isProcessing}
            className="disabled:opacity-50"
          >
            ✕
          </Button>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="text-red-500 text-sm flex items-center space-x-1">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* 키보드 단축키 안내 */}
        <div className="text-xs text-gray-500">
          {multiline
            ? "Shift + Enter: 저장, Escape: 취소"
            : "Enter: 저장, Escape: 취소"}
        </div>
      </div>
    );
  }

  // 표시 모드
  return (
    <div className="relative group">
      <span
        className={`cursor-pointer hover:text-blue-600 transition-colors ${className} ${
          disabled ? "cursor-not-allowed opacity-50" : ""
        }`}
        onClick={handleStartEdit}
      >
        {value || placeholder}
      </span>

      {/* 편집 아이콘 (호버 시 표시) */}
      {!disabled && (
        <span className="absolute -right-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 text-sm">
          ✏️
        </span>
      )}

      {/* 저장 상태 표시 */}
      {isSaving && (
        <span className="absolute -right-14 top-0 text-blue-500 text-sm">
          💾
        </span>
      )}
    </div>
  );
}
