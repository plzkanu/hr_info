-- 앱 로그인 계정 (접두사 employee_)

CREATE TABLE IF NOT EXISTS employee_users (
  id text PRIMARY KEY,
  name text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'user')) DEFAULT 'user',
  department text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  password_must_change boolean NOT NULL DEFAULT false,
  permissions text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS employee_users_role_idx ON employee_users (role);
CREATE INDEX IF NOT EXISTS employee_users_active_idx ON employee_users (active);

ALTER TABLE employee_users DISABLE ROW LEVEL SECURITY;

-- 초기 관리자: hradmin / hradmin!! (첫 로그인 시 비밀번호 변경 필수)
INSERT INTO employee_users (id, name, password_hash, role, department, active, password_must_change) VALUES
  (
    'hradmin',
    '시스템 관리자',
    '$2b$10$BNsCYpx2inA4D82y7jNdAeZl1tQg8MRRgcXc7GwCDYtXxgNqwpS.u',
    'admin',
    '경영지원팀',
    true,
    true
  )
ON CONFLICT (id) DO NOTHING;

UPDATE employee_users
SET password_must_change = true
WHERE id = 'hradmin';

DELETE FROM employee_users WHERE id = 'admin';
