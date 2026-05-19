import type { User } from "@/lib/api/types";

const DEFAULT_CLIENT_TENANT = "luxe-bloom";

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
      return "/admin";
    }
  }

  if (user.user_type === "client") {
    return `/${DEFAULT_CLIENT_TENANT}/account/profile`;
  }

  return `/${DEFAULT_CLIENT_TENANT}/dashboard`;
}
