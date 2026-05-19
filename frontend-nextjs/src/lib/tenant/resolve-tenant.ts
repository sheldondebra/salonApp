import { env } from "@/config/env";

export type TenantResolution = {
  portal: "marketing" | "super_admin" | "workplace" | "custom_domain";
  tenantSlug?: string;
  host: string;
};

const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "login",
  "register",
  "book",
  "staff",
  "dashboard",
  "appointments",
  "services",
  "clients",
  "settings",
]);

export function resolveTenantFromHost(host: string, pathname: string): TenantResolution {
  const normalizedHost = host.toLowerCase().split(":")[0];
  const workplaceBase = env.workplaceHost.toLowerCase().split(":")[0];
  const rootDomain = env.rootDomain.toLowerCase();

  if (
    normalizedHost === "localhost" ||
    normalizedHost === "127.0.0.1" ||
    normalizedHost === rootDomain ||
    normalizedHost === `www.${rootDomain}`
  ) {
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
