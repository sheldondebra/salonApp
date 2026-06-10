"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, subDays } from "date-fns";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CircleDollarSign,
  CreditCard,
  FileText,
  HandCoins,
  Receipt,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { ErrorState } from "@/components/shared/error-state";
import { MetricCard } from "@/components/shared/metric-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { formatMoney } from "@/lib/format/money";
import type { FinanceOverview } from "@/lib/api/types";

type FinanceOverviewViewProps = {
  tenantSlug: string;
  currency?: string;
};

const CHART_COLORS = ["#ec4899", "#f97316", "#3b82f6", "#22c55e", "#a855f7", "#14b8a6"];

export function FinanceOverviewView({ tenantSlug, currency = "GHS" }: FinanceOverviewViewProps) {
  const [data, setData] = useState<FinanceOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState(format(subDays(new Date(), 29), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [locationId, setLocationId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [serviceId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ from, to });
    if (locationId) params.set("location_id", locationId);
    if (staffId) params.set("staff_id", staffId);
    if (serviceId) params.set("service_id", serviceId);

    try {
      const res = await createApiClient(getApiClientOptions()).get<FinanceOverview>(
        `/${tenantSlug}/finance/overview?${params}`
      );
      setData(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load finance overview");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, from, to, locationId, staffId, serviceId]);

  useEffect(() => {
    void load();
  }, [load]);

  const revenueChart = useMemo(
    () =>
      (data?.charts.revenue_trend ?? []).map((p) => ({
        label: p.label,
        revenue: (p.revenue_cents ?? 0) / 100,
      })),
    [data]
  );

  const paymentMethods = useMemo(
    () =>
      (data?.charts.payment_methods ?? []).map((p) => ({
        name: p.method,
        value: p.amount_cents / 100,
        count: p.count,
      })),
    [data]
  );

  const profitChart = useMemo(
    () =>
      (data?.charts.profit_estimate ?? []).map((p) => ({
        label: p.label,
        income: (p.income_cents ?? 0) / 100,
        expenses: (p.expenses_cents ?? 0) / 100,
        profit: (p.profit_cents ?? 0) / 100,
      })),
    [data]
  );

  if (loading && !data) {
    return <DashboardSkeleton />;
  }

  if (error && !data) {
    return <ErrorState description={error} onRetry={load} className="mx-auto max-w-lg" />;
  }

  const cards = data?.cards;
  const filterOptions = data?.filter_options;

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-border/60 shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Scope charts and totals by date, branch, staff, or service</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <Label className="text-xs">From</Label>
            <Input type="date" className="mt-1 rounded-xl" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">To</Label>
            <Input type="date" className="mt-1 rounded-xl" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Branch</Label>
            <select
              className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
            >
              <option value="">All branches</option>
              {(filterOptions?.locations ?? []).map((loc) => (
                <option key={loc.id} value={String(loc.id)}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs">Staff</Label>
            <select
              className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
            >
              <option value="">All staff</option>
              {(filterOptions?.staff ?? []).map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button className="w-full rounded-xl" onClick={() => void load()} disabled={loading}>
              {loading ? "Updating…" : "Apply filters"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Revenue today"
          value={formatMoney(cards?.revenue_today_cents ?? 0, currency)}
          icon={TrendingUp}
          hint="Collected payments and POS today"
        />
        <MetricCard
          title="Revenue this month"
          value={formatMoney(cards?.revenue_month_cents ?? 0, currency)}
          icon={CircleDollarSign}
        />
        <MetricCard
          title="Net revenue"
          value={formatMoney(cards?.net_revenue_cents ?? 0, currency)}
          icon={Banknote}
          hint="After discounts, fees, and estimated payroll"
        />
        <MetricCard
          title="Outstanding invoices"
          value={formatMoney(cards?.outstanding_invoices_cents ?? 0, currency)}
          icon={FileText}
          hint="Create and send invoices from Invoices"
        />
        <MetricCard
          title="Expenses"
          value={formatMoney(cards?.expenses_cents ?? 0, currency)}
          icon={Receipt}
          hint="Record costs on Expenses"
        />
        <MetricCard
          title="Payroll due"
          value={formatMoney(cards?.payroll_due_cents ?? 0, currency)}
          icon={Users}
          hint="Estimated from active salary profiles"
        />
        <MetricCard
          title="Tips collected"
          value={formatMoney(cards?.tips_collected_cents ?? 0, currency)}
          icon={HandCoins}
        />
        <MetricCard
          title="Refunds"
          value={formatMoney(cards?.refunds_cents ?? 0, currency)}
          icon={ArrowDownRight}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Revenue trend</CardTitle>
            <CardDescription>Gross collected revenue in selected range</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {revenueChart.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">No revenue in this period</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChart}>
                  <defs>
                    <linearGradient id="financeRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ec4899" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatMoney(Math.round(Number(v ?? 0) * 100), currency)} />
                  <Area type="monotone" dataKey="revenue" stroke="#ec4899" fill="url(#financeRevenue)" name="Revenue" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Payment methods</CardTitle>
            <CardDescription>POS and gateway collections in range</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {paymentMethods.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">No payment data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentMethods} dataKey="value" nameKey="name" innerRadius={56} outerRadius={88} paddingAngle={2}>
                    {paymentMethods.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatMoney(Math.round(Number(v ?? 0) * 100), currency)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Service revenue</CardTitle>
            <CardDescription>Top services by booked/collected value</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(data?.charts.service_revenue ?? []).slice(0, 6).map((s) => ({
                name: s.name?.length > 14 ? `${s.name.slice(0, 14)}…` : s.name,
                revenue: (s.revenue_cents ?? 0) / 100,
              }))}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatMoney(Math.round(Number(v ?? 0) * 100), currency)} />
                <Bar dataKey="revenue" fill="#f97316" radius={[6, 6, 0, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Staff revenue</CardTitle>
            <CardDescription>Top performers in selected range</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(data?.charts.staff_revenue ?? []).slice(0, 6).map((s) => ({
                name: s.name?.length > 14 ? `${s.name.slice(0, 14)}…` : s.name,
                revenue: (s.revenue_cents ?? 0) / 100,
              }))}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatMoney(Math.round(Number(v ?? 0) * 100), currency)} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Profit estimate</CardTitle>
            <CardDescription>Income vs estimated daily costs in range</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={profitChart}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatMoney(Math.round(Number(v ?? 0) * 100), currency)} />
                <Area type="monotone" dataKey="income" stackId="1" stroke="#22c55e" fill="#22c55e33" name="Income" />
                <Area type="monotone" dataKey="expenses" stackId="2" stroke="#ef4444" fill="#ef444433" name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl shadow-soft lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent payments</CardTitle>
            <CardDescription>Latest payment requests and card transactions</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border/60 p-0">
            {(data?.recent_payments ?? []).length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-muted-foreground">No recent payments</p>
            ) : (
              (data?.recent_payments ?? []).map((row) => (
                <div key={`${row.source}-${row.id}`} className="flex items-center justify-between gap-3 px-6 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{row.customer_name ?? row.reference}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.source === "payment_request" ? "Payment request" : "Card payment"} · {row.status}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">{formatMoney(row.amount_cents, row.currency || currency)}</p>
                    {row.occurred_at ? (
                      <p className="text-[11px] text-muted-foreground">
                        {format(new Date(row.occurred_at), "MMM d, h:mm a")}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-primary/20 bg-primary/5 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4 text-primary" />
              Wallet snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">Available</p>
              <p className="text-2xl font-bold">{formatMoney(cards?.wallet_available_cents ?? 0, currency)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-lg font-semibold">{formatMoney(cards?.wallet_pending_cents ?? 0, currency)}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card/80 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pending payments</span>
                <span className="font-medium">{cards?.pending_payments_count ?? 0}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-muted-foreground">Failed payments</span>
                <span className="font-medium text-destructive">{cards?.failed_payments_count ?? 0}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CreditCard className="h-3.5 w-3.5" />
              Platform fees (lifetime): {formatMoney(cards?.platform_fees_cents ?? 0, currency)}
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-700">
              <ArrowUpRight className="h-3.5 w-3.5" />
              Gross in range: {formatMoney(cards?.gross_revenue_cents ?? 0, currency)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
