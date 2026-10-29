# 보안점검 보고서 (hr_info)

이 문서는 `EXISTING_SITE_SECURITY_AUDIT.md` 지침에 따른 점검 결과입니다. 안전 인증서가 아니며, 검토 범위 내에서 발견된 사항을 기록합니다. “완전히 안전함”으로 해석하지 마십시오.

기본 모드는 점검·보고 전용입니다. 애플리케이션 코드 수정, 운영 환경 변경, 배포는 수행하지 않았습니다.

---

## 점검 개요

| 항목 | 내용 |
| --- | --- |
| 점검 일시 | 2026-10-29 (KST) |
| 대상 | SOOSAN 사원명부 조회 시스템 (`hr_info`) |
| 저장소 | https://github.com/plzkanu/hr_info (로컬 `D:\prj\hr_info`) |
| 확인 커밋 | `28644f0395be161960b2f513bfaccf9860c4e01f` (short `28644f0`), 브랜치 `main` |
| 대상 환경 | 로컬 개발 워크스테이션의 소스·잠금 파일·실행 버전. Replit 운영 URL·헤더·Secrets 실값은 확인하지 않음 |
| 승인 범위 | 읽기 전용 정적 검토. 운영 HTTP 능동 테스트, 무차별 로그인, 스캐너, 실제 개인정보 열람·반출, 코드 수정은 승인 없음 → 미수행 |
| 제외 | 운영 Replit 인스턴스 침투 시험, Supabase 대시보드/RLS 실권한 조회, 백업·사고대응 절차의 실증거, KISA 포털 실시간 공지 전수 |

### 시스템 요약

- Next.js 16 App Router + React 19. 인증은 자체 HMAC 쿠키(`hrinfo_session`, 8시간)와 bcrypt 비밀번호. Supabase Auth는 사용하지 않음.
- 데이터: hr_info Supabase(로그인·명부·인사상세)와 manmanage Supabase(공사경력). 서버가 **Service Role** 키로 조회.
- 역할: `admin` / `user`. 추가 권한은 `view_full_resident_id`(주민번호·생년월일·학력)뿐. 그 외 명부·가족·발령 등은 로그인 사용자 전원이 조회 가능.
- 개인정보(인사·주민등록번호·가족)를 처리함. 결제·메일·문자·n8n·PHP는 해당 없음.
- 배포: Replit에서 `next start -H 0.0.0.0 -p 3000`. API 경로는 `/hr-api`.

### 확인한 버전 (선언 / 잠금 / 로컬 실행)

| 구성 요소 | package.json | package-lock / 실행 | 비고 |
| --- | --- | --- | --- |
| Node.js | `>=22` | 로컬 실행 **v24.14.0** | 운영(Replit) Node 버전은 미점검 |
| npm | — | 11.9.0 | |
| next | 16.2.7 | 16.2.7 | 아래 Next.js 공지 범위에 포함 |
| react / react-dom | 19.2.4 | 동일 | |
| @supabase/supabase-js | ^2.107.0 | lock 기준 설치본 | |
| bcryptjs | ^3.0.3 | | |
| xlsx | ^0.18.5 | 0.18.5 | SheetJS 커뮤니티 빌드 |

### 사용 도구·명령·공지 (확인일 2026-10-29)

