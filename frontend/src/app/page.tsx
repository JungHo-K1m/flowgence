"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ServiceTypeButtons } from "@/components/project/ServiceTypeButtons";
import { FileUpload } from "@/components/project/FileUpload";

export default function HomePage() {
  const router = useRouter();
  const [projectDescription, setProjectDescription] = useState("");
  const [selectedServiceType, setSelectedServiceType] = useState<string>("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleStart = () => {
    // 프로젝트 생성 페이지로 이동
    router.push("/project/new");
  };

  const handleFileSelect = (files: File[]) => {
    setUploadedFiles(files);
    console.log("Selected files:", files);
  };

  const handleServiceTypeSelect = (serviceType: string) => {
    setSelectedServiceType(serviceType);
  };

  return (
    <div className="min-h-screen bg-white">
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
              <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
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
    </div>
  );
}
