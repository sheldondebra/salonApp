import { env } from "@/config/env";

export type TenantResolution = {
  portal: "marketing" | "super_admin" | "workplace" | "custom_domain";
  tenantSlug?: string;
  host: string;
};

export function resolveTenantFromHost(host: string, pathname: string): TenantResolution {
  const normalizedHost = host.toLowerCase().split(":")[0];
  const workplaceBase = env.workplaceHost.toLowerCase().split(":")[0];

  if (normalizedHost === "localhost" || normalizedHost === env.rootDomain) {
    if (pathname.startsWith("/admin")) {
      return { portal: "super_admin", host: normalizedHost };
    }
    return { portal: "marketing", host: normalizedHost };
  }

  if (
    normalizedHost === workplaceBase ||
    normalizedHost.endsWith(`.${workplaceBase}`)
  ) {
    const segments = pathname.split("/").filter(Boolean);
    return {
      portal: "workplace",
      tenantSlug: segments[0],
      host: normalizedHost,
    };
  }

  return { portal: "custom_domain", host: normalizedHost };
}
