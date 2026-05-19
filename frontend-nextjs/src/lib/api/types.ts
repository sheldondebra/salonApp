export type TenantBranding = {
  logo_url: string | null;
  banner_url: string | null;
  primary_color: string;
  accent_color: string;
  tagline: string | null;
  business_phone: string | null;
  business_email: string | null;
  address: string | null;
};

export type Tenant = {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  timezone: string;
  currency: string;
  branding: TenantBranding;
};

export type User = {
  id: number;
  uuid: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  user_type: string;
  account_intent?: string;
  onboarding_status?: string;
  selected_plan?: string | null;
};

export type BillingPlan = {
  id: string;
  name: string;
  price_cents: number;
  interval: string;
  contact_sales?: boolean;
};

export type PlatformSubscription = {
  id: number;
  uuid: string;
  plan_id: string;
  status: string;
  final_amount_cents: number;
  currency: string;
  provider_reference: string | null;
  paid_at: string | null;
};

export type Service = {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_cents: number;
  price_formatted: string;
  category?: { id: number; name: string };
};

export type StaffMember = {
  id: number;
  uuid: string;
  display_name: string;
  title: string | null;
};

export type Appointment = {
  id: number;
  uuid: string;
  starts_at: string;
  ends_at: string;
  status: string;
  notes: string | null;
  service?: Service;
  staff_member?: { id: number; display_name: string; title: string | null };
  client?: User;
};

export type DashboardStats = {
  appointments_today: number;
  revenue_month_cents: number;
  pending_bookings: number;
  completed_month: number;
};

export type RevenueChartPoint = {
  date: string;
  label: string;
  revenue_cents: number;
  bookings: number;
};
