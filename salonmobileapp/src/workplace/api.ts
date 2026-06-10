import { createApiClient } from "@/api/client";
import type { Appointment } from "@/booking/types";

export type WorkplaceAuth = {
  token: string;
  tenantSlug: string;
};

function client(auth: WorkplaceAuth) {
  return createApiClient({ token: auth.token, tenantSlug: auth.tenantSlug });
}

function tenantPath(slug: string, path: string): string {
  return `/${slug}${path}`;
}

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
};

export type AppointmentsMeta = {
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

export type AppointmentFilter = "upcoming" | "today" | "past" | "all";

export async function fetchDashboardStats(auth: WorkplaceAuth): Promise<DashboardStats> {
  const res = await client(auth).get<{ stats: DashboardStats }>(
    tenantPath(auth.tenantSlug, "/dashboard/stats")
  );
  return res.stats;
}

export async function fetchUpcomingAppointments(auth: WorkplaceAuth): Promise<Appointment[]> {
  const res = await client(auth).get<{ data: Appointment[] }>(
    tenantPath(auth.tenantSlug, "/dashboard/upcoming")
  );
  return res.data ?? [];
}

export async function fetchTenantAppointments(
  auth: WorkplaceAuth,
  params: { filter?: AppointmentFilter; q?: string; per_page?: number } = {}
): Promise<{ data: Appointment[]; meta: AppointmentsMeta }> {
  const search = new URLSearchParams();
  if (params.filter) search.set("filter", params.filter);
  if (params.q) search.set("q", params.q);
  if (params.per_page) search.set("per_page", String(params.per_page));
  const qs = search.toString();

  return client(auth).get<{ data: Appointment[]; meta: AppointmentsMeta }>(
    tenantPath(auth.tenantSlug, `/appointments${qs ? `?${qs}` : ""}`)
  );
}

export async function fetchTenantAppointment(
  auth: WorkplaceAuth,
  uuid: string
): Promise<Appointment> {
  const res = await client(auth).get<{ data: Appointment }>(
    tenantPath(auth.tenantSlug, `/appointments/${uuid}`)
  );
  return res.data;
}

export async function updateTenantAppointment(
  auth: WorkplaceAuth,
  uuid: string,
  body: { status?: string; notes?: string }
): Promise<Appointment> {
  const res = await client(auth).patch<{ data: Appointment }>(
    tenantPath(auth.tenantSlug, `/appointments/${uuid}`),
    body
  );
  return res.data;
}

export type GrowthChartPoint = {
  date: string;
  label: string;
  revenue_cents: number;
  bookings: number;
  completed: number;
  cancelled: number;
  self_bookings: number;
};

export async function fetchGrowthChart(
  auth: WorkplaceAuth,
  days: 7 | 30 = 7
): Promise<GrowthChartPoint[]> {
  const res = await client(auth).get<{ data: GrowthChartPoint[] }>(
    tenantPath(auth.tenantSlug, `/dashboard/growth-chart?days=${days}`)
  );
  return res.data ?? [];
}

export type StaffMemberRow = {
  id: number;
  uuid: string;
  display_name: string;
  title?: string | null;
  is_active: boolean;
  user?: { email?: string };
};

export type ClientRow = {
  id: number;
  uuid: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  appointments_count?: number;
};

export type Paginated<T> = {
  data: T[];
  meta?: { total?: number; current_page?: number; last_page?: number };
};

export async function fetchStaffMembers(
  auth: WorkplaceAuth,
  params: { q?: string; per_page?: number } = {}
): Promise<Paginated<StaffMemberRow>> {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.per_page) search.set("per_page", String(params.per_page));
  const qs = search.toString();
  return client(auth).get<Paginated<StaffMemberRow>>(
    tenantPath(auth.tenantSlug, `/staff-members${qs ? `?${qs}` : ""}`)
  );
}

export async function fetchClients(
  auth: WorkplaceAuth,
  params: { q?: string; per_page?: number } = {}
): Promise<Paginated<ClientRow>> {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.per_page) search.set("per_page", String(params.per_page));
  const qs = search.toString();
  return client(auth).get<Paginated<ClientRow>>(
    tenantPath(auth.tenantSlug, `/clients${qs ? `?${qs}` : ""}`)
  );
}

