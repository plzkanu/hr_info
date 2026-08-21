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

1. Replit 프로젝트가 GitHub `plzkanu/hr_info`의 `main`을 보도록 연결합니다.
2. 왼쪽 **Secrets**에 위 환경 변수를 넣습니다. (Shell에서 키를 붙여 넣지 않습니다.)
3. 아래 명령을 **Replit Shell**에서 실행합니다.

### 처음 한 번 (또는 코드가 없을 때)

프로젝트 폴더에서 GitHub를 연결하고 `main`을 받습니다.

```bash
git remote -v
git remote add origin https://github.com/plzkanu/hr_info.git
git fetch origin
git checkout -B main origin/main
```

이미 `origin`이 있으면 `git remote add`는 건너뜁니다.

```bash
git remote set-url origin https://github.com/plzkanu/hr_info.git
git fetch origin
git checkout main
git pull origin main
```

### 매번 배포할 때 (Replit Shell)

Secrets를 저장한 뒤, Shell에서 아래를 **위에서 아래로** 실행합니다.

```bash
cd ~/hr_info || cd .

git status
git fetch origin
git checkout main
git pull origin main

npm install
npm run build
```

빌드가 끝나면 운영 서버를 켭니다. Replit이 열어 주는 포트에 맞춥니다.

```bash
npm run start -- -H 0.0.0.0 -p ${PORT:-3000}
```

이 명령은 서버가 떠 있는 동안 Shell을 점유합니다. 중지하려면 해당 Shell에서 `Ctrl + C`를 누릅니다.

환경 변수가 들어갔는지만 확인할 때는 값을 출력하지 말고 아래를 씁니다.

```bash
test -n "$AUTH_SECRET" && echo "AUTH_SECRET=ok" || echo "AUTH_SECRET=missing"
test -n "$NEXT_PUBLIC_SUPABASE_URL" && echo "NEXT_PUBLIC_SUPABASE_URL=ok" || echo "NEXT_PUBLIC_SUPABASE_URL=missing"
test -n "$SUPABASE_SERVICE_ROLE_KEY" && echo "SUPABASE_SERVICE_ROLE_KEY=ok" || echo "SUPABASE_SERVICE_ROLE_KEY=missing"
```

### 코드만 다시 받아 재배포

로컬에서 `git push origin main` 한 뒤, Replit Shell에서:

```bash
git fetch origin
git checkout main
git pull origin main
npm install
npm run build
npm run start -- -H 0.0.0.0 -p ${PORT:-3000}
```

이전에 `npm run start`가 켜져 있으면 먼저 그 Shell에서 `Ctrl + C`로 끄고 다시 실행합니다. 포트가 남아 있으면:

```bash
fuser -k ${PORT:-3000}/tcp || true
```

개발 확인만 할 때는 `npm run dev -- -H 0.0.0.0 -p ${PORT:-3000}` 을 써도 됩니다. 운영은 `build` 후 `start`를 권장합니다.

### `/api` 경로 주의

Replit에서 다른 앱이 `/api`를 가로채면 로그인이 404가 납니다. 이 앱의 API는 모두 **`/hr-api`** 아래에 있습니다.

예: 로그인은 `POST /hr-api/auth/login`

Replit 프록시에서 `/hr-api`가 다른 API 서버가 아니라 **이 Next.js 앱**으로 가게 해야 합니다. `/api`는 기존 앱이 써도 됩니다.

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
git fetch origin
git checkout main
git pull origin main
npm install
npm run build
npm run start -- -H 0.0.0.0 -p ${PORT:-3000}
```

스키마를 바꿨으면 Supabase에서 `apply-all-migrations.sql`도 다시 실행합니다.
