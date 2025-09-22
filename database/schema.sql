-- ===========================================
-- Flowgence Database Schema
-- ===========================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===========================================
-- Users Table (Supabase Auth와 연동)
-- ===========================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  company TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'client')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- Projects Table
-- ===========================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'in_progress', 'requirements_review', 
    'estimation_review', 'contract_review', 'completed', 'cancelled'
  )),
  project_overview JSONB,
  requirements JSONB,
  estimation JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- Chat Messages Table
-- ===========================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- Files Table
-- ===========================================
CREATE TABLE IF NOT EXISTS files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size BIGINT NOT NULL,
  path TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- Requirements Table (정규화된 요구사항)
-- ===========================================
CREATE TABLE IF NOT EXISTS requirements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'functional', 'non_functional', 'technical', 'business', 
    'ui_ux', 'security', 'performance', 'integration'
  )),
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft', 'review', 'approved', 'rejected', 'implemented'
  )),
  acceptance_criteria TEXT[],
  dependencies UUID[],
  estimated_hours INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- Estimations Table
-- ===========================================
CREATE TABLE IF NOT EXISTS estimations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  total_cost DECIMAL(12,2) NOT NULL,
  total_hours INTEGER NOT NULL,
  breakdown JSONB NOT NULL,
  assumptions TEXT[],
  risks JSONB,
  timeline JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- AI Agents Table
-- ===========================================
CREATE TABLE IF NOT EXISTS ai_agents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('rfp', 'estimation', 'contract', 'requirements')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'training', 'error')),
  config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- Workflows Table
-- ===========================================
CREATE TABLE IF NOT EXISTS workflows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  triggers JSONB NOT NULL,
  steps JSONB NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error', 'paused')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- Indexes
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_project_id ON chat_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_files_project_id ON files(project_id);
CREATE INDEX IF NOT EXISTS idx_requirements_project_id ON requirements(project_id);
CREATE INDEX IF NOT EXISTS idx_requirements_category ON requirements(category);
CREATE INDEX IF NOT EXISTS idx_requirements_priority ON requirements(priority);
CREATE INDEX IF NOT EXISTS idx_estimations_project_id ON estimations(project_id);

-- ===========================================
-- Row Level Security (RLS) Policies
-- ===========================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Projects policies
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Chat messages policies
CREATE POLICY "Users can view project messages" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = chat_messages.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create project messages" ON chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = chat_messages.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Files policies
CREATE POLICY "Users can view project files" ON files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = files.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create project files" ON files
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = files.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Requirements policies
CREATE POLICY "Users can view project requirements" ON requirements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = requirements.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage project requirements" ON requirements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = requirements.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Estimations policies
CREATE POLICY "Users can view project estimations" ON estimations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = estimations.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage project estimations" ON estimations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = estimations.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- AI Agents policies (모든 사용자가 읽기만 가능)
CREATE POLICY "Users can view ai agents" ON ai_agents
  FOR SELECT USING (true);

-- Workflows policies (모든 사용자가 읽기만 가능)
CREATE POLICY "Users can view workflows" ON workflows
  FOR SELECT USING (true);

-- ===========================================
-- Functions
-- ===========================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, company, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'company',
    'user'  -- 기본 역할
  );
  RETURN new;
END;
$$;

-- Create triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requirements_updated_at BEFORE UPDATE ON requirements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_estimations_updated_at BEFORE UPDATE ON estimations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_agents_updated_at BEFORE UPDATE ON ai_agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- Sample Data
-- ===========================================

-- Insert sample AI agents
INSERT INTO ai_agents (name, description, type, config) VALUES
('RFP Agent', '프로젝트 개요 분석 및 요구사항 도출 에이전트', 'rfp', '{
  "model": "gpt-4",
  "temperature": 0.7,
  "maxTokens": 4000,
  "systemPrompt": "당신은 SI 프로젝트의 RFP(제안요청서) 분석 전문가입니다. 사용자의 프로젝트 설명을 분석하여 체계적인 요구사항을 도출해주세요.",
  "tools": ["requirements_extraction", "project_analysis"]
}'),
('Estimation Agent', '요구사항 기반 견적 산출 에이전트', 'estimation', '{
  "model": "gpt-4",
  "temperature": 0.3,
  "maxTokens": 2000,
  "systemPrompt": "당신은 SI 프로젝트 견적 전문가입니다. 주어진 요구사항을 바탕으로 정확한 견적을 산출해주세요.",
  "tools": ["cost_calculation", "timeline_estimation"]
}'),
('Contract Agent', '계약서 생성 및 검토 에이전트', 'contract', '{
  "model": "gpt-4",
  "temperature": 0.2,
  "maxTokens": 3000,
  "systemPrompt": "당신은 법무 전문가입니다. 프로젝트 요구사항과 견적을 바탕으로 계약서를 생성하고 검토해주세요.",
  "tools": ["contract_generation", "legal_review"]
}');

-- Insert sample workflows
INSERT INTO workflows (name, description, triggers, steps, status) VALUES
('Project Creation Workflow', '새 프로젝트 생성 시 자동 실행되는 워크플로우', 
 '[{"type": "webhook", "config": {"path": "project-created"}}]',
 '[{"id": "1", "type": "ai_processing", "name": "Analyze Project", "config": {"agent": "rfp"}, "nextSteps": ["2"]}, {"id": "2", "type": "notification", "name": "Send Confirmation", "config": {"channel": "email"}, "nextSteps": []}]',
 'active'),
('Requirements Analysis Workflow', '요구사항 분석 및 정리 워크플로우',
 '[{"type": "webhook", "config": {"path": "requirements-updated"}}]',
 '[{"id": "1", "type": "ai_processing", "name": "Extract Requirements", "config": {"agent": "rfp"}, "nextSteps": ["2"]}, {"id": "2", "type": "data_transformation", "name": "Format Requirements", "config": {"format": "json"}, "nextSteps": ["3"]}, {"id": "3", "type": "notification", "name": "Notify User", "config": {"channel": "in_app"}, "nextSteps": []}]',
 'active');
