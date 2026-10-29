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

ALTER TABLE employee_users ENABLE ROW LEVEL SECURITY;

-- 최초 관리자는 고정 비밀번호로 넣지 않습니다. node scripts/bootstrap-admin.mjs 로 생성하세요.
DELETE FROM employee_users WHERE id = 'admin';
