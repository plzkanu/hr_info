-- 시스템 설정 (키-값, 접두사 employee_)

CREATE TABLE IF NOT EXISTS employee_app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE employee_app_settings DISABLE ROW LEVEL SECURITY;

INSERT INTO employee_app_settings (key, value) VALUES
  ('idle_timeout_minutes', '30')
ON CONFLICT (key) DO NOTHING;