export type ClientProfileStats = {
  total_spend_cents: number;
  visit_count: number;
  last_visit_at: string | null;
  next_booking_at: string | null;
  no_show_count: number;
};

export type ClientProfilePayload = {
  client: { id: number; name: string; email: string; phone: string | null; is_active: boolean };
  stats: ClientProfileStats;
  visits: { uuid: string; service_name: string | null; starts_at: string | null; status: string }[];
  notes: { id: number; body: string; created_at: string | null }[];
  allergies: { id: number; allergen: string; severity: string }[];
  patch_tests: { id: number; product_name: string; tested_on: string | null; result: string }[];
  treatments: { id: number; service_name: string; treated_at: string | null }[];
  media: { id: number; kind: string; url: string; caption: string | null }[];
  documents: { id: number; title: string; file_url: string }[];
  payments: { id: number; reference: string; amount_cents: number; status: string; occurred_at: string | null }[];
  loyalty: { points_balance: number; lifetime_points: number } | null;
  timeline: { type: string; title: string; subtitle: string | null; occurred_at: string | null }[];
};

export async function fetchClientProfile(auth: WorkplaceAuth, clientId: number): Promise<ClientProfilePayload> {
  const res = await client(auth).get<{ data: ClientProfilePayload }>(
    tenantPath(auth.tenantSlug, `/clients/${clientId}/profile`)
  );
  return res.data;
}

export type PosSummary = {
  sales_today_count: number;
  sales_today_cents: number;
  sales_month_count: number;
  sales_month_cents: number;
  inventory?: {
    total_products?: number;
    active_products?: number;
    low_stock_count?: number;
    total_units?: number;
    stock_value_cents?: number;
  };
};

export async function fetchPosSummary(auth: WorkplaceAuth): Promise<PosSummary> {
  return client(auth).get<PosSummary>(tenantPath(auth.tenantSlug, "/pos/summary"));
}

export type InventoryDashboard = {
  summary: {
    total_products?: number;
    active_products?: number;
    low_stock_count?: number;
    total_units?: number;
    stock_value_cents?: number;
  };
  low_stock: Array<{
    id: number;
    name: string;
    sku?: string;
    quantity_on_hand?: number;
    reorder_level?: number;
  }>;
};

export async function fetchInventoryDashboard(auth: WorkplaceAuth): Promise<InventoryDashboard> {
  return client(auth).get<InventoryDashboard>(
    tenantPath(auth.tenantSlug, "/inventory/dashboard")
  );
}

export type WaitlistEntry = {
  uuid: string;
  status: string;
  priority: number;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  preferred_date: string;
  preferred_time: string | null;
  party_size: number;
  notes: string | null;
  staff_member?: { id: number; name: string } | null;
  location?: { id: number; name: string } | null;
  services?: { id: number; name: string; duration_minutes: number }[];
  converted_appointment?: { uuid: string; starts_at: string | null } | null;
};

export type WaitlistOpening = {
  date: string;
  time: string;
  label: string;
  staff_member_id: number | null;
};

export async function fetchWaitlist(
  auth: WorkplaceAuth,
  params: { status?: string; q?: string; per_page?: number } = {}
): Promise<Paginated<WaitlistEntry>> {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.q) search.set("q", params.q);
  if (params.per_page) search.set("per_page", String(params.per_page));
  const qs = search.toString();
  return client(auth).get<Paginated<WaitlistEntry>>(
    tenantPath(auth.tenantSlug, `/waitlist${qs ? `?${qs}` : ""}`)
  );
}

export async function fetchWaitlistOpenings(
  auth: WorkplaceAuth,
  uuid: string
): Promise<WaitlistOpening[]> {
  const res = await client(auth).get<{ data: WaitlistOpening[] }>(
    tenantPath(auth.tenantSlug, `/waitlist/${uuid}/openings`)
  );
  return res.data ?? [];
}

export async function notifyWaitlistClient(auth: WorkplaceAuth, uuid: string): Promise<void> {
  await client(auth).post(tenantPath(auth.tenantSlug, `/waitlist/${uuid}/notify`));
}

export async function convertWaitlistEntry(
  auth: WorkplaceAuth,
  uuid: string,
  body: { starts_at: string; staff_member_id?: number | null }
): Promise<void> {
  await client(auth).post(tenantPath(auth.tenantSlug, `/waitlist/${uuid}/convert`), body);
}

