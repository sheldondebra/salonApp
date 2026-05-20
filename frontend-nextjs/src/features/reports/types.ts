export type ReportFilterOption = { id: number; name: string };

export type ReportFilterOptions = {
  locations: ReportFilterOption[];
  staff: ReportFilterOption[];
  services: ReportFilterOption[];
  statuses: string[];
};

export type ReportFiltersState = {
  from: string;
  to: string;
  location_id: string;
  staff_id: string;
  service_id: string;
  status: string;
};

export type TenantReportPayload = {
  filters: ReportFiltersState;
  summary: {
    revenue_cents: number;
    bookings: number;
    customers: number;
    new_customers: number;
    sms_sent: number;
    sms_failed: number;
  };
  revenue: { date: string; label: string; revenue_cents: number }[];
  bookings: { date: string; label: string; count: number }[];
  customers: { date: string; label: string; count: number }[];
  staff_performance: { staff_id: number | null; name: string; bookings: number; revenue_cents: number }[];
  popular_services: { service_id: number; name: string; bookings: number; revenue_cents: number }[];
  payment_status: { status: string; count: number }[];
  sms_usage: { date: string; label: string; sent: number; failed: number }[];
  filter_options: ReportFilterOptions;
};

export type AdminReportPayload = {
  filters: ReportFiltersState;
  summary: {
    tenants: number;
    new_tenants: number;
    mrr_cents: number;
    subscription_revenue_cents: number;
    sms_sent: number;
    sms_failed: number;
    platform_bookings: number;
  };
  tenant_growth: { month: string; label: string; count: number }[];
  subscription_mrr: { month: string; label: string; mrr_cents: number }[];
  subscription_revenue: { date: string; label: string; revenue_cents: number }[];
  sms_usage: { date: string; label: string; sent: number; failed: number }[];
  bookings_by_tenant: { tenant_id: number; name: string; slug: string; bookings: number }[];
};
