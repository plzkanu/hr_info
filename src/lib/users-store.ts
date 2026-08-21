import bcrypt from "bcryptjs";
import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatSupabaseNetworkError } from "@/lib/supabase/fetch";
import { initialPassword, validateNewPassword } from "./password";
import { sanitizePermissions } from "./permissions";
import type { User, UserRole } from "./types";

const DEFAULT_ADMIN_ID = "hradmin";

interface EmployeeUserRow {
  id: string;
  name: string;
  password_hash: string;
  role: UserRole;
  department: string;
  active: boolean;
  password_must_change?: boolean;
  permissions?: string[] | null;
  created_at: string;
  updated_at: string;
}

function mapUser(row: EmployeeUserRow): User {
  return {
    id: row.id,
    passwordHash: row.password_hash,
    name: row.name,
    department: row.department ?? "",
    role: row.role,
    active: row.active,
    passwordMustChange: row.password_must_change === true,
    permissions: sanitizePermissions(row.permissions),
    createdAt: row.created_at,
  };
}

function requireSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase가 설정되지 않았습니다. 사용자 데이터는 employee_users 테이블에 저장됩니다.",
    );
  }
}

async function seedDefaultAdminIfEmpty(): Promise<void> {
  const supabase = createServerClient();
  const { count, error: countError } = await supabase
    .from("employee_users")
    .select("*", { count: "exact", head: true });

  if (countError) {
    throw new Error(formatSupabaseNetworkError(countError.message));
  }

  if ((count ?? 0) > 0) {
    return;
  }

  const passwordHash = await bcrypt.hash(initialPassword(DEFAULT_ADMIN_ID), 10);
  const { error } = await supabase.from("employee_users").insert({
    id: DEFAULT_ADMIN_ID,
    name: "시스템 관리자",
    password_hash: passwordHash,
    role: "admin",
    department: "경영지원팀",
    active: true,
    password_must_change: true,
    permissions: [],
  });

  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }
}

export async function getAllUsers(): Promise<User[]> {
  requireSupabase();
  await seedDefaultAdminIfEmpty();

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("employee_users")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  return (data ?? []).map((row) => mapUser(row as EmployeeUserRow));
}

export async function findUserById(id: string): Promise<User | null> {
  requireSupabase();

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("employee_users")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  return data ? mapUser(data as EmployeeUserRow) : null;
}

