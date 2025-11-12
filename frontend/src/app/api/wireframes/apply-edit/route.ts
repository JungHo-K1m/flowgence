import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { projectId, prompt } = await request.json();

    if (!projectId || !prompt) {
      return NextResponse.json(
        { status: 'error', message: 'projectId와 prompt는 필수입니다' },
        { status: 400 }
      );
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/wireframes/apply-edit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ projectId, prompt }),
    });

    const data = await response.json();

    if (data.status === 'error') {
      return NextResponse.json(
        { status: 'error', message: data.message },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('AI 편집 API 오류:', error);
    return NextResponse.json(
      { status: 'error', message: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

