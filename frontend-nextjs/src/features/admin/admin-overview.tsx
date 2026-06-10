"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  Building2,
  CreditCard,
  LifeBuoy,
  MessageSquare,
  Server,
  TrendingUp,
  Users,
} from "lucide-react";
import { MetricCard } from "@/components/shared/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import { Button } from "@/components/ui/button";
import { createApiClient } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { formatMoney } from "@/lib/format/money";

type CommandCards = {
  active_tenants: number;
  trial_tenants: number;
  mrr_cents: number;
  revenue_collected_cents: number;
  failed_payments: number;
  open_support_tickets: number;
  sms_balance: number;
  provider_incidents: number;
};

type ChartPoint = { month: string; count?: number; revenue_cents?: number; amount_cents?: number };

type PlatformAlert = {
  type: string;
  title: string;
  count: number;
  severity: string;
};

type RecentTenant = {
  name: string;
  slug: string;
  plan: string;
  status?: string;
  created_at: string;
};

type OverviewResponse = {
  cards: CommandCards;
  stats?: Record<string, number | string | null>;
  alerts?: PlatformAlert[];
  recent_tenants: RecentTenant[];
  charts: {
    mrr_trend: ChartPoint[];
    tenant_growth: ChartPoint[];
    payment_volume: ChartPoint[];
    support_ticket_trend: ChartPoint[];
    signups?: ChartPoint[];
    revenue?: ChartPoint[];
  };
};

export function AdminOverview() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createApiClient(getApiClientOptions())
      .get<OverviewResponse>("/admin/overview")
      .then(setData)
      .catch(() =>
        createApiClient(getApiClientOptions())
          .get<OverviewResponse>("/admin/dashboard")
          .then(setData)
      )
      .finally(() => setLoading(false));
  }, []);

  const cards = data?.cards;
  const alerts = data?.alerts ?? [];

  if (loading) return <DashboardSkeleton />;

  const formatMonth = (m: string) => {
    const [y, mo] = m.split("-");
    return new Date(Number(y), Number(mo) - 1).toLocaleDateString("en-US", { month: "short" });
  };

  const metricCards = [
    { title: "Active tenants", value: String(cards?.active_tenants ?? 0), icon: Building2 },
    { title: "Trial tenants", value: String(cards?.trial_tenants ?? 0), icon: Users },
    {
      title: "MRR",
      value: formatMoney(cards?.mrr_cents ?? 0),
      icon: TrendingUp,
      hint: "Estimated from active plan prices",
    },
    {
      title: "Revenue collected",
      value: formatMoney(cards?.revenue_collected_cents ?? 0),
      icon: CreditCard,
      hint: "All-time paid subscriptions",
    },
    {
      title: "Failed payments",
      value: String(cards?.failed_payments ?? 0),
      icon: AlertTriangle,
      hint: cards?.failed_payments ? "Review payment failures" : undefined,
    },
    {
      title: "Open support tickets",
      value: String(cards?.open_support_tickets ?? 0),
      icon: LifeBuoy,
    },
    {
      title: "SMS balance",
      value: String(cards?.sms_balance ?? 0),
      icon: MessageSquare,
      hint: "MNotify reseller credits",
    },
    {
      title: "Provider incidents",
      value: String(cards?.provider_incidents ?? 0),
      icon: Server,
      hint: "MTN MoMo + SMS provider health",
    },
  ];

  return (
    <div className="space-y-8">
      {alerts.length > 0 ? (
        <Card className="rounded-2xl border-amber-500/30 bg-amber-500/5 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Platform alerts
              <span className="ml-auto text-xs font-normal text-muted-foreground">
                {alerts.reduce((sum, alert) => sum + alert.count, 0)} items
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {alerts.map((alert) => (
              <Link
                key={alert.type}
                href={
                  alert.type === "failed_payments"
                    ? "/admin/payment-failures"
                    : alert.type === "provider_health"
                      ? "/admin/provider-health"
                      : alert.type === "support"
                        ? "/admin/support"
                        : "/admin/tenants"
                }
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm hover:bg-muted/50"
              >
                <span className="font-medium">{alert.title}</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  {alert.count}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((c) => (
          <MetricCard key={c.title} title={c.title} value={c.value} hint={c.hint} icon={c.icon} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="MRR trend" data={data?.charts.mrr_trend ?? []} dataKey="revenue_cents" formatMonth={formatMonth} type="area" />
        <ChartCard title="Tenant growth" data={data?.charts.tenant_growth ?? []} dataKey="count" formatMonth={formatMonth} type="bar" />
        <ChartCard
          title="Payment volume"
          data={data?.charts.payment_volume ?? []}
          dataKey="amount_cents"
          formatMonth={formatMonth}
          type="area"
          valueFormatter={(v) => formatMoney(Number(v))}
        />
        <ChartCard title="Support ticket trend" data={data?.charts.support_ticket_trend ?? []} dataKey="count" formatMonth={formatMonth} type="line" />
      </div>

      <Card className="rounded-2xl shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent salons</CardTitle>
          <Button variant="outline" size="sm" className="rounded-xl" asChild>
            <Link href="/admin/tenants">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {(data?.recent_tenants ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No tenants yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data?.recent_tenants.map((t) => (
                <li key={t.slug} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium">{t.name}</p>
                    <p className="text-muted-foreground">/{t.slug}</p>
                  </div>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs capitalize">
                    {t.plan}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ChartCard({
  title,
  data,
  dataKey,
  formatMonth,
  type,
  valueFormatter,
}: {
  title: string;
  data: ChartPoint[];
  dataKey: string;
  formatMonth: (m: string) => string;
  type: "bar" | "area" | "line";
  valueFormatter?: (v: number) => string;
}) {
  const formatValue = valueFormatter ?? ((v: number) => String(v));

  return (
    <Card className="rounded-2xl shadow-soft">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {type === "bar" ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
              <XAxis dataKey="month" tickFormatter={formatMonth} fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip labelFormatter={(label) => formatMonth(String(label))} />
              <Bar dataKey={dataKey} fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          ) : type === "line" ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
              <XAxis dataKey="month" tickFormatter={formatMonth} fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip labelFormatter={(label) => formatMonth(String(label))} />
              <Line type="monotone" dataKey={dataKey} stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
            </LineChart>
          ) : (
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
              <XAxis dataKey="month" tickFormatter={formatMonth} fontSize={12} />
              <YAxis tickFormatter={(v) => formatValue(Number(v))} fontSize={12} />
              <Tooltip
                labelFormatter={(label) => formatMonth(String(label))}
                formatter={(value) => [formatValue(Number(value)), title]}
              />
              <Area type="monotone" dataKey={dataKey} stroke="hsl(var(--accent))" fill="hsl(var(--primary) / 0.25)" />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}