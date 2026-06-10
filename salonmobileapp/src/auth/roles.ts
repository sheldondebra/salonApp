import type { ApiUser, MeResponse, MobilePortal } from "@/auth/types";

const PLATFORM_ADMIN_ROLES = new Set(["super_admin", "office_admin"]);
const WORKPLACE_TYPES = new Set(["tenant_owner", "manager"]);
const STAFF_TYPES = new Set(["staff"]);

export function resolveMobilePortal(user: ApiUser, me?: MeResponse): MobilePortal {
  const platformRoles = me?.platform_roles ?? user.roles ?? [];
  if (platformRoles.some((r) => PLATFORM_ADMIN_ROLES.has(r))) {
    return "admin";
  }

  const userType = user.user_type ?? "";
  if (PLATFORM_ADMIN_ROLES.has(userType)) {
    return "admin";
  }
  if (WORKPLACE_TYPES.has(userType)) {
    return "workplace";
  }
  if (STAFF_TYPES.has(userType)) {
    return "staff";
  }
  return "client";
}

export function resolveTenantSlug(user: ApiUser, me?: MeResponse, storedSlug?: string | null): string | null {
  if (storedSlug) return storedSlug;
  if (user.owned_tenant_slug) return user.owned_tenant_slug;
  const ownerTenant = me?.tenants?.find((t) => t.is_owner);
  if (ownerTenant?.slug) return ownerTenant.slug;
  if (me?.tenants?.[0]?.slug) return me.tenants[0].slug;
  return null;
}

export function isGeneralOfficeUser(user: ApiUser, me?: MeResponse): boolean {
  const platformRoles = me?.platform_roles ?? user.roles ?? [];
  if (platformRoles.includes("office_admin")) return true;
  return user.user_type === "office_admin";
}

export function portalLabel(portal: MobilePortal, user?: ApiUser, me?: MeResponse): string {
  switch (portal) {
    case "admin":
      return user && isGeneralOfficeUser(user, me) ? "General Office" : "Platform admin";
    case "workplace":
      return "Salon Owner";
    case "staff":
      return "Staff";
    case "client":
      return "Client";
    default:
      return "Client";
  }
}
