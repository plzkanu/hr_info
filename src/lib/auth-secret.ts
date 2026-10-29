const MIN_LENGTH = 16;

const FORBIDDEN = new Set([
  "dev-secret-change-in-production",
  "your-random-secret-key-here",
]);

export const AUTH_SECRET_REQUIRED =
  "AUTH_SECRET 환경 변수가 필요합니다. .env.local 또는 배포 Secrets에 16자 이상의 임의 문자열을 넣으세요.";

export const AUTH_SECRET_WEAK =
  "AUTH_SECRET이 예시 값이거나 너무 짧습니다. 16자 이상의 임의 문자열로 바꾸세요.";

export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim() ?? "";
  if (!secret) {
    throw new Error(AUTH_SECRET_REQUIRED);
  }
  if (secret.length < MIN_LENGTH || FORBIDDEN.has(secret)) {
    throw new Error(AUTH_SECRET_WEAK);
  }
  return secret;
}

export function assertAuthSecret() {
  getAuthSecret();
}
