"use client";

import { useCallback, useEffect, useState } from "react";
import { format, subDays } from "date-fns";
import { Download, HandCoins, TrendingUp, Users, Wallet } from "lucide-react";
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
import type { FinancePayrollResponse } from "@/lib/api/types";

type FinancePayrollViewProps = {
  tenantSlug: string;
  currency?: string;
};

export function FinancePayrollView({ tenantSlug, currency = "GHS" }: FinancePayrollViewProps) {
  const { can } = useAbilities(tenantSlug);
  const canExport = can(Permissions.finance.view) || can(Permissions.finance.export);

  const [data, setData] = useState<FinancePayrollResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(format(subDays(new Date(), 29), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ from, to });
      const result = await createApiClient(getApiClientOptions()).get<{ data: FinancePayrollResponse }>(
        `/${tenantSlug}/finance/payroll?${params}`
      );
      setData(result.data);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load payroll");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = data?.summary;
  const staff = data?.staff ?? [];

  async function exportCsv() {
    const params = new URLSearchParams({ from, to });
    const opts = getApiClientOptions();
    const base = env.apiUrl ? `${env.apiUrl}/api/v1` : "/api/v1";
    const url = `${base}/${tenantSlug}/finance/payroll/export?${params}`;

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
      link.download = `finance-payroll-${tenantSlug}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      toast.error("Could not export payroll");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Payroll & earnings</h2>
          <p className="text-sm text-muted-foreground">
            Estimated staff cost from pay profiles, completed appointment commissions, and attributed tips.
          </p>
        </div>
        {canExport ? (
          <Button type="button" variant="outline" className="rounded-xl gap-2" onClick={() => void exportCsv()}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label htmlFor="payroll-from">From</Label>
          <Input id="payroll-from" type="date" className="mt-1 rounded-xl" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="payroll-to">To</Label>
          <Input id="payroll-to" type="date" className="mt-1 rounded-xl" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total payroll"
          value={formatMoney(summary?.total_payroll_cents ?? 0, currency)}
          icon={Users}
          hint={`${summary?.staff_count ?? 0} staff`}
        />
        <MetricCard title="Base pay" value={formatMoney(summary?.base_pay_cents ?? 0, currency)} icon={Wallet} />
        <MetricCard title="Commissions" value={formatMoney(summary?.commission_cents ?? 0, currency)} icon={TrendingUp} />
        <MetricCard title="Tips owed" value={formatMoney(summary?.tips_owed_cents ?? 0, currency)} icon={HandCoins} />
      </div>

      <Card className="rounded-2xl border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle>Staff earnings</CardTitle>
          <CardDescription>
            Amounts are estimates for the selected period. Formal pay runs and approvals can be added later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={[
              {
                id: "staff",
                header: "Staff",
                mobilePrimary: true,
                cell: (row) => (
                  <div>
                    <p className="font-medium">{row.staff_name}</p>
                    <p className="text-xs text-muted-foreground">{row.job_title ?? row.pay_type}</p>
                  </div>
                ),
              },
              {
                id: "pay_role",
                header: "Pay role",
                cell: (row) => row.pay_role_name ?? "—",
              },
              {
                id: "base",
                header: "Base",
                cell: (row) => formatMoney(row.base_pay_cents, currency),
              },
              {
                id: "commission",
                header: "Commission",
                cell: (row) => formatMoney(row.commission_cents, currency),
              },
              {
                id: "tips",
                header: "Tips",
                cell: (row) => formatMoney(row.tips_owed_cents, currency),
              },
              {
                id: "total",
                header: "Total",
                cell: (row) => (
                  <span className="font-semibold">{formatMoney(row.total_earnings_cents, currency)}</span>
                ),
              },
              {
                id: "status",
                header: "Status",
                cell: (row) => (
                  <Badge variant="secondary">{row.approval_status}</Badge>
                ),
              },
            ]}
            data={staff}
            rowKey={(row) => String(row.staff_member_id)}
            loading={loading}
            emptyIcon={Users}
            emptyTitle="No staff earnings"
            emptyDescription="Add payroll profiles under Team, then complete appointments and POS sales with tips."
          />
        </CardContent>
      </Card>
    </div>
  );
}