export async function createWaitlistEntry(
  auth: WorkplaceAuth,
  body: {
    service_ids: number[];
    preferred_date: string;
    client_name: string;
    client_email: string;
    staff_member_id?: number | null;
    location_id?: number | null;
    preferred_time?: string | null;
    priority?: number;
    client_phone?: string | null;
    notes?: string | null;
  }
): Promise<WaitlistEntry> {
  const res = await client(auth).post<{ data: WaitlistEntry }>(
    tenantPath(auth.tenantSlug, "/waitlist"),
    body
  );
  return res.data;
}

export type FormFieldDefinition = {
  field_key: string;
  field_type: string;
  label: string;
  help_text?: string | null;
  placeholder?: string | null;
  options?: { choices?: string[] } | null;
  is_required?: boolean;
  sort_order?: number;
  visible_when?: { field_key: string; operator?: string; value?: unknown } | null;
};

export type FormTemplate = {
  uuid: string;
  name: string;
  category: string;
  description?: string | null;
  is_active: boolean;
  submissions_count?: number;
  fields: FormFieldDefinition[];
};

export type FormTemplateLibraryItem = {
  slug: string;
  name: string;
  category: string;
  description?: string | null;
  fields: FormFieldDefinition[];
};

export async function fetchFormTemplates(
  auth: WorkplaceAuth,
  params: { q?: string; per_page?: number } = {}
): Promise<Paginated<FormTemplate>> {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.per_page) search.set("per_page", String(params.per_page));
  const qs = search.toString();
  return client(auth).get<Paginated<FormTemplate>>(
    tenantPath(auth.tenantSlug, `/forms${qs ? `?${qs}` : ""}`)
  );
}

export async function fetchFormTemplate(auth: WorkplaceAuth, uuid: string): Promise<FormTemplate> {
  const res = await client(auth).get<{ data: FormTemplate }>(
    tenantPath(auth.tenantSlug, `/forms/${uuid}`)
  );
  return res.data;
}

export async function fetchFormLibrary(auth: WorkplaceAuth): Promise<FormTemplateLibraryItem[]> {
  const res = await client(auth).get<{ data: FormTemplateLibraryItem[] }>(
    tenantPath(auth.tenantSlug, "/forms/library")
  );
  return res.data ?? [];
}

export async function importFormLibrary(auth: WorkplaceAuth, slug: string): Promise<FormTemplate> {
  const res = await client(auth).post<{ data: FormTemplate }>(
    tenantPath(auth.tenantSlug, "/forms/library/import"),
    { slug }
  );
  return res.data;
}

export async function submitForm(
  auth: WorkplaceAuth,
  uuid: string,
  answers: Record<string, unknown>
): Promise<void> {
  await client(auth).post(tenantPath(auth.tenantSlug, `/forms/${uuid}/submissions`), { answers });
}

function buildQueryString(
  params: Record<string, string | number | boolean | null | undefined>
): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export type MembershipPlan = {
  id: number;
  uuid: string;
  name: string;
  description?: string | null;
  price_cents: number;
  billing_interval: string;
  discount_percent: number;
  free_service_ids?: number[];
  priority_booking: boolean;
  points_multiplier: number;
  is_active: boolean;
  sort_order?: number;
};

export type ClientMembership = {
  id: number;
  uuid: string;
  membership_plan_id: number;
  status: string;
  starts_at?: string | null;
  ends_at?: string | null;
  next_billing_at?: string | null;
  client?: ClientRow | null;
  plan?: MembershipPlan | null;
};

export async function fetchMembershipPlans(
  auth: WorkplaceAuth,
  params: { q?: string; per_page?: number } = {}
): Promise<Paginated<MembershipPlan>> {
  return client(auth).get<Paginated<MembershipPlan>>(
    tenantPath(auth.tenantSlug, `/membership-plans${buildQueryString(params)}`)
  );
}

export async function fetchClientMemberships(
  auth: WorkplaceAuth,
  params: { status?: string; per_page?: number } = {}
): Promise<Paginated<ClientMembership>> {
  return client(auth).get<Paginated<ClientMembership>>(
    tenantPath(auth.tenantSlug, `/client-memberships${buildQueryString(params)}`)
  );
}

