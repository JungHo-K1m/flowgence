import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { requirements, projectId } = await request.json();

    console.log("=== AI 요구사항 검증 요청 (Frontend → Backend) ===");
    console.log("프로젝트 ID:", projectId);
    console.log("요구사항 개수:", requirements?.categories?.length || 0);

    // 백엔드 API URL
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    // 백엔드로 요청 프록시
    const response = await fetch(`${backendUrl}/chat/requirements/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requirements,
        projectId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("백엔드 검증 API 오류:", errorData);
      throw new Error(errorData.message || `Backend API error: ${response.status}`);
    }

    const verificationResult = await response.json();
    
    console.log("=== AI 검증 완료 ===");
    console.log("검증 결과:", verificationResult.status);

    return NextResponse.json({
      status: "success",
      ...verificationResult,
    });
  } catch (error) {
    console.error("AI 검증 오류:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "검증 중 오류가 발생했습니다",
        suggestions: [],
        warnings: [],
      },
      { status: 500 }
    );
  }
}

