import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { WireframesService } from './wireframes.service';
import { GenerateWireframeDto } from './dto/generate-wireframe.dto';
import { ApplyEditDto } from './dto/apply-edit.dto';

@Controller('wireframes')
export class WireframesController {
  constructor(private readonly wireframesService: WireframesService) {}

  @Post('generate')
  async generate(@Body() dto: GenerateWireframeDto) {
    const result = await this.wireframesService.generateWireframe(dto.projectId);
    return { status: 'success', ...result };
  }

  @Get('latest/:projectId')
  async getLatest(@Param('projectId') projectId: string) {
    const wireframe = await this.wireframesService.getLatestWireframe(projectId);
    return { status: 'success', wireframe };
  }

  @Post('apply-edit')
  async applyEdit(@Body() dto: ApplyEditDto) {
    const result = await this.wireframesService.applyAIEdit(dto.projectId, dto.prompt);
    return { status: 'success', ...result };
  }
}
