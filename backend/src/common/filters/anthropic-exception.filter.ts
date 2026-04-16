import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { ERROR_MESSAGES } from '../constants';
import { ClaudeApiError } from '../services/claude-api.service';

/**
 * Claude API 과부하(529) 에러를 503 응답으로 통합 변환한다.
 * 컨트롤러마다 중복되던 529 에러 핸들링을 한 곳에서 처리한다.
 */
@Catch()
export class AnthropicExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AnthropicExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (this.isOverloadedError(exception)) {
      this.logger.warn('Anthropic overloaded error caught by filter');
      response.status(503).json({
        statusCode: 503,
        message: ERROR_MESSAGES.OVERLOADED,
        error: 'Service Temporarily Unavailable',
        type: 'overloaded_error',
      });
      return;
    }

    // 이 필터가 처리하지 않는 에러는 기본 NestJS 에러 핸들러로 위임
    // HttpException 등은 NestJS 내부에서 알아서 처리하므로 re-throw
    throw exception;
  }

  private isOverloadedError(error: unknown): boolean {
    if (!error) return false;

    // ClaudeApiError 타입
    const e = error as ClaudeApiError;
    if (e.status === 529 || e.type === 'overloaded_error') return true;

    // plain object (컨트롤러에서 throw한 경우)
    const obj = error as Record<string, unknown>;
    if (obj.statusCode === 529 || obj.type === 'overloaded_error') return true;

    // Error 인스턴스 메시지 패턴
    if (error instanceof Error) {
      return error.message.includes('529') || error.message.includes('overloaded');
    }

    return false;
  }
}
