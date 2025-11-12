import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { WireframesService } from './wireframes.service';
import { GenerateWireframeDto } from './dto/generate-wireframe.dto';
import { ApplyEditDto } from './dto/apply-edit.dto';

@Controller('wireframes')
export class WireframesController {
  constructor(private readonly wireframesService: WireframesService) {}

  @Post('generate')
  async generate(@Body() dto: GenerateWireframeDto) {
    try {
      console.log('=== 와이어프레임 생성 요청 ===');
      console.log('프로젝트 ID:', dto.projectId);

      const result = await this.wireframesService.generateWireframe(
        dto.projectId,
      );

      return {
        status: 'success',
        ...result,
      };
    } catch (error: any) {
      console.error('와이어프레임 생성 오류:', error);
      return {
        status: 'error',
        message: error.message || '와이어프레임 생성 중 오류가 발생했습니다',
      };
    }
  }

  @Get('latest/:projectId')
  async getLatest(@Param('projectId') projectId: string) {
    try {
      const wireframe =
        await this.wireframesService.getLatestWireframe(projectId);
      return {
        status: 'success',
        wireframe,
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: error.message || '와이어프레임 조회 중 오류가 발생했습니다',
      };
    }
  }

  @Post('apply-edit')
  async applyEdit(@Body() dto: ApplyEditDto) {
    try {
      console.log('=== AI 편집 요청 ===');
      console.log('프로젝트 ID:', dto.projectId);
      console.log('프롬프트:', dto.prompt);

      const result = await this.wireframesService.applyAIEdit(
        dto.projectId,
        dto.prompt,
      );

      return {
        status: 'success',
        ...result,
      };
    } catch (error: any) {
      console.error('AI 편집 오류:', error);
      return {
        status: 'error',
        message: error.message || 'AI 편집 중 오류가 발생했습니다',
      };
    }
  }
}

