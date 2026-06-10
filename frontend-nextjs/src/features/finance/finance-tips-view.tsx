"use client";

import { useCallback, useEffect, useState } from "react";
import { format, subDays } from "date-fns";
import { HandCoins, Search } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/shared/data-table";
import { MetricCard } from "@/components/shared/metric-card";
import { CrudPagination } from "@/features/crud/crud-pagination";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatMoney } from "@/lib/format/money";
import type { FinanceTipEntry, FinanceTipsResponse } from "@/lib/api/types";

type FinanceTipsViewProps = {
  tenantSlug: string;
  currency?: string;
};

export function FinanceTipsView({ tenantSlug, currency = "GHS" }: FinanceTipsViewProps) {
  const [rows, setRows] = useState<FinanceTipEntry[]>([]);
  const [meta, setMeta] = useState<FinanceTipsResponse["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState(format(subDays(new Date(), 29), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), per_page: "20", from, to });
      if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());

      const result = await createApiClient(getApiClientOptions()).get<FinanceTipsResponse>(
        `/${tenantSlug}/finance/tips?${params}`
      );
      setRows(result.data ?? []);
      setMeta(result.meta);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load tips");
      setRows([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, page, from, to, debouncedQuery]);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = meta?.summary;
  const trend = meta?.monthly_trend ?? [];
  const bestMonth = trend.reduce<(typeof trend)[number] | null>(
    (best, point) => (!best || point.tips_cents > best.tips_cents ? point : best),
    null
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Tips</h2>
        <p className="text-sm text-muted-foreground">
          Tips collected at shop checkout. Add a tip when completing a POS sale.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          title="Total tips"
          value={formatMoney(summary?.total_tips_cents ?? 0, currency)}
          icon={HandCoins}
          hint={`${summary?.tip_count ?? 0} checkout${summary?.tip_count === 1 ? "" : "s"}`}
        />
        <MetricCard
          title="Average tip"
          value={formatMoney(summary?.average_tip_cents ?? 0, currency)}
          icon={HandCoins}
        />
        <MetricCard
          title="Best month"
          value={formatMoney(bestMonth?.tips_cents ?? 0, currency)}
          icon={Search}
          hint={bestMonth?.label}
        />
      </div>

      {trend.length > 0 ? (
        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Monthly tips</CardTitle>
            <CardDescription>Last six months from shop checkout</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {trend.map((point) => (
                <div key={point.month} className="rounded-xl border border-border/60 p-3 text-center">
                  <p className="text-xs text-muted-foreground">{point.label}</p>
                  <p className="mt-1 font-semibold">{formatMoney(point.tips_cents, currency)}</p>
                  <p className="text-xs text-muted-foreground">{point.tip_count} sale{point.tip_count === 1 ? "" : "s"}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-2xl border-border/60 shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label className="text-xs">From</Label>
            <Input type="date" className="mt-1 rounded-xl" value={from} onChange={(e) => { setPage(1); setFrom(e.target.value); }} />
          </div>
          <div>
            <Label className="text-xs">To</Label>
            <Input type="date" className="mt-1 rounded-xl" value={to} onChange={(e) => { setPage(1); setTo(e.target.value); }} />
          </div>
          <div>
            <Label className="text-xs">Search</Label>
            <Input className="mt-1 rounded-xl" placeholder="Sale # or customer…" value={query} onChange={(e) => { setPage(1); setQuery(e.target.value); }} />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle>Tip history</CardTitle>
          <CardDescription>Each row is a completed shop sale that included a tip</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <DataTable
            columns={[
              {
                id: "completed_at",
                header: "Date",
                mobilePrimary: true,
                cell: (row) => row.completed_at ? format(new Date(row.completed_at), "MMM d, yyyy · h:mm a") : "—",
              },
              {
                id: "sale_number",
                header: "Sale",
                cell: (row) => row.sale_number ?? `#${row.id}`,
              },
              {
                id: "customer",
                header: "Customer",
                cell: (row) => row.customer?.name ?? "Walk-in",
              },
              {
                id: "branch",
                header: "Branch",
                cell: (row) => row.branch?.name ?? "—",
              },
              {
                id: "payment_method",
                header: "Payment",
                cell: (row) => (row.payment_method ?? "—").replace(/_/g, " "),
              },
              {
                id: "tip_cents",
                header: "Tip",
                className: "text-right font-medium",
                cell: (row) => formatMoney(row.tip_cents, row.currency || currency),
              },
              {
                id: "total_cents",
                header: "Sale total",
                className: "text-right",
                cell: (row) => formatMoney(row.total_cents, row.currency || currency),
              },
            ]}
            data={rows}
            rowKey={(row) => String(row.id)}
            loading={loading}
            emptyIcon={HandCoins}
            emptyTitle="No tips yet"
            emptyDescription="Tips added at shop checkout will show up here."
          />
          <CrudPagination meta={meta} page={page} onPageChange={setPage} />
        </CardContent>
      </Card>
    </div>
  );
}
