import type { MeResponse } from "@/auth/types";

export function isSuperAdmin(me: MeResponse | null | undefined): boolean {
  if (!me) return false;
  return (
    me.platform_roles?.includes("super_admin") ||
    me.user.user_type === "super_admin"
  );
}

export function hasPlatformPermission(
  me: MeResponse | null | undefined,
  permission: string
): boolean {
  if (!me) return false;
  if (isSuperAdmin(me)) return true;
  return me.platform_permissions?.includes(permission) ?? false;
}

export function hasAnyPlatformPermission(
  me: MeResponse | null | undefined,
  permissions: string[]
): boolean {
  return permissions.some((p) => hasPlatformPermission(me, p));
}

export function canViewOfficeDashboard(me: MeResponse | null | undefined): boolean {
  return hasAnyPlatformPermission(me, ["office.dashboard.view", "tenants.view"]);
}

export function canViewTenants(me: MeResponse | null | undefined): boolean {
  return hasAnyPlatformPermission(me, ["office.tenants.view", "tenants.view"]);
}

export function canManageBilling(me: MeResponse | null | undefined): boolean {
  return hasAnyPlatformPermission(me, ["office.finance.view", "billing.manage"]);
}

export function canViewOfficeSupport(me: MeResponse | null | undefined): boolean {
  return hasAnyPlatformPermission(me, ["office.support.view", "tenants.view"]);
}
