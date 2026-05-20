export type TenantSocialLinks = {
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  twitter?: string | null;
};

export type TenantOpeningHoursDay = {
  day: string;
  open: string;
  close: string;
  closed: boolean;
};

export type TenantBranding = {
  logo_url: string | null;
  banner_url: string | null;
  primary_color: string;
  accent_color: string;
  tagline: string | null;
  business_description?: string | null;
  business_phone: string | null;
  business_email: string | null;
  whatsapp?: string | null;
  address: string | null;
  address_line1?: string | null;
  city?: string | null;
  country?: string | null;
  website_url?: string | null;
  social?: TenantSocialLinks;
  opening_hours?: TenantOpeningHoursDay[];
};

export type TenantPaymentConfig = {
  enabled: boolean;
  deposit_percent: number;
  require_full_payment: boolean;
};

export type TenantBookingConfig = {
  slug: string;
  accepts_public_bookings: boolean;
  multiple_locations: boolean;
  location_mode: "none" | "single" | "multi";
  locations_count: number;
  business_type?: string | null;
  business_type_label?: string | null;
  payments?: TenantPaymentConfig;
  currency?: string;
};

export type TenantDomain = {
  domain: string;
  type?: string;
  is_primary?: boolean;
  is_verified?: boolean;
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
  business_type?: string | null;
  business_type_label?: string | null;
  branding: TenantBranding;
  domains?: TenantDomain[];
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
  owned_tenant_slug?: string | null;
};

export type Coupon = {
  id: number;
  code: string;
  type: "percent" | "fixed" | string;
  value: number;
  scope?: "subscription" | "booking" | "both" | string;
  tenant_id?: number | null;
  max_redemptions: number | null;
  redemptions_count: number;
  starts_at?: string | null;
  expires_at: string | null;
  is_active: boolean;
  metadata?: {
    plan_ids?: string[];
    service_ids?: number[];
    min_amount_cents?: number;
  };
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

export type ServiceCategory = {
  id: number;
  uuid: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  services_count?: number;
};

export type Service = {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_cents: number;
  price_formatted: string;
  is_active?: boolean;
  category?: { id: number; name: string };
  service_category_id?: number | null;
};

export type ProductCategory = {
  id: number;
  name: string;
  sort_order: number;
  is_active: boolean;
};

export type Supplier = {
  id: number;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  is_active: boolean;
};

export type ProductStockRow = {
  location_id: number;
  location_name: string | null;
  quantity: number;
};

export type Product = {
  id: number;
  name: string;
  sku: string | null;
  barcode: string | null;
  description: string | null;
  image_url: string | null;
  cost_cents: number;
  retail_cents: number;
  low_stock_threshold: number;
  is_active: boolean;
  total_quantity: number;
  is_low_stock: boolean;
  category?: { id: number; name: string } | null;
  supplier?: { id: number; name: string } | null;
  stocks?: ProductStockRow[];
};

export type StockMovement = {
  id: number;
  type: string;
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  reason: string | null;
  notes: string | null;
  created_at: string;
  product?: { id: number; name: string; sku: string | null };
  location?: { id: number; name: string };
  user?: { id: number; name: string };
};

export type InventoryDashboard = {
  summary: {
    total_products: number;
    active_products: number;
    low_stock_count: number;
    total_units: number;
    stock_value_cents: number;
  };
  low_stock: {
    id: number;
    name: string;
    sku: string | null;
    quantity: number;
    low_stock_threshold: number;
    category?: string | null;
  }[];
  recent_movements: StockMovement[];
};

export type StaffMember = {
  id: number;
  uuid: string;
  display_name: string;
  title: string | null;
  is_bookable?: boolean;
  is_active?: boolean;
  user?: { id: number; name: string; email: string; phone: string | null };
};

export type TenantClient = {
  id: number;
  uuid: string;
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  appointments_count?: number;
};

export type Location = {
  id: number;
  uuid: string;
  name: string;
  address_line1: string | null;
  city: string | null;
  country: string | null;
  is_active?: boolean;
  label: string;
};

export type BookingTimeSlot = {
  time: string;
  label: string;
  available: boolean;
};

export type BookingRecurrence = {
  frequency: "weekly" | "biweekly" | "monthly";
  occurrences: number;
};

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export type Appointment = {
  id: number;
  uuid: string;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus | string;
  booked_via?: "online" | "staff";
  payment_status?: string;
  amount_due_cents?: number;
  deposit_paid_cents?: number;
  notes: string | null;
  booking_group_id?: number | null;
  service?: Service;
  staff_member?: { id: number; display_name: string; title: string | null };
  client?: Pick<User, "id" | "name" | "email" | "phone">;
  location?: { id: number; name: string; label?: string; city?: string | null };
};

export type PaymentTransaction = {
  uuid: string;
  provider: string;
  purpose: string;
  provider_reference: string;
  amount_cents: number;
  currency: string;
  status: string;
  failure_reason?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
  appointment?: Appointment;
  client?: { name: string; email: string };
};

export type AppointmentsListMeta = {
  current_page: number;
  last_page: number;
  total: number;
  filter: string;
  summary: {
    today: number;
    pending: number;
    upcoming: number;
  };
};

export type DashboardStats = {
  appointments_today: number;
  revenue_month_cents: number;
  pending_bookings: number;
  completed_month: number;
  cancelled_month: number;
  self_bookings_month: number;
  new_customers_month: number;
};

export type GrowthChartPoint = {
  date: string;
  label: string;
  revenue_cents: number;
  bookings: number;
  completed: number;
  cancelled: number;
  self_bookings: number;
};

/** @deprecated Use GrowthChartPoint */
export type RevenueChartPoint = GrowthChartPoint;

export type DashboardBookingsBreakdown = {
  cancelled: Appointment[];
  completed: Appointment[];
  self_bookings: Appointment[];
};

export type SaleItem = {
  id: number;
  item_type: "service" | "product";
  service_id: number | null;
  product_id: number | null;
  name: string;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
};

export type Sale = {
  id: number;
  uuid: string;
  sale_number: string | null;
  status: string;
  location_id: number;
  client_user_id: number | null;
  appointment_id: number | null;
  subtotal_cents: number;
  discount_cents: number;
  tax_cents: number;
  service_charge_cents: number;
  tip_cents: number;
  total_cents: number;
  currency: string;
  payment_method: string;
  coupon_code: string | null;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  client?: { id: number; name: string; email?: string; phone?: string | null } | null;
  location?: { id: number; name: string } | null;
  appointment?: { id: number; uuid: string } | null;
  items?: SaleItem[];
};
