import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const { projectId, prompt } = await request.json();

    if (!projectId || !prompt) {
      return NextResponse.json(
        { status: 'error', message: 'projectId와 prompt는 필수입니다' },
        { status: 400 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/wireframes/apply-edit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ projectId, prompt }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { status: 'error', message: `백엔드 오류 (${response.status}): ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.status === 'error') {
      return NextResponse.json(
        { status: 'error', message: data.message },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        message: error instanceof Error ? error.message : '서버 오류가 발생했습니다',
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
}

