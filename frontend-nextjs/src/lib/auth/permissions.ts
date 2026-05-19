/** Permission names mirror backend config/permissions.php */

export const Permissions = {
  tenants: {
    view: "tenants.view",
    create: "tenants.create",
    update: "tenants.update",
    delete: "tenants.delete",
    export: "tenants.export",
  },
  bookings: {
    view: "bookings.view",
    create: "bookings.create",
    update: "bookings.update",
    delete: "bookings.delete",
    export: "bookings.export",
  },
  services: {
    view: "services.view",
    create: "services.create",
    update: "services.update",
    delete: "services.delete",
    export: "services.export",
  },
  staff: {
    view: "staff.view",
    create: "staff.create",
    update: "staff.update",
    delete: "staff.delete",
    export: "staff.export",
  },
  clients: {
    view: "clients.view",
    create: "clients.create",
    update: "clients.update",
    delete: "clients.delete",
    export: "clients.export",
  },
  analytics: {
    view: "analytics.view",
    export: "analytics.export",
  },
  billing: {
    manage: "billing.manage",
  },
  settings: {
    manage: "settings.manage",
  },
} as const;

export type PermissionName = string;

export function hasPermission(
  permissions: string[] | undefined,
  required: string | string[]
): boolean {
  if (!permissions?.length) return false;
  const needed = Array.isArray(required) ? required : [required];
  return needed.some((p) => permissions.includes(p));
}

export function hasAllPermissions(
  permissions: string[] | undefined,
  required: string[]
): boolean {
  if (!permissions?.length) return false;
  return required.every((p) => permissions.includes(p));
}
