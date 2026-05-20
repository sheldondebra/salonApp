import type { User } from "@/lib/api/types";

const DEFAULT_CLIENT_TENANT = "luxe-bloom";

const SALON_USER_TYPES = new Set(["tenant_owner", "manager", "staff"]);

export function redirectPathAfterAuth(user: User, next?: string | null): string {
  if (next && next.startsWith("/")) {
    return next;
  }

  if (user.user_type === "super_admin" || user.user_type === "office_admin") {
    return "/admin";
  }

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
