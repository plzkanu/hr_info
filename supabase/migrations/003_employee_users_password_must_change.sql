-- 비밀번호 초기화 후 강제 변경 플래그 + admin 계정 교체

ALTER TABLE employee_users
  ADD COLUMN IF NOT EXISTS password_must_change boolean NOT NULL DEFAULT false;

-- 고정 비밀번호 시드는 폐기했습니다. 최초 관리자는 node scripts/bootstrap-admin.mjs 로 생성하세요.
DELETE FROM employee_users WHERE id = 'admin';