- 정적 검토: 인증·세션·API 라우트·Supabase 클라이언트·마이그레이션·`next.config.ts`·`.gitignore`·`DEPLOY.md`
- `node --version`, `npm --version`, `npm audit --json` (레지스트리에 패키지 이름만 전송. 비밀값 없음)
- `git ls-files`로 추적 `.env*` 확인 (추적 파일은 `.env.example`만)
- GitHub Advisory: Next.js GHSA 다수(아래 개별 항목), SheetJS GHSA-4r6h-8v6p-xvw6 / GHSA-5pgg-2g8v-p4x9
- Node.js 24.x 수정본 24.22.1 (CVE-2026-111497 Node2Shell / undici brotli 관련). 로컬은 24.14.0
- KISA/KrCERT 포털 실시간 대조: **미점검** (https://www.krcert.or.kr/ 는 방법론 참고만)
- OWASP WSTG / ASVS: 체크리스트 매핑 참고

### 정적 검토 vs 능동 검증

- 수행: 코드·설정·의존성 읽기 전용 검토, 로컬 Node/npm 버전, npm audit
- 미수행: 운영 URL 접속, 로그인 시도, 세션 위조 실험, 레이트리밋 폭주, 이미지 최적화 RCE 재현, DB RLS 실측, 헤더(HSTS/CSP) 실측

---

## 요약

| 심각도 | 확인된 건수 |
| --- | ---: |
| Critical | 2 |
| High | 6 |
| Medium | 5 |
| Low | 4 |
| Informational | 3 |
| 추가 확인 필요 | 7 |
| 미점검 | 11 (체크리스트 기준) |

우선 조치(수정은 별도 승인 후):

1. **Next.js를 공식 수정 버전(npm audit 기준 16.4.3 이상, 배포 시점의 최신 패치)으로 올리십시오.** 16.2.7은 인증 없는 RCE 권고 범위에 들어 있습니다. 운영 Windows 호스트와 이미지 최적화 경로가 특히 해당됩니다.
2. **운영 Node를 24.22.1 이상(또는 해당 분기의 수정본)으로 맞추십시오.** 로컬은 v24.14.0이라 Node2Shell 패치 전 버전입니다.
3. **`AUTH_SECRET` 미설정 시 기동을 실패시키십시오.** 지금은 하드코드 폴백으로 세션을 서명합니다.
4. **예측 가능한 임시 비밀번호(`아이디!!`)와 문서화된 초기 관리자 조합을 폐기하고, 로그인 실패 제한을 넣으십시오.**
5. **세션 토큰에 만료를 넣고, 유휴 로그아웃을 서버에서 강제하십시오.** 쿠키 `maxAge`와 클라이언트 타이머만으로는 부족합니다.
6. **Service Role + RLS 비활성** 구성을 재검토하고, 운영에서 TLS 검증 우회(`SUPABASE_SSL_VERIFY=0`)를 쓰지 마십시오.

운영·배포 권고: Critical/High가 남아 있으면 신규 기능 배포를 보류하는 것이 지침에 맞습니다. 예외는 책임자·기한·보완 통제를 기록한 뒤에만 허용하십시오. 이 점검은 서비스를 중단시키지 않았습니다.

---

## 개별 발견 사항

### SA-01 Next.js 16.2.7이 인증 없는 RCE 등 공식 권고 범위에 있음

- **상태:** 취약 (버전 일치 확인됨, 악용은 미재현)
- **심각도:** Critical
- **증거 신뢰도:** 확인됨 (잠금 파일·npm audit). 실제 원격 코드 실행 여부는 확인 불가
- **영향 환경:** 로컬 `next dev` / 운영 `next start` 모두 동일 패키지 버전을 쓸 경우
- **경로·파일:** `package.json` `next: 16.2.7`, `package-lock.json` 동일
- **공격 전제:** 앱이 네트워크에 열려 있고, 각 GHSA가 요구하는 기능(Windows 호스트, Image Optimization, Server Actions 등)이 충족될 때
- **업무 영향:** 서버 장악 시 Service Role로 인사 DB 전체 유출·변조 가능
- **증거:** `npm audit`이 `next` 16.2.7을 `>=16.0.0 <16.2.11` 및 `<=16.4.0` 범위의 권고에 매핑. 대표 항목:
  - GHSA-p293-qw3h-jr36 인증 없는 RCE (Windows 호스트) — critical, `<16.3.3`
  - GHSA-2464-fhr4-w9xw 이미지 최적화 SVG 관련 인증 없는 RCE — critical, `<=16.4.0`
  - GHSA-2xp9-vwfh-vxw4 이미지 최적화 AVIF 관련 RCE — critical, `<16.3.3`
  - GHSA-673q-mjm6-r5xr `use cache` typed array RCE — 이 저장소에는 `"use cache"` 없음 → 해당 조건은 충족하지 않는 것으로 판단
  - GHSA-m99w-x7hq-7vfj / GHSA-p3m5-59mp-j5vr Server Actions DoS — `"use server"` 없음 → 해당 조건 불충족으로 판단
- **재현:** 하지 않음 (지침상 운영·RCE 능동 테스트 금지)
- **관련:** 위 GHSA. CWE-94 등
- **권장 수정:** Next.js를 배포 시점 공식 패치(audit 제시 16.4.3 이상)로 올리고 재빌드. `npm audit fix --force` 일괄 적용은 하지 말 것
- **임시 완화:** 인터넷 노출 최소화, 이미지 최적화 원격 소스 비허용, Windows에 `0.0.0.0` 바인딩 자제. 완화만으로 RCE 권고를 해소하지 못함
- **담당자 / 기한 / 재점검:** 미지정. 재점검: lock 파일 버전과 `npm audit`에서 해당 GHSA 소거 확인

### SA-02 AUTH_SECRET 미설정 시 알려진 폴백으로 세션 서명

- **상태:** 취약 (코드 확인). 운영 Secrets 실값은 미점검
- **심각도:** Critical (운영에서 미설정이면 인증 우회). 설정되어 있으면 잠재 결함
- **증거 신뢰도:** 코드는 확인됨. 운영 적용 여부는 확인 불가
- **파일:** `src/lib/session-token.ts` `getAuthSecret()` (약 5–7행)
- **공격 전제:** 운영에 `AUTH_SECRET`이 없거나 폴백과 동일
- **업무 영향:** 임의 사용자 ID(예: 관리자)에 대한 유효 세션 쿠키 위조. `getSessionUser()`는 서명만 검증한 뒤 DB에서 해당 ID를 로드하므로, 비밀키를 알면 활성 계정으로 로그인과 동등
- **증거:** `process.env.AUTH_SECRET`이 없으면 소스에 고정된 개발용 문자열이 사용됨. 실패 폐쇄가 아님
- **재현:** 하지 않음
- **관련:** CWE-1188, CWE-321
- **권장 수정:** 비밀키 없으면 프로세스 종료. 길이 충분한 임의값. 폴백 삭제. 의심되면 키 재발급 후 전 세션 무효
- **임시 완화:** Replit Secrets에 강한 `AUTH_SECRET`이 있는지 책임자가 확인 (값을 채팅에 붙여 넣지 말 것)

### SA-03 예측 가능한 임시 비밀번호와 로그인 실패 제한 없음

- **상태:** 취약
- **심각도:** High (초기 관리자 비밀번호가 아직 유효하면 Critical에 해당할 수 있음 — 운영 실사용 여부는 미점검)
- **증거 신뢰도:** 코드·문서 확인됨. 운영 계정의 현재 비밀번호 상태는 확인 불가
- **파일:**
  - `src/lib/password.ts` `initialPassword` (아이디 + `!!`)
  - `src/app/hr-api/auth/login/route.ts` (실패 카운터·잠금 없음)
  - `src/app/hr-api/auth/complete-password-change/route.ts` (세션 없이 ID+현재비번으로 변경·세션 발급)
  - `README.md` / `DEPLOY.md` / `supabase/migrations/001_employee_users.sql` 초기 관리자 안내
- **공격 전제:** 로그인 화면이 인터넷에 열려 있고, 아이디를 추측할 수 있음 (문서화된 `hradmin`, 사번성 ID)
- **업무 영향:** 미변경 계정 탈취, 강제변경 대상 계정의 비밀번호를 공격자 값으로 교체
- **증거:** 신규·초기화 비밀번호가 결정적. 로그인 401에 백오프 없음. 강제 변경 API는 인증 쿠키 없이 호출 가능(현재 비밀번호는 필요)
- **재현:** 하지 않음 (무차별 로그인 금지)
- **관련:** CWE-521, CWE-307, OWASP ASVS V2
- **권장 수정:** 임시 비밀번호는 충분한 엔트로피로 생성해 1회 표시. 실패 N회 잠금 또는 지연. 초기 관리자 안내를 운영 문서에서 제거하고 해당 계정 비밀번호·해시 교체
- **임시 완화:** 공개 URL 접근 제한(VPN/IP), 모든 계정이 `password_must_change`가 아니고 기본 패턴을 쓰지 않는지 관리자가 확인

### SA-04 세션 토큰에 만료 클레임이 없고 유휴 종료가 클라이언트에만 있음

- **상태:** 취약
- **심각도:** High
- **증거 신뢰도:** 확인됨
- **파일:** `src/lib/session-token.ts` `createSessionToken` / `parseSessionToken`; `src/lib/auth.ts` 쿠키 `maxAge` 8시간; `src/components/idle-timeout-watcher.tsx`; `src/app/hr-api/auth/extend/route.ts`
- **공격 전제:** 쿠키 유출(XSS, 악성 확장, 공용 PC). 브라우저는 `maxAge`를 지키지 않는 클라이언트로 쿠키를 계속 보낼 수 있음
- **업무 영향:** 탈취된 세션이 사용자 비활성·비밀번호 변경 전까지 유효. 유휴 로그아웃은 탭을 닫지 않은 정상 브라우저에서만 동작
- **증거:** HMAC 페이로드는 사용자 JSON뿐이고 `exp`/`iat` 없음. `getSessionUser`는 서명·계정 활성·`passwordMustChange`만 확인. 유휴 감시는 브라우저 이벤트
- **재현:** 하지 않음
- **관련:** CWE-613
- **권장 수정:** 토큰에 만료·발급시각 포함, 서버에서 거부. 로그아웃·비번 변경 시 서버 측 세션 버전/무효화. 유휴도 서버 시각 기준
- **임시 완화:** 쿠키 `maxAge` 단축은 브라우저에만 유효. 근본 대책은 서버 만료

### SA-05 Service Role로 전 조회 + 앱 테이블 RLS 비활성

- **상태:** 취약 (앱 설계 확인). anon/authenticated GRANT 실측은 미점검
- **심각도:** High
- **증거 신뢰도:** 코드·SQL은 확인됨. Supabase 대시보드 권한은 확인 불가
- **파일:** `src/lib/supabase/server.ts` (`SUPABASE_SERVICE_ROLE_KEY`, `MANMANAGE_SUPABASE_SERVICE_ROLE_KEY`); `supabase/migrations/001_employee_users.sql` `ALTER TABLE employee_users DISABLE ROW LEVEL SECURITY`; `002_employee_app_settings.sql` 동일
- **공격 전제:** 키 유출, 또는 anon 키가 알려진 상태에서 public 롤에 SELECT가 열려 있는 경우
- **업무 영향:** 비밀번호 해시·설정·인사 테이블 직접 접근. 앱 XSS만으로도 로그인 사용자 권한으로 명부 API 호출 가능(HttpOnly라 쿠키 탈취는 어려워도 동일출처 요청은 가능)
- **증거:** 서버 클라이언트가 서비스 롤만 사용. 마이그레이션이 RLS를 명시적으로 끔
- **재현:** 하지 않음
- **관련:** CWE-284, Supabase “RLS를 기본으로” 권고
- **권장 수정:** 앱용은 최소 권한 역할. `employee_users` 등 RLS 활성화 후 서비스 롤만 우회. anon/authenticated GRANT 제거. 유출 의심 키는 재발급
- **임시 완화:** 키가 프런트 번들·Git에 없는지 유지 (현재 `NEXT_PUBLIC_` 접두 없는 서비스 롤은 클라이언트 번들 대상이 아님 — 정적 검토)

### SA-06 TLS 검증 우회 옵션과 예시 설정의 기본값처럼 보이는 비활성

- **상태:** 취약 (코드·예시 확인). 운영 Secrets에 해당 변수가 있는지는 미점검
- **심각도:** High
- **증거 신뢰도:** 확인됨
- **파일:** `.env.example` `SUPABASE_SSL_VERIFY=0`; `src/lib/supabase/config.ts` `isSupabaseTlsInsecure`; `src/lib/supabase/fetch.ts` `rejectUnauthorized: false`
- **공격 전제:** 이 옵션이 켜진 호스트와 공격자가 경로상 MITM 가능
- **업무 영향:** Service Role 요청 탈취·변조, 인사·계정 데이터 노출. Node2Shell형 undici 이슈와 겹치면 위험도가 올라감(다만 이 우회 경로의 fetch는 undici가 아니라 Node `https` 에이전트)
- **재현:** 하지 않음
- **관련:** CWE-295
- **권장 수정:** 운영에서 옵션 제거. 예시는 주석으로 “임시·개발 전용”을 명확히. 인증서 문제는 기업 CA 신뢰로 해결
- **임시 완화:** Replit 공개 HTTPS 구간에서는 해당 변수를 넣지 말라는 `DEPLOY.md` 안내를 지키는지 확인

### SA-07 로그인 세션만으로 본인 비밀번호 변경 (현재 비밀번호 없음)

- **상태:** 취약
- **심각도:** High
- **증거 신뢰도:** 확인됨
- **파일:** `src/app/hr-api/auth/change-password/route.ts`; `src/lib/users-store.ts` `changeOwnPassword` (약 332–358행)
- **공격 전제:** 유효 세션(쿠키 탈취 또는 자리 비움)
- **업무 영향:** 계정 탈취를 비밀번호 교체로 고정. 피해자 복구가 어려움
- **증거:** 요청 본문에 `newPassword`/`confirmPassword`만 있음. 현재 비밀번호 검증 없음
- **재현:** 하지 않음
- **관련:** CWE-620
- **권장 수정:** 현재 비밀번호 재확인. 변경 후 다른 세션 무효화
- **임시 완화:** SameSite=Lax가 사이트 간 POST CSRF는 완화. 동일 출처 XSS·쿠키 탈취에는 무력

### SA-08 로컬 Node v24.14.0 (Node2Shell 패치 전 24.x)

- **상태:** 취약 (로컬 런타임). 운영 Node는 미점검
- **심각도:** High (로컬·동일 버전 운영 시). 이 앱의 주된 outbound는 설정한 Supabase URL
- **증거 신뢰도:** 로컬 실행 버전 확인됨. 운영은 확인 불가
- **공격 전제:** 취약한 undici `fetch`가 공격자 영향 하의 HTTP 응답(예: 브로틀리)을 처리할 때. 이미지 최적화 원격 로드 등이 있으면 노출면이 넓어짐
- **업무 영향:** 프로세스 RCE 시 SA-01과 유사한 DB 키 노출
- **증거:** `node -v` → v24.14.0. 24.x 수정은 24.22.1로 안내된 상태
- **재현:** 하지 않음
- **권장 수정:** 개발·배포 런타임을 수정 버전으로 통일. `engines`에 하한 명시 검토
- **임시 완화:** 사용자 입력을 원격 URL fetch에 쓰지 않기 (현재 명부 조회는 Supabase 클라이언트)

### SA-09 보안 응답 헤더·CSP 미설정

- **상태:** 취약 (앱 설정 기준). CDN/Replit 프록시 추가 헤더는 미점검
- **심각도:** Medium
- **증거 신뢰도:** `next.config.ts` 확인됨. 실응답 헤더는 확인 불가
- **파일:** `next.config.ts` (`allowedDevOrigins`만, headers 없음). `middleware.ts` 없음
- **업무 영향:** 클릭재킹, MIME 스니핑, XSS 심화 시 완화 헤더 부재
- **권장 수정:** CSP, `X-Frame-Options`/`frame-ancestors`, `nosniff`, `Referrer-Policy`, HTTPS에서 HSTS(적용 범위 검토 후)
- **임시 완화:** 리버스 프록시에서 헤더 추가 가능하나 앱과 중복·충돌 확인 필요

### SA-10 API 5xx/4xx가 내부 오류 문자열을 그대로 반환

- **상태:** 취약
- **심각도:** Medium
- **증거 신뢰도:** 확인됨
- **파일:** `src/app/hr-api/auth/login/route.ts` 43–48행; `employees/route.ts` 64–68행; `related-api.ts` 27–30행; 사용자·설정 라우트 다수
- **공격 전제:** 인증 전(로그인 500) 또는 인증 후
- **업무 영향:** 테이블명·스키마 안내·연결 실패 원인 등 정찰 정보. 비밀키 자체는 `formatSupabaseNetworkError`가 일부 가림
- **권장 수정:** 클라이언트는 고정 메시지, 상세는 서버 로그. 로그인 500도 동일

### SA-11 비밀번호 정책이 길이 8 + 임시비번 금지뿐

- **상태:** 취약
- **심각도:** Medium
- **증거 신뢰도:** 확인됨
- **파일:** `src/lib/password.ts` `validateNewPassword`
- **권장 수정:** 복잡도 또는 차단 목록, 변경 시 현재 비번, 필요 시 MFA(관리자)

### SA-12 xlsx 0.18.5 (Prototype Pollution / ReDoS) — 수정 버전 없음

- **상태:** 취약 (의존성). 이 앱은 주로 `XLSX.writeFile`로 내보냄
- **심각도:** Medium (비신뢰 통합 파싱이 없으면 실익은 낮을 수 있음)
- **증거 신뢰도:** npm audit 확인됨
- **파일:** `package.json`; `src/components/employee-inquiry.tsx` 약 429행
- **관련:** GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9
- **권장 수정:** 유지 중인 라이브러리로 교체(예: ExcelJS 등) 또는 SheetJS 정식 채널. 비신뢰 xlsx 업로드 파싱을 추가하지 말 것
- **한계:** `fixAvailable: false`

### SA-13 인증된 모든 사용자가 전사 인사·가족·경력 조회 가능

- **상태:** 추가 확인 필요 (코드상 의도된 모델로 보임)
- **심각도:** Medium (내부 HR 전용·소규모 계정만이면 수용 가능. 계정이 넓으면 High)
- **증거 신뢰도:** API 권한 코드는 확인됨
- **파일:** `src/app/hr-api/employees/route.ts` `requireApiSession`만; `related-api.ts`; family/appointments/construction-history 등
- **판단 근거:** 주민번호 등은 `canViewPersonalIdentity`로 서버에서 비움(`src/lib/format.ts` `applyPersonalIdentityVisibility`). 그 외 필드·엑셀 내보내기는 세션만 있으면 가능. 객체 소유권(본인 사번만) 검사는 없음
- **권장:** 업무상 전 직원 HR 조회가 맞는지 책임자 확인. 아니면 부서/회사 범위 축소

### SA-14 공개 헬스 엔드포인트

- **상태:** 취약 (정보 노출 수준)
- **심각도:** Low
- **파일:** `src/app/hr-api/health/route.ts`, `src/app/internal-api/route.ts` — `{ ok: true, service: "hr-info" }`
- **권장:** 내부 프로브만 허용하거나 내용 최소화. 현재는 민감 데이터 없음

### SA-15 대시보드 보호가 middleware가 아니라 레이아웃 가드만

- **상태:** 추가 확인 필요 / 방어 깊이 부족
- **심각도:** Low
- **파일:** `src/app/dashboard/layout.tsx` `getSessionUser` 후 `/login` 리다이렉트. API는 `requireApiSession`
- **근거:** 레이아웃을 거치지 않는 페이지가 없으면 우회는 어려움. RSC 레이아웃 가드는 일반적으로 유효. middleware 부재는 헤더 삽입·일괄 인증 기회를 줄임
- **권장:** middleware에서 세션 쿠키 존재만이라도 검사 (서명 검증은 서버 권위 유지)

### SA-16 Git에 초기 관리자 bcrypt 해시 존재

- **상태:** 취약 (기본 계정 산출 가능)
- **심각도:** Low (비밀번호는 문서에도 있음)
- **파일:** `supabase/migrations/001_employee_users.sql` INSERT (해시 값은 보고서에 재기재하지 않음)
- **권장:** 시드 해시를 제거하고 최초 기동 시 로컬에서만 생성. 운영 해시가 시드와 같으면 교체

### SA-17 회사 코드로 명부 테이블명을 조합

- **상태:** 추가 확인 필요
- **심각도:** Low
- **파일:** `src/lib/companies.ts` `rosterTableFor`; `employees-store.ts` `COMPANY_ROSTER_TABLE[company] ?? rosterTableFor(company)`
- **근거:** PostgREST `.from(table)`이라 전형적 SQL 삽입은 아님. 허용 목록 밖의 코드는 `{code}_emp_roster` 존재 여부 탐지에 쓰일 수 있음
- **권장:** `soosan_companies` 허용 코드만 통과

### SA-18 npm audit 전이 의존성 (brace-expansion, postcss, sharp, js-yaml, zod, source-map-js)

- **상태:** 추가 확인 필요 (빌드/이미지 파이프라인 의존)
- **심각도:** Informational ~ Medium (sharp/postcss는 Next 업그레이드로 같이 오를 수 있음)
- **증거 신뢰도:** audit 결과 확인됨. 런타임 도달 경로는 미검증
- **권장:** Next 패치와 함께 재감사. 개별 `audit fix --force` 금지

### SA-19 통과에 가까운 통제 (정보)

- 비밀번호 저장: bcryptjs 비용 10, API `toPublicUser`에서 해시 제거
- 세션 쿠키: `httpOnly`, `sameSite: 'lax'`, 운영에서 `secure: NODE_ENV === 'production'`
- 세션 페이로드의 role을 신뢰하지 않고 DB 재조회
- 로그인 실패 메시지는 401에서 아이디/비밀번호 미구분
- React 기본 이스케이프, `dangerouslySetInnerHTML`/`eval` 없음 (빌드 스크립트의 `child_process`는 로컬 빌드용)
- Supabase 필터는 클라이언트 바인딩. `.env*`는 `.gitignore` (`.env.example` 제외)
- 관리자 API `requireApiAdmin`, 자기 비밀번호 초기화 차단 (`reset-password/route.ts`)
- 로그인 `from` 쿼리는 `/dashboard` 접두만 허용

---

## 체크리스트 결과

범례: 통과 / 취약 / 추가 확인 필요 / 미점검 / 해당 없음

### 인증과 세션

| 항목 | 상태 | 근거·범위 |
| --- | --- | --- |
| 비밀번호 단방향 해시 | 통과 | bcryptjs, 정적 검토 |
| 재설정 토큰 만료·일회성 | 해당 없음 | 메일 토큰 없음. 임시비번은 결정적 문자열(SA-03) |
| 로그인 실패 제한 | 취약 | SA-03 |
| 계정 존재 여부 노출 | 통과 | 일반 401 문구. 강제변경 성공 시에만 userId 반환 |
| 관리자 MFA | 취약 | 없음 |
| 중요 작업 재인증 | 취약 | 비번 변경·초기화에 현재 비번/재인증 부족 (SA-07) |
| 로그인 시 세션 교체 | 추가 확인 필요 | 매 로그인 새 HMAC 쿠키. 이전 쿠키 서버 무효화는 없음 |
| 로그아웃 시 무효화 | 취약 | 쿠키 삭제뿐, 토큰 블랙리스트/버전 없음 (SA-04) |
| 쿠키 Secure/HttpOnly/SameSite | 통과(코드) | 운영 실헤더는 미점검. Secure는 production만 |
| 토큰 만료·서명 | 취약 | HMAC-SHA-256은 있으나 exp 없음 (SA-02, SA-04) |

### 권한과 업무 로직

| 항목 | 상태 | 근거·범위 |
| --- | --- | --- |
| 서버 권한 검증 | 통과(부분) | API 세션/관리자 검사 있음. 주민번호 권한 서버 적용 |
| 객체·조직 IDOR | 추가 확인 필요 | 사번만 있으면 타인 상세 조회 (SA-13) |
| 관리자 기능 경계 | 통과 | `/dashboard/admin` 레이아웃 + `requireApiAdmin` |
| 내보내기 권한 | 추가 확인 필요 | 엑셀은 클라이언트, 데이터는 세션 사용자의 조회 결과 |
| 클라이언트 역할 신뢰 | 통과 | 쿠키 role 무시, DB 로드 |
| 재전송·동시성 | 미점검 | 능동 테스트 없음 |

### 입력값과 출력값

| 항목 | 상태 | 근거·범위 |
| --- | --- | --- |
| SQL 바인딩 | 통과 | Supabase 필터. 테이블명은 허용 목록+조합 (SA-17) |
| XSS 출력 인코딩 | 통과 | React 텍스트. 능동 XSS 테스트는 없음 |
| 명령·역직렬화·경로 | 통과 | 사용자 입력으로 셸 실행 없음 |
| SSRF | 추가 확인 필요 | 앱 코드에 사용자 URL fetch 없음. Next 이미지 최적화 GHSA는 SA-01 |
| 업로드 | 해당 없음 | 파일 업로드 API 없음 |
| CSRF | 통과(부분) | 인증 POST는 SameSite=Lax로 사이트 간 완화. 명시적 CSRF 토큰 없음. 능동 검증 없음 |

### API·서버·브라우저 설정

| 항목 | 상태 | 근거·범위 |
| --- | --- | --- |
| HTTPS/HSTS | 미점검 | Replit 응답 미수집. 앱에 HSTS 설정 없음 |
| CORS | 통과(코드) | 커스텀 광역 CORS 없음. 개발 `allowedDevOrigins`만 |
| CSP·프레임·nosniff | 취약 | SA-09 |
| .env/.git 공개 | 미점검 | 운영 URL에서 `/.env` 요청 안 함. Git 추적은 `.env.example`만 |
| 오류 정보 노출 | 취약 | SA-10 |
| 요청 크기·빈도 제한 | 취약 | 앱 레벨 레이트 리밋 없음. `fetchAllRows` 상한 10만 행 |
| 캐시 개인화 혼선 | 추가 확인 필요 | Next 캐시 GHSA는 버전에 포함. 본 앱은 동적 세션 API 위주 |

### 데이터·비밀정보·운영

| 항목 | 상태 | 근거·범위 |
| --- | --- | --- |
| Git/프론트 비밀값 | 통과(정적) | JWT형 문자열 검색에서 앱 소스 히트 없음. lock integrity는 해시 |
| 키 최소 권한 | 취약 | SA-05 |
| 개인정보 최소 수집 | 추가 확인 필요 | ERP 동기화 명부. 앱이 원천 수집하지는 않음 |
| 로그 마스킹 | 미점검 | 운영 로그 미열람 |
| 보관·삭제 정책 | 미점검 | |
| 백업 복구 증거 | 미점검 | |
| 감사 로그·알림·사고 연락 | 미점검 | 로그인 감사 이벤트 코드 없음 |

### PHP / n8n

| 항목 | 상태 |
| --- | --- |
| PHP | 해당 없음 |
| n8n | 해당 없음 |

### Cursor·Replit 개발 환경

| 항목 | 상태 | 근거 |
| --- | --- | --- |
| AI 생성 코드도 동일 기준 | 통과 | 이번 점검에서 별도 면제 없음 |
| Replit 공개 범위·협업 | 미점검 | 배포 문서만 확인. 실제 Always-On/공개 URL ACL 미확인 |
| Secrets vs 프론트 번들 | 통과(코드) | 서비스 롤은 `NEXT_PUBLIC_` 아님 |
| 샘플 계정 문서화 | 취약 | SA-03, SA-16 |
| `start` 0.0.0.0 | 추가 확인 필요 | Replit 관례. 방화벽 전제 |

---

## 수정 및 재검증 기록

| 항목 | 내용 |
| --- | --- |
| 이번 점검에서 변경한 파일 | 없음 (보고 파일 `SECURITY_AUDIT_REPORT.md` 추가만) |
| 수정 승인 | 받지 않음. 패치 미실시 |
| 테스트 | 회귀 테스트 없음 |
| 롤백 | 해당 없음 |
| 미해결 위험 | SA-01 ~ SA-18 |
| 최종 승인자 | 미지정 |

패치를 승인하면 별도 브랜치에서 Next/Node/`AUTH_SECRET` 실패 폐쇄·로그인 제한·세션 만료를 우선하는 것을 권고합니다.

---

## 확인 불가·미점검 목록

1. 운영 Replit 실제 Node·Next 실행 버전 (빌드 산출물이 이 lock과 같은지)
2. 운영 `AUTH_SECRET` / TLS 우회 변수 존재 여부 (값은 요청·기록하지 않음)
3. 운영 HTTP 보안 헤더, 인증서, HSTS
4. Supabase 대시보드의 anon 키 노출, 테이블 GRANT, 명부 테이블 RLS
5. 초기 `hradmin` 비밀번호가 운영에서 교체되었는지
6. Replit 배포 URL의 인터넷 공개 범위와 접근통제
7. KISA/KrCERT 당일 공지 전수 대조
8. 백업·복구 훈련, 개인정보 파기, 감사 로그
9. Next.js 이미지 최적화 RCE의 실제 악용 조건 충족 여부
10. 전이 취약점(sharp/libvips 등)의 런타임 도달
11. 스테이징에서의 CSRF·권한 경계 최소 재현

---

## 참고 URL (확인일 2026-10-29)

- 지침 방법론: OWASP WSTG, OWASP ASVS, KrCERT 포털
- Next.js 권고: https://github.com/advisories/GHSA-p293-qw3h-jr36 외 `npm audit`에 나열된 GHSA
- SheetJS: https://github.com/advisories/GHSA-4r6h-8v6p-xvw6 , https://github.com/advisories/GHSA-5pgg-2g8v-p4x9
- Node 24.x 수정 버전: 24.22.1 (CVE-2026-111497)

---

*보고서 끝. 수정 작업이 필요하면 별도 승인을 받은 뒤 진행하십시오.*
