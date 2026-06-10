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

export type TenantPaymentMode = "platform_account" | "tenant_own_account" | "disabled";
export type SettlementSchedule = "manual" | "daily" | "weekly" | "monthly";
export type SettlementMethod = "momo" | "bank" | "cash" | "other";
export type PaymentGatewayKey = "paystack" | "flutterwave" | "mtn_momo";

export type GatewayStatusEntry = {
  enabled: boolean;
  status: "disabled" | "platform" | "pending_setup" | "unavailable" | "enabled";
  label: string;
};

export type TenantPaymentModeSettings = {
  id: number;
  mode: TenantPaymentMode;
  default_gateway: PaymentGatewayKey;
  mtn_momo_enabled: boolean;
  paystack_enabled: boolean;
  flutterwave_enabled: boolean;
  settlement_schedule: SettlementSchedule;
  settlement_method: SettlementMethod | null;
  settlement_account_name: string | null;
  settlement_account_number: string | null;
  settlement_provider: string | null;
  settlement_notes: string | null;
  is_payment_enabled: boolean;
  approved_at: string | null;
  approved_by: { id: number; name: string; email: string } | null;
  gateway_status: Record<PaymentGatewayKey, GatewayStatusEntry>;
  updated_at: string | null;
};

export type PaymentProviderAccountPayload = {
  id: number;
  provider: string;
  account_type: "platform" | "tenant";
  environment: "sandbox" | "production";
  country: string;
  currency: string;
  target_environment: string | null;
  callback_host: string | null;
  status: string;
  configured: boolean;
  has_stored_api_user: boolean;
  has_stored_api_key: boolean;
  has_stored_subscription_key: boolean;
  api_user_masked: string | null;
  api_key_masked: string | null;
  subscription_key_masked: string | null;
  key_source: "database" | "environment" | null;
  last_health_check_at: string | null;
  last_successful_token_at: string | null;
  last_balance_sync_at: string | null;
  last_error: string | null;
  updated_at: string | null;
};

export type PlatformPaymentGateway = {
  id: PaymentGatewayKey;
  name: string;
  description: string;
  configured: boolean;
  connected: boolean;
  status: string;
  key_source: "database" | "environment" | null;
  environment: string | null;
  country: string | null;
  currency: string | null;
  target_environment: string | null;
  callback_host: string | null;
  public_key_masked: string | null;
  secret_key_masked: string | null;
  subscription_key_masked: string | null;
  last_health_check_at: string | null;
  last_successful_token_at: string | null;
  last_error: string | null;
  updated_at: string | null;
  supports_health_check: boolean;
  account: PaymentProviderAccountPayload | null;
};

export type PlatformPaymentGatewaysOverview = {
  summary: {
    total: number;
    configured: number;
    connected: number;
  };
  gateways: PlatformPaymentGateway[];
};

export type TenantMtnMomoContext = {
  payment_mode: TenantPaymentMode;
  uses_platform_account: boolean;
  can_manage_own_account: boolean;
  platform_account: PaymentProviderAccountPayload;
  tenant_account: PaymentProviderAccountPayload | null;
};

export type TenantWallet = {
  id: number;
  tenant_id: number;
  currency: string;
  available_balance: number;
  pending_balance: number;
  total_collected: number;
  total_fees: number;
  total_settled: number;
  total_refunded: number;
  status: string;
  updated_at: string | null;
  tenant?: { id: number; name: string; slug: string };
};

export type WalletTransactionType =
  | "payment_collected"
  | "platform_fee"
  | "gateway_fee"
  | "settlement_pending"
  | "settlement_paid"
  | "refund"
  | "adjustment"
  | "reversal";

