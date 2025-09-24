import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  @Get('api')
  getApiInfo() {
    return {
      name: 'Flowgence API',
      version: '1.0.0',
      description: 'AI Agent 기반 SI 전과정 자동화 서비스 API',
      endpoints: {
        health: '/api/health',
        projects: '/api/projects',
        chat: '/api/chat',
        requirements: '/api/requirements',
        estimations: '/api/estimations',
      },
    };
  }
}
