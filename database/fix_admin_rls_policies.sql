-- ===========================================
-- 관리자 RLS 정책 수정 (무한 재귀 문제 해결)
-- ===========================================

-- 1단계: 기존 문제 정책들 삭제
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "관리자는 모든 프로필 조회 가능" ON profiles;
DROP POLICY IF EXISTS "Admins can view all projects" ON projects;
DROP POLICY IF EXISTS "Admins can update all projects" ON projects;
DROP POLICY IF EXISTS "Admins can view all chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Admins can view all requirements" ON requirements;
DROP POLICY IF EXISTS "Admins can view all estimations" ON estimations;
DROP POLICY IF EXISTS "Admins can view all files" ON files;

-- 2단계: 관리자 역할 확인 함수 생성 (재귀 문제 해결)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3단계: 새로운 관리자 정책 추가 (함수 사용)

-- Profiles 테이블
CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can update all profiles"
ON profiles
FOR UPDATE
TO authenticated
USING (is_admin());

-- Projects 테이블
CREATE POLICY "Admins can view all projects"
ON projects
FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can update all projects"
ON projects
FOR UPDATE
TO authenticated
USING (is_admin());

-- Chat Messages 테이블
CREATE POLICY "Admins can view all chat messages"
ON chat_messages
FOR SELECT
TO authenticated
USING (is_admin());

-- Requirements 테이블
CREATE POLICY "Admins can view all requirements"
ON requirements
FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can manage all requirements"
ON requirements
FOR ALL
TO authenticated
USING (is_admin());

-- Estimations 테이블
CREATE POLICY "Admins can view all estimations"
ON estimations
FOR SELECT
TO authenticated
USING (is_admin());

-- Files 테이블
CREATE POLICY "Admins can view all files"
ON files
FOR SELECT
TO authenticated
USING (is_admin());

-- 4단계: 정책 확인
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND policyname LIKE '%Admin%'
ORDER BY tablename, policyname;

-- 5단계: is_admin() 함수 테스트
SELECT is_admin() as am_i_admin;

-- 6단계: 현재 사용자 확인
SELECT id, email, role FROM profiles WHERE id = auth.uid();

