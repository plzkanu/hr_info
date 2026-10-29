-- 앱은 서버의 service_role만 사용합니다. service_role은 RLS를 우회합니다.
-- anon / authenticated 에는 정책을 만들지 않아 직접 REST 접근을 막습니다.

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'employee_users',
    'employee_app_settings',
    'soosan_companies',
    'employee_appointments',
    'employee_family',
    'employee_education',
    'employee_career',
    'employee_languages',
    'employee_reward_penalty',
    'employee_licenses',
    'ens_emp_roster',
    'ind_emp_roster',
    'erp_hr_sync_status'
  ]
  LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      CONTINUE;
    END IF;
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    BEGIN
      EXECUTE format(
        'REVOKE ALL ON TABLE public.%I FROM anon, authenticated',
        t
      );
    EXCEPTION
      WHEN undefined_object THEN
        NULL;
    END;
  END LOOP;
END $$;
