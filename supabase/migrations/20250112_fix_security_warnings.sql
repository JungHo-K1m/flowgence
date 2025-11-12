-- ============================================================================
-- Security Fix Migration
-- Date: 2025-01-12
-- Purpose: Fix security warnings from Supabase Advisor
-- Issue: Functions missing search_path protection (SQL Injection vulnerability)
-- ============================================================================

-- 1. Fix is_admin function
-- Add SET search_path to prevent SQL injection attacks
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- 🔒 Security fix
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$function$;

-- 2. Fix save_project_with_messages function
-- Add SET search_path to prevent SQL injection attacks
CREATE OR REPLACE FUNCTION public.save_project_with_messages(
  project_data jsonb, 
  messages_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- 🔒 Security fix
AS $function$
DECLARE
  new_project_id UUID;
  result JSONB;
  overview_value JSONB;
BEGIN
  -- project_overview 값 추출 및 null 체크
  -- JSONB에서 'null' 문자열과 실제 null을 구분
  overview_value := project_data->'project_overview';
  
  -- null이거나 'null' 문자열이거나 빈 JSONB 객체인 경우 NULL로 처리
  IF overview_value IS NULL 
     OR overview_value = 'null'::jsonb 
     OR overview_value = '{}'::jsonb 
     OR jsonb_typeof(overview_value) = 'null' THEN
    overview_value := NULL;
  END IF;

  -- 프로젝트 생성
  INSERT INTO projects (
    user_id,
    title,
    description,
    status,
    project_overview
  ) VALUES (
    auth.uid(),
    project_data->>'title',
    project_data->>'description',
    'requirements_review',
    overview_value
  ) RETURNING id INTO new_project_id;

  -- 채팅 메시지 저장
  INSERT INTO chat_messages (project_id, role, content, metadata)
  SELECT 
    new_project_id,
    (value->>'role')::TEXT,
    (value->>'content')::TEXT,
    value->'metadata'
  FROM jsonb_array_elements(messages_data);

  -- 결과 반환
  result := jsonb_build_object(
    'project_id', new_project_id,
    'status', 'success',
    'message', 'Project and messages saved successfully'
  );

  RETURN result;
END;
$function$;

-- ============================================================================
-- Verification Query
-- Run this to confirm the functions now have search_path set
-- ============================================================================
SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  CASE 
    WHEN p.proconfig IS NOT NULL THEN 'search_path is set ✓'
    ELSE 'search_path NOT set ✗'
  END as security_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname IN ('save_project_with_messages', 'is_admin')
ORDER BY p.proname;
