import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CLAUDE_API_URL,
  CLAUDE_API_VERSION,
  CLAUDE_MODEL,
  CLAUDE_MAX_TOKENS,
  CLAUDE_RETRY_DELAY_MS,
  ERROR_MESSAGES,
} from '../constants';

export interface ClaudeRequestOptions {
  systemPrompt: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  maxTokens?: number;
  stream?: boolean;
}

export interface ClaudeApiError extends Error {
  status?: number;
  type?: string;
}

@Injectable()
export class ClaudeApiService {
  private readonly logger = new Logger(ClaudeApiService.name);
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ANTHROPIC_API_KEY') || '';
  }

  /**
   * Claude API를 호출한다. 529 에러 시 1회 자동 재시도.
   */
  async call(options: ClaudeRequestOptions): Promise<Response> {
    this.ensureApiKey();

    const body = this.buildRequestBody(options);
    const headers = this.buildHeaders();

    const response = await fetch(CLAUDE_API_URL, { method: 'POST', headers, body });

    if (response.ok) return response;

    // 529 (Overloaded) → 1회 재시도
    if (response.status === 529) {
      this.logger.warn('Claude API 529 (Overloaded) – retrying in %dms', CLAUDE_RETRY_DELAY_MS);
      await this.delay(CLAUDE_RETRY_DELAY_MS);

      const retry = await fetch(CLAUDE_API_URL, { method: 'POST', headers, body });
      if (retry.ok) return retry;

      if (retry.status === 529) {
        throw this.createOverloadedError();
      }
      await this.throwApiError(retry);
    }

    // 500 에러 → 1회 재시도 (짧은 딜레이)
    if (response.status === 500) {
      this.logger.warn('Claude API 500 – retrying in 1s');
      await this.delay(1_000);

      const retry = await fetch(CLAUDE_API_URL, { method: 'POST', headers, body });
      if (retry.ok) return retry;
      await this.throwApiError(retry);
    }

    await this.throwApiError(response);
    // unreachable, but satisfies TS
    throw new Error('Unexpected');
  }

  /**
   * call() 결과를 JSON으로 파싱하여 반환한다.
   */
  async callAndParseJson(options: ClaudeRequestOptions): Promise<unknown> {
    const response = await this.call(options);
    return response.json();
  }

  /**
   * 스트리밍 응답용. call()의 Response를 그대로 반환한다.
   * stream: true를 자동으로 설정한다.
   */
  async callStream(options: Omit<ClaudeRequestOptions, 'stream'>): Promise<Response> {
    return this.call({ ...options, stream: true });
  }

  // ── helpers ────────────────────────────────────────────────────

  private ensureApiKey(): void {
    if (!this.apiKey) {
      throw new Error(ERROR_MESSAGES.API_KEY_MISSING);
    }
  }

  private buildHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      'anthropic-version': CLAUDE_API_VERSION,
    };
  }

  private buildRequestBody(options: ClaudeRequestOptions): string {
    return JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: options.maxTokens ?? CLAUDE_MAX_TOKENS,
      system: options.systemPrompt,
      messages: options.messages,
      ...(options.stream && { stream: true }),
    });
  }

  createOverloadedError(): ClaudeApiError {
    const err = new Error(ERROR_MESSAGES.OVERLOADED_EN) as ClaudeApiError;
    err.status = 529;
    err.type = 'overloaded_error';
    return err;
  }

  isOverloadedError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    const e = error as ClaudeApiError;
    return (
      e.status === 529 ||
      e.type === 'overloaded_error' ||
      e.message.includes('529') ||
      e.message.includes('overloaded')
    );
  }

  private async throwApiError(response: Response): Promise<never> {
    const text = await response.text();
    this.logger.error('Claude API error: %d – %s', response.status, text.substring(0, 300));
    throw new Error(`Claude API error: ${response.status} - ${text}`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
