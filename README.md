# 사원명부 조회 시스템

회사 사원명부를 조회하는 내부 웹앱입니다.  
입찰·견적 시스템의 UI/UX·인증 패턴을 따릅니다.

## 기술 스택

| 항목 | 선택 |
|------|------|
| 런타임 | Node.js 24.22.1 이상 (권장 24.22.2) |
| 프레임워크 | Next.js 16 (App Router), React 19 |
| 스타일 | Tailwind CSS v4 |
| 인증 | HMAC 세션 쿠키 + bcrypt (`hrinfo_session`) |
| DB | Supabase PostgreSQL |

## 화면

- `/login` — 로그인
- `/dashboard` — 사원명부조회 (검색·엑셀·출력)
- `/dashboard/admin/users` — 사용자 관리 (관리자)
- `/dashboard/admin/session-settings` — 미사용 타임아웃 설정

## 로컬 실행

1. `.env.example`을 복사해 `.env.local`을 만들고 Supabase URL / Service Role / `AUTH_SECRET`을 넣습니다.
2. [Supabase SQL Editor](https://supabase.com/dashboard)에서 `supabase/apply-all-migrations.sql`을 실행합니다. (로그인 계정·세션 설정 테이블)
3. 사원 데이터는 기존 `ens_emp_roster`를 사용합니다.

```bash
npm install
npm run dev
```

브라우저: http://localhost:3000

계정이 없으면 `node scripts/bootstrap-admin.mjs`로 최초 관리자를 만듭니다. 임시 비밀번호는 터미널에 한 번만 출력됩니다.

사용자 추가·비밀번호 초기화 시에도 임의 임시 비밀번호가 한 번만 표시되며, 해당 사용자는 로그인 후 반드시 새 비밀번호로 변경해야 합니다.

사용자관리에서 계정별로 화면 권한을 지정할 수 있습니다. 현재 권한: **주민번호 전체보기**.

회사 VPN에서 TLS 오류가 나는 **로컬 개발**에서만 `.env.local`에 `SUPABASE_SSL_VERIFY=0`을 넣을 수 있습니다. 운영(Replit)에는 넣지 마세요.

## 테이블

앱에서 새로 만드는 테이블은 `employee_` 접두사를 사용합니다.

| 테이블 | 용도 |
|--------|------|
| `ens_emp_roster` | 사원명부 (ERP 동기화, 조회 전용) |
| `employee_users` | 시스템 로그인 계정 |
| `employee_app_settings` | 세션 타임아웃 등 |

접근 제어는 Next.js API + Service Role 키로 처리합니다.
