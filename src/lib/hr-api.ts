/** Replit 등에서 다른 앱이 `/api`를 선점할 때 HR 전용 경로 */
export const HR_API_BASE = "/hr-api";

export function hrApi(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${HR_API_BASE}${normalized}`;
}