export async function sellMembership(
  auth: WorkplaceAuth,
  body: {
    client_user_id: number;
    membership_plan_id: number;
    starts_at?: string | null;
    notes?: string | null;
  }
): Promise<ClientMembership> {
  const res = await client(auth).post<{ data: ClientMembership }>(
    tenantPath(auth.tenantSlug, "/client-memberships"),
    body
  );
  return res.data;
}

export type ServicePackage = {
  id: number;
  uuid: string;
  name: string;
  description?: string | null;
  service_id?: number | null;
  sessions_included: number;
  price_cents: number;
  expiry_days?: number | null;
  is_active: boolean;
};

export type ClientPackageBalance = {
  id: number;
  uuid: string;
  service_package_id: number;
  client_user_id: number;
  sessions_total: number;
  sessions_remaining: number;
  expires_at?: string | null;
  status: string;
  client?: ClientRow | null;
  package?: ServicePackage | null;
};

export async function fetchServicePackages(
  auth: WorkplaceAuth,
  params: { q?: string; per_page?: number } = {}
): Promise<Paginated<ServicePackage>> {
  return client(auth).get<Paginated<ServicePackage>>(
    tenantPath(auth.tenantSlug, `/service-packages${buildQueryString(params)}`)
  );
}

export async function fetchClientPackageBalances(
  auth: WorkplaceAuth,
  params: { status?: string; per_page?: number } = {}
): Promise<Paginated<ClientPackageBalance>> {
  return client(auth).get<Paginated<ClientPackageBalance>>(
    tenantPath(auth.tenantSlug, `/client-package-balances${buildQueryString(params)}`)
  );
}

export async function sellServicePackage(
  auth: WorkplaceAuth,
  body: {
    client_user_id: number;
    service_package_id: number;
    starts_at?: string | null;
    notes?: string | null;
  }
): Promise<ClientPackageBalance> {
  const res = await client(auth).post<{ data: ClientPackageBalance }>(
    tenantPath(auth.tenantSlug, "/client-package-balances"),
    body
  );
  return res.data;
}

export async function redeemClientPackage(
  auth: WorkplaceAuth,
  balanceId: number,
  body: { sessions_used?: number; note?: string | null }
): Promise<ClientPackageBalance> {
  const res = await client(auth).post<{ data: ClientPackageBalance }>(
    tenantPath(auth.tenantSlug, `/client-package-balances/${balanceId}/redeem`),
    body
  );
  return res.data;
}

export type GiftCard = {
  id: number;
  uuid: string;
  code: string;
  initial_balance_cents: number;
  balance_cents: number;
  status: string;
  recipient_email?: string | null;
  recipient_name?: string | null;
  expires_at?: string | null;
  client?: ClientRow | null;
};

export type GiftCardTransaction = {
  id: number;
  type: string;
  amount_cents: number;
  balance_after_cents: number;
  note?: string | null;
  created_at?: string | null;
};

export async function fetchGiftCards(
  auth: WorkplaceAuth,
  params: { status?: string; q?: string; per_page?: number } = {}
): Promise<Paginated<GiftCard>> {
  return client(auth).get<Paginated<GiftCard>>(
    tenantPath(auth.tenantSlug, `/gift-cards${buildQueryString(params)}`)
  );
}

export async function fetchGiftCard(
  auth: WorkplaceAuth,
  giftCardId: number
): Promise<GiftCard & { transactions?: GiftCardTransaction[] }> {
  const res = await client(auth).get<{ data: GiftCard & { transactions?: GiftCardTransaction[] } }>(
    tenantPath(auth.tenantSlug, `/gift-cards/${giftCardId}`)
  );
  return res.data;
}

export async function lookupGiftCardByCode(
  auth: WorkplaceAuth,
  code: string
): Promise<GiftCard & { transactions?: GiftCardTransaction[] }> {
  const res = await client(auth).get<{ data: GiftCard & { transactions?: GiftCardTransaction[] } }>(
    tenantPath(auth.tenantSlug, `/gift-cards/lookup${buildQueryString({ code })}`)
  );
  return res.data;
}

export async function sellGiftCard(
  auth: WorkplaceAuth,
  body: {
    initial_balance_cents: number;
    recipient_name?: string | null;
    recipient_email?: string | null;
    client_user_id?: number | null;
    purchaser_user_id?: number | null;
    expires_at?: string | null;
  }
): Promise<GiftCard> {
  const res = await client(auth).post<{ data: GiftCard }>(
    tenantPath(auth.tenantSlug, "/gift-cards"),
    body
  );
  return res.data;
}

