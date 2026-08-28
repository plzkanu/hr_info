-- 상세 테이블 회사구분: company_id = soosan_companies.id

ALTER TABLE public.employee_appointments ADD COLUMN IF NOT EXISTS company_id integer;
ALTER TABLE public.employee_family ADD COLUMN IF NOT EXISTS company_id integer;
ALTER TABLE public.employee_education ADD COLUMN IF NOT EXISTS company_id integer;
ALTER TABLE public.employee_career ADD COLUMN IF NOT EXISTS company_id integer;
ALTER TABLE public.employee_languages ADD COLUMN IF NOT EXISTS company_id integer;
ALTER TABLE public.employee_reward_penalty ADD COLUMN IF NOT EXISTS company_id integer;
ALTER TABLE public.employee_licenses ADD COLUMN IF NOT EXISTS company_id integer;
