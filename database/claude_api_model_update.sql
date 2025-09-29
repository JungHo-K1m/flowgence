-- Claude API 모델명 업데이트 관련 SQL
-- 실행일: 2025-09-29
-- 목적: Claude API 모델명 변경에 따른 데이터베이스 메타데이터 업데이트

-- 1. 기존 채팅 메시지의 모델명 업데이트 (필요시)
UPDATE chat_messages 
SET metadata = jsonb_set(
    metadata, 
    '{model}', 
    '"claude-sonnet-4-20250514"'
)
WHERE metadata->>'model' = 'claude-3-5-sonnet-20240620'
   OR metadata->>'model' = 'claude-3-5-sonnet-20241022';

-- 2. 새로운 모델명으로 메타데이터 업데이트
UPDATE chat_messages 
SET metadata = jsonb_set(
    metadata, 
    '{model}', 
    '"claude-sonnet-4-20250514"'
)
WHERE metadata->>'model' IS NULL;

-- 3. 업데이트된 메타데이터 확인
SELECT 
    id,
    role,
    LEFT(content, 50) as content_preview,
    metadata->>'model' as model_name,
    metadata->>'timestamp' as timestamp
FROM chat_messages 
WHERE metadata->>'model' = 'claude-sonnet-4-20250514'
ORDER BY "createdAt" DESC
LIMIT 10;
