/**
 * Tenant context (name, branding) — workplace slug or custom domain.
 */
export function tenantApiBase(slug?: string | null): string {
  return slug ? `/${slug}` : "/booking";
}

/**
 * Public client booking catalog (services, staff, availability).
 * Slug routes use /{slug}/book/* to avoid clashing with admin /{slug}/services.
 */
export function bookingApiBase(slug?: string | null): string {
  return slug ? `/${slug}/book` : "/booking";
}
