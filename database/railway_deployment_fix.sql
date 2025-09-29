-- Railway 배포 환경 안정화 관련 SQL
-- 실행일: 2025-09-29
-- 목적: Railway 배포 시 발생한 데이터베이스 연결 및 스키마 문제 해결

-- 1. 연결 풀 설정 확인
SELECT 
    setting,
    unit,
    short_desc
FROM pg_settings 
WHERE name IN (
    'max_connections',
    'shared_buffers',
    'effective_cache_size',
    'work_mem',
    'maintenance_work_mem'
);

-- 2. 활성 연결 수 확인
SELECT 
    count(*) as active_connections,
    state,
    application_name
FROM pg_stat_activity 
WHERE state IS NOT NULL
GROUP BY state, application_name;

-- 3. 테이블 크기 및 인덱스 사용률 확인
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE tablename = 'chat_messages'
ORDER BY tablename, attname;

-- 4. 인덱스 사용률 확인
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename = 'chat_messages';

-- 5. 테이블 통계 정보 업데이트
ANALYZE chat_messages;

-- 6. 연결 상태 확인
SELECT 
    datname,
    numbackends,
    xact_commit,
    xact_rollback,
    blks_read,
    blks_hit,
    tup_returned,
    tup_fetched,
    tup_inserted,
    tup_updated,
    tup_deleted
FROM pg_stat_database 
WHERE datname = current_database();
