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
    settings: "staff.settings",
  },
  clients: {
    view: "clients.view",
    create: "clients.create",
    update: "clients.update",
    delete: "clients.delete",
    export: "clients.export",
  },
  forms: {
    view: "forms.view",
    create: "forms.create",
    update: "forms.update",
    delete: "forms.delete",
    export: "forms.export",
  },
  memberships: {
    view: "memberships.view",
    create: "memberships.create",
    update: "memberships.update",
    delete: "memberships.delete",
    export: "memberships.export",
  },
  packages: {
    view: "packages.view",
    create: "packages.create",
    update: "packages.update",
    delete: "packages.delete",
    export: "packages.export",
  },
  gift_cards: {
    view: "gift_cards.view",
    create: "gift_cards.create",
    update: "gift_cards.update",
    delete: "gift_cards.delete",
    export: "gift_cards.export",
  },
  reviews: {
    view: "reviews.view",
    create: "reviews.create",
    update: "reviews.update",
    delete: "reviews.delete",
    export: "reviews.export",
  },
  reports: {
    view: "reports.view",
    create: "reports.create",
    update: "reports.update",
    delete: "reports.delete",
    export: "reports.export",
  },
  analytics: {
    view: "analytics.view",
    export: "analytics.export",
  },
  finance: {
    view: "finance.view",
    export: "finance.export",
    refund: "finance.refund",
    adjust: "finance.adjust_transaction",
    applyDiscount: "finance.apply_discount",
    approveDiscount: "finance.approve_discount",
    viewTips: "finance.view_tips",
    viewPayroll: "finance.payroll.view",
    viewPayrollSelf: "finance.payroll.view_self",
    reconciliationManage: "finance.reconciliation.manage",
    taxesManage: "finance.taxes.manage",
  },
  marketing: {
    view: "marketing.view",
    manage: "marketing.update",
  },
  marketplace: {
    view: "marketplace.view",
    manage: "marketplace.update",
    featured: "marketplace.view",
    commissions: "marketplace.view",
  },
  approvals: {
    view: "approvals.view",
    create: "approvals.create",
    manage: "approvals.update",
  },
  billing: {
    manage: "billing.manage",
  },
  settings: {
    manage: "settings.manage",
  },
  inventory: {
    view: "inventory.view",
    create: "inventory.create",
    update: "inventory.update",
    delete: "inventory.delete",
    export: "inventory.export",
  },
  pos: {
    view: "pos.view",
    create: "pos.create",
  },
  payment_requests: {
    view: "payment_requests.view",
    create: "payment_requests.create",
    cancel: "payment_requests.cancel",
    retry: "payment_requests.retry",
    verify: "payment_requests.verify",
  },
  wallet: {
    view: "wallet.view",
    export: "wallet.export",
    adjust: "wallet.adjust",
  },
  office: {
    dashboard: "office.dashboard.view",
    tenants: "office.tenants.view",
    operations: "office.operations.view",
    finance: "office.finance.view",
    support: "office.support.view",
    settings: "office.settings.manage",
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
