-- 사용자별 화면 기능 권한

ALTER TABLE employee_users
  ADD COLUMN IF NOT EXISTS permissions text[] NOT NULL DEFAULT '{}';
