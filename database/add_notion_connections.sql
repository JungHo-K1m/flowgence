-- ===========================================
-- Notion Connections Table
-- 사용자별 Notion OAuth 연결 정보 저장
-- ===========================================

CREATE TABLE IF NOT EXISTS notion_connections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  access_token TEXT NOT NULL, -- 암호화하여 저장 권장
  workspace_id TEXT,
  workspace_name TEXT,
  bot_id TEXT,
  database_id TEXT, -- 사용자가 선택한 데이터베이스 ID (선택사항)
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- 토큰 만료 시간
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id) -- 사용자당 하나의 연결만 허용
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_notion_connections_user_id ON notion_connections(user_id);

-- RLS 정책
ALTER TABLE notion_connections ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 연결 정보만 조회 가능
CREATE POLICY "Users can view own notion connection" ON notion_connections
  FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 연결 정보만 생성 가능
CREATE POLICY "Users can insert own notion connection" ON notion_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 연결 정보만 수정 가능
CREATE POLICY "Users can update own notion connection" ON notion_connections
  FOR UPDATE USING (auth.uid() = user_id);

-- 사용자는 자신의 연결 정보만 삭제 가능
CREATE POLICY "Users can delete own notion connection" ON notion_connections
  FOR DELETE USING (auth.uid() = user_id);

-- updated_at 자동 업데이트 트리거
CREATE TRIGGER update_notion_connections_updated_at 
  BEFORE UPDATE ON notion_connections
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

