export type PortalKey = "marketing" | "super_admin" | "tenant" | "staff" | "client";

export const portals = {
  marketing: {
    key: "marketing" as const,
    label: "Marketing",
    basePath: "/",
  },
  super_admin: {
    key: "super_admin" as const,
    label: "Super Admin",
    basePath: "/admin",
  },
  tenant: {
    key: "tenant" as const,
    label: "Business Dashboard",
    basePath: "/:tenantSlug/dashboard",
  },
  staff: {
    key: "staff" as const,
    label: "Staff Portal",
    basePath: "/:tenantSlug/staff",
  },
  client: {
    key: "client" as const,
    label: "Client Booking",
    basePath: "/:tenantSlug/book",
  },
} as const;

export function tenantPath(slug: string, portal: Exclude<PortalKey, "marketing" | "super_admin">) {
  const map = {
    tenant: `/${slug}/dashboard`,
    staff: `/${slug}/staff`,
    client: `/${slug}/book`,
  } as const;
  return map[portal];
}
