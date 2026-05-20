"use client";

import { useCallback, useEffect, useState } from "react";
import { Ticket } from "lucide-react";
import { RequirePlatformPermission } from "@/components/auth/require-platform-permission";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminToolbar } from "@/features/admin/admin-toolbar";
import { Permissions } from "@/lib/auth/permissions";
import { formatMoney } from "@/lib/format/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/metric-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { createApiClient } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { CreditCard, Clock, DollarSign } from "lucide-react";

type SubRow = {
  id: number;
  plan_id: string;
  status: string;
  final_amount_cents: number;
  currency: string;
  paid_at: string | null;
  user?: { name: string; email: string };
};

type Summary = { total: number; paid: number; pending: number; mrr_cents: number };

export default function AdminSubscriptionsPage() {
  const [rows, setRows] = useState<SubRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (status) params.set("status", status);
    createApiClient(getApiClientOptions())
      .get<{ data: SubRow[]; summary: Summary }>(`/admin/subscriptions?${params}`)
      .then((res) => {
        setRows(Array.isArray(res.data) ? res.data : []);
        setSummary(res.summary ?? null);
      })
      .finally(() => setLoading(false));
  }, [search, status]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <AdminShell title="Subscriptions" description="Platform subscription lifecycle">
      <RequirePlatformPermission permission={Permissions.billing.manage}>
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard title="Total" value={String(summary?.total ?? 0)} icon={Ticket} />
          <MetricCard title="Paid" value={String(summary?.paid ?? 0)} icon={CreditCard} />
          <MetricCard
            title="30-day revenue"
            value={formatMoney(summary?.mrr_cents ?? 0)}
            icon={DollarSign}
          />
        </div>

        <Card className="mt-6 rounded-2xl shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent" />
              Subscriptions
            </CardTitle>
            <AdminToolbar search={search} onSearchChange={setSearch}>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-10 w-36 rounded-xl border border-input bg-card px-3 text-sm"
              >
                <option value="">All status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </AdminToolbar>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 rounded-xl" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Owner</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Paid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="font-medium">{s.user?.name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{s.user?.email}</div>
                      </TableCell>
                      <TableCell className="capitalize">{s.plan_id}</TableCell>
                      <TableCell>{formatMoney(s.final_amount_cents, s.currency)}</TableCell>
                      <TableCell>
                        <Badge variant={s.status === "paid" ? "default" : "secondary"}>{s.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {s.paid_at ? new Date(s.paid_at).toLocaleDateString() : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </RequirePlatformPermission>
    </AdminShell>
  );
}
