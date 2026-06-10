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
  wallet_available_cents: number;
  wallet_pending_cents: number;
  pending_payments_count: number;
  failed_payments_count: number;
};

export type FinanceChartPoint = {
  date: string;
  label: string;
  revenue_cents?: number;
};

export type FinanceRecentPayment = {
  id: number;
  source: string;
  reference: string;
  status: string;
  amount_cents: number;
  currency: string;
  customer_name?: string | null;
  occurred_at?: string | null;
};

export type FinanceOverview = {
  cards: FinanceOverviewCards;
  charts: {
    revenue_trend: FinanceChartPoint[];
    payment_methods: { method: string; amount_cents: number; count: number }[];
  };
  recent_payments: FinanceRecentPayment[];
};

export type FinancePayrollStaffRow = {
  staff_member_id: number;
  staff_name: string;
  job_title: string | null;
  pay_type: string;
  pay_role_name: string | null;
  base_pay_cents: number;
  commission_cents: number;
  tips_owed_cents: number;
  total_earnings_cents: number;
  approval_status: string;
};

export type FinancePayrollResponse = {
  filters: { from: string; to: string };
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
  status: string;
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
  applies_to: string;
  inclusive_or_exclusive: string;
  is_active: boolean;
  is_default: boolean;
};

export type FinanceTaxReport = {
  summary: {
    tax_collected_cents: number;
    taxable_sales_cents: number;
    pos_tax_cents: number;
    invoice_tax_cents: number;
    pos_sale_count: number;
    invoice_count: number;
  };
  monthly_trend: Array<{ month: string; label: string; tax_cents: number }>;
};

export type FinanceProfitLossResponse = {
  filters: { from: string; to: string };
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
  sections: Array<{
    key: string;
    label: string;
    section: string;
    amount_cents: number;
    emphasis?: boolean;
  }>;
  monthly_trend: Array<{
    month: string;
    label: string;
    revenue_cents: number;
    expenses_cents: number;
    profit_cents: number;
  }>;
};

export type FinancePrepaidBalancesResponse = {
  summary: {
    gift_card_liability_cents: number;
    package_liability_cents: number;
    membership_revenue_cents: number;
    gift_card_redemptions_cents: number;
    gift_card_active_count: number;
    package_active_count: number;
    active_memberships_count: number;
    package_redemptions_count: number;
    total_prepaid_liability_cents: number;
  };
  active_gift_cards: Array<{
    uuid: string;
    code: string;
    balance_cents: number;
    status: string;
  }>;
  active_packages: Array<{
    uuid: string;
    package_name: string | null;
    client_name: string | null;
    sessions_remaining: number;
    sessions_total: number;
    liability_cents: number;
  }>;
  recent_redemptions: Array<{
    type: string;
    label: string;
    amount_cents: number | null;
    sessions_used?: number;
    occurred_at: string | null;
  }>;
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

export type FinanceTipEntry = {
  id: number;
  source: string;
  sale_number: string | null;
  tip_cents: number;
  total_cents: number;
  currency: string;
  payment_method: string | null;
  completed_at: string | null;
  customer?: { id: number; name: string } | null;
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
    monthly_trend: Array<{ month: string; label: string; tips_cents: number; tip_count: number }>;
  };
};

export type FinanceInsight = {
  id: string;
  severity: string;
  title: string;
  message: string;
  action: string;
  metric_value: number;
};

export type FinanceInsightsResponse = {
  forecast: {
    mtd_revenue_cents: number;
    projected_month_revenue_cents: number;
    daily_average_cents: number;
  };
  metrics: {
    refund_rate_percent: number;
    discount_rate_percent: number;
    payroll_to_revenue_percent: number;
    expense_change_percent: number;
  };
  highlights?: {
    top_staff: Array<{ staff_id: number | null; name: string; revenue_cents: number }>;
    underperforming_services: Array<{
      service_id: number;
      name: string;
      avg_revenue_cents: number;
    }>;
  };
  insights: FinanceInsight[];
  alert_channels: Array<{
    channel: string;
    label: string;
    enabled: boolean;
    placeholder: boolean;
    note: string;
  }>;
  busiest_days: Array<{ label: string; revenue_cents: number }>;
};
