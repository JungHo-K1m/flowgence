-- 프로젝트 개요 저장 문제 수정
-- save_project_with_messages 함수에서 project_overview가 null이 아닌 경우에만 저장하도록 수정

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
$$;

-- 함수 수정 완료 확인
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'save_project_with_messages';

