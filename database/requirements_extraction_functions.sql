-- ===========================================
-- Flowgence Requirements Extraction Functions
-- ===========================================
-- 이 파일은 요구사항 추출 기능에 필요한 추가 SQL문들을 포함합니다.
-- 기존 schema.sql이 실행된 후 이 파일을 실행하세요.

-- ===========================================
-- JSONB 인덱스 추가 (성능 최적화)
-- ===========================================

-- projects 테이블의 JSONB 필드들에 GIN 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_projects_requirements_gin ON projects USING GIN (requirements);
CREATE INDEX IF NOT EXISTS idx_projects_overview_gin ON projects USING GIN (project_overview);
CREATE INDEX IF NOT EXISTS idx_projects_estimation_gin ON projects USING GIN (estimation);

-- chat_messages의 metadata JSONB 필드 인덱스
CREATE INDEX IF NOT EXISTS idx_chat_messages_metadata_gin ON chat_messages USING GIN (metadata);

-- ===========================================
-- 요구사항 추출 및 저장용 함수들
-- ===========================================

-- 1. 프로젝트와 채팅 메시지를 함께 저장하는 함수
CREATE OR REPLACE FUNCTION save_project_with_messages(
  project_data JSONB,
  messages_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_project_id UUID;
  result JSONB;
BEGIN
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
    project_data->'project_overview'
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
$$;

-- 2. 요구사항을 JSONB와 정규화 테이블에 동시 저장하는 함수
CREATE OR REPLACE FUNCTION save_requirements_dual(
  project_id_param UUID,
  requirements_json JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  -- 1. projects.requirements JSONB 필드 업데이트
  UPDATE projects 
  SET requirements = requirements_json,
      updated_at = NOW()
  WHERE id = project_id_param AND user_id = auth.uid();

  -- 2. requirements 테이블에 개별 요구사항 저장
  INSERT INTO requirements (project_id, title, description, category, priority, status)
  SELECT 
    project_id_param,
    req->>'title',
    req->>'description',
    CASE 
      WHEN category->>'category' ILIKE '%인증%' OR category->>'category' ILIKE '%로그인%' THEN 'functional'
      WHEN category->>'category' ILIKE '%결제%' OR category->>'category' ILIKE '%주문%' THEN 'functional'
      WHEN category->>'category' ILIKE '%관리%' OR category->>'category' ILIKE '%관리자%' THEN 'business'
      WHEN category->>'category' ILIKE '%UI%' OR category->>'category' ILIKE '%UX%' THEN 'ui_ux'
      WHEN category->>'category' ILIKE '%보안%' OR category->>'category' ILIKE '%보안%' THEN 'security'
      WHEN category->>'category' ILIKE '%성능%' OR category->>'category' ILIKE '%속도%' THEN 'performance'
      ELSE 'functional'
    END,
    CASE 
      WHEN req->>'priority' = 'high' THEN 'high'
      WHEN req->>'priority' = 'medium' THEN 'medium'
      WHEN req->>'priority' = 'low' THEN 'low'
      ELSE 'medium'
    END,
    'draft'
  FROM jsonb_array_elements(requirements_json->'categories') AS category,
       jsonb_array_elements(category->'requirements') AS req;

  result := jsonb_build_object(
    'status', 'success',
    'message', 'Requirements saved to both JSONB and normalized table'
  );

  RETURN result;
END;
$$;

-- 3. 프로젝트 상태 업데이트 함수
CREATE OR REPLACE FUNCTION update_project_status(
  project_id_param UUID,
  new_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  UPDATE projects 
  SET status = new_status,
      updated_at = NOW()
  WHERE id = project_id_param AND user_id = auth.uid();

  IF FOUND THEN
    result := jsonb_build_object(
      'status', 'success',
      'message', 'Project status updated successfully'
    );
  ELSE
    result := jsonb_build_object(
      'status', 'error',
      'message', 'Project not found or access denied'
    );
  END IF;

  RETURN result;
END;
$$;

-- ===========================================
-- 추가 RLS 정책 (필요한 경우)
-- ===========================================

-- chat_messages 업데이트 정책 추가
CREATE POLICY "Users can update project messages" ON chat_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = chat_messages.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- files 업데이트/삭제 정책 추가
CREATE POLICY "Users can update project files" ON files
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = files.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete project files" ON files
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = files.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- ===========================================
-- 확인 쿼리들
-- ===========================================

-- 생성된 함수들 확인
-- SELECT routine_name FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
-- AND routine_name IN ('save_project_with_messages', 'save_requirements_dual', 'update_project_status');

-- 새로 추가된 인덱스 확인
-- SELECT indexname FROM pg_indexes 
-- WHERE tablename = 'projects' 
-- AND indexname LIKE '%gin%';

-- RLS 정책 확인
-- SELECT policyname FROM pg_policies 
-- WHERE tablename = 'chat_messages' 
-- AND policyname LIKE '%update%';

-- ===========================================
-- 사용 예시
-- ===========================================

-- 프로젝트와 메시지 저장 예시
-- SELECT save_project_with_messages(
--   '{"title": "테스트 프로젝트", "description": "테스트 설명", "project_overview": {"serviceCoreElements": {"title": "테스트"}}}'::jsonb,
--   '[{"role": "user", "content": "안녕하세요", "metadata": {"timestamp": "2025-01-22T10:00:00Z"}}]'::jsonb
-- );

-- 요구사항 저장 예시
-- SELECT save_requirements_dual(
--   'project-uuid-here'::uuid,
--   '{"categories": [{"category": "인증", "requirements": [{"title": "로그인", "description": "사용자 로그인", "priority": "high"}]}]}'::jsonb
-- );

-- 프로젝트 상태 업데이트 예시
-- SELECT update_project_status(
--   'project-uuid-here'::uuid,
--   'estimation_review'
-- );
