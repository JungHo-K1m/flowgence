// ─── Anthropic Claude API ───────────────────────────────────────────
export const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
export const CLAUDE_API_VERSION = '2023-06-01';
export const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
export const CLAUDE_MAX_TOKENS = 16_000;
export const CLAUDE_MAX_TOKENS_WIREFRAME_EDIT = 4_096;
export const CLAUDE_RETRY_DELAY_MS = 2_000;

// ─── CORS ───────────────────────────────────────────────────────────
export const CORS_TRUSTED_PATTERNS = ['vercel.app', 'flowgence.ai'] as const;
export const CORS_DEFAULT_ORIGIN = 'http://localhost:3000';

// ─── Server ─────────────────────────────────────────────────────────
export const DEFAULT_PORT = 3001;
export const HEALTH_CHECK_DELAY_MS = 5_000;

// ─── Notion ─────────────────────────────────────────────────────────
export const NOTION_API_URL = 'https://api.notion.com/v1';
export const NOTION_API_VERSION = '2022-06-28';
export const NOTION_MAX_BLOCKS_PER_REQUEST = 100;

// ─── Error Messages ─────────────────────────────────────────────────
export const ERROR_MESSAGES = {
  API_KEY_MISSING: 'ANTHROPIC_API_KEY is not configured',
  OVERLOADED: '현재 사용량이 많아 서비스가 일시적으로 지연되고 있습니다. 잠시 후 다시 시도해주세요.',
  OVERLOADED_EN: 'Claude API is currently overloaded. Please try again later.',
  INVALID_RESPONSE: 'Invalid response format from Claude API',
  CHAT_FAILED: 'Failed to process chat message',
  EXTRACTION_FAILED: '요구사항 추출 실패',
  UPDATE_FAILED: '요구사항 업데이트 실패',
  PARSE_FAILED: '응답 파싱 실패',
} as const;