export async function redeemGiftCard(
  auth: WorkplaceAuth,
  giftCardId: number,
  body: { amount_cents: number; note?: string | null }
): Promise<GiftCard> {
  const res = await client(auth).post<{ data: GiftCard }>(
    tenantPath(auth.tenantSlug, `/gift-cards/${giftCardId}/redeem`),
    body
  );
  return res.data;
}

export type ReviewSettings = {
  auto_send_after_appointment: boolean;
  delay_hours: number;
  request_message_template?: string | null;
  google_review_url?: string | null;
  auto_send_google_review: boolean;
  low_rating_threshold: number;
};

export type ReviewRequestRow = {
  id: number;
  uuid: string;
  status: string;
  client_email?: string | null;
  sent_at?: string | null;
  completed_at?: string | null;
  google_review_sent?: boolean;
};

export type ReviewRecord = {
  id: number;
  uuid: string;
  rating: number;
  comment?: string | null;
  status: string;
  is_verified: boolean;
  source: string;
  created_at?: string | null;
  client_name?: string | null;
  staff_member_name?: string | null;
  service_name?: string | null;
};

export type ComplaintCase = {
  id: number;
  uuid: string;
  status: string;
  internal_notes?: string | null;
  resolution_note?: string | null;
  resolved_at?: string | null;
  review?: ReviewRecord | null;
};

export type ReviewDashboard = {
  settings: ReviewSettings | null;
  stats: {
    average_rating: number;
    total_reviews: number;
    pending_requests: number;
    low_rating_cases: number;
    google_sent: number;
  };
  requests: ReviewRequestRow[];
  reviews: ReviewRecord[];
  complaints: ComplaintCase[];
};

export async function fetchReviewDashboard(auth: WorkplaceAuth): Promise<ReviewDashboard> {
  return client(auth).get<ReviewDashboard>(tenantPath(auth.tenantSlug, "/reviews/dashboard"));
}

export async function fetchReviewRequests(
  auth: WorkplaceAuth,
  params: { status?: string; per_page?: number } = {}
): Promise<Paginated<ReviewRequestRow>> {
  return client(auth).get<Paginated<ReviewRequestRow>>(
    tenantPath(auth.tenantSlug, `/review-requests${buildQueryString(params)}`)
  );
}

export async function fetchReviews(
  auth: WorkplaceAuth,
  params: { status?: string; per_page?: number } = {}
): Promise<Paginated<ReviewRecord>> {
  return client(auth).get<Paginated<ReviewRecord>>(
    tenantPath(auth.tenantSlug, `/reviews${buildQueryString(params)}`)
  );
}

export async function sendReviewRequest(
  auth: WorkplaceAuth,
  body: { appointment_id?: number | null; client_user_id?: number | null; client_email?: string | null }
): Promise<ReviewRequestRow> {
  const res = await client(auth).post<{ data: ReviewRequestRow }>(
    tenantPath(auth.tenantSlug, "/review-requests"),
    body
  );
  return res.data;
}

export type SupplierSummary = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
};

export type PurchaseOrderItem = {
  id: number;
  product_id: number;
  product_name?: string | null;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost_cents: number;
};

export type PurchaseOrder = {
  id: number;
  uuid: string;
  reference?: string | null;
  status: string;
  notes?: string | null;
  sent_at?: string | null;
  received_at?: string | null;
  supplier?: SupplierSummary | null;
  items?: PurchaseOrderItem[];
};

export async function fetchPurchaseOrders(
  auth: WorkplaceAuth,
  params: { status?: string; per_page?: number } = {}
): Promise<Paginated<PurchaseOrder>> {
  return client(auth).get<Paginated<PurchaseOrder>>(
    tenantPath(auth.tenantSlug, `/purchase-orders${buildQueryString(params)}`)
  );
}

export async function fetchPurchaseOrder(auth: WorkplaceAuth, purchaseOrderId: number): Promise<PurchaseOrder> {
  const res = await client(auth).get<{ data: PurchaseOrder }>(
    tenantPath(auth.tenantSlug, `/purchase-orders/${purchaseOrderId}`)
  );
  return res.data;
}