export async function verifyUserCredentials(
  id: string,
  password: string,
): Promise<User | null> {
  requireSupabase();
  await seedDefaultAdminIfEmpty();

  const user = await findUserById(id.trim().toLowerCase());
  if (!user || !user.active) {
    return null;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  return valid ? user : null;
}

export interface CreateUserInput {
  id: string;
  name: string;
  department?: string;
  role: UserRole;
  active?: boolean;
  permissions?: string[];
}

export async function createUser(
  input: CreateUserInput,
): Promise<{ user: User; temporaryPassword: string }> {
  requireSupabase();

  const normalizedId = input.id.trim().toLowerCase();

  if (!normalizedId) {
    throw new Error("아이디를 입력해 주세요.");
  }
  if (normalizedId === "admin") {
    throw new Error("admin 아이디는 사용할 수 없습니다.");
  }

  const existing = await findUserById(normalizedId);
  if (existing) {
    throw new Error("이미 사용 중인 아이디입니다.");
  }

  const temporaryPassword = initialPassword(normalizedId);
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("employee_users")
    .insert({
      id: normalizedId,
      name: input.name.trim() || normalizedId,
      password_hash: passwordHash,
      role: input.role,
      department: input.department?.trim() ?? "",
      active: input.active ?? true,
      password_must_change: true,
      permissions: sanitizePermissions(input.permissions),
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("이미 사용 중인 아이디입니다.");
    }
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  return {
    user: mapUser(data as EmployeeUserRow),
    temporaryPassword,
  };
}

export interface UpdateUserInput {
  name?: string;
  department?: string;
  role?: UserRole;
  active?: boolean;
  permissions?: string[];
}

async function countActiveAdmins(excludeId?: string): Promise<number> {
  const users = await getAllUsers();
  return users.filter(
    (user) =>
      user.role === "admin" &&
      user.active &&
      (excludeId === undefined || user.id !== excludeId),
  ).length;
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
): Promise<User> {
  requireSupabase();

  const existing = await findUserById(id);
  if (!existing) {
    throw new Error("계정을 찾을 수 없습니다.");
  }

  const nextRole = input.role ?? existing.role;
  const nextActive = input.active ?? existing.active;

  if (
    existing.role === "admin" &&
    existing.active &&
    (nextRole !== "admin" || !nextActive)
  ) {
    const remaining = await countActiveAdmins(id);
    if (remaining < 1) {
      throw new Error("활성 관리자가 한 명뿐이라 변경할 수 없습니다.");
    }
  }

  const patch: Record<string, string | boolean | string[]> = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) {
    patch.name = input.name.trim() || existing.id;
  }
  if (input.department !== undefined) {
    patch.department = input.department.trim();
  }
  if (input.role !== undefined) {
    patch.role = input.role;
  }
  if (input.active !== undefined) {
    patch.active = input.active;
  }
  if (input.permissions !== undefined) {
    patch.permissions = sanitizePermissions(input.permissions);
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("employee_users")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  return mapUser(data as EmployeeUserRow);
}

export async function resetUserPassword(
  id: string,
): Promise<{ temporaryPassword: string }> {
  requireSupabase();
  const user = await findUserById(id);
  if (!user) {
    throw new Error("계정을 찾을 수 없습니다.");
  }

  const temporaryPassword = initialPassword(user.id);
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);
  const supabase = createServerClient();
  const { error } = await supabase
    .from("employee_users")
    .update({
      password_hash: passwordHash,
      password_must_change: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  return { temporaryPassword };
}

export async function completeForcedPasswordChange(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<User> {
  requireSupabase();
  const user = await verifyUserCredentials(userId, currentPassword);
  if (!user) {
    throw new Error("현재 비밀번호가 올바르지 않습니다.");
  }
  if (!user.passwordMustChange) {
    throw new Error("비밀번호 변경이 필요하지 않은 계정입니다.");
  }

  const policyError = validateNewPassword(newPassword, user.id);
  if (policyError) throw new Error(policyError);
  if (currentPassword === newPassword) {
    throw new Error("초기화 비밀번호와 다른 비밀번호를 입력해 주세요.");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("employee_users")
    .update({
      password_hash: passwordHash,
      password_must_change: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select("*")
    .single();

  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  return mapUser(data as EmployeeUserRow);
}

export async function changeOwnPassword(
  userId: string,
  newPassword: string,
): Promise<void> {
  requireSupabase();
  const user = await findUserById(userId);
  if (!user || !user.active) {
    throw new Error("계정을 찾을 수 없습니다.");
  }

  const policyError = validateNewPassword(newPassword, user.id);
  if (policyError) throw new Error(policyError);

  const passwordHash = await bcrypt.hash(newPassword, 10);
  const supabase = createServerClient();
  const { error } = await supabase
    .from("employee_users")
    .update({
      password_hash: passwordHash,
      password_must_change: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }
}

export async function deleteUser(id: string): Promise<void> {
  requireSupabase();

  const target = await findUserById(id);
  if (!target) {
    throw new Error("계정을 찾을 수 없습니다.");
  }

  if (target.role === "admin" && target.active) {
    const adminCount = await countActiveAdmins(id);
    if (adminCount < 1) {
      throw new Error("활성 관리자가 한 명뿐이라 삭제할 수 없습니다.");
    }
  }

  const supabase = createServerClient();
  const { error } = await supabase.from("employee_users").delete().eq("id", id);

  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }
}
