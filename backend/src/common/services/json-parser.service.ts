import { Injectable, Logger } from '@nestjs/common';

/**
 * Claude API 응답에서 JSON을 추출하고 파싱하는 유틸리티 서비스.
 * 마크다운 코드블록(```json ... ```) 래핑을 자동으로 처리한다.
 */
@Injectable()
export class JsonParserService {
  private readonly logger = new Logger(JsonParserService.name);

  /**
   * Claude 응답 텍스트에서 JSON을 추출하여 파싱한다.
   * @returns 파싱된 객체, 또는 파싱 실패 시 null
   */
  parse<T = unknown>(text: string): T | null {
    const extracted = this.extractJson(text);
    try {
      return JSON.parse(extracted) as T;
    } catch {
      this.logger.warn('JSON parse failed – input preview: %s', extracted.substring(0, 300));
      return null;
    }
  }

  /**
   * parse()와 동일하나, 실패 시 예외를 던진다.
   */
  parseOrThrow<T = unknown>(text: string, context?: string): T {
    const result = this.parse<T>(text);
    if (result === null) {
      throw new Error(context ? `${context}: JSON 파싱 실패` : 'JSON 파싱 실패');
    }
    return result;
  }

  /**
   * Claude 응답 data 객체에서 텍스트를 꺼낸다.
   * data.content[0].text 형태를 기대한다.
   */
  extractText(data: { content?: Array<{ text?: string }> }): string {
    const text = data?.content?.[0]?.text;
    if (!text) {
      throw new Error('Invalid response format from Claude API');
    }
    return text;
  }

  // ── private ──────────────────────────────────────────────────────

  private extractJson(raw: string): string {
    let text = raw.trim();

    // Pattern 1: starts with ```json
    if (text.startsWith('```json')) {
      text = text.replace(/^```json\s*/i, '').replace(/\s*```\s*$/i, '');
      return text.trim();
    }

    // Pattern 2: starts with ```
    if (text.startsWith('```')) {
      text = text.replace(/^```\s*/i, '').replace(/\s*```\s*$/i, '');
      return text.trim();
    }

    // Pattern 3: JSON block somewhere in the text
    const match = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (match) {
      return match[1].trim();
    }

    // Pattern 4: text already looks like JSON
    return text;
  }
}
