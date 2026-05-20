"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquare, CheckCircle, Clock, XCircle } from "lucide-react";
import { RequirePlatformPermission } from "@/components/auth/require-platform-permission";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminToolbar } from "@/features/admin/admin-toolbar";
import { Permissions } from "@/lib/auth/permissions";
import { MetricCard } from "@/components/shared/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { createApiClient } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { AdminSmsResellerHub } from "@/features/sms/admin-sms-reseller-hub";

type SmsRow = {
  id: number;
  recipient: string;
  type?: string;
  status: string;
  body: string;
  created_at: string;
  sent_at?: string | null;
  tenant?: { name: string; slug: string };
};

type Summary = { total: number; sent: number; queued: number; failed: number };

export default function AdminSmsPage() {
  const [tab, setTab] = useState<"hub" | "log">("hub");
  const [rows, setRows] = useState<SmsRow[]>([]);
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
      .get<{ data: SmsRow[]; summary: Summary }>(`/admin/sms?${params}`)
      .then((res) => {
        setRows(Array.isArray(res.data) ? res.data : []);
        setSummary(res.summary ?? null);
      })
      .finally(() => setLoading(false));
  }, [search, status]);

  useEffect(() => {
    if (tab !== "log") return;
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load, tab]);

  return (
    <AdminShell title="SMS" description="Reseller hub, wallets, and delivery logs">
      <RequirePlatformPermission permission={Permissions.billing.manage}>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={tab === "hub" ? "default" : "outline"}
            className="rounded-xl"
            onClick={() => setTab("hub")}
          >
            Reseller hub
          </Button>
          <Button
            type="button"
            variant={tab === "log" ? "default" : "outline"}
            className="rounded-xl"
            onClick={() => setTab("log")}
          >
            Delivery log
          </Button>
        </div>

        {tab === "hub" ? (
          <div className="mt-6">
            <AdminSmsResellerHub />
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard title="Total" value={String(summary?.total ?? 0)} icon={MessageSquare} />
              <MetricCard title="Sent" value={String(summary?.sent ?? 0)} icon={CheckCircle} />
              <MetricCard title="Queued" value={String(summary?.queued ?? 0)} icon={Clock} />
              <MetricCard title="Failed" value={String(summary?.failed ?? 0)} icon={XCircle} />
            </div>

            <Card className="mt-6 rounded-2xl shadow-soft">
              <CardHeader>
                <CardTitle>SMS log</CardTitle>
                <AdminToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Recipient">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="h-10 w-32 rounded-xl border border-input bg-card px-3 text-sm"
                  >
                    <option value="">All</option>
                    <option value="sent">Sent</option>
                    <option value="queued">Queued</option>
                    <option value="failed">Failed</option>
                  </select>
                </AdminToolbar>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-48 rounded-xl" />
                ) : rows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No SMS messages logged yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Sent</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell>{m.recipient}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {(m.type ?? "general").replace(/_/g, " ")}
                          </TableCell>
                          <TableCell>{m.tenant?.name ?? "Platform"}</TableCell>
                          <TableCell>
                            <Badge variant={m.status === "sent" ? "default" : "secondary"}>{m.status}</Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-muted-foreground">{m.body}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(m.created_at).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </RequirePlatformPermission>
    </AdminShell>
  );
}
