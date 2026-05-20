import type { User } from "@/lib/api/types";

const DEFAULT_CLIENT_TENANT = "luxe-bloom";

const SALON_USER_TYPES = new Set(["tenant_owner", "manager", "staff"]);

const PLATFORM_USER_TYPES = new Set(["super_admin", "office_admin"]);

/** Routes only platform staff may use (General Office). */
function isPlatformOnlyPath(path: string): boolean {
  return path === "/admin" || path.startsWith("/admin/");
}

export function canAccessPlatformAdmin(user: User): boolean {
  return PLATFORM_USER_TYPES.has(user.user_type);
}

export function salonWorkspacePath(user: User): string {
  if (user.account_intent === "salon_owner") {
    if (user.onboarding_status === "payment_pending") {
      const plan = user.selected_plan ? `?plan=${user.selected_plan}` : "";
      return `/checkout${plan}`;
    }
    if (user.onboarding_status === "paid") {
      return "/onboarding";
    }
    if (user.onboarding_status === "onboarded") {
      const slug = user.owned_tenant_slug;
      return slug ? `/${slug}/dashboard` : "/onboarding";
    }
  }

  if (SALON_USER_TYPES.has(user.user_type)) {
    const slug = user.owned_tenant_slug;
    if (slug) {
      return `/${slug}/dashboard`;
    }
    if (user.onboarding_status === "payment_pending") {
      const plan = user.selected_plan ? `?plan=${user.selected_plan}` : "";
      return `/checkout${plan}`;
    }
    if (user.onboarding_status === "paid") {
      return "/onboarding";
    }
  }

  if (user.user_type === "client") {
    return `/${DEFAULT_CLIENT_TENANT}/account/profile`;
  }

  return `/${DEFAULT_CLIENT_TENANT}/dashboard`;
}

export function redirectPathAfterAuth(user: User, next?: string | null): string {
  if (next && next.startsWith("/")) {
    if (isPlatformOnlyPath(next) && !canAccessPlatformAdmin(user)) {
      return salonWorkspacePath(user);
    }
    return next;
  }

  if (canAccessPlatformAdmin(user)) {
    return "/admin";
  }

  return salonWorkspacePath(user);
}
