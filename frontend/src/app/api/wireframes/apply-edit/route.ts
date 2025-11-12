import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== Frontend API: AI 편집 요청 시작 ===');
    
    const { projectId, prompt } = await request.json();
    console.log('Request body:', { projectId, prompt });

    if (!projectId || !prompt) {
      console.error('Validation failed: missing projectId or prompt');
      return NextResponse.json(
        { status: 'error', message: 'projectId와 prompt는 필수입니다' },
        { status: 400 }
      );
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    console.log('Backend URL:', backendUrl);
    console.log('Full URL:', `${backendUrl}/wireframes/apply-edit`);

    const response = await fetch(`${backendUrl}/wireframes/apply-edit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ projectId, prompt }),
    });

    console.log('Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error response:', errorText);
      return NextResponse.json(
        { status: 'error', message: `백엔드 오류 (${response.status}): ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Backend response data:', data);

    if (data.status === 'error') {
      return NextResponse.json(
        { status: 'error', message: data.message },
        { status: 400 }
      );
    }

    console.log('=== Frontend API: AI 편집 성공 ===');
    return NextResponse.json(data);
  } catch (error) {
    console.error('=== Frontend API: AI 편집 오류 ===');
    console.error('Error details:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
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

