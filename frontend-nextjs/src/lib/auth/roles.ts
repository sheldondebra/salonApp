/** Role slugs — mirror backend App\Enums\RoleName */
export const Roles = {
  superAdmin: "super_admin",
  officeAdmin: "office_admin",
  tenantOwner: "tenant_owner",
  manager: "manager",
  staff: "staff",
  client: "client",
} as const;

export type RoleSlug = (typeof Roles)[keyof typeof Roles];

export const RoleLabels: Record<RoleSlug, string> = {
  super_admin: "Super Admin",
  office_admin: "Office Admin",
  tenant_owner: "Tenant Owner",
  manager: "Manager",
  staff: "Staff",
  client: "Client",
};
