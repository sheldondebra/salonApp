"use client";

import { useCallback, useEffect, useState } from "react";
import { format, subDays } from "date-fns";
import { ArrowDownRight, ArrowUpRight, Download, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/shared/data-table";
import { MetricCard } from "@/components/shared/metric-card";
import { CrudPagination } from "@/features/crud/crud-pagination";
import { CreateRefundDialog } from "@/features/finance/create-refund-dialog";
import { CreateAdjustmentDialog } from "@/features/finance/create-adjustment-dialog";
import { createApiClient, ApiError } from "@/lib/api/client";
import { env } from "@/config/env";
import { getApiClientOptions } from "@/lib/auth/session";
import { useAbilities } from "@/hooks/use-abilities";
import { Permissions } from "@/lib/auth/permissions";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatMoney } from "@/lib/format/money";
import type { FinanceLedgerEntry, FinanceTransactionsResponse } from "@/lib/api/types";

const SOURCE_LABELS: Record<string, string> = {
  booking: "Booking",
  pos_sale: "Shop sale",
  payment_request: "Payment request",
  wallet: "Wallet",
  payment: "Payment",
};

type FinanceTransactionsViewProps = {
  tenantSlug: string;
  currency?: string;
};

function statusVariant(status: string): "success" | "secondary" | "warning" | "outline" {
  if (status === "paid" || status === "posted") return "success";
  if (status === "pending" || status === "processing") return "secondary";
  if (status === "failed" || status === "cancelled" || status === "expired") return "warning";
  return "outline";
}

function canRefundEntry(row: FinanceLedgerEntry): boolean {
  if (row.transaction_type !== "income") return false;
  if (!["paid", "posted", "success"].includes(row.status)) return false;
  return row.source_type === "pos_sale" || row.source_type === "payment_request";
}

function canAdjustEntry(row: FinanceLedgerEntry): boolean {
  return !row.id.startsWith("finance_refund:") && !row.id.startsWith("finance_adjustment:");
}

