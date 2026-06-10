import type { Appointment } from "@/booking/types";

export type PlatformChartPoint = {
  month: string;
  count?: number;
  revenue_cents?: number;
  amount_cents?: number;
};

export type CommandCenterCards = {
  active_tenants: number;
  trial_tenants: number;
  mrr_cents: number;
  revenue_collected_cents: number;
  failed_payments: number;
  open_support_tickets: number;
  sms_balance: number;
  provider_incidents: number;
  mnotify_status?: string;
  mnotify_last_synced_at?: string | null;
};

export type PlatformAlert = {
  type: string;
  title: string;
  count: number;
  severity: string;
};

export type AdminDashboardStats = {
  tenants: number;
  paid_subscriptions: number;
  unpaid_signups: number;
  paid_awaiting_setup: number;
  onboarded_owners: number;
  revenue_cents: number;
  sms_sent: number;
  sms_failed: number;
  mnotify_balance: number;
  mnotify_status: string;
  mnotify_last_synced_at: string | null;
  mrr_cents?: number;
  trial_tenants?: number;
  failed_payments?: number;
  open_support_tickets?: number;
  provider_incidents?: number;
};

export type AdminDashboard = {
  cards?: CommandCenterCards;
  stats: AdminDashboardStats;
  alerts?: PlatformAlert[];
  recent_tenants: {
    name: string;
    slug: string;
    plan: string | null;
    status: string | null;
    created_at: string | null;
  }[];
  charts?: {
    mrr_trend?: PlatformChartPoint[];
    tenant_growth?: PlatformChartPoint[];
    payment_volume?: PlatformChartPoint[];
    support_ticket_trend?: PlatformChartPoint[];
    signups?: PlatformChartPoint[];
    revenue?: PlatformChartPoint[];
  };
};

export type AdminAppointment = Appointment & {
  tenant?: { id: number; name: string; slug: string };
};

export type AdminAppointmentsMeta = {
  current_page: number;
  last_page: number;
  total: number;
  filter: string;
  summary: {
    today: number;
    upcoming: number;
    all: number;
  };
};

export type AdminTenant = {
  id: number;
  name: string;
  slug: string;
  plan?: string | null;
  status?: string | null;
  users_count?: number;
  owner?: { name: string; email: string; onboarding_status?: string } | null;
};

export type PaginatedMeta = {
  current_page: number;
  last_page: number;
  total: number;
};
