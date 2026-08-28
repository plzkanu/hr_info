-- 회사구분 (상세 테이블 company_id = soosan_companies.id)

CREATE TABLE IF NOT EXISTS public.soosan_companies (
  id integer PRIMARY KEY,
  company_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