export async function receivePurchaseOrderItems(
  auth: WorkplaceAuth,
  purchaseOrderId: number,
  body: { items: Array<{ purchase_order_item_id: number; quantity_received: number }> }
): Promise<PurchaseOrder> {
  const res = await client(auth).post<{ data: PurchaseOrder }>(
    tenantPath(auth.tenantSlug, `/purchase-orders/${purchaseOrderId}/receive`),
    body
  );
  return res.data;
}

export type BarcodeLookupResult = {
  id: number;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  quantity_on_hand?: number | null;
};

export async function lookupProductBarcode(
  auth: WorkplaceAuth,
  code: string
): Promise<BarcodeLookupResult | null> {
  const res = await client(auth).get<{ data: BarcodeLookupResult | null }>(
    tenantPath(auth.tenantSlug, `/products/barcode-lookup${buildQueryString({ code })}`)
  );
  return res.data ?? null;
}

export type ProductBundle = {
  id: number;
  uuid: string;
  name: string;
  description?: string | null;
  price_cents: number;
  is_active: boolean;
  items?: Array<{
    id: number;
    product_id: number;
    product_name?: string | null;
    quantity: number;
  }>;
};

export async function fetchProductBundles(
  auth: WorkplaceAuth,
  params: { q?: string; per_page?: number } = {}
): Promise<Paginated<ProductBundle>> {
  return client(auth).get<Paginated<ProductBundle>>(
    tenantPath(auth.tenantSlug, `/product-bundles${buildQueryString(params)}`)
  );
}

export type ReportDefinition = {
  id: number;
  uuid: string;
  name: string;
  report_type: string;
  config: Record<string, unknown>;
  created_at?: string | null;
};

export async function fetchReportDefinitions(
  auth: WorkplaceAuth,
  params: { report_type?: string; per_page?: number } = {}
): Promise<Paginated<ReportDefinition>> {
  return client(auth).get<Paginated<ReportDefinition>>(
    tenantPath(auth.tenantSlug, `/report-definitions${buildQueryString(params)}`)
  );
}

export type KpiTarget = {
  id: number;
  uuid: string;
  metric: string;
  period: string;
  target_value: number;
  current_value?: number;
  progress_percent?: number;
  period_start?: string | null;
  period_end?: string | null;
};

export type KpiDashboard = {
  summary: {
    revenue_target_progress?: number;
    bookings_target_progress?: number;
    retail_target_progress?: number;
    staff_target_progress?: number;
  };
  targets: KpiTarget[];
};

export async function fetchKpiDashboard(auth: WorkplaceAuth): Promise<KpiDashboard> {
  return client(auth).get<KpiDashboard>(tenantPath(auth.tenantSlug, "/kpi/dashboard"));
}

export async function createKpiTarget(
  auth: WorkplaceAuth,
  body: {
    metric: string;
    period: string;
    target_value: number;
    period_start?: string | null;
    period_end?: string | null;
    staff_member_id?: number | null;
    location_id?: number | null;
  }
): Promise<KpiTarget> {
  const res = await client(auth).post<{ data: KpiTarget }>(
    tenantPath(auth.tenantSlug, "/kpi-targets"),
    body
  );
  return res.data;
}

export type OccupancyReport = {
  summary: {
    utilization_percent: number;
    occupancy_percent: number;
    booked_hours: number;
    available_hours: number;
    peak_time_label?: string | null;
  };
  by_staff: Array<{
    label: string;
    utilization_percent: number;
    booked_hours: number;
    available_hours: number;
  }>;
  by_room: Array<{
    label: string;
    occupancy_percent: number;
    booked_hours: number;
    available_hours: number;
  }>;
};

export async function fetchOccupancyReport(
  auth: WorkplaceAuth,
  params: { range?: string } = {}
): Promise<OccupancyReport> {
  return client(auth).get<OccupancyReport>(
    tenantPath(auth.tenantSlug, `/analytics/occupancy${buildQueryString(params)}`)
  );
}

export type RetentionReport = {
  summary: {
    returning_clients: number;
    new_clients: number;
    churn_risk_count: number;
    average_visits_per_client: number;
  };
  churn_risk: Array<{
    id: number;
    name: string;
    last_visit_at?: string | null;
    risk_level: string;
  }>;
  cohorts: Array<{
    label: string;
    retention_percent: number;
  }>;
};

