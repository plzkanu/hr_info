export interface NavItem {
  href: string;
  label: string;
  adminOnly?: boolean;
}

export const mainNavItems: NavItem[] = [
  { href: "/dashboard", label: "사원명부조회" },
  { href: "/dashboard/admin", label: "관리자메뉴", adminOnly: true },
];

export const adminSubNavItems: NavItem[] = [
  { href: "/dashboard/admin/users", label: "사용자관리" },
  { href: "/dashboard/admin/session-settings", label: "세션 설정" },
];
