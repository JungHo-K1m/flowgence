"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  className?: string;
}

export function FileUpload({ onFileSelect, className = "" }: FileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onFileSelect(acceptedFiles);
      setIsDragActive(false);
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "image/*": [".png", ".jpg", ".jpeg", ".gif"],
    },
    multiple: true,
  });

  const handleFileSelect = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif";
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      onFileSelect(files);
    };
    input.click();
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${
            isDragActive
              ? "border-purple-400 bg-purple-50"
              : isDragReject
              ? "border-red-400 bg-red-50"
              : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
          }
        `}
      >
        <input {...getInputProps()} />

        {/* Upload Icon */}
        <div className="mb-4">
          <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
        </div>

        {/* Upload Text */}
        <p className="text-lg font-medium text-gray-700 mb-2">
          파일이나 이미지를 여기로 끌어오세요
        </p>

        {/* File Select Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleFileSelect();
          }}
          className="bg-[#6366F1] text-white px-6 py-2 rounded-lg hover:bg-[#6366F1] transition-colors duration-200"
        >
          파일 선택하기
        </button>

        {/* Info Icon */}
        <button className="absolute top-4 right-4 w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center hover:bg-gray-400 transition-colors duration-200">
          <span className="text-xs font-medium text-gray-600">i</span>
        </button>
      </div>
    </div>
  );
}
