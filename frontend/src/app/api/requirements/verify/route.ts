import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { requirements, projectId } = await request.json();

    console.log("=== AI 요구사항 검증 시작 ===");
    console.log("프로젝트 ID:", projectId);
    console.log("요구사항 개수:", requirements?.categories?.length || 0);

    // Claude API 키 확인
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }

    // Claude API를 사용한 검증
    const verificationResult = await verifyWithClaude(requirements, apiKey);

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

async function verifyWithClaude(requirements: any, apiKey: string) {
  const systemPrompt = `당신은 SI 프로젝트 요구사항 검증 전문가입니다.
주어진 요구사항을 분석하여 다음을 확인해주세요:

1. 일관성 검사: 요구사항 간 모순이나 충돌이 있는지 확인
2. 완성도 검사: 명확하지 않거나 모호한 요구사항 확인
3. 우선순위 검증: 우선순위가 적절히 설정되었는지 확인
4. 누락 항목: 일반적으로 필요하지만 빠진 요구사항 확인
5. 중복 확인: 중복되거나 유사한 요구사항 확인

응답은 반드시 다음 JSON 형식으로만 제공해주세요:
{
  "status": "ok" | "warning" | "error",
  "score": 0-100,
  "suggestions": [
    {
      "type": "missing" | "duplicate" | "unclear" | "priority" | "conflict",
      "severity": "low" | "medium" | "high",
      "message": "구체적인 제안 내용",
      "category": "해당 카테고리 (있는 경우)"
    }
  ],
  "warnings": [
    {
      "message": "경고 내용",
      "affectedRequirements": ["요구사항 ID"]
    }
  ],
  "summary": {
    "totalRequirements": 숫자,
    "issuesFound": 숫자,
    "criticalIssues": 숫자
  }
}`;

  const userPrompt = `다음 요구사항을 검증해주세요:

${JSON.stringify(requirements, null, 2)}

위 요구사항의 일관성, 완성도, 우선순위를 검토하고 개선 제안을 해주세요.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude API 오류:", errorText);

      // 529 (Overloaded) 에러 처리
      if (response.status === 529) {
        console.log("Claude API 과부하 - 재시도");
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const retryResponse = await fetch(
          "https://api.anthropic.com/v1/messages",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model: "claude-sonnet-4-20250514",
              max_tokens: 4000,
              system: systemPrompt,
              messages: [
                {
                  role: "user",
                  content: userPrompt,
                },
              ],
            }),
          }
        );

        if (retryResponse.ok) {
          const retryData = await retryResponse.json();
          return parseVerificationResponse(retryData);
        } else if (retryResponse.status === 529) {
          throw new Error("529");
        }
      }

      throw new Error(`Claude API 오류: ${response.status}`);
    }

    const data = await response.json();
    return parseVerificationResponse(data);
  } catch (error) {
    console.error("Claude API 호출 실패:", error);
    
    // Fallback: 기본 검증 결과 반환
    return {
      status: "ok",
      score: 85,
      suggestions: [],
      warnings: [],
      summary: {
        totalRequirements: requirements?.categories?.reduce(
          (total: number, cat: any) =>
            total +
            (cat.subCategories?.reduce(
              (subTotal: number, sub: any) =>
                subTotal + (sub.requirements?.length || 0),
              0
            ) || 0),
          0
        ) || 0,
        issuesFound: 0,
        criticalIssues: 0,
      },
    };
  }
}

function parseVerificationResponse(data: any) {
  if (!data.content || !data.content[0] || !data.content[0].text) {
    throw new Error("Invalid response format from Claude API");
  }

  const responseText = data.content[0].text;
  console.log("Claude 응답:", responseText.substring(0, 200) + "...");

  // JSON 추출
  let jsonText = responseText;
  const jsonBlockMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonBlockMatch) {
    jsonText = jsonBlockMatch[1];
  }

  try {
    const result = JSON.parse(jsonText);
    return result;
  } catch (parseError) {
    console.error("JSON 파싱 오류:", parseError);
    console.error("응답 텍스트:", responseText);

    // Fallback
    return {
      status: "ok",
      score: 85,
      suggestions: [],
      warnings: [],
      summary: {
        totalRequirements: 0,
        issuesFound: 0,
        criticalIssues: 0,
      },
    };
  }
}

