"use client";

import { useCallback, useEffect, useState } from "react";
import { format, subDays } from "date-fns";
import { BadgePercent, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/shared/data-table";
import { MetricCard } from "@/components/shared/metric-card";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { formatMoney } from "@/lib/format/money";
import type { FinancePayrollResponse } from "@/lib/api/types";

type FinanceCommissionsViewProps = {
  tenantSlug: string;
  currency?: string;
};

export function FinanceCommissionsView({ tenantSlug, currency = "GHS" }: FinanceCommissionsViewProps) {
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
      toast.error(error instanceof ApiError ? error.message : "Could not load commissions");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = data?.summary;
  const staff = (data?.staff ?? []).filter((row) => row.commission_cents > 0 || row.commission_rate > 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Commissions</h2>
        <p className="text-sm text-muted-foreground">
          Estimated service commissions from completed appointments and staff pay profiles.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label htmlFor="commissions-from">From</Label>
          <Input
            id="commissions-from"
            type="date"
            className="mt-1 rounded-xl"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="commissions-to">To</Label>
          <Input
            id="commissions-to"
            type="date"
            className="mt-1 rounded-xl"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <div className="flex items-end sm:col-span-2 lg:col-span-2">
          <Button type="button" className="rounded-xl" onClick={() => void load()} disabled={loading}>
            {loading ? "Loading…" : "Apply dates"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Total commissions"
          value={formatMoney(summary?.commission_cents ?? 0, currency)}
          icon={TrendingUp}
        />
        <MetricCard
          title="Staff with commissions"
          value={String(staff.length)}
          icon={Users}
          hint={`${summary?.staff_count ?? 0} on payroll`}
        />
        <MetricCard
          title="Avg per earning staff"
          value={formatMoney(
            staff.length > 0 ? Math.round((summary?.commission_cents ?? 0) / staff.length) : 0,
            currency
          )}
          icon={BadgePercent}
        />
      </div>

      <Card className="rounded-2xl border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle>Commission breakdown</CardTitle>
          <CardDescription>
            Based on each staff member&apos;s commission rate and completed appointment revenue.
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
                id: "rate",
                header: "Rate",
                cell: (row) => (row.commission_rate > 0 ? `${row.commission_rate}%` : "—"),
              },
              {
                id: "commission",
                header: "Commission",
                cell: (row) => (
                  <span className="font-semibold">{formatMoney(row.commission_cents, currency)}</span>
                ),
              },
              {
                id: "status",
                header: "Status",
                cell: (row) => <Badge variant="secondary">{row.approval_status}</Badge>,
              },
            ]}
            data={staff}
            rowKey={(row) => String(row.staff_member_id)}
            loading={loading}
            emptyIcon={BadgePercent}
            emptyTitle="No commissions yet"
            emptyDescription="Set commission rates on staff pay profiles, then complete appointments to see earnings here."
          />
        </CardContent>
      </Card>
    </div>
  );
}
