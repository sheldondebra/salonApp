"use client";

import { useCallback, useEffect, useState } from "react";
import { format, subDays } from "date-fns";
import { FileText, Plus, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/shared/data-table";
import { MetricCard } from "@/components/shared/metric-card";
import { CrudPagination } from "@/features/crud/crud-pagination";
import { CreateInvoiceDialog } from "@/features/finance/create-invoice-dialog";
import { InvoiceDetailDrawer } from "@/features/finance/invoice-detail-drawer";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatMoney } from "@/lib/format/money";
import type { TenantInvoice, TenantInvoicesResponse } from "@/lib/api/types";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  partially_paid: "Partial",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

function statusVariant(status: string): "success" | "secondary" | "warning" | "outline" {
  if (status === "paid") return "success";
  if (status === "draft") return "outline";
  if (status === "overdue" || status === "cancelled") return "warning";
  return "secondary";
}

type FinanceInvoicesViewProps = {
  tenantSlug: string;
  tenantName?: string;
  currency?: string;
};

export function FinanceInvoicesView({ tenantSlug, tenantName, currency = "GHS" }: FinanceInvoicesViewProps) {
  const [rows, setRows] = useState<TenantInvoice[]>([]);
  const [meta, setMeta] = useState<TenantInvoicesResponse["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState(format(subDays(new Date(), 89), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<TenantInvoice | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), per_page: "20", from, to });
      if (status) params.set("status", status);
      if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());

      const result = await createApiClient(getApiClientOptions()).get<TenantInvoicesResponse>(
        `/${tenantSlug}/finance/invoices?${params}`
      );
      setRows(result.data ?? []);
      setMeta(result.meta);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load invoices");
      setRows([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, page, status, from, to, debouncedQuery]);

  useEffect(() => {
    void load();
  }, [load]);

  async function openDetail(row: TenantInvoice) {
    try {
      const res = await createApiClient(getApiClientOptions()).get<{ data: TenantInvoice }>(
        `/${tenantSlug}/finance/invoices/${row.id}`
      );
      setSelected(res.data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not load invoice");
    }
  }

  const summary = meta?.summary;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Invoices & receipts</h2>
          <p className="text-sm text-muted-foreground">Create, send, and collect payment on professional invoices</p>
        </div>
        <Button className="rounded-xl" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create invoice
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Outstanding"
          value={formatMoney(summary?.outstanding_cents ?? 0, currency)}
          icon={FileText}
          hint={`${summary?.overdue_count ?? 0} overdue`}
        />
        <MetricCard title="Paid" value={String(summary?.paid_count ?? 0)} icon={FileText} hint="Fully collected" />
        <MetricCard title="Drafts" value={String(summary?.draft_count ?? 0)} icon={FileText} />
        <MetricCard title="Total" value={String(summary?.total_count ?? 0)} icon={Search} />
      </div>

      <Card className="rounded-2xl border-border/60 shadow-soft">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">Filters</CardTitle>
              <CardDescription>Search by invoice number or client name</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => void load()} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="partially_paid">Partially paid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <Label className="text-xs">Search</Label>
            <Input
              className="mt-1 rounded-xl"
              placeholder="Invoice # or client…"
              value={query}
              onChange={(e) => { setPage(1); setQuery(e.target.value); }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>Click a row to send, collect payment, or print a receipt</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <DataTable
            columns={[
              {
                id: "invoice_number",
                header: "Invoice",
                mobilePrimary: true,
                cell: (row) => (
                  <div>
                    <p className="font-medium">{row.invoice_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.created_at ? format(new Date(row.created_at), "MMM d, yyyy") : ""}
                    </p>
                  </div>
                ),
              },
              {
                id: "customer",
                header: "Client",
                cell: (row) => row.customer?.name ?? "—",
              },
              {
                id: "status",
                header: "Status",
                cell: (row) => <Badge variant={statusVariant(row.status)}>{STATUS_LABELS[row.status] ?? row.status}</Badge>,
              },
              {
                id: "due_date",
                header: "Due",
                cell: (row) => (row.due_date ? format(new Date(row.due_date), "MMM d, yyyy") : "—"),
              },
              {
                id: "total_cents",
                header: "Total",
                cell: (row) => formatMoney(row.total_cents, row.currency || currency),
              },
              {
                id: "balance_due_cents",
                header: "Balance",
                className: "text-right",
                cell: (row) => formatMoney(row.balance_due_cents, row.currency || currency),
              },
            ]}
            data={rows}
            rowKey={(row) => String(row.id)}
            onRowClick={(row) => void openDetail(row)}
            loading={loading}
            emptyIcon={FileText}
            emptyTitle="No invoices yet"
            emptyDescription="Create your first invoice to bill clients professionally."
          />

          <CrudPagination meta={meta} page={page} onPageChange={setPage} />
        </CardContent>
      </Card>

      <CreateInvoiceDialog
        tenantSlug={tenantSlug}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(invoice) => {
          void load();
          setSelected(invoice);
        }}
      />

      {selected ? (
        <InvoiceDetailDrawer
          tenantSlug={tenantSlug}
          tenantName={tenantName}
          invoice={selected}
          onClose={() => setSelected(null)}
          onUpdated={(invoice) => {
            setSelected(invoice);
            void load();
          }}
        />
      ) : null}
    </div>
  );
}
