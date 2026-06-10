"use client";

import { useCallback, useEffect, useState } from "react";
import { Wallet, AlertTriangle, Server, CheckCircle2, XCircle } from "lucide-react";
import type { MnotifySettings } from "@/features/sms/admin-mnotify-settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/metric-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { createApiClient } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";

type ProviderInfo = MnotifySettings & {
  recent_failed_syncs?: number;
};

type Overview = {
  provider: ProviderInfo;
  summary: {
    tenant_count: number;
    total_tenant_balance: number;
    total_tenant_used: number;
    low_balance_tenants: number;
  };
};

type WalletRow = {
  tenant_id: number;
  balance_credits: number;
  total_used: number;
  is_low_balance: boolean;
  tenant?: { name: string; slug: string };
};

type TxRow = {
  id: number;
  type: string;
  amount: number;
  balance_after: number;
  notes: string | null;
  created_at: string;
};

type SyncLogRow = {
  id: number;
  status: string;
  balance_before: number | null;
  balance_after: number | null;
  message: string | null;
  created_at: string;
};

export function AdminSmsResellerHub() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [wallets, setWallets] = useState<WalletRow[]>([]);
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const client = createApiClient(getApiClientOptions());
    Promise.all([
      client.get<Overview>("/admin/sms-reseller/overview"),
      client.get<{ data: WalletRow[] }>("/admin/sms-reseller/wallets?per_page=50"),
      client.get<{ data: TxRow[] }>("/admin/sms-reseller/transactions?per_page=20"),
      client.get<{ data: SyncLogRow[] }>("/admin/sms-reseller/provider/sync-logs?per_page=10"),
    ])
      .then(([ov, w, tx, logs]) => {
        setOverview(ov);
        setWallets(Array.isArray(w.data) ? w.data : []);
        setTransactions(Array.isArray(tx.data) ? tx.data : []);
        setSyncLogs(Array.isArray(logs.data) ? logs.data : []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <Skeleton className="h-64 rounded-2xl" />;
  }

  const provider = overview?.provider;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="MNotify balance"
          value={String(provider?.balance_credits ?? 0)}
          hint={provider?.status ?? "pending sync"}
          icon={Server}
        />
        <MetricCard
          title="Tenant credits"
          value={String(overview?.summary.total_tenant_balance ?? 0)}
          hint={`${overview?.summary.tenant_count ?? 0} salons`}
          icon={Wallet}
        />
        <MetricCard
          title="SMS used"
          value={String(overview?.summary.total_tenant_used ?? 0)}
          icon={Wallet}
        />
        <MetricCard
          title="Low balance"
          value={String(overview?.summary.low_balance_tenants ?? 0)}
          hint="Salons below threshold"
          icon={AlertTriangle}
        />
      </div>

      <Card className="rounded-2xl shadow-soft">
        <CardHeader>
          <CardTitle>Provider sync log</CardTitle>
        </CardHeader>
        <CardContent>
          {syncLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sync attempts yet. Use Sync from MNotify above.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Before</TableHead>
                  <TableHead>After</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {syncLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {log.status === "success" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                    </TableCell>
                    <TableCell>{log.balance_before ?? "—"}</TableCell>
                    <TableCell>{log.balance_after ?? "—"}</TableCell>
                    <TableCell className="max-w-md text-xs text-muted-foreground">{log.message ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-soft">
        <CardHeader>
          <CardTitle>Tenant SMS wallets</CardTitle>
        </CardHeader>
        <CardContent>
          {wallets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tenant wallets yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Salon</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Used</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wallets.map((w) => (
                  <TableRow key={w.tenant_id}>
                    <TableCell>{w.tenant?.name ?? w.tenant_id}</TableCell>
                    <TableCell>{w.balance_credits}</TableCell>
                    <TableCell>{w.total_used}</TableCell>
                    <TableCell>
                      {w.is_low_balance ? (
                        <Badge variant="outline" className="border-amber-300 text-amber-800">
                          Low
                        </Badge>
                      ) : (
                        <Badge variant="secondary">OK</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-soft">
        <CardHeader>
          <CardTitle>Recent wallet activity</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="capitalize">{tx.type.replace(/_/g, " ")}</TableCell>
                    <TableCell className={tx.amount >= 0 ? "text-emerald-600" : "text-destructive"}>
                      {tx.amount >= 0 ? "+" : ""}
                      {tx.amount}
                    </TableCell>
                    <TableCell>{tx.balance_after}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">{tx.notes ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(tx.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
