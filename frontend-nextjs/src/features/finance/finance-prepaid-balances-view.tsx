"use client";

import { useCallback, useEffect, useState } from "react";
import { format, subDays } from "date-fns";
import { CreditCard, Download, Gift, Repeat, Users } from "lucide-react";
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
import type { FinancePrepaidBalancesResponse } from "@/lib/api/types";

type FinancePrepaidBalancesViewProps = {
  tenantSlug: string;
  currency?: string;
};

export function FinancePrepaidBalancesView({ tenantSlug, currency = "GHS" }: FinancePrepaidBalancesViewProps) {
  const { can } = useAbilities(tenantSlug);
  const canExport = can(Permissions.finance.view) || can(Permissions.finance.export);

  const [data, setData] = useState<FinancePrepaidBalancesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(format(subDays(new Date(), 29), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [lookupCode, setLookupCode] = useState("");
  const [lookupResult, setLookupResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ from, to });
      const result = await createApiClient(getApiClientOptions()).get<{ data: FinancePrepaidBalancesResponse }>(
        `/${tenantSlug}/finance/prepaid-balances?${params}`
      );
      setData(result.data);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load prepaid balances");
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
    const url = `${base}/${tenantSlug}/finance/prepaid-balances/export?${params}`;

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
      link.download = `finance-prepaid-${tenantSlug}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      toast.error("Could not export prepaid report");
    }
  }

  async function lookupGiftCard() {
    if (!lookupCode.trim()) return;
    setLookupResult(null);
    try {
      const params = new URLSearchParams({ type: "gift_card", code: lookupCode.trim() });
      const result = await createApiClient(getApiClientOptions()).get<{
        data: { gift_card?: { code: string; balance_cents: number; status: string } };
      }>(`/${tenantSlug}/finance/prepaid-balances/lookup?${params}`);
      const card = result.data.gift_card;
      if (card) {
        setLookupResult(`${card.code}: ${formatMoney(card.balance_cents, currency)} (${card.status})`);
      }
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Gift card not found");
    }
  }

  const summary = data?.summary;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Prepaid Balances</h2>
          <p className="text-sm text-muted-foreground">
            Gift card liabilities, package credits, membership revenue, and redemptions.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="prepaid-from">From</Label>
            <Input id="prepaid-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="prepaid-to">To</Label>
            <Input id="prepaid-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
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
          title="Gift card liability"
          value={formatMoney(summary?.gift_card_liability_cents ?? 0, currency)}
          icon={CreditCard}
          hint={`${summary?.gift_card_active_count ?? 0} active cards`}
        />
        <MetricCard
          title="Package liability"
          value={formatMoney(summary?.package_liability_cents ?? 0, currency)}
          icon={Gift}
          hint={`${summary?.package_active_count ?? 0} active packages`}
        />
        <MetricCard
          title="Membership revenue"
          value={formatMoney(summary?.membership_revenue_cents ?? 0, currency)}
          icon={Users}
          hint={`${summary?.active_memberships_count ?? 0} active memberships`}
        />
        <MetricCard
          title="Redemptions"
          value={formatMoney(summary?.gift_card_redemptions_cents ?? 0, currency)}
          icon={Repeat}
          hint={`${summary?.package_redemptions_count ?? 0} package redemptions`}
        />
      </div>

      <Card className="rounded-2xl border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle>Gift card lookup</CardTitle>
          <CardDescription>Check an active gift card balance by code.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <Label htmlFor="gift-lookup">Code</Label>
            <Input
              id="gift-lookup"
              value={lookupCode}
              onChange={(e) => setLookupCode(e.target.value)}
              placeholder="Enter gift card code"
            />
          </div>
          <Button type="button" onClick={() => void lookupGiftCard()}>
            Look up
          </Button>
          {lookupResult ? <p className="text-sm font-medium text-emerald-700">{lookupResult}</p> : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle>Active gift cards</CardTitle>
            <CardDescription>Outstanding balances you may need to honor.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { id: "code", header: "Code", mobilePrimary: true, cell: (row) => row.code },
                { id: "balance", header: "Balance", cell: (row) => formatMoney(row.balance_cents, currency) },
                {
                  id: "status",
                  header: "Status",
                  cell: (row) => <Badge variant="secondary">{row.status}</Badge>,
                },
              ]}
              data={data?.active_gift_cards ?? []}
              rowKey={(row) => row.uuid}
              loading={loading && !data}
              emptyIcon={CreditCard}
              emptyTitle="No active gift cards"
              emptyDescription="Sell gift cards from POS or the Gift cards page."
            />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle>Active packages</CardTitle>
            <CardDescription>Estimated liability from unused sessions.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { id: "package", header: "Package", mobilePrimary: true, cell: (row) => row.package_name ?? "Package" },
                { id: "client", header: "Client", cell: (row) => row.client_name ?? "—" },
                {
                  id: "sessions",
                  header: "Sessions",
                  cell: (row) => `${row.sessions_remaining}/${row.sessions_total}`,
                },
                {
                  id: "liability",
                  header: "Liability",
                  cell: (row) => formatMoney(row.liability_cents, currency),
                },
              ]}
              data={data?.active_packages ?? []}
              rowKey={(row) => row.uuid}
              loading={loading && !data}
              emptyIcon={Gift}
              emptyTitle="No active packages"
              emptyDescription="Assign prepaid packages to clients from the Packages page."
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle>Membership payments</CardTitle>
            <CardDescription>Memberships sold in the selected period.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { id: "plan", header: "Plan", mobilePrimary: true, cell: (row) => row.plan_name ?? "Membership" },
                { id: "client", header: "Client", cell: (row) => row.client_name ?? "—" },
                { id: "amount", header: "Amount", cell: (row) => formatMoney(row.amount_cents, currency) },
                {
                  id: "status",
                  header: "Status",
                  cell: (row) => <Badge variant="outline">{row.status}</Badge>,
                },
              ]}
              data={data?.membership_payments ?? []}
              rowKey={(row) => row.uuid}
              loading={loading && !data}
              emptyIcon={Users}
              emptyTitle="No membership sales"
              emptyDescription="No memberships were sold in this period."
            />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle>Recent redemptions</CardTitle>
            <CardDescription>Gift card and package usage in the selected period.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { id: "type", header: "Type", cell: (row) => row.type.replace("_", " ") },
                { id: "label", header: "Reference", mobilePrimary: true, cell: (row) => row.label },
                {
                  id: "amount",
                  header: "Amount / sessions",
                  cell: (row) =>
                    row.type === "gift_card"
                      ? formatMoney(row.amount_cents ?? 0, currency)
                      : `${row.sessions_used ?? 0} session(s)`,
                },
              ]}
              data={data?.recent_redemptions ?? []}
              rowKey={(row) => `${row.type}-${row.reference ?? row.occurred_at ?? row.label}`}
              loading={loading && !data}
              emptyIcon={Repeat}
              emptyTitle="No redemptions"
              emptyDescription="Gift card and package redemptions will appear here."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
