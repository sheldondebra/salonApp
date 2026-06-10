import { createApiClient } from "@/api/client";
import type {
  CashDrawerSession,
  FinanceInsightsResponse,
  FinanceOverview,
  FinancePayrollResponse,
  FinancePrepaidBalancesResponse,
  FinanceProfitLossResponse,
  FinanceTaxReport,
  FinanceTipsResponse,
  FinanceTransactionsResponse,
  TenantTaxRate,
} from "@/finance/types";

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

export async function fetchFinanceOverview(
  auth: WorkplaceAuth,
  params?: { from?: string; to?: string; location_id?: string }
): Promise<FinanceOverview> {
  const search = new URLSearchParams();
  if (params?.from) search.set("from", params.from);
  if (params?.to) search.set("to", params.to);
  if (params?.location_id) search.set("location_id", params.location_id);
  const qs = search.toString();
  return client(auth).get<FinanceOverview>(
    tenantPath(auth.tenantSlug, `/finance/overview${qs ? `?${qs}` : ""}`)
  );
}

export type TenantInvoiceSummary = {
  id: number;
  invoice_number: string;
  status: string;
  total_cents: number;
  balance_due_cents: number;
  currency: string;
  due_date?: string | null;
  customer?: { name: string } | null;
  created_at?: string | null;
};

export type TenantInvoicesResponse = {
  data: TenantInvoiceSummary[];
  meta: { current_page: number; last_page: number; total: number };
};

export async function fetchFinanceInvoices(
  auth: WorkplaceAuth,
  params?: { page?: number; q?: string }
): Promise<TenantInvoicesResponse> {
  const search = new URLSearchParams({ per_page: "25", page: String(params?.page ?? 1) });
  if (params?.q) search.set("q", params.q);
  return client(auth).get<TenantInvoicesResponse>(
    tenantPath(auth.tenantSlug, `/finance/invoices?${search}`)
  );
}

export type TenantInvoiceDetail = TenantInvoiceSummary & {
  uuid: string;
  subtotal_cents: number;
  amount_paid_cents: number;
  notes?: string | null;
  customer?: { id: number; name: string; email?: string | null; phone?: string | null } | null;
  items: { id: number; description: string; quantity: number; unit_price_cents: number; line_total_cents: number }[];
  payments: { id: number; payment_method: string; amount_cents: number; paid_at?: string | null }[];
};

export async function fetchFinanceInvoice(auth: WorkplaceAuth, id: number): Promise<TenantInvoiceDetail> {
  const res = await client(auth).get<{ data: TenantInvoiceDetail }>(
    tenantPath(auth.tenantSlug, `/finance/invoices/${id}`)
  );
  return res.data;
}

export async function createFinanceInvoice(
  auth: WorkplaceAuth,
  body: {
    customer_id?: number | null;
    due_date?: string | null;
    notes?: string | null;
    items: { description: string; quantity?: number; unit_price_cents: number }[];
  }
): Promise<TenantInvoiceDetail> {
  const res = await client(auth).post<{ data: TenantInvoiceDetail }>(
    tenantPath(auth.tenantSlug, "/finance/invoices"),
    body
  );
  return res.data;
}

export async function sendFinanceInvoice(auth: WorkplaceAuth, id: number): Promise<TenantInvoiceDetail> {
  const res = await client(auth).post<{ data: TenantInvoiceDetail }>(
    tenantPath(auth.tenantSlug, `/finance/invoices/${id}/send`)
  );
  return res.data;
}

export type ExpenseCategory = { id: number; name: string; slug: string };

export type TenantExpense = {
  id: number;
  vendor_name?: string | null;
  amount_cents: number;
  currency: string;
  payment_method: string;
  expense_date?: string | null;
  note?: string | null;
  status: string;
  category?: ExpenseCategory | null;
};

export type TenantExpensesResponse = {
  data: TenantExpense[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
    summary: { total_count: number; total_cents: number; this_month_cents: number };
  };
};

export async function fetchExpenseCategories(auth: WorkplaceAuth): Promise<ExpenseCategory[]> {
  const res = await client(auth).get<{ data: ExpenseCategory[] }>(
    tenantPath(auth.tenantSlug, "/finance/expenses/categories")
  );
  return res.data ?? [];
}

export async function fetchFinanceExpenses(
  auth: WorkplaceAuth,
  params?: { page?: number; q?: string }
): Promise<TenantExpensesResponse> {
  const search = new URLSearchParams({ per_page: "25", page: String(params?.page ?? 1) });
  if (params?.q) search.set("q", params.q);
  return client(auth).get<TenantExpensesResponse>(
    tenantPath(auth.tenantSlug, `/finance/expenses?${search}`)
  );
}

export async function fetchFinancePayroll(
  auth: WorkplaceAuth,
  params?: { from?: string; to?: string }
): Promise<FinancePayrollResponse> {
  const search = new URLSearchParams();
  if (params?.from) search.set("from", params.from);
  if (params?.to) search.set("to", params.to);
  const qs = search.toString();
  const res = await client(auth).get<{ data: FinancePayrollResponse }>(
    tenantPath(auth.tenantSlug, `/finance/payroll${qs ? `?${qs}` : ""}`)
  );
  return res.data;
}

export async function fetchActiveCashDrawer(
  auth: WorkplaceAuth,
  locationId: number
): Promise<CashDrawerSession | null> {
  const res = await client(auth).get<{ data: CashDrawerSession | null }>(
    tenantPath(auth.tenantSlug, `/finance/cash-drawer/active?location_id=${locationId}`)
  );
  return res.data;
}

