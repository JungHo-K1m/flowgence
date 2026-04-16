import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const { requirements, projectId } = await request.json();

    // 백엔드로 요청 프록시
    const response = await fetch(`${API_BASE_URL}/chat/requirements/verify`, {
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
      throw new Error(errorData.message || `Backend API error: ${response.status}`);
    }

    const verificationResult = await response.json();

    return NextResponse.json({
      status: "success",
      ...verificationResult,
    });
  } catch (error) {
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

