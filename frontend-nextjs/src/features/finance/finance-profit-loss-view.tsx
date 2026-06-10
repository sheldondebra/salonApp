"use client";

import { useCallback, useEffect, useState } from "react";
import { format, subDays } from "date-fns";
import { Download, PieChart, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { toast } from "sonner";
import { env } from "@/config/env";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MetricCard } from "@/components/shared/metric-card";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { useAbilities } from "@/hooks/use-abilities";
import { Permissions } from "@/lib/auth/permissions";
import { formatMoney } from "@/lib/format/money";
import type { FinanceProfitLossResponse } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type FinanceProfitLossViewProps = {
  tenantSlug: string;
  currency?: string;
};

function formatSignedMoney(cents: number, currency: string) {
  const abs = formatMoney(Math.abs(cents), currency);
  if (cents < 0) return `(${abs})`;
  return abs;
}

export function FinanceProfitLossView({ tenantSlug, currency = "GHS" }: FinanceProfitLossViewProps) {
  const { can } = useAbilities(tenantSlug);
  const canExport = can(Permissions.finance.view) || can(Permissions.finance.export);

  const [data, setData] = useState<FinanceProfitLossResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(format(subDays(new Date(), 29), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ from, to });
      const result = await createApiClient(getApiClientOptions()).get<{ data: FinanceProfitLossResponse }>(
        `/${tenantSlug}/finance/profit-loss?${params}`
      );
      setData(result.data);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load profit & loss");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  async function exportCsv() {
    const params = new URLSearchParams({ from, to });
    const opts = getApiClientOptions();
    const base = env.apiUrl ? `${env.apiUrl}/api/v1` : "/api/v1";
    const url = `${base}/${tenantSlug}/finance/profit-loss/export?${params}`;

    try {
      const res = await fetch(url, {
        headers: {
          Accept: "text/csv",
          ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
          ...(opts.tenantSlug ? { "X-Tenant-Slug": String(opts.tenantSlug) } : {}),
        },
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `finance-profit-loss-${tenantSlug}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      toast.error("Could not export profit & loss");
    }
  }

  const summary = data?.summary;
  const sections = data?.sections ?? [];
  const trend = data?.monthly_trend ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Profit & Loss</h2>
          <p className="text-sm text-muted-foreground">
            Estimated income, costs, and net profit for the selected period.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="pl-from">From</Label>
            <Input id="pl-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pl-to">To</Label>
            <Input id="pl-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            Apply
          </Button>
          {canExport ? (
            <Button variant="outline" onClick={() => void exportCsv()}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Net revenue"
          value={formatMoney(summary?.net_revenue_cents ?? 0, currency)}
          icon={TrendingUp}
          hint="After discounts"
        />
        <MetricCard
          title="Gross profit"
          value={formatMoney(summary?.gross_profit_cents ?? 0, currency)}
          icon={Wallet}
          hint="After COGS"
        />
        <MetricCard
          title="Net profit"
          value={formatMoney(summary?.net_profit_cents ?? 0, currency)}
          icon={PieChart}
          hint={`${summary?.margin_percent ?? 0}% margin`}
        />
        <MetricCard
          title="Total expenses"
          value={formatMoney(summary?.total_expenses_cents ?? 0, currency)}
          icon={TrendingDown}
          hint="Payroll, fees, refunds"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Statement</CardTitle>
          <CardDescription>
            Income, cost of goods sold, and operating expenses for {from} to {to}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !data ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : sections.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data for this period.</p>
          ) : (
            <div className="divide-y rounded-lg border">
              {sections.map((row) => (
                <div
                  key={row.key}
                  className={cn(
                    "flex items-center justify-between gap-4 px-4 py-3 text-sm",
                    row.emphasis && "bg-muted/40 font-medium"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span>{row.label}</span>
                    {row.section === "summary" && row.emphasis ? (
                      <Badge variant="secondary">Subtotal</Badge>
                    ) : null}
                  </div>
                  <span
                    className={cn(
                      "tabular-nums",
                      row.amount_cents < 0 && "text-destructive",
                      row.amount_cents > 0 && row.section === "summary" && "text-emerald-600"
                    )}
                  >
                    {formatSignedMoney(row.amount_cents, currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {trend.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Monthly trend</CardTitle>
            <CardDescription>Net revenue vs expenses by month.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trend.map((point) => (
                <div key={point.month} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-medium">{point.label}</span>
                  <div className="flex flex-wrap gap-4 text-muted-foreground">
                    <span>Revenue {formatMoney(point.revenue_cents, currency)}</span>
                    <span>Expenses {formatMoney(point.expenses_cents, currency)}</span>
                    <span
                      className={cn(
                        "font-medium",
                        point.profit_cents >= 0 ? "text-emerald-600" : "text-destructive"
                      )}
                    >
                      Profit {formatSignedMoney(point.profit_cents, currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
