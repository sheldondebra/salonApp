"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Download, RefreshCw, Wallet, Receipt, TrendingUp, Clock, Banknote } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { StatCard } from "@/components/shared/stat-card";
import { CrudPagination } from "@/features/crud/crud-pagination";
import { formatMoney } from "@/features/booking/booking-helpers";
import { createApiClient, ApiError } from "@/lib/api/client";
import { env } from "@/config/env";
import { getApiClientOptions } from "@/lib/auth/session";
import { useAbilities } from "@/hooks/use-abilities";
import { Permissions } from "@/lib/auth/permissions";
import type { TenantWallet, TenantWalletTransaction } from "@/lib/api/types";

const TYPE_LABELS: Record<string, string> = {
  payment_collected: "Payment collected",
  platform_fee: "Platform fee",
  gateway_fee: "Gateway fee",
  settlement_pending: "Settlement pending",
  settlement_paid: "Settlement paid",
  refund: "Refund",
  adjustment: "Adjustment",
  reversal: "Reversal",
};

type WalletViewProps = {
  tenantSlug: string;
};

export function WalletView({ tenantSlug }: WalletViewProps) {
  const { can } = useAbilities(tenantSlug);
  const canExport = can(Permissions.wallet.export);

  const [wallet, setWallet] = useState<TenantWallet | null>(null);
  const [transactions, setTransactions] = useState<TenantWalletTransaction[]>([]);
  const [page, setPage] = useState(1);
  const [txMeta, setTxMeta] = useState<{ current_page: number; last_page: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const client = createApiClient(getApiClientOptions());
      const [walletRes, txRes] = await Promise.all([
        client.get<{ data: TenantWallet }>(`/${tenantSlug}/wallet`),
        client.get<{ data: TenantWalletTransaction[]; meta: { last_page: number } }>(
          `/${tenantSlug}/wallet/transactions?page=${page}&per_page=25`
        ),
      ]);
      setWallet(walletRes.data);
      setTransactions(txRes.data ?? []);
      setTxMeta({
        current_page: page,
        last_page: txRes.meta?.last_page ?? 1,
        total: (txRes.meta as { total?: number })?.total ?? txRes.data?.length ?? 0,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load wallet");
    }
  }, [tenantSlug, page]);

  useEffect(() => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [load]);

  async function handleExport() {
    const opts = getApiClientOptions();
    const base = env.apiUrl ? `${env.apiUrl}/api/v1` : "/api/v1";
    const url = `${base}/${tenantSlug}/wallet/transactions/export`;
    try {
      const res = await fetch(url, {
        headers: {
          Authorization: opts.token ? `Bearer ${opts.token}` : "",
          "X-Tenant-Slug": tenantSlug,
        },
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `wallet-${tenantSlug}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success("Wallet transactions exported");
    } catch {
      toast.error("Could not export transactions");
    }
  }

  const currency = wallet?.currency ?? "GHS";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Schedelux Wallet — payments collected through the platform, not your personal MoMo balance.
          </p>
        </div>
        <div className="flex gap-2">
          {canExport ? (
            <Button variant="secondary" onClick={() => void handleExport()}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          ) : null}
          <Button
            variant="outline"
            onClick={() => {
              setRefreshing(true);
              void load().finally(() => setRefreshing(false));
            }}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {wallet ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard title="Available" value={formatMoney(wallet.available_balance, currency)} icon={Wallet} />
          <StatCard title="Pending" value={formatMoney(wallet.pending_balance, currency)} icon={Clock} />
          <StatCard title="Total collected" value={formatMoney(wallet.total_collected, currency)} icon={TrendingUp} />
          <StatCard title="Total fees" value={formatMoney(wallet.total_fees, currency)} icon={Receipt} />
          <StatCard title="Total settled" value={formatMoney(wallet.total_settled, currency)} icon={Banknote} />
        </div>
      ) : null}

      <Card className="rounded-2xl shadow-soft">
        <CardContent className="pt-6">
          <DataTable<TenantWalletTransaction>
            loading={loading}
            columns={[
              {
                id: "created_at",
                header: "Date",
                cell: (row) => (row.created_at ? format(new Date(row.created_at), "MMM d, yyyy HH:mm") : "—"),
              },
              {
                id: "type",
                header: "Type",
                cell: (row) => TYPE_LABELS[row.type] ?? row.type,
              },
              {
                id: "direction",
                header: "Direction",
                cell: (row) => <span className="capitalize">{row.direction}</span>,
              },
              {
                id: "amount",
                header: "Amount",
                cell: (row) => formatMoney(row.amount, currency),
              },
              {
                id: "balance_after",
                header: "Balance after",
                cell: (row) => formatMoney(row.balance_after, currency),
              },
              {
                id: "reference",
                header: "Reference",
                cell: (row) => row.reference ?? "—",
              },
              {
                id: "description",
                header: "Description",
                cell: (row) => row.description ?? "—",
              },
            ]}
            data={transactions}
            rowKey={(row) => String(row.id)}
            emptyIcon={Wallet}
            emptyTitle="No wallet transactions yet"
            emptyDescription="Successful MoMo payments will appear here."
          />
          <CrudPagination meta={txMeta} page={page} onPageChange={setPage} />
        </CardContent>
      </Card>
    </div>
  );
}