export async function openCashDrawer(
  auth: WorkplaceAuth,
  body: { location_id: number; opening_cash_cents?: number; opening_notes?: string | null }
): Promise<CashDrawerSession> {
  const res = await client(auth).post<{ data: CashDrawerSession }>(
    tenantPath(auth.tenantSlug, "/finance/cash-drawer/open"),
    body
  );
  return res.data;
}

export async function closeCashDrawer(
  auth: WorkplaceAuth,
  sessionUuid: string,
  body: { counted_cash_cents: number; closing_notes?: string | null }
): Promise<CashDrawerSession> {
  const res = await client(auth).post<{ data: CashDrawerSession }>(
    tenantPath(auth.tenantSlug, `/finance/cash-drawer/sessions/${sessionUuid}/close`),
    body
  );
  return res.data;
}

export async function fetchTaxRates(auth: WorkplaceAuth): Promise<TenantTaxRate[]> {
  const res = await client(auth).get<{ data: TenantTaxRate[] }>(
    tenantPath(auth.tenantSlug, "/finance/tax-rates")
  );
  return res.data ?? [];
}

export async function fetchFinanceTaxReport(
  auth: WorkplaceAuth,
  params?: { from?: string; to?: string }
): Promise<FinanceTaxReport> {
  const search = new URLSearchParams();
  if (params?.from) search.set("from", params.from);
  if (params?.to) search.set("to", params.to);
  const qs = search.toString();
  const res = await client(auth).get<{ data: FinanceTaxReport }>(
    tenantPath(auth.tenantSlug, `/finance/taxes/report${qs ? `?${qs}` : ""}`)
  );
  return res.data;
}

export async function fetchFinanceProfitLoss(
  auth: WorkplaceAuth,
  params?: { from?: string; to?: string }
): Promise<FinanceProfitLossResponse> {
  const search = new URLSearchParams();
  if (params?.from) search.set("from", params.from);
  if (params?.to) search.set("to", params.to);
  const qs = search.toString();
  const res = await client(auth).get<{ data: FinanceProfitLossResponse }>(
    tenantPath(auth.tenantSlug, `/finance/profit-loss${qs ? `?${qs}` : ""}`)
  );
  return res.data;
}

export async function fetchFinancePrepaidBalances(
  auth: WorkplaceAuth,
  params?: { from?: string; to?: string }
): Promise<FinancePrepaidBalancesResponse> {
  const search = new URLSearchParams();
  if (params?.from) search.set("from", params.from);
  if (params?.to) search.set("to", params.to);
  const qs = search.toString();
  const res = await client(auth).get<{ data: FinancePrepaidBalancesResponse }>(
    tenantPath(auth.tenantSlug, `/finance/prepaid-balances${qs ? `?${qs}` : ""}`)
  );
  return res.data;
}

export async function fetchFinanceInsights(
  auth: WorkplaceAuth,
  params?: { from?: string; to?: string }
): Promise<FinanceInsightsResponse> {
  const search = new URLSearchParams();
  if (params?.from) search.set("from", params.from);
  if (params?.to) search.set("to", params.to);
  const qs = search.toString();
  const res = await client(auth).get<{ data: FinanceInsightsResponse }>(
    tenantPath(auth.tenantSlug, `/finance/insights${qs ? `?${qs}` : ""}`)
  );
  return res.data;
}

export async function fetchFinanceTransactions(
  auth: WorkplaceAuth,
  params?: { page?: number; from?: string; to?: string; q?: string }
): Promise<FinanceTransactionsResponse> {
  const search = new URLSearchParams({
    per_page: "25",
    page: String(params?.page ?? 1),
  });
  if (params?.from) search.set("from", params.from);
  if (params?.to) search.set("to", params.to);
  if (params?.q) search.set("q", params.q);
  return client(auth).get<FinanceTransactionsResponse>(
    tenantPath(auth.tenantSlug, `/finance/transactions?${search}`)
  );
}

export async function fetchFinanceTips(
  auth: WorkplaceAuth,
  params?: { page?: number; from?: string; to?: string; q?: string }
): Promise<FinanceTipsResponse> {
  const search = new URLSearchParams({
    per_page: "25",
    page: String(params?.page ?? 1),
  });
  if (params?.from) search.set("from", params.from);
  if (params?.to) search.set("to", params.to);
  if (params?.q) search.set("q", params.q);
  return client(auth).get<FinanceTipsResponse>(
    tenantPath(auth.tenantSlug, `/finance/tips?${search}`)
  );
}

export async function lookupPrepaidBalance(
  auth: WorkplaceAuth,
  params: { type: "gift_card"; code: string } | { type: "package"; balance_uuid: string }
): Promise<{ gift_card?: { code: string; balance_cents: number; status: string }; package_balance?: { liability_cents: number; sessions_remaining: number } }> {
  const search = new URLSearchParams({ type: params.type });
  if (params.type === "gift_card") search.set("code", params.code);
  if (params.type === "package") search.set("balance_uuid", params.balance_uuid);
  const res = await client(auth).get<{ data: Record<string, unknown> }>(
    tenantPath(auth.tenantSlug, `/finance/prepaid-balances/lookup?${search}`)
  );
  return res.data as { gift_card?: { code: string; balance_cents: number; status: string }; package_balance?: { liability_cents: number; sessions_remaining: number } };
}

export async function createFinanceExpense(
  auth: WorkplaceAuth,
  body: {
    expense_category_id: number;
    vendor_name?: string | null;
    amount_cents: number;
    payment_method?: string;
    expense_date?: string;
    note?: string | null;
  }
): Promise<TenantExpense> {
  const res = await client(auth).post<{ data: TenantExpense }>(
    tenantPath(auth.tenantSlug, "/finance/expenses"),
    body
  );
  return res.data;
}
