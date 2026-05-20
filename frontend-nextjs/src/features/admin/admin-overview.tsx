"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Building2, CreditCard, MessageSquare, Server, UserCheck, Users } from "lucide-react";
import { MetricCard } from "@/components/shared/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import { Button } from "@/components/ui/button";
import { createApiClient } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { formatMoney } from "@/lib/format/money";

type DashboardStats = {
  tenants: number;
  paid_subscriptions: number;
  unpaid_signups: number;
  paid_awaiting_setup: number;
  onboarded_owners: number;
  revenue_cents: number;
  sms_sent: number;
  sms_failed: number;
  mnotify_balance?: number;
  mnotify_status?: string;
  mnotify_last_synced_at?: string | null;
};

type ChartPoint = { month: string; count?: number; revenue_cents?: number };

type RecentTenant = {
  name: string;
  slug: string;
  plan: string;
  status?: string;
  created_at: string;
};

export function AdminOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [signups, setSignups] = useState<ChartPoint[]>([]);
  const [revenue, setRevenue] = useState<ChartPoint[]>([]);
  const [recent, setRecent] = useState<RecentTenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createApiClient(getApiClientOptions())
      .get<{
        stats: DashboardStats;
        recent_tenants: RecentTenant[];
        charts: { signups: ChartPoint[]; revenue: ChartPoint[] };
      }>("/admin/dashboard")
      .then((res) => {
        setStats(res.stats);
        setRecent(res.recent_tenants ?? []);
        setSignups(res.charts?.signups ?? []);
        setRevenue(res.charts?.revenue ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;

  const cards = [
    { title: "Active tenants", value: String(stats?.tenants ?? 0), icon: Building2 },
    {
      title: "Platform revenue",
      value: formatMoney(stats?.revenue_cents ?? 0),
      icon: CreditCard,
      hint: "All-time paid subscriptions",
    },
    { title: "Paid subscriptions", value: String(stats?.paid_subscriptions ?? 0), icon: CreditCard },
    { title: "Onboarded owners", value: String(stats?.onboarded_owners ?? 0), icon: UserCheck },
    { title: "Unpaid signups", value: String(stats?.unpaid_signups ?? 0), icon: Users },
    {
      title: "SMS delivered",
      value: String(stats?.sms_sent ?? 0),
      icon: MessageSquare,
      hint: stats?.sms_failed ? `${stats.sms_failed} failed` : undefined,
    },
    {
      title: "MNotify balance",
      value: String(stats?.mnotify_balance ?? 0),
      icon: Server,
      hint: stats?.mnotify_last_synced_at
        ? `Synced ${new Date(stats.mnotify_last_synced_at).toLocaleString()} · ${stats.mnotify_status ?? "—"}`
        : stats?.mnotify_status ?? "Sync in Admin → SMS",
    },
  ];

  const formatMonth = (m: string) => {
    const [y, mo] = m.split("-");
    return new Date(Number(y), Number(mo) - 1).toLocaleDateString("en-US", { month: "short" });
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <MetricCard key={c.title} title={c.title} value={c.value} hint={c.hint} icon={c.icon} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Owner signups</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={signups}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                <XAxis dataKey="month" tickFormatter={formatMonth} fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip labelFormatter={(label) => formatMonth(String(label))} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Subscription revenue</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                <XAxis dataKey="month" tickFormatter={formatMonth} fontSize={12} />
                <YAxis tickFormatter={(v) => formatMoney(Number(v))} fontSize={12} />
                <Tooltip
                  labelFormatter={(label) => formatMonth(String(label))}
                  formatter={(value) => [formatMoney(Number(value)), "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue_cents"
                  stroke="hsl(var(--accent))"
                  fill="hsl(var(--primary) / 0.25)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent salons</CardTitle>
          <Button variant="outline" size="sm" className="rounded-xl" asChild>
            <Link href="/admin/tenants">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tenants yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((t) => (
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
