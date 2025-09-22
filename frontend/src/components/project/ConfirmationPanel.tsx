"use client";

import { useState } from "react";

interface ConfirmationPanelProps {
  onNextStep: () => void;
  onPrevStep: () => void;
  currentStep: number;
  projectData: {
    description: string;
    serviceType: string;
    uploadedFiles: File[];
    chatMessages: unknown[];
  };
}

export function ConfirmationPanel({
  onNextStep,
  onPrevStep,
  currentStep,
  projectData,
}: ConfirmationPanelProps) {
  const [activeTab, setActiveTab] = useState<"requirements" | "estimate">(
    "requirements"
  );

  // 샘플 데이터
  const requirementsData = {
    total: 24,
    mandatory: 15,
    recommended: 6,
    optional: 3,
    projectType: "이커머스 플랫폼",
    estimatedUsers: "1000명/일",
    duration: "3개월",
  };

  const estimateData = {
    baseEstimate: 85000000,
    discount: 0,
    finalEstimate: 85000000,
    stages: [
      {
        name: "요구사항 분석 및 설계",
        duration: "2주",
        percentage: 20,
        cost: 17000000,
      },
      {
        name: "개발",
        duration: "6주",
        percentage: 50,
        cost: 42500000,
      },
      {
        name: "통합 테스트 및 QA",
        duration: "2주",
        percentage: 15,
        cost: 12750000,
      },
      {
        name: "배포 및 안정화",
        duration: "2주",
        percentage: 15,
        cost: 12750000,
      },
    ],
    payments: [
      { stage: "계약 시", percentage: 30, amount: 24000000 },
      { stage: "중간 검수", percentage: 40, amount: 32000000 },
      { stage: "최종 납품", percentage: 30, amount: 24000000 },
    ],
    projectOverview: {
      duration: "12주",
      period: "2025년 1월~4월",
      personnel: 6,
      breakdown: "개발자 4명, 디자이너 1명, PM 1명",
      warranty: "1년",
      warrantyDetail: "무상 유지보수",
    },
  };

  const requirementsDetails = [
    {
      category: "상품 관리",
      count: 4,
      expanded: true,
      items: [
        {
          id: "FR-001",
          title: "상품 등록/수정",
          description: "상품 기본 정보 등록 및 옵션 관리",
          effort: "5일",
          cost: 4000000,
        },
        {
          id: "FR-002",
          title: "재고 관리",
          description: "실시간 재고 추적 및 알림 기능",
          effort: "5일",
          cost: 4000000,
        },
        {
          id: "FR-003",
          title: "상품 카테고리 관리",
          description: "다단계 카테고리 구조 및 필터링",
          effort: "5일",
          cost: 4000000,
        },
      ],
    },
    {
      category: "주문&결제",
      count: 4,
      expanded: false,
      items: [],
    },
    {
      category: "배송 관리",
      count: 4,
      expanded: false,
      items: [],
    },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR").format(amount) + "원";
  };

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Tabs */}
      <div className="border-b border-gray-200 px-6">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab("requirements")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "requirements"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            확정 요구사항
          </button>
          <button
            onClick={() => setActiveTab("estimate")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "estimate"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            상세 견적
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "requirements" ? (
          <div className="p-6">
            {/* Confirmation Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    요구사항이 확정되었습니다
                  </h3>
                  <p className="text-sm text-blue-600 mt-1">
                    확정된 요구사항은 수정할 수 없으며, 변경이 필요한 경우
                    담당자에게 문의하세요.
                  </p>
                </div>
              </div>
            </div>

            {/* Project Summary Cards */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                확정된 프로젝트 요구사항
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">
                    총 요구사항
                  </h3>
                  <div className="text-2xl font-bold text-blue-600">
                    {requirementsData.total}개
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    필수 {requirementsData.mandatory} · 권장{" "}
                    {requirementsData.recommended} · 선택{" "}
                    {requirementsData.optional}
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">
                    프로젝트 유형
                  </h3>
                  <div className="text-lg font-semibold text-gray-900">
                    {requirementsData.projectType}
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">
                    예상 사용자
                  </h3>
                  <div className="text-lg font-semibold text-gray-900">
                    {requirementsData.estimatedUsers}
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">
                    프로젝트 기간
                  </h3>
                  <div className="text-lg font-semibold text-gray-900">
                    {requirementsData.duration}
                  </div>
                </div>
              </div>
            </div>

            {/* Requirements Details */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                요구사항 상세 내역
              </h2>
              <div className="space-y-4">
                {requirementsDetails.map((category, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg"
                  >
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-gray-500 mr-2">
                            {category.expanded ? "▲" : "▼"}
                          </span>
                          <span className="font-medium text-gray-900">
                            {category.category}
                          </span>
                          <span className="ml-2 bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                            {category.count}
                          </span>
                        </div>
                      </div>
                    </div>
                    {category.expanded && (
                      <div className="p-4">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  ID
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  요구사항
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  공수(M/D)
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  견적 금액
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {category.items.map((item, itemIndex) => (
                                <tr key={itemIndex}>
                                  <td className="px-3 py-3 text-sm font-medium text-gray-900">
                                    {item.id}
                                  </td>
                                  <td className="px-3 py-3 text-sm text-gray-900">
                                    <div>
                                      <div className="font-medium">
                                        {item.title}
                                      </div>
                                      <div className="text-gray-500 text-xs mt-1">
                                        {item.description}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-3 py-3 text-sm text-gray-900">
                                    {item.effort}
                                  </td>
                                  <td className="px-3 py-3 text-sm font-medium text-gray-900">
                                    {formatCurrency(item.cost)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6">
            {/* Estimate Summary */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-purple-900 mb-4">
                    견적 요약
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-purple-700">기본 견적</span>
                      <span className="font-semibold text-purple-900">
                        {formatCurrency(estimateData.baseEstimate)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-700">할인</span>
                      <span className="font-semibold text-purple-900">
                        - {formatCurrency(estimateData.discount)}
                      </span>
                    </div>
                    <div className="border-t border-purple-200 pt-2 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold text-purple-900">
                          최종 견적
                        </span>
                        <span className="text-xl font-bold text-purple-900">
                          = {formatCurrency(estimateData.finalEstimate)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  견적서 다운로드
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Stages and Payments */}
              <div className="lg:col-span-2 space-y-6">
                {/* Stages */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    단계별 상세 내역
                  </h3>
                  <div className="space-y-3">
                    {estimateData.stages.map((stage, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="text-gray-500 mr-3">{">"}</span>
                            <div>
                              <div className="font-medium text-gray-900">
                                {stage.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {stage.duration}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">
                              {stage.percentage}%
                            </div>
                            <div className="font-semibold text-gray-900">
                              {formatCurrency(stage.cost)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Conditions */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    지불 조건
                  </h3>
                  <div className="space-y-3">
                    {estimateData.payments.map((payment, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 border-b border-gray-100"
                      >
                        <span className="text-gray-700">{payment.stage}</span>
                        <div className="text-right">
                          <span className="text-sm text-gray-500">
                            {payment.percentage}%
                          </span>
                          <span className="ml-2 font-medium text-gray-900">
                            {formatCurrency(payment.amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Project Overview */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  프로젝트 개요
                </h3>

                {/* Development Period */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <svg
                      className="w-5 h-5 text-gray-500 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="font-medium text-gray-900">개발 기간</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {estimateData.projectOverview.duration}
                  </div>
                  <div className="text-sm text-gray-500">
                    {estimateData.projectOverview.period}
                  </div>
                </div>

                {/* Personnel */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <svg
                      className="w-5 h-5 text-gray-500 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <span className="font-medium text-gray-900">투입 인력</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {estimateData.projectOverview.personnel}명
                  </div>
                  <div className="text-sm text-gray-500">
                    {estimateData.projectOverview.breakdown}
                  </div>
                </div>

                {/* Quality Assurance */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <svg
                      className="w-5 h-5 text-gray-500 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    <span className="font-medium text-gray-900">품질 보증</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {estimateData.projectOverview.warranty}
                  </div>
                  <div className="text-sm text-gray-500">
                    {estimateData.projectOverview.warrantyDetail}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
        <div className="flex justify-between">
          <button
            onClick={onPrevStep}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            이전 단계
          </button>
          <button
            onClick={onNextStep}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            최종 승인 및 계약
          </button>
        </div>
      </div>
    </div>
  );
}
