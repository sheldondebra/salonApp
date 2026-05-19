/**
 * Tenant-scoped API path prefix.
 * - Workplace / slug routes: /api/v1/{slug}/...
 * - Custom CNAME domain: /api/v1/booking/... (tenant resolved from Host header)
 */
export function tenantApiBase(slug?: string | null): string {
  return slug ? `/${slug}` : "/booking";
}
