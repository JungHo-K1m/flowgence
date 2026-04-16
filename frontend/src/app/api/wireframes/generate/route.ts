import { NextRequest, NextResponse } from "next/server";
import { API_ROOT_URL } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json();

    // 백엔드로 요청 프록시
    const response = await fetch(`${API_ROOT_URL}/wireframes/generate`, {
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
      throw new Error(errorData.message || `Backend API error: ${response.status}`);
    }

    const result = await response.json();

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "와이어프레임 생성 중 오류가 발생했습니다",
      },
      { status: 500 }
    );
  }
}

