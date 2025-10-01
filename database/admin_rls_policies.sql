-- ===========================================
-- 관리자 페이지용 RLS 정책 설정
-- ===========================================
-- 이 파일은 관리자가 모든 데이터를 조회할 수 있도록 RLS 정책을 추가합니다.

-- ===========================================
-- Profiles 테이블 - 관리자 정책 추가
-- ===========================================

-- 기존 정책 확인 (선택사항)
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';

-- 관리자는 모든 프로필 조회 가능
CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ===========================================
-- Projects 테이블 - 관리자 정책 추가
-- ===========================================

-- 관리자는 모든 프로젝트 조회 가능
CREATE POLICY "Admins can view all projects"
ON projects
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 관리자는 모든 프로젝트 수정 가능
CREATE POLICY "Admins can update all projects"
ON projects
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ===========================================
-- Chat Messages 테이블 - 관리자 정책 추가
-- ===========================================

-- 관리자는 모든 채팅 메시지 조회 가능
CREATE POLICY "Admins can view all chat messages"
ON chat_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ===========================================
-- Requirements 테이블 - 관리자 정책 추가
-- ===========================================

-- 관리자는 모든 요구사항 조회 가능
CREATE POLICY "Admins can view all requirements"
ON requirements
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ===========================================
-- Estimations 테이블 - 관리자 정책 추가
-- ===========================================

-- 관리자는 모든 견적 조회 가능
CREATE POLICY "Admins can view all estimations"
ON estimations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ===========================================
-- Files 테이블 - 관리자 정책 추가
-- ===========================================

-- 관리자는 모든 파일 조회 가능
CREATE POLICY "Admins can view all files"
ON files
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- ===========================================
-- 정책 확인 쿼리
-- ===========================================

-- 모든 RLS 정책 확인
SELECT 
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'projects', 'chat_messages', 'requirements', 'estimations', 'files')
ORDER BY tablename, policyname;

-- 현재 사용자의 역할 확인
SELECT id, email, role FROM profiles WHERE id = auth.uid();