export function FinanceTransactionsView({ tenantSlug, currency = "GHS" }: FinanceTransactionsViewProps) {
  const { can } = useAbilities(tenantSlug);
  const canExport = can(Permissions.finance.export);
  const canRefund = can(Permissions.finance.refund);
  const canAdjust = can(Permissions.finance.adjust);

  const [rows, setRows] = useState<FinanceLedgerEntry[]>([]);
  const [meta, setMeta] = useState<FinanceTransactionsResponse["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState(format(subDays(new Date(), 29), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [status, setStatus] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [refundTarget, setRefundTarget] = useState<FinanceLedgerEntry | null>(null);
  const [adjustTarget, setAdjustTarget] = useState<FinanceLedgerEntry | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: "25",
        from,
        to,
      });
      if (status) params.set("status", status);
      if (sourceType) params.set("source_type", sourceType);
      if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());

      const result = await createApiClient(getApiClientOptions()).get<FinanceTransactionsResponse>(
        `/${tenantSlug}/finance/transactions?${params}`
      );
      setRows(result.data ?? []);
      setMeta(result.meta);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load transactions");
      setRows([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, page, from, to, status, sourceType, debouncedQuery]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleExport() {
    const params = new URLSearchParams({ from, to });
    if (status) params.set("status", status);
    if (sourceType) params.set("source_type", sourceType);
    if (query.trim()) params.set("q", query.trim());

    const opts = getApiClientOptions();
    const base = env.apiUrl ? `${env.apiUrl}/api/v1` : "/api/v1";
    const url = `${base}/${tenantSlug}/finance/transactions/export?${params}`;

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
      link.download = `finance-transactions-${tenantSlug}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success("Transactions exported");
    } catch {
      toast.error("Could not export transactions");
    }
  }

  const summary = meta?.summary;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Income"
          value={formatMoney(summary?.income_cents ?? 0, currency)}
          icon={ArrowUpRight}
          hint={`${summary?.paid_count ?? 0} paid`}
        />
        <MetricCard
          title="Expenses"
          value={formatMoney(summary?.expense_cents ?? 0, currency)}
          icon={ArrowDownRight}
        />
        <MetricCard
          title="Net"
          value={formatMoney(summary?.net_cents ?? 0, currency)}
          icon={ArrowUpRight}
          hint="Income minus expenses and refunds"
        />
        <MetricCard
          title="Entries"
          value={String(summary?.total_count ?? 0)}
          icon={Search}
          hint={`${summary?.pending_count ?? 0} pending · ${summary?.failed_count ?? 0} failed`}
        />
      </div>

      <Card className="rounded-2xl border-border/60 shadow-soft">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">Filters</CardTitle>
              <CardDescription>Search bookings, shop sales, payment requests, and wallet activity</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => void load()} disabled={loading}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              {canExport ? (
                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => void handleExport()}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <Label className="text-xs">From</Label>
            <Input type="date" className="mt-1 rounded-xl" value={from} onChange={(e) => { setPage(1); setFrom(e.target.value); }} />
          </div>
          <div>
            <Label className="text-xs">To</Label>
            <Input type="date" className="mt-1 rounded-xl" value={to} onChange={(e) => { setPage(1); setTo(e.target.value); }} />
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <select
              className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              value={status}
              onChange={(e) => { setPage(1); setStatus(e.target.value); }}
            >
              <option value="">All statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="posted">Posted</option>
            </select>
          </div>
          <div>
            <Label className="text-xs">Source</Label>
            <select
              className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              value={sourceType}
              onChange={(e) => { setPage(1); setSourceType(e.target.value); }}
            >
              <option value="">All sources</option>
              <option value="booking">Bookings</option>
              <option value="pos_sale">Shop sales</option>
              <option value="payment_request">Payment requests</option>
              <option value="wallet">Wallet</option>
            </select>
          </div>
          <div>
            <Label className="text-xs">Search</Label>
            <Input
              className="mt-1 rounded-xl"
              placeholder="Reference, client, branch…"
              value={query}
              onChange={(e) => { setPage(1); setQuery(e.target.value); }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle>Transaction history</CardTitle>
          <CardDescription>All money in and out — bookings, shop, wallet, and payment requests</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <DataTable
            columns={[
              {
                id: "occurred_at",
                header: "Date",
                mobilePrimary: true,
                cell: (row) => (
                  <div>
                    <p className="font-medium">
                      {row.occurred_at ? format(new Date(row.occurred_at), "MMM d, yyyy") : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {row.occurred_at ? format(new Date(row.occurred_at), "h:mm a") : ""}
                    </p>
                  </div>
                ),
              },
              {
                id: "description",
                header: "Description",
                cell: (row) => (
                  <div>
                    <p className="font-medium">{row.description}</p>
                    <p className="text-xs text-muted-foreground">{row.reference}</p>
                  </div>
                ),
              },
              {
                id: "source_type",
                header: "Source",
                cell: (row) => SOURCE_LABELS[row.source_type] ?? row.source_type,
              },
              {
                id: "customer_name",
                header: "Client",
                cell: (row) => row.customer_name ?? "—",
              },
              {
                id: "payment_method",
                header: "Method",
                cell: (row) => row.payment_method,
              },
              {
                id: "status",
                header: "Status",
                cell: (row) => <Badge variant={statusVariant(row.status)}>{row.status}</Badge>,
              },
              {
                id: "amount_cents",
                header: "Amount",
                className: "text-right",
                cell: (row) => (
                  <span className={row.transaction_type === "expense" || row.transaction_type === "refund" ? "text-destructive" : "text-foreground"}>
                    {row.transaction_type === "expense" || row.transaction_type === "refund" ? "−" : ""}
                    {formatMoney(row.amount_cents, row.currency || currency)}
                  </span>
                ),
              },
              ...(canRefund || canAdjust
                ? [{
                    id: "actions",
                    header: "",
                    cell: (row: FinanceLedgerEntry) => (
                      <div className="flex justify-end gap-1">
                        {canRefund && canRefundEntry(row) ? (
                          <Button variant="ghost" size="sm" className="rounded-lg" onClick={() => setRefundTarget(row)}>
                            Refund
                          </Button>
                        ) : null}
                        {canAdjust && canAdjustEntry(row) ? (
                          <Button variant="ghost" size="sm" className="rounded-lg" onClick={() => setAdjustTarget(row)}>
                            Adjust
                          </Button>
                        ) : null}
                      </div>
                    ),
                  }]
                : []),
            ]}
            data={rows}
            rowKey={(row) => row.id}
            loading={loading}
            emptyIcon={Search}
            emptyTitle="No transactions in this period"
            emptyDescription="Adjust the date range or filters to see money movements."
          />

          {meta && meta.last_page > 1 ? (
            <CrudPagination meta={meta} page={page} onPageChange={setPage} />
          ) : null}
        </CardContent>
      </Card>
      {refundTarget && (refundTarget.source_type === 'pos_sale' || refundTarget.source_type === 'payment_request') ? (
        <CreateRefundDialog
          tenantSlug={tenantSlug}
          open
          sourceType={refundTarget.source_type}
          sourceId={refundTarget.source_id}
          onClose={() => setRefundTarget(null)}
          onCreated={() => {
            setRefundTarget(null);
            void load();
          }}
        />
      ) : null}

      <CreateAdjustmentDialog
        tenantSlug={tenantSlug}
        open={Boolean(adjustTarget)}
        entry={adjustTarget}
        onClose={() => setAdjustTarget(null)}
        onCreated={() => {
          setAdjustTarget(null);
          void load();
        }}
      />
    </div>
  );
}
