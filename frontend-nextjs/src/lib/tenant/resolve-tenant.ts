import { env } from "@/config/env";

export type TenantResolution = {
  portal: "marketing" | "super_admin" | "workplace" | "custom_domain";
  tenantSlug?: string;
  host: string;
};

function appUrlHost(): string | null {
  try {
    return new URL(env.appUrl).host.toLowerCase().split(":")[0];
  } catch {
    return null;
  }
}

function isPlatformHost(normalizedHost: string): boolean {
  const rootDomain = env.rootDomain.toLowerCase();

  if (
    normalizedHost === "localhost" ||
    normalizedHost === "127.0.0.1" ||
    normalizedHost === rootDomain ||
    normalizedHost === `www.${rootDomain}`
  ) {
    return true;
  }

  // Vercel preview and production deployment URLs (e.g. salon-app-jk2t.vercel.app).
  if (normalizedHost.endsWith(".vercel.app")) {
    return true;
  }

  const configuredAppHost = appUrlHost();
  if (
    configuredAppHost &&
    (normalizedHost === configuredAppHost || normalizedHost === `www.${configuredAppHost}`)
  ) {
    return true;
  }

  return false;
}

const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "login",
  "register",
  "book",
  "staff",
  "dashboard",
  "reports",
  "appointments",
  "services",
  "clients",
  "settings",
  "reports",
  "coupons",
  "payments",
  "onboarding",
]);

export function resolveTenantFromHost(host: string, pathname: string): TenantResolution {
  const normalizedHost = host.toLowerCase().split(":")[0];
  const workplaceBase = env.workplaceHost.toLowerCase().split(":")[0];

  if (isPlatformHost(normalizedHost)) {
    if (pathname.startsWith("/admin")) {
      return { portal: "super_admin", host: normalizedHost };
    }
    return { portal: "marketing", host: normalizedHost };
  }

  if (normalizedHost === workplaceBase || normalizedHost.endsWith(`.${workplaceBase}`)) {
    const segments = pathname.split("/").filter(Boolean);
    const slug = segments[0] && !RESERVED_SLUGS.has(segments[0]) ? segments[0] : undefined;

    return {
      portal: "workplace",
      tenantSlug: slug,
      host: normalizedHost,
    };
  }

  return { portal: "custom_domain", host: normalizedHost };
}
