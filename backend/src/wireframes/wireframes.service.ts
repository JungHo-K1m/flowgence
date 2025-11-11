import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class WireframesService {
  private supabase;

  constructor(private configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL') || '',
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || '',
    );
  }

  async generateWireframe(projectId: string) {
    console.log('=== 와이어프레임 생성 시작 ===');
    console.log('프로젝트 ID:', projectId);

    try {
      // 1. 프로젝트 요구사항 로드
      const { data: project, error: projectError } = await this.supabase
        .from('projects')
        .select('*, requirements, project_overview')
        .eq('id', projectId)
        .single();

      if (projectError) {
        throw new Error(`프로젝트 로드 실패: ${projectError.message}`);
      }

      if (!project) {
        throw new Error('프로젝트를 찾을 수 없습니다');
      }

      // 2. 요구사항 요약 생성
      const summary = this.createRequirementsSummary(project);

      // 3. LLM으로 와이어프레임 JSON 생성
      const spec = await this.generateSpecFromLLM(summary);

      // 4. 기존 와이어프레임 삭제 (재생성 시)
      const { error: deleteError } = await this.supabase
        .from('wireframes')
        .delete()
        .eq('project_id', projectId);

      if (deleteError) {
        console.warn('기존 와이어프레임 삭제 실패:', deleteError.message);
        // 삭제 실패는 무시 (처음 생성 시 데이터가 없을 수 있음)
      }

      // 5. 새 와이어프레임 저장
      const { data: saved, error: saveError } = await this.supabase
        .from('wireframes')
        .insert({
          project_id: projectId,
          version: 1,
          spec: spec,
        })
        .select()
        .single();

      if (saveError) {
        throw new Error(`와이어프레임 저장 실패: ${saveError.message}`);
      }

      console.log('=== 와이어프레임 생성 완료 ===');
      return { ok: true, spec: saved.spec, wireframe: saved };
    } catch (error) {
      console.error('와이어프레임 생성 실패:', error);
      throw error;
    }
  }

  async getLatestWireframe(projectId: string) {
    const { data, error } = await this.supabase
      .from('wireframes')
      .select('*')
      .eq('project_id', projectId)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      throw new Error(`와이어프레임 조회 실패: ${error.message}`);
    }

    return data;
  }

  private createRequirementsSummary(project: any): string {
    // 요구사항을 LLM이 이해하기 쉬운 형태로 요약
    const requirements = project.requirements || {};
    const overview = project.project_overview || {};

    let summary = '프로젝트 요약:\n';
    summary += `- 제목: ${project.title || '제목 없음'}\n`;
    summary += `- 설명: ${project.description || '설명 없음'}\n\n`;

    // 서비스 유형
    if (overview.serviceCoreElements?.title) {
      summary += `서비스 유형: ${overview.serviceCoreElements.title}\n\n`;
    }

    // 핵심 기능
    if (
      overview.serviceCoreElements?.keyFeatures &&
      overview.serviceCoreElements.keyFeatures.length > 0
    ) {
      summary += '핵심 기능:\n';
      overview.serviceCoreElements.keyFeatures.forEach(
        (feature: string, idx: number) => {
          summary += `${idx + 1}. ${feature}\n`;
        },
      );
      summary += '\n';
    }

    // 기능 요구사항
    if (requirements.categories && requirements.categories.length > 0) {
      summary += '주요 요구사항:\n';
      let count = 1;
      requirements.categories.forEach((cat: any) => {
        if (cat.subCategories) {
          cat.subCategories.forEach((sub: any) => {
            if (sub.requirements && sub.requirements.length > 0) {
              sub.requirements.slice(0, 3).forEach((req: any) => {
                // 상위 3개만
                summary += `${count}. ${req.title}: ${req.description}\n`;
                count++;
              });
            }
          });
        }
      });
    }

    return summary;
  }

  private async generateSpecFromLLM(summary: string): Promise<any> {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    const systemPrompt = `당신은 제품 디자이너 보조 에이전트입니다. 모바일 기준 저해상도 와이어프레임을 JSON 형태로 출력합니다.

규칙:
- 반드시 유효한 JSON만 출력합니다. 마크다운 코드블록이나 추가 텍스트 금지.
- 스키마: { viewport: { width, height, device }, screen: { id, name, layout, elements[] } }
- elements[].type은 다음 중 하나만: text, button, input, image, card, list, navbar, footer, chip, checkbox, radio, select, table, divider, icon
- 좌표(x,y), 크기(w,h)는 px 단위 정수. (0,0)은 좌측 상단.
- 모바일 기본 크기: 390x844 (iPhone 14 기준)
- 필수 요소: 상단 네비게이션, 핵심 액션(버튼), 입력 필드, 리스트/카드
- 로파이 디자인: 단순한 박스와 레이블만. 색상/스타일/아이콘 디테일 최소화.

레이아웃 가이드:
- navbar 높이: 56px
- 버튼 높이: 44-48px
- 입력 필드 높이: 44px
- 카드 간격: 16px
- 좌우 패딩: 16px
- 하단 탭바 높이: 60px

예시 JSON:
{
  "viewport": { "width": 390, "height": 844, "device": "mobile" },
  "screen": {
    "id": "home",
    "name": "홈 화면",
    "layout": { "type": "free" },
    "elements": [
      { "id": "e1", "type": "navbar", "label": "상단바", "x": 0, "y": 0, "w": 390, "h": 56 },
      { "id": "e2", "type": "input", "label": "검색", "x": 16, "y": 72, "w": 358, "h": 44 },
      { "id": "e3", "type": "list", "label": "목록", "x": 16, "y": 132, "w": 358, "h": 652 }
    ]
  }
}`;

    const userPrompt = `다음 프로젝트의 홈/메인 화면 와이어프레임을 생성해주세요:

${summary}

위 요구사항을 반영하여, 사용자가 가장 먼저 보게 될 메인 화면의 와이어프레임 JSON을 생성해주세요.`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: userPrompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Claude API 오류:', errorText);
        throw new Error(`Claude API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.content[0].text;

      // JSON 파싱
      let spec;
      try {
        // 코드블록 제거 시도
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          spec = JSON.parse(jsonMatch[0]);
        } else {
          spec = JSON.parse(content);
        }
      } catch (parseError) {
        console.error('JSON 파싱 실패, 폴백 사용');
        spec = this.getFallbackWireframe();
      }

      // 기본 검증
      if (!spec.viewport || !spec.screen || !spec.screen.elements) {
        console.warn('잘못된 스키마, 폴백 사용');
        spec = this.getFallbackWireframe();
      }

      return spec;
    } catch (error) {
      console.error('LLM 호출 실패:', error);
      // 폴백: 기본 와이어프레임 반환
      return this.getFallbackWireframe();
    }
  }

  private getFallbackWireframe(): any {
    // LLM 실패 시 기본 와이어프레임
    return {
      viewport: { width: 390, height: 844, device: 'mobile' },
      screen: {
        id: 'home',
        name: '홈 화면',
        layout: { type: 'free' },
        elements: [
          {
            id: 'e1',
            type: 'navbar',
            label: '상단 네비게이션',
            x: 0,
            y: 0,
            w: 390,
            h: 56,
          },
          {
            id: 'e2',
            type: 'input',
            label: '검색',
            x: 16,
            y: 72,
            w: 270,
            h: 44,
          },
          {
            id: 'e3',
            type: 'button',
            label: '필터',
            x: 300,
            y: 72,
            w: 74,
            h: 44,
          },
          {
            id: 'e4',
            type: 'list',
            label: '목록',
            x: 16,
            y: 132,
            w: 358,
            h: 652,
            props: { count: 6 },
          },
          {
            id: 'e5',
            type: 'navbar',
            label: '하단 탭',
            x: 0,
            y: 784,
            w: 390,
            h: 60,
          },
        ],
      },
    };
  }
}