export async function fetchRetentionReport(
  auth: WorkplaceAuth,
  params: { range?: string } = {}
): Promise<RetentionReport> {
  return client(auth).get<RetentionReport>(
    tenantPath(auth.tenantSlug, `/analytics/retention${buildQueryString(params)}`)
  );
}

export type BranchComparisonBranch = {
  id: number | string;
  name: string;
  revenue_cents: number;
  bookings: number;
  staff_score: number;
  service_score: number;
  change_percent?: number | null;
  rank?: number | null;
};

export type BranchComparisonDashboard = {
  summary: {
    branches: number;
    revenue_cents: number;
    bookings: number;
    average_staff_score: number;
  };
  branches: BranchComparisonBranch[];
};

export async function fetchBranchComparison(
  auth: WorkplaceAuth,
  params: { range?: string } = {}
): Promise<BranchComparisonDashboard> {
  const res = await client(auth).get<BranchComparisonDashboard | { data: BranchComparisonDashboard }>(
    tenantPath(auth.tenantSlug, `/analytics/branch-comparison${buildQueryString(params)}`)
  );
  return unwrapData(res);
}

export type MarketingIntegration = {
  provider: string;
  connected: boolean;
  measurement_id?: string | null;
  consent_mode?: boolean;
  tracked_events: string[];
  last_event_at?: string | null;
};

export type MarketingIntegrationsDashboard = {
  integrations: MarketingIntegration[];
  recent_events: Array<{
    name: string;
    provider: string;
    status: string;
    deliveries: number;
  }>;
};

export async function fetchMarketingIntegrations(
  auth: WorkplaceAuth
): Promise<MarketingIntegrationsDashboard> {
  const res = await client(auth).get<
    MarketingIntegrationsDashboard | { data: MarketingIntegrationsDashboard }
  >(tenantPath(auth.tenantSlug, "/marketing/integrations"));
  return unwrapData(res);
}

export type AbandonedBookingRecord = {
  id: number | string;
  client_name: string;
  service_name: string;
  channel: string;
  started_at?: string | null;
  reminder_state: string;
  recovery_value_cents: number;
  status: string;
};

export type AbandonedBookingsDashboard = {
  summary: {
    open_sessions: number;
    recovered_count: number;
    recovered_value_cents: number;
    automations_live: number;
  };
  automation: {
    sms: boolean;
    email: boolean;
    whatsapp: boolean;
    delay_minutes: number;
  };
  sessions: AbandonedBookingRecord[];
};

export async function fetchAbandonedBookings(
  auth: WorkplaceAuth,
  params: { status?: string } = {}
): Promise<AbandonedBookingsDashboard> {
  const res = await client(auth).get<
    AbandonedBookingsDashboard | { data: AbandonedBookingsDashboard }
  >(tenantPath(auth.tenantSlug, `/marketing/abandoned-bookings${buildQueryString(params)}`));
  return unwrapData(res);
}

export type RebookingRule = {
  id: number | string;
  label: string;
  cadence_days: number;
  scope: string;
  active: boolean;
};

export type RebookingSuggestion = {
  id: number | string;
  client_name: string;
  service_name: string;
  due_on?: string | null;
  staff_name?: string | null;
  confidence: string;
  channel: string;
};

export type RebookingDashboard = {
  summary: {
    due_this_week: number;
    rules: number;
    scheduled_reminders: number;
    recovered_clients: number;
  };
  rules: RebookingRule[];
  suggestions: RebookingSuggestion[];
};

export async function fetchRebookingDashboard(
  auth: WorkplaceAuth
): Promise<RebookingDashboard> {
  const res = await client(auth).get<RebookingDashboard | { data: RebookingDashboard }>(
    tenantPath(auth.tenantSlug, "/marketing/rebooking")
  );
  return unwrapData(res);
}

export type SocialBookingLink = {
  platform: string;
  handle?: string | null;
  url: string;
  clicks: number;
  bookings: number;
  qr_ready: boolean;
};

export type SocialLinksDashboard = {
  summary: {
    links: number;
    clicks: number;
    bookings: number;
    top_platform?: string | null;
  };
  share_copy?: string | null;
  links: SocialBookingLink[];
};

export async function fetchSocialLinksDashboard(
  auth: WorkplaceAuth
): Promise<SocialLinksDashboard> {
  const res = await client(auth).get<SocialLinksDashboard | { data: SocialLinksDashboard }>(
    tenantPath(auth.tenantSlug, "/marketing/social-links")
  );
  return unwrapData(res);
}

