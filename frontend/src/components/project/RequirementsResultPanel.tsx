"use client";

import { useState } from "react";

interface RequirementsResultPanelProps {
  projectData: {
    description: string;
    serviceType: string;
    uploadedFiles: File[];
    chatMessages: any[];
  };
}

export function RequirementsResultPanel({
  projectData,
}: RequirementsResultPanelProps) {
  const [activeSection, setActiveSection] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");

  // 샘플 데이터
  const requirementsData = {
    projectName: "E-커머스 플랫폼",
    overview: {
      goal: "반려동물 보호자가 사료를 쉽고 안전하게 탐색·비교·구매할 수 있는 웹/모바일 이커머스 서비스 구축",
      valueProposition:
        "성분/알러지 정보 기반 탐색, 맞춤 추천, 정기배송, 간편결제·빠른 배송 연동을 통한 최소 클릭 반복 구매 경험 제공",
    },
    scope: {
      included: [
        "회원가입/로그인 (이메일·소셜) 및 프로필/반려동물 정보 관리",
        "상품(사료) 등록, 성분·원료·영양표시 정보 관리, 재고/가격 관리",
        "카테고리 필터·검색 (성분/알러지/연령/체중/브랜드/가격)",
        "장바구니, 주문서 생성, 쿠폰·포인트, 간편결제 (국내 PG/페이)",
        "배송 옵션 (일반/빠른/예약), 정기배송 (구독), 배송 추적",
        "주문/배송 현황 조회, 반품/교환, 리뷰·Q&A",
        "관리자 콘솔 (상품/주문/재고/배송/쿠폰/프로모션/로그)",
        "알림 (이메일/푸시/SMS) 및 기본 분석 대시보드",
      ],
      excluded: [
        "오프라인 매장 POS, 복잡한 WMS/OMS 고도화 (기초 재고/출고 연동만)",
        "커뮤니티형 SNS (피드·팔로우 등), 다국가 멀티 통화 완전 대응 (추후 단계)",
        "수의사 상담/처방전 검증 (링크 수준 가이드만 제공)",
      ],
    },
    functionalRequirements: [
      {
        id: "FR-001",
        name: "회원가입/로그인",
        description:
          "이메일·비밀번호, 소셜 로그인(네이버/카카오/애플) 지원, 비밀번호 찾기",
        priority: "필수",
      },
      {
        id: "FR-002",
        name: "반려동물 프로필",
        description:
          "종/품종, 성별, 나이, 체중, 알러지/금기 성분 저장(여러 마리 지원)",
        priority: "필수",
      },
      {
        id: "FR-003",
        name: "상품 등록/수정",
        description:
          "기본 정보(브랜드, 규격, 가격), 이미지 업로드·썸네일, 판매상태(판매/품절/숨김)",
        priority: "필수",
      },
      {
        id: "FR-004",
        name: "맞춤 추천",
        description:
          "반려동물 프로필 기반 품질 중심/가격 중심 추천 알고리즘 토글",
        priority: "권장",
      },
      {
        id: "FR-005",
        name: "통계 대시보드",
        description:
          "매출/구독 유지율/재구매율/장바구니 이탈율, 상위 성분 태그",
        priority: "선택",
      },
    ],
    nonFunctionalRequirements: [
      {
        category: "성능",
        description: "모든 페이지는 3초 이내에 로드되어야 한다.",
      },
      {
        category: "보안",
        description: "사용자 비밀번호는 암호화하여 저장해야 한다.",
      },
      {
        category: "사용성",
        description:
          "직관적인 UI/UX를 제공하여 사용자가 쉽게 사용할 수 있어야 한다.",
      },
      {
        category: "호환성",
        description:
          "최신 버전의 Chrome, Firefox, Safari 브라우저와 호환되어야 한다.",
      },
    ],
    screenList: [
      "메인 페이지",
      "로그인 / 회원가입 페이지",
      "상품 상세 페이지",
      "장바구니 페이지",
      "주문/결제 페이지",
      "마이페이지 (프로필·반려동물·주소록)",
    ],
  };

  const sections = [
    { id: "overview", label: "개요" },
    { id: "scope", label: "범위" },
    { id: "functional", label: "기능 요구사항" },
    { id: "non-functional", label: "비기능 요구사항" },
    { id: "screens", label: "화면 목록" },
    { id: "data-model", label: "데이터 모델" },
  ];

  const handleExportPDF = () => {
    // PDF 내보내기 기능 (구현 예정)
    console.log("PDF 내보내기");
  };

  const handleShareNotion = () => {
    // Notion 공유 기능 (구현 예정)
    console.log("Notion 공유");
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="h-full bg-white flex">
      {/* Left Sidebar */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
        {/* Project Selection */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">
              {requirementsData.projectName}
            </h2>
            <svg
              className="w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 p-4">
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeSection === section.id
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {section.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                요구사항 결과 페이지
              </h1>
              <p className="text-gray-600 mt-1">
                프로젝트 요구사항 및 견적 결과
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleExportPDF}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
              >
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
                PDF로 내보내기
              </button>
              <button
                onClick={handleShareNotion}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
              >
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
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                  />
                </svg>
                Notion으로 공유
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="mt-4">
            <input
              type="text"
              placeholder="검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Overview Section */}
          <section id="overview" className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">개요</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">목표</h3>
                <p className="text-gray-600">
                  {requirementsData.overview.goal}
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">가치 제안</h3>
                <p className="text-gray-600">
                  {requirementsData.overview.valueProposition}
                </p>
              </div>
            </div>
          </section>

          {/* Scope Section */}
          <section id="scope" className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">범위</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">
                  포함 범위 (Included Scope)
                </h3>
                <ul className="space-y-2">
                  {requirementsData.scope.included.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2 mt-1">•</span>
                      <span className="text-gray-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-3">
                  제외 범위 (Excluded Scope)
                </h3>
                <ul className="space-y-2">
                  {requirementsData.scope.excluded.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-red-500 mr-2 mt-1">•</span>
                      <span className="text-gray-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Functional Requirements Section */}
          <section id="functional" className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              기능 요구사항
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      요구사항명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      설명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      우선순위
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requirementsData.functionalRequirements.map((req) => (
                    <tr key={req.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {req.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {req.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {req.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            req.priority === "필수"
                              ? "bg-red-100 text-red-800"
                              : req.priority === "권장"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {req.priority}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Non-functional Requirements Section */}
          <section id="non-functional" className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              비기능 요구사항
            </h2>
            <div className="space-y-4">
              {requirementsData.nonFunctionalRequirements.map((req, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <h3 className="font-medium text-gray-900 mb-2">
                    {req.category}
                  </h3>
                  <p className="text-gray-600">{req.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Screen List Section */}
          <section id="screens" className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              화면 목록
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {requirementsData.screenList.map((screen, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 text-center"
                >
                  <span className="text-gray-900">{screen}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Data Model Section */}
          <section id="data-model" className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              데이터 모델
            </h2>
            <div className="text-center py-8 text-gray-500">
              <p>데이터 모델 정보가 여기에 표시됩니다.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
