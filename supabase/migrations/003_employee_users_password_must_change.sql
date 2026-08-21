-- 비밀번호 초기화 후 강제 변경 플래그 + admin 계정 교체

ALTER TABLE employee_users
  ADD COLUMN IF NOT EXISTS password_must_change boolean NOT NULL DEFAULT false;

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
