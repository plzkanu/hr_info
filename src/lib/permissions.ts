export const FEATURE_PERMISSIONS = [
  {
    id: "view_full_resident_id",
    label: "주민번호 전체보기",
    description: "사원명부와 엑셀에서 주민등록번호 전체를 볼 수 있습니다.",
  },
] as const;

export type FeaturePermissionId = (typeof FEATURE_PERMISSIONS)[number]["id"];

const ALLOWED = new Set<string>(FEATURE_PERMISSIONS.map((item) => item.id));

export function sanitizePermissions(values: unknown): FeaturePermissionId[] {
  if (!Array.isArray(values)) {
    return [];
  }

  const unique: FeaturePermissionId[] = [];
  for (const value of values) {
    if (
      typeof value === "string" &&
      ALLOWED.has(value) &&
      !unique.includes(value as FeaturePermissionId)
    ) {
      unique.push(value as FeaturePermissionId);
    }
  }
  return unique;
}

export function hasPermission(
  permissions: readonly string[] | undefined,
  id: FeaturePermissionId,
): boolean {
  return (permissions ?? []).includes(id);
}

export function permissionLabel(id: string): string {
  return FEATURE_PERMISSIONS.find((item) => item.id === id)?.label ?? id;
}
