import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json();

    console.log("=== 와이어프레임 생성 요청 (Frontend → Backend) ===");
    console.log("프로젝트 ID:", projectId);

    // 백엔드 API URL
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    // 백엔드로 요청 프록시
    const response = await fetch(`${backendUrl}/wireframes/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("백엔드 와이어프레임 API 오류:", errorData);
      throw new Error(errorData.message || `Backend API error: ${response.status}`);
    }

    const result = await response.json();
    
    console.log("=== 와이어프레임 생성 완료 ===");
    console.log("생성된 화면:", result.spec?.screen?.name);

    return NextResponse.json(result);
  } catch (error) {
    console.error("와이어프레임 생성 오류:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "와이어프레임 생성 중 오류가 발생했습니다",
      },
      { status: 500 }
    );
  }
}

