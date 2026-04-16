import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { ClaudeApiService } from '../common/services/claude-api.service';
import { JsonParserService } from '../common/services/json-parser.service';
import { CLAUDE_MAX_TOKENS_WIREFRAME_EDIT } from '../common/constants';
import {
  SYSTEM_PROMPT_WIREFRAME_GENERATE,
  SYSTEM_PROMPT_WIREFRAME_EDIT,
  buildWireframeUserPrompt,
} from './prompts';

@Injectable()
export class WireframesService {
  private readonly logger = new Logger(WireframesService.name);
  private supabase;

  constructor(
    private configService: ConfigService,
    private claudeApi: ClaudeApiService,
    private jsonParser: JsonParserService,
  ) {
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL') || '',
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || '',
    );
  }

  async generateWireframe(projectId: string) {
    this.logger.log('Wireframe generation started – project: %s', projectId);

    try {
      // 1. 프로젝트 요구사항 로드
      const { data: project, error: projectError } = await this.supabase
        .from('projects')
        .select('*, requirements, project_overview')
        .eq('id', projectId)
        .single();

      if (projectError) throw new Error(`프로젝트 로드 실패: ${projectError.message}`);
      if (!project) throw new Error('프로젝트를 찾을 수 없습니다');

      // 2. 요구사항 요약 → LLM 호출
      const summary = this.createRequirementsSummary(project);
      const spec = await this.generateSpecFromLLM(summary);

      // 3. 기존 와이어프레임 삭제 후 저장
      await this.supabase.from('wireframes').delete().eq('project_id', projectId);

      const { data: saved, error: saveError } = await this.supabase
        .from('wireframes')
        .insert({ project_id: projectId, version: 1, spec })
        .select()
        .single();

      if (saveError) throw new Error(`와이어프레임 저장 실패: ${saveError.message}`);

      this.logger.log('Wireframe generation completed – project: %s', projectId);
      return { ok: true, spec: saved.spec, wireframe: saved };
    } catch (error) {
      this.logger.error('Wireframe generation failed: %s', (error as Error).message);
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

    if (error) throw new Error(`와이어프레임 조회 실패: ${error.message}`);
    return data;
  }

  async applyAIEdit(projectId: string, prompt: string) {
    this.logger.log('AI edit started – project: %s, prompt: %s', projectId, prompt);

    try {
      const wireframe = await this.getLatestWireframe(projectId);
      if (!wireframe) throw new Error('와이어프레임이 존재하지 않습니다');

      const updatedSpec = await this.modifyWithAI(wireframe.spec, prompt);

      await this.supabase.from('wireframes').delete().eq('project_id', projectId);

      const { data: saved, error: saveError } = await this.supabase
        .from('wireframes')
        .insert({
          project_id: projectId,
          version: wireframe.version + 1,
          spec: updatedSpec,
        })
        .select()
        .single();

      if (saveError) throw new Error(`저장 실패: ${saveError.message}`);

      this.logger.log('AI edit completed – project: %s', projectId);
      return { ok: true, spec: saved.spec };
    } catch (error) {
      this.logger.error('AI edit failed: %s', (error as Error).message);
      throw error;
    }
  }

  // ── Private ───────────────────────────────────────────────────

  private createRequirementsSummary(project: any): string {
    const requirements = project.requirements || {};
    const overview = project.project_overview || {};

    let summary = '프로젝트 요약:\n';
    summary += `- 제목: ${project.title || '제목 없음'}\n`;
    summary += `- 설명: ${project.description || '설명 없음'}\n\n`;

    if (overview.serviceCoreElements?.title) {
      summary += `서비스 유형: ${overview.serviceCoreElements.title}\n\n`;
    }

    if (overview.serviceCoreElements?.keyFeatures?.length > 0) {
      summary += '핵심 기능:\n';
      overview.serviceCoreElements.keyFeatures.forEach((feature: string, idx: number) => {
        summary += `${idx + 1}. ${feature}\n`;
      });
      summary += '\n';
    }

    if (requirements.categories?.length > 0) {
      summary += '주요 요구사항:\n';
      let count = 1;
      for (const cat of requirements.categories) {
        for (const sub of cat.subCategories || []) {
          for (const req of (sub.requirements || []).slice(0, 3)) {
            summary += `${count}. ${req.title}: ${req.description}\n`;
            count++;
          }
        }
      }
    }

    return summary;
  }

  private async generateSpecFromLLM(summary: string): Promise<any> {
    try {
      const data = (await this.claudeApi.callAndParseJson({
        systemPrompt: SYSTEM_PROMPT_WIREFRAME_GENERATE,
        messages: [{ role: 'user', content: buildWireframeUserPrompt(summary) }],
      })) as any;

      const content = this.jsonParser.extractText(data);
      let spec = this.jsonParser.parse<any>(content);

      if (!spec) {
        this.logger.warn('JSON parse failed for wireframe, using fallback');
        return this.getFallbackWireframe();
      }

      // 스키마 검증
      if (!spec.viewport || !spec.screens || !Array.isArray(spec.screens) || spec.screens.length === 0) {
        this.logger.warn('Invalid wireframe schema, using fallback');
        return this.getFallbackWireframe();
      }

      if (!spec.viewport && spec.screens?.length > 0) {
        spec.viewport = spec.screens[0].viewport ?? { width: 390, height: 844, device: 'mobile' };
      }

      return spec;
    } catch (error) {
      this.logger.error('LLM wireframe generation failed: %s', (error as Error).message);
      return this.getFallbackWireframe();
    }
  }

  private async modifyWithAI(currentSpec: any, prompt: string): Promise<any> {
    const userPrompt = `현재 와이어프레임:\n${JSON.stringify(currentSpec, null, 2)}\n\n사용자 수정 요청: ${prompt}\n\n위 요청에 따라 수정된 전체 JSON을 출력하세요.`;

    try {
      const data = (await this.claudeApi.callAndParseJson({
        systemPrompt: SYSTEM_PROMPT_WIREFRAME_EDIT,
        messages: [{ role: 'user', content: userPrompt }],
        maxTokens: CLAUDE_MAX_TOKENS_WIREFRAME_EDIT,
      })) as any;

      const jsonText = this.jsonParser.extractText(data);
      const updatedSpec = this.jsonParser.parse<any>(jsonText);

      if (!updatedSpec) {
        this.logger.warn('JSON parse failed for AI edit, returning current spec');
        return currentSpec;
      }

      if (!updatedSpec.viewport && updatedSpec.screens?.length > 0) {
        updatedSpec.viewport = updatedSpec.screens[0].viewport ?? { width: 390, height: 844, device: 'mobile' };
      }

      return updatedSpec;
    } catch (error) {
      this.logger.error('AI edit error: %s', (error as Error).message);
      return currentSpec;
    }
  }

  private getFallbackWireframe(): any {
    return {
      viewport: { width: 390, height: 844, device: 'mobile' },
      screens: [
        {
          id: 'home_mobile',
          name: '모바일 홈 화면',
          viewport: { width: 390, height: 844, device: 'mobile' },
          layout: { type: 'free' },
          elements: [
            { id: 'e1', type: 'navbar', label: '상단 네비게이션', x: 0, y: 0, w: 390, h: 56 },
            { id: 'e2', type: 'input', label: '검색', x: 16, y: 72, w: 270, h: 44 },
            { id: 'e3', type: 'button', label: '필터', x: 300, y: 72, w: 74, h: 44 },
            { id: 'e4', type: 'list', label: '목록', x: 16, y: 132, w: 358, h: 652, props: { count: 6 } },
            { id: 'e5', type: 'navbar', label: '하단 탭', x: 0, y: 784, w: 390, h: 60 },
          ],
        },
        {
          id: 'dashboard_desktop',
          name: '데스크톱 대시보드',
          viewport: { width: 1440, height: 900, device: 'desktop' },
          layout: { type: 'free' },
          elements: [
            { id: 'd1', type: 'navbar', label: '상단바', x: 0, y: 0, w: 1440, h: 72 },
            { id: 'd2', type: 'card', label: '요약 카드', x: 24, y: 96, w: 1392, h: 160 },
            { id: 'd3', type: 'table', label: '프로젝트 리스트', x: 24, y: 280, w: 1392, h: 480 },
            { id: 'd4', type: 'button', label: '신규 프로젝트', x: 1224, y: 40, w: 192, h: 48 },
          ],
        },
      ],
    };
  }
}