export type MarketplaceProfile = {
  published: boolean;
  salon_name: string;
  headline?: string | null;
  rating: number;
  review_count: number;
  categories: string[];
  services: Array<{ id: number | string; name: string; price_from_cents?: number | null }>;
  photos: Array<{ id: number | string; url?: string | null; caption?: string | null }>;
  location: {
    city: string;
    branch_count: number;
  };
};

export type MarketplaceSearchResult = {
  id: number | string;
  name: string;
  city: string;
  distance_km?: number | null;
  rating?: number | null;
  featured?: boolean;
  favorite_count?: number;
  categories?: string[];
};

export async function fetchMarketplaceProfile(auth: WorkplaceAuth): Promise<MarketplaceProfile> {
  const res = await client(auth).get<MarketplaceProfile | { data: MarketplaceProfile }>(
    tenantPath(auth.tenantSlug, "/marketplace/profile")
  );
  return unwrapData(res);
}

export async function searchMarketplaceBusinesses(
  auth: WorkplaceAuth,
  params: { q?: string; city?: string; featured?: boolean } = {}
): Promise<Paginated<MarketplaceSearchResult>> {
  return client(auth).get<Paginated<MarketplaceSearchResult>>(
    tenantPath(auth.tenantSlug, `/marketplace/search${buildQueryString(params)}`)
  );
}

export type ChairRentalRenter = {
  id: number | string;
  chair_name: string;
  renter_name: string;
  status: string;
  weekly_fee_cents: number;
  next_invoice_due?: string | null;
  payout_mode?: string | null;
  days_booked: number;
};

export type ChairRentalDashboard = {
  summary: {
    active_renters: number;
    occupied_chairs: number;
    revenue_cents: number;
    overdue_invoices: number;
  };
  renters: ChairRentalRenter[];
  schedule: Array<{ day: string; occupied: number; total: number }>;
};

export async function fetchChairRentalDashboard(auth: WorkplaceAuth): Promise<ChairRentalDashboard> {
  const res = await client(auth).get<ChairRentalDashboard | { data: ChairRentalDashboard }>(
    tenantPath(auth.tenantSlug, "/enterprise/chair-rentals")
  );
  return unwrapData(res);
}

export type EnterpriseApproval = {
  id: number | string;
  type: string;
  title: string;
  requested_by: string;
  amount_cents?: number | null;
  submitted_at?: string | null;
  priority: string;
  status: string;
  branch_name?: string | null;
};

export type EnterpriseApprovalsInbox = {
  summary: {
    pending: number;
    urgent: number;
    approved_today: number;
    rejected_today: number;
  };
  queue: EnterpriseApproval[];
};

export async function fetchEnterpriseApprovals(
  auth: WorkplaceAuth,
  params: { status?: string } = {}
): Promise<EnterpriseApprovalsInbox> {
  const res = await client(auth).get<EnterpriseApprovalsInbox | { data: EnterpriseApprovalsInbox }>(
    tenantPath(auth.tenantSlug, `/enterprise/approvals${buildQueryString(params)}`)
  );
  return unwrapData(res);
}

export async function submitEnterpriseApproval(
  auth: WorkplaceAuth,
  approvalId: number | string,
  body: { decision: "approved" | "rejected"; notes?: string | null }
): Promise<void> {
  await client(auth).post(tenantPath(auth.tenantSlug, `/enterprise/approvals/${approvalId}`), body);
}

export type WhiteLabelPreview = {
  app_name: string;
  plan: string;
  primary_hex: string;
  accent_hex: string;
  custom_domain?: string | null;
  assets: {
    logo: boolean;
    splash: boolean;
    icon: boolean;
  };
  modules: string[];
};

export async function fetchWhiteLabelPreview(auth: WorkplaceAuth): Promise<WhiteLabelPreview> {
  const res = await client(auth).get<WhiteLabelPreview | { data: WhiteLabelPreview }>(
    tenantPath(auth.tenantSlug, "/enterprise/white-label-preview")
  );
  return unwrapData(res);
}

function unwrapData<T>(payload: T | { data: T }): T {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in (payload as Record<string, unknown>) &&
    (payload as { data?: T }).data !== undefined
  ) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}
