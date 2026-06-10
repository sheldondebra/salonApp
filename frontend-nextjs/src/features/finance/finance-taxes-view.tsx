"use client";

import { useCallback, useEffect, useState } from "react";
import { format, subDays } from "date-fns";
import { Calculator, Download, Percent, Receipt, Store } from "lucide-react";
import { toast } from "sonner";
import { env } from "@/config/env";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/shared/data-table";
import { MetricCard } from "@/components/shared/metric-card";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { useAbilities } from "@/hooks/use-abilities";
import { Permissions } from "@/lib/auth/permissions";
import { formatMoney } from "@/lib/format/money";
import type { FinanceTaxReport, TenantTaxRate } from "@/lib/api/types";

type FinanceTaxesViewProps = {
  tenantSlug: string;
  currency?: string;
};

export function FinanceTaxesView({ tenantSlug, currency = "GHS" }: FinanceTaxesViewProps) {
  const { can } = useAbilities(tenantSlug);
  const canManage = can(Permissions.settings.manage) || can(Permissions.finance.taxesManage);

  const [rates, setRates] = useState<TenantTaxRate[]>([]);
  const [report, setReport] = useState<FinanceTaxReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(format(subDays(new Date(), 29), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [savingId, setSavingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ from, to });
      const [ratesRes, reportRes] = await Promise.all([
        createApiClient(getApiClientOptions()).get<{ data: TenantTaxRate[] }>(
          `/${tenantSlug}/finance/tax-rates`
        ),
        createApiClient(getApiClientOptions()).get<{ data: FinanceTaxReport }>(
          `/${tenantSlug}/finance/taxes/report?${params}`
        ),
      ]);
      setRates(ratesRes.data ?? []);
      setReport(reportRes.data);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load tax data");
      setRates([]);
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateRate(rate: TenantTaxRate, patch: Partial<TenantTaxRate>) {
    setSavingId(rate.id);
    try {
      const res = await createApiClient(getApiClientOptions()).patch<{ data: TenantTaxRate }>(
        `/${tenantSlug}/finance/tax-rates/${rate.id}`,
        patch
      );
      setRates((prev) => prev.map((r) => (r.id === rate.id ? res.data : r)));
      if (patch.is_default) {
        setRates((prev) =>
          prev.map((r) => ({ ...r, is_default: r.id === rate.id }))
        );
      }
      toast.success("Tax rate updated");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not update rate");
    } finally {
      setSavingId(null);
    }
  }

  async function exportReport() {
    const params = new URLSearchParams({ from, to });
    const opts = getApiClientOptions();
    const base = env.apiUrl ? `${env.apiUrl}/api/v1` : "/api/v1";
    const url = `${base}/${tenantSlug}/finance/taxes/report/export?${params}`;
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
      link.download = `finance-tax-${tenantSlug}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      toast.error("Could not export tax report");
    }
  }

  const summary = report?.summary;
  const trend = report?.monthly_trend ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Taxes & VAT</h2>
          <p className="text-sm text-muted-foreground">
            Configure tax rates and review tax collected from POS and invoices.
          </p>
        </div>
        <Button type="button" variant="outline" className="rounded-xl gap-2" onClick={() => void exportReport()}>
          <Download className="h-4 w-4" />
          Export report
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="tax-from">From</Label>
          <Input id="tax-from" type="date" className="mt-1 rounded-xl" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="tax-to">To</Label>
          <Input id="tax-to" type="date" className="mt-1 rounded-xl" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Tax collected"
          value={formatMoney(summary?.tax_collected_cents ?? 0, currency)}
          icon={Calculator}
          hint="POS + invoices"
        />
        <MetricCard
          title="Taxable sales"
          value={formatMoney(summary?.taxable_sales_cents ?? 0, currency)}
          icon={Receipt}
        />
        <MetricCard
          title="POS tax"
          value={formatMoney(summary?.pos_tax_cents ?? 0, currency)}
          icon={Store}
          hint={`${summary?.pos_sale_count ?? 0} sales`}
        />
        <MetricCard
          title="Invoice tax"
          value={formatMoney(summary?.invoice_tax_cents ?? 0, currency)}
          icon={Percent}
          hint={`${summary?.invoice_count ?? 0} invoices`}
        />
      </div>

      {trend.length > 0 ? (
        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle>Tax by month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {trend.map((point) => (
                <div key={point.month} className="rounded-xl border border-border/60 p-3 text-center">
                  <p className="text-xs text-muted-foreground">{point.label}</p>
                  <p className="mt-1 font-semibold">{formatMoney(point.tax_cents, currency)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-2xl border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle>Tax rates</CardTitle>
          <CardDescription>
            Default rate is used for POS tax preview. Apply tax % at checkout or on invoices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={[
              {
                id: "name",
                header: "Name",
                mobilePrimary: true,
                cell: (row) => (
                  <div>
                    <p className="font-medium">{row.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {row.applies_to} · {row.inclusive_or_exclusive}
                    </p>
                  </div>
                ),
              },
              {
                id: "rate",
                header: "Rate %",
                cell: (row) =>
                  canManage ? (
                    <Input
                      className="w-24 rounded-lg h-9"
                      type="number"
                      min={0}
                      max={100}
                      step="0.1"
                      defaultValue={row.rate}
                      disabled={savingId === row.id}
                      onBlur={(e) => {
                        const next = parseFloat(e.target.value);
                        if (!Number.isNaN(next) && next !== row.rate) {
                          void updateRate(row, { rate: next });
                        }
                      }}
                    />
                  ) : (
                    `${row.rate}%`
                  ),
              },
              {
                id: "default",
                header: "Default",
                cell: (row) =>
                  row.is_default ? (
                    <Badge variant="success">Default</Badge>
                  ) : canManage ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 rounded-lg"
                      disabled={savingId === row.id}
                      onClick={() => void updateRate(row, { is_default: true })}
                    >
                      Set default
                    </Button>
                  ) : (
                    "—"
                  ),
              },
              {
                id: "status",
                header: "Status",
                cell: (row) => (
                  <Badge variant={row.is_active ? "success" : "secondary"}>
                    {row.is_active ? "Active" : "Inactive"}
                  </Badge>
                ),
              },
            ]}
            data={rates}
            rowKey={(row) => String(row.id)}
            loading={loading}
            emptyIcon={Calculator}
            emptyTitle="No tax rates"
            emptyDescription="Default VAT will appear on first load."
          />
        </CardContent>
      </Card>
    </div>
  );
}
