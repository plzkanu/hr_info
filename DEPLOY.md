# 배포 안내

사원명부 조회 시스템은 GitHub에 올린 뒤 Replit에서 운영 배포합니다.

- 저장소: [https://github.com/plzkanu/hr_info](https://github.com/plzkanu/hr_info)
- 원격: `https://github.com/plzkanu/hr_info.git`
- 브랜치: `main`

`.env.local`과 비밀키는 Git에 올리지 않습니다.

## 1. 배포 전 준비

### 환경 변수

운영 환경(Replit Secrets 등)에 아래 값을 넣습니다. 로컬은 `.env.example`을 복사해 `.env.local`을 만듭니다.

| 변수 | 필수 | 설명 |
|------|------|------|
| `AUTH_SECRET` | 필수 | 세션 쿠키 서명 키. 운영에서는 반드시 임의 문자열로 바꿉니다. |
| `NEXT_PUBLIC_SUPABASE_URL` | 필수 | Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | 필수 | Supabase Service Role 키 (anon 키가 아님) |
| `SUPABASE_SSL_VERIFY` | 선택 | 회사 VPN/방화벽 TLS 오류일 때만 `0` |

Replit처럼 공개 HTTPS로 띄울 때는 보통 `SUPABASE_SSL_VERIFY`를 넣지 않습니다.

### 데이터베이스

Supabase SQL Editor에서 `supabase/apply-all-migrations.sql`을 한 번 실행합니다.

이미 운영 DB에 테이블이 있으면 다시 실행해도 `CREATE TABLE IF NOT EXISTS` / `ON CONFLICT DO NOTHING`이라 기존 데이터는 유지됩니다. 스키마를 바꾼 뒤에만 다시 실행하면 됩니다.

사원·발령·가족 등 인사 데이터는 ERP에서 동기화된 기존 테이블을 사용합니다. 앱이 이 데이터를 새로 만들지 않습니다.

초기 관리자: `hradmin` / `hradmin!!` (첫 로그인 시 비밀번호 변경 필수)

## 2. GitHub에 올리기

로컬에서 수정한 코드를 `main`에 푸시하면 Replit이 받을 수 있습니다.

```bash
git add -A
git status
git commit -m "변경 내용을 한 줄로"
git push origin main
```

처음 연결할 때만:

```bash
git remote add origin https://github.com/plzkanu/hr_info.git
git push -u origin main
```

올리면 안 되는 것:

- `.env.local`, `.env`
- `node_modules`, `.next`
- Supabase 키, `AUTH_SECRET`

## 3. Replit 배포

1. 왼쪽 **Secrets**에 위 환경 변수를 넣습니다. (Shell에서 키를 붙여 넣지 않습니다.)
2. 아래 명령을 **Replit Shell**에서 실행합니다.

### `origin`이 없다는 에러가 날 때

`fatal: 'origin' does not appear to be a git repository` 는 GitHub 연결이 없다는 뜻입니다. 아래를 **한 번** 실행합니다.

```bash
git remote -v
git remote add origin https://github.com/plzkanu/hr_info.git
```

이미 `origin`이 있는데 주소가 다르면 `add` 대신:

```bash
git remote set-url origin https://github.com/plzkanu/hr_info.git
```

git 저장소 자체가 아니면:

```bash
git init
git remote add origin https://github.com/plzkanu/hr_info.git
```

연결한 뒤 코드 받기 + 빌드:

```bash
git fetch origin main && git reset --hard origin/main && npm install && npm run build
```

빌드가 끝나면:

```bash
npm run start:prod
```

### 매번 배포할 때 (origin이 이미 있을 때)

```bash
git fetch origin main && git reset --hard origin/main && npm install && npm run build
npm run start:prod
```

`reset --hard`는 Replit에만 있는 로컬 수정이 지워집니다. GitHub `main`과 똑같이 맞출 때 씁니다.

이 `start` 명령은 서버가 떠 있는 동안 Shell을 점유합니다. 중지하려면 `Ctrl + C`입니다. 이전에 서버가 켜져 있으면 먼저 끄고 다시 실행합니다. 포트가 남아 있으면:

```bash
fuser -k ${PORT:-3000}/tcp || true
```

환경 변수가 들어갔는지만 확인할 때는 값을 출력하지 말고 아래를 씁니다.

```bash
test -n "$AUTH_SECRET" && echo "AUTH_SECRET=ok" || echo "AUTH_SECRET=missing"
test -n "$NEXT_PUBLIC_SUPABASE_URL" && echo "NEXT_PUBLIC_SUPABASE_URL=ok" || echo "NEXT_PUBLIC_SUPABASE_URL=missing"
test -n "$SUPABASE_SERVICE_ROLE_KEY" && echo "SUPABASE_SERVICE_ROLE_KEY=ok" || echo "SUPABASE_SERVICE_ROLE_KEY=missing"
```

개발 확인만 할 때는 `npm run dev -- -H 0.0.0.0 -p ${PORT:-3000}` 을 써도 됩니다. Replit 퍼블리시는 `build` 후 `start:prod`를 권장합니다.

### `/api` 경로 주의

Replit에서 다른 앱이 `/api`를 가로채면 로그인이 404가 납니다. 이 앱의 API는 모두 **`/hr-api`** 아래에 있습니다.

예: 로그인은 `POST /hr-api/auth/login`

Replit 프록시에서 `/hr-api`가 다른 API 서버가 아니라 **이 Next.js 앱**으로 가게 해야 합니다. `/api`는 기존 앱이 써도 됩니다.

### 퍼블리시 헬스체크

Replit Publish가 `healthcheck /internal-api` 또는 `healthcheck /` 에서 500·connection refused를 내면, 예전 `api-server`(포트 1104)를 보고 있는 겁니다. 이 앱은 Next.js이며 `artifacts/api-server`가 아닙니다.

1. GitHub 최신 `main`을 받은 뒤 `npm run build`까지 다시 합니다.
2. 실행은 **반드시** Next.js 운영 스크립트입니다. 예전 `api-server`가 아닙니다.

```bash
npm run start:prod
```

이 스크립트는 Next.js를 `$PORT`에 띄우고, Replit 헬스체크용으로 `127.0.0.1:1104`에서 `/internal-api`에 200을 줍니다.

3. Replit **Publish / Deployment** 설정에서
   - Run command: `npm run start:prod`
   - Health check path: `/internal-api`
   - 포트 충돌이 나면 예전 api-server 프로세스를 먼저 종료합니다.
4. Replit Secrets의 `SUPABASE_SSL_VERIFY`는 **빼는 것**을 권장합니다. 공개 Replit에서는 필요 없고, 로그에 `NODE_TLS_REJECT_UNAUTHORIZED` 경고가 납니다.

헬스체크가 통과하는 주소:

- `GET /` → 로그인 화면 (200)
- `GET /internal-api` → `{ "ok": true }`
- `GET /hr-api/health` → `{ "ok": true }`

## 4. 배포 후 확인

- `/login`에서 로그인된다.
- 브라우저 네트워크에 `/hr-api/auth/login`이 200으로 보인다. (`/api/auth/login`이 아님)
- 사원명부 조회가 된다.
- 관리자 화면에서 사용자·세션 설정을 열 수 있다.

로그인이 안 되면 아래를 순서대로 봅니다.

1. Replit이 최신 `main`을 받았는지
2. Secrets에 URL / Service Role / `AUTH_SECRET`이 있는지
3. `/hr-api/auth/login`이 Next.js로 가는지 (다른 앱 `/api`와 섞이지 않았는지)
4. Supabase에 `employee_users`가 있는지

## 5. 이후 배포

로컬에서:

```bash
git add -A
git commit -m "변경 내용을 한 줄로"
git push origin main
```

Replit Shell에서:

```bash
git remote add origin https://github.com/plzkanu/hr_info.git
git fetch origin main && git reset --hard origin/main && npm install && npm run build
npm run start:prod
```

`origin`이 이미 있으면 `git remote add` 줄은 건너뛰거나, 주소만 고칠 때 `git remote set-url origin https://github.com/plzkanu/hr_info.git` 을 씁니다.

스키마를 바꿨으면 Supabase에서 `apply-all-migrations.sql`도 다시 실행합니다.
