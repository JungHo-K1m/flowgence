-- ===========================================
-- Flowgence Database Schema Verification Queries
-- ===========================================
-- 이 파일은 데이터베이스 스키마가 올바르게 설정되었는지 확인하는 쿼리들을 포함합니다.

-- ===========================================
-- 기본 테이블 존재 확인
-- ===========================================

-- 기존 테이블 확인
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'projects', 'chat_messages', 'files', 'requirements');

-- ===========================================
-- 함수 존재 확인
-- ===========================================

-- 기존 함수 확인
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('save_project_with_messages', 'save_requirements_dual', 'update_project_status');

-- ===========================================
-- 인덱스 확인
-- ===========================================

-- JSONB 인덱스 확인
SELECT indexname FROM pg_indexes 
WHERE tablename = 'projects' 
AND indexname LIKE '%gin%';

-- 모든 인덱스 확인
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('projects', 'chat_messages', 'files', 'requirements')
ORDER BY tablename, indexname;

-- ===========================================
-- RLS 정책 확인
-- ===========================================

-- 모든 RLS 정책 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 특정 테이블의 RLS 정책 확인
SELECT policyname FROM pg_policies 
WHERE tablename = 'chat_messages' 
AND policyname LIKE '%update%';

-- ===========================================
-- 테이블 구조 확인
-- ===========================================

-- projects 테이블 구조 확인
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'projects'
ORDER BY ordinal_position;

-- chat_messages 테이블 구조 확인
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'chat_messages'
ORDER BY ordinal_position;

-- requirements 테이블 구조 확인
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'requirements'
ORDER BY ordinal_position;

-- ===========================================
-- 트리거 확인
-- ===========================================

-- 모든 트리거 확인
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ===========================================
-- 샘플 데이터 확인
-- ===========================================

-- AI 에이전트 샘플 데이터 확인
SELECT name, type, status FROM ai_agents;

-- 워크플로우 샘플 데이터 확인
SELECT name, status FROM workflows;

-- ===========================================
-- 권한 확인
-- ===========================================

-- 현재 사용자 권한 확인
SELECT 
    table_name,
    privilege_type
FROM information_schema.table_privileges 
WHERE grantee = current_user
AND table_schema = 'public'
ORDER BY table_name, privilege_type;

-- ===========================================
-- 성능 확인
-- ===========================================

-- 테이블 크기 확인
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 인덱스 사용률 확인 (PostgreSQL 9.2+)
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_tup_read DESC;
