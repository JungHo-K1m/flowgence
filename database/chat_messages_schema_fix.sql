-- Chat Messages 테이블 스키마 수정 SQL
-- 실행일: 2025-09-29
-- 목적: chat_messages 테이블의 projectId, createdAt 컬럼 추가 및 제약조건 수정

-- 1. projectId 컬럼 추가 (VARCHAR 타입)
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS "projectId" VARCHAR NOT NULL DEFAULT 'temp-project-overview';

-- 2. createdAt 컬럼 추가 (TIMESTAMP 타입)
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. project_id 컬럼의 NOT NULL 제약조건 제거 (UUID 타입이므로)
ALTER TABLE chat_messages 
ALTER COLUMN project_id DROP NOT NULL;

-- 4. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_chat_messages_project_id ON chat_messages("projectId");
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages("createdAt");

-- 5. 기존 NULL 값 업데이트 (projectId 컬럼만)
UPDATE chat_messages 
SET "projectId" = 'temp-project-overview' 
WHERE "projectId" IS NULL OR "projectId" = '';

-- 6. RLS (Row Level Security) 설정
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 7. RLS 정책 생성 (기존 정책이 없다면)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'chat_messages' 
        AND policyname = 'Allow all operations for authenticated users'
    ) THEN
        CREATE POLICY "Allow all operations for authenticated users" ON chat_messages
            FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 8. 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'chat_messages' 
ORDER BY ordinal_position;