export type TenantWalletTransaction = {
  id: number;
  type: WalletTransactionType;
  direction: "credit" | "debit";
  amount: number;
  balance_before: number;
  balance_after: number;
  reference: string | null;
  description: string | null;
  payment_request_id: number | null;
  settlement_id: number | null;
  created_at: string | null;
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

export type SupplierContact = {
  id: number;
  supplier_id: number;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  is_primary: boolean;
  notes: string | null;
  created_at?: string | null;
};

export type MembershipBillingInterval = "weekly" | "monthly" | "quarterly" | "yearly";

export type MembershipPlan = {
  id: number;
  uuid?: string;
  name: string;
  description: string | null;
  price_cents: number;
  billing_interval: MembershipBillingInterval | string;
  is_active: boolean;
  color: string | null;
  visits_included: number | null;
  service_discount_percent: number | null;
  product_discount_percent: number | null;
  perks?: string[];
  active_memberships_count?: number;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ClientMembership = {
  id: number;
  uuid?: string;
  membership_plan_id: number;
  client_user_id: number;
  status: "active" | "pending" | "paused" | "expired" | "cancelled" | string;
  started_at: string | null;
  ends_at: string | null;
  renews_at?: string | null;
  remaining_credits?: number | null;
  amount_cents?: number | null;
  currency?: string | null;
  membership_plan?: { id: number; name: string; color?: string | null } | null;
  client?: { id: number; name: string; email?: string | null; phone?: string | null } | null;
};

export type ServicePackageItem = {
  service_id: number;
  service_name: string;
  quantity: number;
};

export type ServicePackage = {
  id: number;
  uuid?: string;
  name: string;
  description: string | null;
  price_cents: number;
  is_active: boolean;
  validity_days: number | null;
  items: ServicePackageItem[];
  active_clients_count?: number;
  redemptions_count?: number;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ClientPackage = {
  id: number;
  uuid?: string;
  service_package_id: number;
  client_user_id: number;
  status: "active" | "expired" | "redeemed" | "cancelled" | string;
  total_quantity: number;
  balance_remaining: number;
  sold_at?: string | null;
  expires_at?: string | null;
  service_package?: { id: number; name: string } | null;
  client?: { id: number; name: string; email?: string | null; phone?: string | null } | null;
};

export type PackageRedemption = {
  id: number;
  client_package_id: number;
  service_id: number;
  quantity: number;
  redeemed_at: string | null;
  notes?: string | null;
  staff_member_name?: string | null;
  service_name?: string | null;
};

export type GiftCard = {
  id: number;
  code: string;
  purchaser_name: string | null;
  recipient_name: string | null;
  recipient_email: string | null;
  recipient_phone: string | null;
  message: string | null;
  initial_balance_cents: number;
  balance_cents: number;
  status: "active" | "redeemed" | "expired" | "void" | string;
  sold_at?: string | null;
  expires_at?: string | null;
  last_used_at?: string | null;
};

export type GiftCardLookup = {
  gift_card: GiftCard | null;
  transactions: {
    id: number;
    type: string;
    amount_cents: number;
    balance_after_cents: number;
    occurred_at: string | null;
    reference?: string | null;
  }[];
};

export type GiftCardLiability = {
  currency: string;
  outstanding_balance_cents: number;
  active_count: number;
  expired_count: number;
  issued_this_month_cents: number;
  redeemed_this_month_cents: number;
  by_status: {
    status: string;
    count: number;
    balance_cents: number;
  }[];
};

export type ReviewSettings = {
  id?: number;
  auto_send: boolean;
  send_delay_hours: number | null;
  min_rating_public: number | null;
  collect_private_feedback: boolean;
  allow_anonymous: boolean;
  escalation_email: string | null;
  reply_sla_hours: number | null;
  updated_at?: string | null;
};

export type ReviewRequest = {
  id: number;
  client_name: string | null;
  channel: string;
  status: "queued" | "sent" | "opened" | "reviewed" | "expired" | string;
  rating: number | null;
  requested_at: string | null;
  reviewed_at: string | null;
  appointment?: { id: number; uuid: string; starts_at?: string | null } | null;
};

export type Review = {
  id: number;
  rating: number;
  title: string | null;
  body: string | null;
  status: "pending" | "published" | "flagged" | "hidden" | "resolved" | string;
  source: string | null;
  author_name: string | null;
  is_public: boolean;
  reply_body?: string | null;
  replied_at?: string | null;
  created_at: string | null;
  client?: { id: number; name: string } | null;
};

export type ComplaintCase = {
  id: number;
  reference: string;
  status: "open" | "investigating" | "resolved" | "closed" | string;
  priority: "low" | "medium" | "high" | "urgent" | string;
  subject: string;
  summary: string | null;
  client_name: string | null;
  owner_name: string | null;
  opened_at: string | null;
  due_at?: string | null;
  review?: { id: number; rating: number } | null;
};

export type PurchaseOrderLine = {
  id?: number;
  product_id: number;
  product_name: string;
  sku?: string | null;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost_cents: number;
  line_total_cents?: number;
};

export type PurchaseOrder = {
  id: number;
  number: string;
  supplier_id: number | null;
  supplier_name?: string | null;
  status: "draft" | "submitted" | "partial" | "received" | "cancelled" | string;
  ordered_at: string | null;
  expected_at: string | null;
  received_at: string | null;
  notes: string | null;
  currency: string;
  subtotal_cents: number;
  lines: PurchaseOrderLine[];
  supplier?: Supplier | null;
};

export type ProductBundleItem = {
  product_id: number;
  product_name: string;
  quantity: number;
};

export type ProductBundle = {
  id: number;
  name: string;
  description: string | null;
  sku?: string | null;
  barcode?: string | null;
  price_cents: number;
  is_active: boolean;
  items: ProductBundleItem[];
};

export type StoreProduct = {
  id: number;
  name: string;
  slug?: string | null;
  sku: string | null;
  barcode: string | null;
  description: string | null;
  image_url: string | null;
  retail_cents: number;
  is_active: boolean;
  total_quantity?: number;
  is_low_stock?: boolean;
  category?: { id: number; name: string } | null;
  badges?: string[];
};

export type ReportDefinition = {
  id: number;
  name: string;
  source: string;
  description: string | null;
  fields: string[];
  group_by?: string | null;
  filters?: Record<string, unknown> | null;
  is_active: boolean;
  updated_at?: string | null;
};

export type ReportPreview = {
  columns: string[];
  rows: Record<string, unknown>[];
};

export type ScheduledReport = {
  id: number;
  report_definition_id: number;
  name: string;
  cadence: "daily" | "weekly" | "monthly" | string;
  next_run_at: string | null;
  last_run_at: string | null;
  recipients: string[];
  format: "csv" | "pdf" | "email" | string;
  is_active: boolean;
  report_definition?: { id: number; name: string; source: string } | null;
};

export type KpiTarget = {
  id: number;
  metric: string;
  label: string;
  unit: "count" | "percent" | "currency" | "hours" | "days" | string;
  target_value: number;
  actual_value: number;
  progress_percent: number;
  trend?: number | null;
  period_label?: string | null;
  owner_name?: string | null;
};

export type KpiDashboard = {
  summary: {
    targets: number;
    on_track: number;
    at_risk: number;
    average_progress_percent: number;
  };
  targets: KpiTarget[];
};

export type OccupancyPoint = {
  date: string;
  label: string;
  occupancy_percent: number;
  available_hours: number;
  booked_hours: number;
  no_show_rate?: number | null;
};

export type OccupancyAnalytics = {
  summary: {
    average_occupancy_percent: number;
    peak_day_label: string | null;
    lowest_day_label: string | null;
    utilization_hours: number;
  };
  timeline: OccupancyPoint[];
  by_staff?: {
    name: string;
    occupancy_percent: number;
    booked_hours: number;
  }[];
  by_day?: {
    label: string;
    occupancy_percent: number;
  }[];
};

export type RetentionPoint = {
  label: string;
  retained_percent: number;
  at_risk_percent?: number | null;
  lapsed_percent?: number | null;
};

export type RetentionCohort = {
  label: string;
  retained_percent: number;
  active_clients: number;
  returning_clients: number;
};

export type RetentionAnalytics = {
  summary: {
    retention_percent: number;
    repeat_clients: number;
    lapsed_clients: number;
    average_days_between_visits: number;
  };
  timeline: RetentionPoint[];
  cohorts?: RetentionCohort[];
  segments?: {
    label: string;
    clients: number;
  }[];
};

export type BranchComparisonBranch = {
  branch_id: number;
  branch_name: string;
  revenue_cents: number;
  bookings: number;
  average_ticket_cents: number;
  utilization_percent: number;
  repeat_rate_percent: number;
  review_score: number | null;
};

export type BranchComparisonTrendPoint = {
  label: string;
  branch_name: string;
  revenue_cents: number;
  bookings: number;
  utilization_percent: number;
};

export type BranchComparisonAnalytics = {
  summary: {
    branches_compared: number;
    total_revenue_cents: number;
    total_bookings: number;
    average_utilization_percent: number;
    top_branch_name: string | null;
  };
  branches: BranchComparisonBranch[];
  trend: BranchComparisonTrendPoint[];
};

export type IntegrationEvent = {
  key: string;
  label: string;
  category: string;
  destination: "ga" | "meta_pixel" | string;
  enabled: boolean;
  last_sent_at: string | null;
  notes?: string | null;
};

export type AnalyticsIntegrationSettings = {
  ga_enabled: boolean;
  ga_measurement_id: string | null;
  ga_api_secret_masked?: string | null;
  meta_enabled: boolean;
  meta_pixel_id: string | null;
  meta_access_token_masked?: string | null;
  consent_mode: "strict" | "balanced" | "marketing" | string;
  updated_at: string | null;
  event_catalog: IntegrationEvent[];
};

export type AbandonedBookingQueueItem = {
  id: number;
  client_name: string;
  service_name: string | null;
  branch_name: string | null;
  abandoned_at: string | null;
  reminder_at: string | null;
  status: string;
  estimated_value_cents: number;
};

export type AbandonedBookingCampaign = {
  id: number;
  name: string;
  channel: string;
  status: "draft" | "live" | "paused" | "completed" | string;
  trigger_minutes: number;
  sent_count: number;
  recovered_bookings: number;
  recovery_rate_percent: number;
  updated_at: string | null;
};

export type AbandonedBookingsOverview = {
  summary: {
    open_abandoned: number;
    recovered_bookings: number;
    recovery_rate_percent: number;
    revenue_recovered_cents: number;
  };
  campaigns: AbandonedBookingCampaign[];
  queue: AbandonedBookingQueueItem[];
};

export type RebookingSegment = {
  label: string;
  clients: number;
  projected_revenue_cents: number;
};

export type RebookingSuggestion = {
  id: number;
  client_name: string;
  recommended_service: string | null;
  assigned_staff_name: string | null;
  last_visit_at: string | null;
  suggested_date: string | null;
  likelihood_label: string;
  lifetime_value_cents: number;
};

export type RebookingOverview = {
  summary: {
    due_clients: number;
    auto_campaigns: number;
    booked_from_campaigns: number;
    projected_revenue_cents: number;
  };
  segments: RebookingSegment[];
  suggestions: RebookingSuggestion[];
};

export type MarketingSocialLink = {
  platform: string;
  label: string;
  url: string;
  clicks: number;
  conversions: number;
  is_active: boolean;
  last_synced_at: string | null;
};

export type MarketingSocialLinksOverview = {
  profile_views: number;
  link_clicks: number;
  bookings_from_social: number;
  bio: string | null;
  share_url: string | null;
  links: MarketingSocialLink[];
};

export type MarketplaceProfile = {
  id: number;
  slug: string;
  business_name: string;
  headline: string | null;
  description: string | null;
  cover_image_url: string | null;
  logo_url: string | null;
  city: string | null;
  region: string | null;
  rating: number | null;
  review_count: number;
  booking_url: string | null;
  accepts_walkins: boolean;
  is_featured: boolean;
  listing_status: "draft" | "published" | "paused" | string;
  specialties: string[];
  service_tags: string[];
};

export type MarketplaceSearchResult = {
  id: number;
  slug: string;
  business_name: string;
  headline: string | null;
  city: string | null;
  region: string | null;
  distance_km: number | null;
  featured: boolean;
  rating: number | null;
  review_count: number;
  lowest_price_cents: number | null;
  currency: string | null;
  service_tags: string[];
  available_today: boolean;
  cover_image_url: string | null;
};

export type MarketplaceSearchResponse = {
  filters: {
    city?: string | null;
    service?: string | null;
    price_max_cents?: number | null;
    sort: string;
  };
  results: MarketplaceSearchResult[];
  nearby_cities?: string[];
  popular_services?: string[];
};

export type FeaturedMarketplacePlacement = {
  id: number;
  marketplace_profile_id: number;
  business_name: string;
  city: string | null;
  slot: number;
  starts_at: string | null;
  ends_at: string | null;
  status: string;
};

export type MarketplaceFeaturedOverview = {
  summary: {
    active_slots: number;
    waitlist_count: number;
    click_through_rate_percent: number;
    bookings_generated: number;
  };
  placements: FeaturedMarketplacePlacement[];
};

export type MarketplaceCommissionRecord = {
  id: number;
  partner_name: string;
  booking_reference: string;
  service_name: string | null;
  commission_rate: number;
  gross_cents: number;
  commission_cents: number;
  status: string;
  payable_at: string | null;
};

export type MarketplaceCommissionOverview = {
  summary: {
    pending_cents: number;
    paid_cents: number;
    bookings: number;
    average_rate: number;
  };
  records: MarketplaceCommissionRecord[];
};

export type AccountDiscoveryItem = {
  id: number;
  type: "service" | "staff" | "salon" | string;
  name: string;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  price_cents?: number | null;
  duration_minutes?: number | null;
  rating?: number | null;
  is_favorite: boolean;
  href: string;
};

export type AccountDiscoveryFeed = {
  favorites_count: number;
  recommended: AccountDiscoveryItem[];
  trending: AccountDiscoveryItem[];
  recently_booked: AccountDiscoveryItem[];
};

export type ChairRentalAgreement = {
  id: number;
  renter_name: string;
  chair_label: string;
  branch_name: string | null;
  status: "lead" | "active" | "notice" | "ended" | string;
  billing_cycle: string;
  rent_cents: number;
  deposit_cents: number;
  next_invoice_at: string | null;
  occupancy_since: string | null;
};

export type ChairRentalOverview = {
  summary: {
    active_rentals: number;
    monthly_recurring_cents: number;
    occupancy_rate_percent: number;
    outstanding_cents: number;
  };
  agreements: ChairRentalAgreement[];
};

export type StaffSelfEmployedProfile = {
  id?: number;
  legal_name: string | null;
  trading_name: string | null;
  tax_id: string | null;
  vat_number: string | null;
  agreement_type: "chair_renter" | "commission_only" | "booth_renter" | string;
  commission_rate: number;
  rent_cents: number;
  payout_method: "bank" | "momo" | "cash" | "other" | null;
  payout_reference: string | null;
  contract_start_at: string | null;
  contract_end_at: string | null;
  notes: string | null;
  is_active: boolean;
};

export type BranchRegion = {
  id: number;
  name: string;
  manager_name?: string | null;
  branch_count: number;
};

export type BranchGroup = {
  id: number;
  name: string;
  region_name: string | null;
  branch_count: number;
  branch_names: string[];
  is_active: boolean;
  manager_name?: string | null;
};

export type BranchGroupOverview = {
  summary: {
    regions: number;
    groups: number;
    covered_branches: number;
    unassigned_branches: number;
  };
  regions: BranchRegion[];
  groups: BranchGroup[];
};

export type ApprovalItem = {
  id: number;
  uuid?: string;
  type: string;
  title: string;
  requester_name: string | null;
  branch_name: string | null;
  submitted_at: string | null;
  due_at: string | null;
  status: "pending" | "approved" | "rejected" | string;
  priority: "low" | "medium" | "high" | string;
  summary: string | null;
};

export type ApprovalRequestRow = {
  uuid: string;
  type: string;
  status: string;
  title: string;
  description: string | null;
  payload: Record<string, unknown>;
  review_note: string | null;
  reviewed_at: string | null;
  is_urgent: boolean;
  requested_by: { id: number; name: string } | null;
  reviewed_by: { id: number; name: string } | null;
  created_at: string | null;
};

export type ApprovalsInbox = {
  summary: {
    pending: number;
    overdue: number;
    approved_today: number;
    rejected_today: number;
  };
  items: ApprovalItem[];
};

export type WhiteLabelSettings = {
  custom_domain: string | null;
  app_name: string;
  support_email: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  login_background_url: string | null;
  primary_color: string;
  accent_color: string;
  email_from_name: string | null;
  email_from_address: string | null;
  custom_help_url: string | null;
  hide_beautyos_branding: boolean;
  dns_status: "unverified" | "verifying" | "verified" | string;
  updated_at: string | null;
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
  tenant_id?: number;
  location_id?: number | null;
  user_id?: number;
  display_name: string;
  job_title?: string | null;
  title: string | null;
  initials?: string;
  bio?: string | null;
  avatar_url?: string | null;
  is_bookable?: boolean;
  is_active?: boolean;
  employment_status?: "active" | "on_leave" | "inactive" | "terminated";
  employment_type?: "full_time" | "part_time" | "contractor" | null;
  hire_date?: string | null;
  color_code?: string | null;
  appointments_count?: number;
  services_count?: number;
  location?: { id: number; name: string } | null;
  user?: { id: number; name: string; email: string; phone: string | null; avatar_url?: string | null };
  payroll?: StaffPayrollProfile | null;
  payroll_summary?: {
    pay_type: StaffPayType;
    base_salary_cents: number;
    hourly_rate_cents: number;
    commission_rate: number;
    pay_role_name?: string | null;
    pay_role_color?: string | null;
  } | null;
};

export type StaffPayType =
  | "salary"
  | "hourly"
  | "commission"
  | "salary_commission"
  | "hourly_commission";

export type StaffPayRole = {
  id: number;
  name: string;
  description: string | null;
  pay_type: StaffPayType;
  base_salary_cents: number;
  hourly_rate_cents: number;
  commission_rate: number;
  commission_type: string | null;
  tip_eligible: boolean;
  color: string | null;
  sort_order: number;
  is_active: boolean;
  staff_count?: number;
};

export type StaffPayrollProfile = {
  id: number;
  staff_member_id: number;
  pay_role_id: number | null;
  pay_type: StaffPayType;
  base_salary_cents: number;
  hourly_rate_cents: number;
  commission_rate: number;
  commission_type: string | null;
  tip_eligible: boolean;
  payout_method: "momo" | "bank" | "cash" | "other" | null;
  payout_account_name: string | null;
  payout_account_number_masked: string | null;
  has_payout_account_number: boolean;
  effective_from: string | null;
  notes: string | null;
  is_active: boolean;
  pay_role: StaffPayRole | null;
  updated_at: string | null;
};

export type StaffStats = {
  total: number;
  active: number;
  bookable: number;
  on_leave_today: number;
  available_now: number;
};

export type StaffWorkingHourDay = {
  id?: number;
  day_of_week: number;
  day_label: string;
  is_working_day: boolean;
  start_time: string | null;
  end_time: string | null;
  location_id?: number | null;
};

export type StaffWorkingHoursMeta = {
  has_custom_schedule?: boolean;
  summary?: { working_days: number; weekly_hours: number };
};

export type StaffServiceAssignment = {
  id: number;
  staff_member_id: number;
  service_id: number;
  custom_duration_minutes: number | null;
  custom_price_cents: number | null;
  effective_duration_minutes: number;
  effective_price_cents: number;
  is_active: boolean;
  service?: {
    id: number;
    uuid?: string;
    name: string;
    duration_minutes: number;
    price_cents: number;
    category?: { id: number; name: string } | null;
  } | null;
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

export type ClientProfileStats = {
  total_spend_cents: number;
  visit_count: number;
  last_visit_at: string | null;
  last_visit_service: string | null;
  next_booking_at: string | null;
  next_booking_service: string | null;
  no_show_count: number;
  appointments_count: number;
};

export type ClientProfileVisit = {
  id: number;
  uuid: string;
  starts_at: string | null;
  status: string;
  service_name: string | null;
  staff_name: string | null;
  amount_due_cents: number;
  payment_status: string;
  notes: string | null;
};

export type ClientProfileNote = {
  id: number;
  body: string;
  is_pinned: boolean;
  author_name: string | null;
  created_at: string | null;
};

export type ClientProfileAllergy = {
  id: number;
  allergen: string;
  severity: string;
  reaction_notes: string | null;
  is_active: boolean;
};

export type ClientProfilePatchTest = {
  id: number;
  product_name: string;
  tested_on: string | null;
  expires_on: string | null;
  result: string;
  notes: string | null;
  staff_name: string | null;
};

export type ClientProfileTreatment = {
  id: number;
  service_name: string;
  treated_at: string | null;
  outcome: string | null;
  notes: string | null;
  staff_name: string | null;
};

export type ClientProfileMedia = {
  id: number;
  kind: "before" | "after" | string;
  url: string;
  caption: string | null;
  taken_at: string | null;
};

export type ClientProfileDocument = {
  id: number;
  title: string;
  file_url: string;
  mime_type: string | null;
  uploaded_by_name: string | null;
  created_at: string | null;
};

export type ClientProfilePayment = {
  id: number;
  source: string;
  reference: string;
  status: string;
  amount_cents: number;
  currency: string;
  occurred_at: string | null;
};

export type ClientProfileTimelineEvent = {
  type: string;
  title: string;
  subtitle: string | null;
  occurred_at: string | null;
};

export type ClientProfileData = {
  client: {
    id: number;
    uuid: string;
    name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
    bio: string | null;
    date_of_birth: string | null;
    is_active: boolean;
    marketing_opt_in: boolean;
  };
  profile: {
    preferred_staff_member_id: number | null;
    preferred_staff_name: string | null;
    preferred_contact: string | null;
    sms_reminders: boolean;
    email_marketing: boolean;
    sms_marketing: boolean;
    tags: string[];
  };
  stats: ClientProfileStats;
  loyalty: {
    points_balance: number;
    lifetime_points: number;
    recent_transactions: {
      id: number;
      points: number;
      type: string;
      description: string;
      created_at: string | null;
    }[];
  } | null;
  visits: ClientProfileVisit[];
  notes: ClientProfileNote[];
  allergies: ClientProfileAllergy[];
  patch_tests: ClientProfilePatchTest[];
  treatments: ClientProfileTreatment[];
  media: ClientProfileMedia[];
  documents: ClientProfileDocument[];
  payments: ClientProfilePayment[];
  timeline: ClientProfileTimelineEvent[];
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
  reason?: string;
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

export type PaymentRequestStatus =
  | "pending"
  | "processing"
  | "success"
  | "failed"
  | "expired"
  | "cancelled";

export type PaymentRequestReason =
  | "booking_payment"
  | "deposit_payment"
  | "invoice_payment"
  | "pos_sale"
  | "sms_package_invoice"
  | "other";

export type PaymentRequest = {
  id: number;
  reference: string;
  amount_cents: number;
  currency: string;
  phone: string;
  email?: string | null;
  gateway: string;
  payment_channel: string;
  reason: PaymentRequestReason;
  description?: string | null;
  status: PaymentRequestStatus;
  provider_status?: string | null;
  external_reference?: string | null;
  transaction_uuid?: string | null;
  failed_reason?: string | null;
  expires_at?: string | null;
  paid_at?: string | null;
  callback_received_at?: string | null;
  status_checked_at?: string | null;
  cancelled_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  customer?: { id: number; name: string; email?: string | null; phone?: string | null } | null;
  requested_by?: { id: number; name: string; email?: string | null } | null;
  branch?: { id: number; name: string } | null;
  booking?: { id: number; uuid: string; starts_at?: string | null; service_name?: string | null } | null;
  pos_sale?: { id: number; uuid: string; sale_number?: string | null; total_cents?: number } | null;
  sms_purchase_invoice?: { id: number; amount_cents: number; currency: string; status: string } | null;
  invoice_id?: number | null;
};

export type PaymentRequestsListMeta = {
  current_page: number;
  last_page: number;
  total: number;
  summary?: {
    pending: number;
    processing: number;
    success: number;
    failed: number;
    expired: number;
    cancelled: number;
  };
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

export type WaitlistStatus = "waiting" | "notified" | "booked" | "cancelled";

export type WaitlistEntry = {
  uuid: string;
  status: WaitlistStatus | string;
  priority: number;
  client_user_id: number | null;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  location_id: number | null;
  staff_member_id: number | null;
  service_ids: number[];
  preferred_date: string;
  preferred_time: string | null;
  party_size: number;
  notes: string | null;
  notified_at: string | null;
  created_at: string;
  client?: { id: number; name: string; email?: string; phone?: string | null } | null;
  location?: { id: number; name: string } | null;
  staff_member?: { id: number; name: string } | null;
  services?: { id: number; name: string; duration_minutes: number; price_cents: number }[];
  converted_appointment?: { uuid: string; starts_at: string; status: string } | null;
};

export type WaitlistOpening = {
  date: string;
  time: string;
  label: string;
  staff_member_id: number | null;
};

export type WaitlistListMeta = {
  current_page: number;
  last_page: number;
  total: number;
};

export type FormFieldType =
  | "heading"
  | "text"
  | "textarea"
  | "email"
  | "phone"
  | "number"
  | "date"
  | "select"
  | "multiselect"
  | "checkbox"
  | "switch";

export type FormFieldVisibleWhen = {
  field_key: string;
  operator?: "equals" | "not_equals" | "filled";
  value?: unknown;
};

export type FormFieldDefinition = {
  field_key: string;
  field_type: FormFieldType | string;
  label: string;
  help_text?: string | null;
  placeholder?: string | null;
  options?: { choices?: string[] } | null;
  is_required?: boolean;
  sort_order?: number;
  visible_when?: FormFieldVisibleWhen | null;
};

export type FormTemplate = {
  uuid: string;
  name: string;
  category: string;
  description?: string | null;
  is_active: boolean;
  library_slug?: string | null;
  submissions_count?: number;
  created_at?: string;
  updated_at?: string;
  fields: FormFieldDefinition[];
};

export type FormTemplateLibraryItem = {
  slug: string;
  name: string;
  category: string;
  description?: string | null;
  fields: FormFieldDefinition[];
};

export type FormSubmission = {
  uuid: string;
  status: string;
  answers: Record<string, unknown>;
  submitted_at?: string | null;
  client_user_id?: number | null;
  client?: { id: number; name: string; email?: string } | null;
  template?: { uuid: string; name: string } | null;
};

export type FormListMeta = {
  current_page: number;
  last_page: number;
  total: number;
};

export type ScheduleEventType = "appointment" | "break" | "time_off" | "unavailable";

export type ScheduleEvent = {
  id: string;
  type: ScheduleEventType;
  starts_at: string;
  ends_at: string;
  staff_member_id: number;
  location_id?: number | null;
  title: string;
  status?: string;
  color?: string | null;
  meta?: Record<string, unknown>;
};

export type StaffBreak = {
  id: number;
  staff_member_id: number;
  location_id?: number | null;
  title: string;
  break_type: string;
  day_of_week?: number | null;
  start_time: string;
  end_time: string;
  repeats_weekly: boolean;
  date?: string | null;
  note?: string | null;
};

export type StaffTimeOff = {
  id: number;
  staff_member_id: number;
  location_id?: number | null;
  purpose: string;
  custom_purpose?: string | null;
  start_at: string;
  end_at: string;
  all_day: boolean;
  note?: string | null;
  status: string;
  reviewed_at?: string | null;
};

export type DashboardStats = {
  appointments_today: number;
  revenue_month_cents: number;
  pending_bookings: number;
  completed_month: number;
  cancelled_month: number;
  self_bookings_month: number;
  new_customers_month: number;
  pos_sales_today_count?: number;
  pos_sales_today_cents?: number;
  pos_sales_month_cents?: number;
  active_products?: number;
  low_stock_count?: number;
};

export type PosSummary = {
  sales_today_count: number;
  sales_today_cents: number;
  sales_month_count: number;
  sales_month_cents: number;
  inventory: {
    total_products: number;
    active_products: number;
    low_stock_count: number;
    total_units: number;
    stock_value_cents: number;
  };
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

export type FinanceOverviewCards = {
  revenue_today_cents: number;
  revenue_month_cents: number;
  gross_revenue_cents: number;
  net_revenue_cents: number;
  outstanding_invoices_cents: number;
  expenses_cents: number;
  payroll_due_cents: number;
  tips_collected_cents: number;
  refunds_cents: number;
  discounts_cents: number;
  total_payments_cents: number;
  pending_payments_cents: number;
  pending_payments_count: number;
  failed_payments_cents: number;
  failed_payments_count: number;
  platform_fees_cents: number;
  wallet_available_cents: number;
  wallet_pending_cents: number;
};

export type FinanceChartPoint = {
  date: string;
  label: string;
  revenue_cents?: number;
  expenses_cents?: number;
  income_cents?: number;
  profit_cents?: number;
};

export type FinancePaymentMethodSlice = {
  method: string;
  amount_cents: number;
  count: number;
};

export type FinanceNamedRevenue = {
  id?: number;
  name: string;
  revenue_cents?: number;
  bookings?: number;
};

export type FinanceRecentPayment = {
  id: number;
  source: "payment_request" | "payment_transaction";
  reference: string;
  status: string;
  amount_cents: number;
  currency: string;
  customer_name?: string | null;
  occurred_at?: string | null;
};

export type FinanceOverview = {
  filters: {
    from: string;
    to: string;
    location_id?: number | null;
    staff_id?: number | null;
    service_id?: number | null;
    status?: string | null;
  };
  cards: FinanceOverviewCards;
  charts: {
    revenue_trend: FinanceChartPoint[];
    payment_methods: FinancePaymentMethodSlice[];
    service_revenue: FinanceNamedRevenue[];
    staff_revenue: FinanceNamedRevenue[];
    expenses_trend: FinanceChartPoint[];
    profit_estimate: FinanceChartPoint[];
  };
  recent_payments: FinanceRecentPayment[];
  filter_options?: {
    locations?: { id: number; name: string }[];
    staff?: { id: number; name: string }[];
    services?: { id: number; name: string }[];
  };
};

export type FinanceLedgerEntry = {
  id: string;
  source_type: string;
  source_id: number;
  transaction_type: string;
  payment_method: string;
  gateway?: string | null;
  amount_cents: number;
  currency: string;
  status: string;
  reference: string;
  description: string;
  customer_name?: string | null;
  branch_name?: string | null;
  staff_name?: string | null;
  occurred_at?: string | null;
};

export type FinanceTransactionsResponse = {
  data: FinanceLedgerEntry[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    summary: {
      total_count: number;
      income_cents: number;
      expense_cents: number;
      refund_cents: number;
      net_cents: number;
      paid_count: number;
      pending_count: number;
      failed_count: number;
    };
  };
};

export type TenantInvoiceItem = {
  id: number;
  description: string;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
};

export type TenantInvoicePayment = {
  id: number;
  payment_method: string;
  amount_cents: number;
  reference?: string | null;
  paid_at?: string | null;
  notes?: string | null;
  recorded_by?: { id: number; name: string } | null;
  payment_request?: { id: number; reference: string; status: string } | null;
};

export type TenantInvoice = {
  id: number;
  uuid: string;
  invoice_number: string;
  status: string;
  subtotal_cents: number;
  discount_total_cents: number;
  tax_total_cents: number;
  total_cents: number;
  amount_paid_cents: number;
  balance_due_cents: number;
  currency: string;
  due_date?: string | null;
  notes?: string | null;
  terms?: string | null;
  sent_at?: string | null;
  paid_at?: string | null;
  cancelled_at?: string | null;
  created_at?: string | null;
  customer?: { id: number; name: string; email?: string | null; phone?: string | null } | null;
  branch?: { id: number; name: string } | null;
  booking?: { id: number; uuid: string } | null;
  pos_sale?: { id: number; uuid: string; sale_number?: string | null } | null;
  items: TenantInvoiceItem[];
  payments: TenantInvoicePayment[];
  payment_requests?: {
    id: number;
    reference: string;
    status: string;
    amount_cents: number;
    gateway: string;
    created_at?: string | null;
  }[];
};

export type TenantInvoicesResponse = {
  data: TenantInvoice[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
    summary: {
      total_count: number;
      outstanding_cents: number;
      paid_count: number;
      overdue_count: number;
      draft_count: number;
    };
  };
};

export type ExpenseCategory = {
  id: number;
  name: string;
  slug: string;
};

export type TenantExpense = {
  id: number;
  vendor_name?: string | null;
  amount_cents: number;
  tax_amount_cents: number;
  currency: string;
  payment_method: string;
  expense_date?: string | null;
  receipt_path?: string | null;
  note?: string | null;
  status: string;
  created_at?: string | null;
  category?: ExpenseCategory | null;
  branch?: { id: number; name: string } | null;
  created_by?: { id: number; name: string } | null;
};

export type TenantExpensesResponse = {
  data: TenantExpense[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
    summary: {
      total_count: number;
      total_cents: number;
      this_month_cents: number;
    };
    monthly_trend: { month: string; label: string; amount_cents: number }[];
    vendors: { vendor_name: string; amount_cents: number; count: number }[];
  };
};

export type FinanceTipEntry = {
  id: number;
  source: string;
  sale_number: string | null;
  tip_cents: number;
  total_cents: number;
  currency: string;
  payment_method: string | null;
  completed_at: string | null;
  customer?: { id: number; name: string; email?: string | null; phone?: string | null } | null;
  branch?: { id: number; name: string } | null;
  recorded_by?: { id: number; name: string } | null;
};

export type FinanceTipsResponse = {
  data: FinanceTipEntry[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
    summary: {
      total_tips_cents: number;
      tip_count: number;
      average_tip_cents: number;
    };
    monthly_trend: { month: string; label: string; tips_cents: number; tip_count: number }[];
  };
};

export type FinancePayrollStaffRow = {
  staff_member_id: number;
  staff_name: string;
  job_title: string | null;
  pay_type: string;
  pay_role_name: string | null;
  commission_rate: number;
  tip_eligible: boolean;
  base_pay_cents: number;
  commission_cents: number;
  tips_owed_cents: number;
  total_earnings_cents: number;
  approval_status: string;
  profile_active: boolean;
};

export type FinancePayrollResponse = {
  filters: { from: string; to: string; staff_member_id: number | null };
  summary: {
    staff_count: number;
    base_pay_cents: number;
    commission_cents: number;
    tips_owed_cents: number;
    total_payroll_cents: number;
  };
  staff: FinancePayrollStaffRow[];
};

export type CashDrawerPaymentBreakdown = {
  cash_cents: number;
  card_cents: number;
  mobile_money_cents: number;
  other_cents: number;
  total_sales_cents: number;
  sale_count: number;
};

export type CashDrawerSession = {
  uuid: string;
  status: "open" | "closed" | "discrepancy" | string;
  location: { id: number; name: string } | null;
  opening_cash_cents: number;
  expected_cash_cents: number;
  counted_cash_cents: number | null;
  difference_cents: number | null;
  payment_breakdown: CashDrawerPaymentBreakdown;
  opening_notes: string | null;
  closing_notes: string | null;
  opened_at: string | null;
  closed_at: string | null;
  opened_by: { id: number; name: string } | null;
  closed_by: { id: number; name: string } | null;
};

export type TenantTaxRate = {
  id: number;
  name: string;
  rate: number;
  applies_to: "all" | "services" | "products" | string;
  inclusive_or_exclusive: "inclusive" | "exclusive" | string;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
  updated_at: string | null;
};

export type FinanceTaxReport = {
  filters: { from: string; to: string; location_id: number | null };
  summary: {
    tax_collected_cents: number;
    taxable_sales_cents: number;
    pos_tax_cents: number;
    invoice_tax_cents: number;
    pos_sale_count: number;
    invoice_count: number;
  };
  by_source: Array<{
    source: string;
    label: string;
    tax_cents: number;
    taxable_cents: number;
    count: number;
  }>;
  monthly_trend: Array<{ month: string; label: string; tax_cents: number }>;
};

export type FinanceProfitLossSection = {
  key: string;
  label: string;
  section: "income" | "cogs" | "expenses" | "summary" | string;
  amount_cents: number;
  emphasis?: boolean;
};

export type FinanceProfitLossResponse = {
  filters: { from: string; to: string; location_id: number | null };
  summary: {
    gross_revenue_cents: number;
    discounts_cents: number;
    net_revenue_cents: number;
    cogs_cents: number;
    gross_profit_cents: number;
    operating_expenses_cents: number;
    payroll_cents: number;
    platform_fees_cents: number;
    refunds_cents: number;
    total_expenses_cents: number;
    net_profit_cents: number;
    margin_percent: number;
  };
  sections: FinanceProfitLossSection[];
  monthly_trend: Array<{
    month: string;
    label: string;
    revenue_cents: number;
    expenses_cents: number;
    profit_cents: number;
  }>;
};

export type FinancePrepaidBalancesResponse = {
  filters: { from: string; to: string; location_id: number | null };
  summary: {
    gift_card_liability_cents: number;
    gift_card_expired_cents: number;
    gift_card_active_count: number;
    package_liability_cents: number;
    package_expired_liability_cents: number;
    package_active_count: number;
    membership_revenue_cents: number;
    active_memberships_count: number;
    gift_card_sales_cents: number;
    gift_card_redemptions_cents: number;
    package_sales_cents: number;
    package_redemptions_count: number;
    package_sessions_redeemed: number;
    total_prepaid_liability_cents: number;
  };
  active_gift_cards: Array<{
    uuid: string;
    code: string;
    status: string;
    balance_cents: number;
    initial_balance_cents: number;
    recipient_name: string | null;
    expires_at: string | null;
  }>;
  active_packages: Array<{
    uuid: string;
    status: string;
    sessions_total: number;
    sessions_remaining: number;
    liability_cents: number;
    package_name: string | null;
    client_name: string | null;
    expires_at: string | null;
  }>;
  membership_payments: Array<{
    uuid: string;
    status: string;
    plan_name: string | null;
    client_name: string | null;
    amount_cents: number;
    starts_at: string | null;
    ends_at: string | null;
    created_at: string | null;
  }>;
  recent_redemptions: Array<{
    type: "gift_card" | "package" | string;
    reference: string | null;
    label: string;
    amount_cents: number | null;
    sessions_used?: number;
    occurred_at: string | null;
  }>;
};

export type FinanceInsight = {
  id: string;
  severity: "info" | "warning" | "critical" | "opportunity" | string;
  title: string;
  message: string;
  action: string;
  metric_value: number;
};

export type FinanceInsightsResponse = {
  filters: { from: string; to: string; location_id: number | null };
  forecast: {
    mtd_revenue_cents: number;
    daily_average_cents: number;
    projected_month_revenue_cents: number;
    days_elapsed: number;
    days_in_month: number;
  };
  busiest_days: Array<{ day_of_week: number; label: string; revenue_cents: number }>;
  highlights: {
    top_staff: Array<{ staff_id: number | null; name: string; bookings: number; revenue_cents: number }>;
    underperforming_services: Array<{
      service_id: number;
      name: string;
      bookings: number;
      revenue_cents: number;
      avg_revenue_cents: number;
    }>;
  };
  metrics: {
    gross_revenue_cents: number;
    refund_rate_percent: number;
    discount_rate_percent: number;
    payroll_to_revenue_percent: number;
    expense_change_percent: number;
    current_expenses_cents: number;
    prior_expenses_cents: number;
    outstanding_invoices_cents: number;
    wallet_available_cents: number;
    payroll_cents: number;
  };
  trend_comparison: {
    revenue_trend: Array<{ date: string; label: string; revenue_cents: number }>;
    prior_period: { from: string; to: string; expenses_cents: number };
  };
  insights: FinanceInsight[];
  alert_channels: Array<{
    channel: string;
    label: string;
    enabled: boolean;
    placeholder: boolean;
    note: string;
  }>;
};

export type FinanceRefundPreview = {
  max_refundable_cents: number;
  currency: string;
  label: string | null;
};

export type FinanceRefund = {
  id: number;
  source_type: string;
  source_id: number;
  amount_cents: number;
  currency: string;
  refund_method: string;
  reason: string;
  status: string;
  gateway_reference?: string | null;
  notes?: string | null;
  refunded_at?: string | null;
  branch?: { id: number; name: string } | null;
  refunded_by?: { id: number; name: string } | null;
  sale_number?: string | null;
  payment_reference?: string | null;
};

export type FinanceAdjustment = {
  id: number;
  ledger_reference: string;
  source_type?: string | null;
  source_id?: number | null;
  direction: "credit" | "debit";
  amount_cents: number;
  currency: string;
  reason: string;
  notes?: string | null;
  created_at?: string | null;
  created_by?: { id: number; name: string } | null;
};
