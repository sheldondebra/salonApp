"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { RefreshCw, Smartphone, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/shared/data-table";
import { StatCard } from "@/components/shared/stat-card";
import { CrudPagination } from "@/features/crud/crud-pagination";
import { PaymentRequestDetailDrawer } from "@/features/payment-requests/payment-request-detail-drawer";
import { CreatePaymentRequestDialog } from "@/features/payment-requests/create-payment-request-dialog";
import {
  PAYMENT_REQUEST_REASON_LABELS,
  PaymentRequestStatusBadge,
} from "@/features/payment-requests/payment-request-status-badge";
import { formatMoney } from "@/features/booking/booking-helpers";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { useAbilities } from "@/hooks/use-abilities";
import { Permissions } from "@/lib/auth/permissions";
import type { PaymentRequest, PaymentRequestsListMeta } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type PaymentRequestsResponse = {
  data: PaymentRequest[];
  meta: PaymentRequestsListMeta;
};

type PaymentRequestsViewProps = {
  tenantSlug: string;
  currency?: string;
};

export function PaymentRequestsView({ tenantSlug, currency = "GHS" }: PaymentRequestsViewProps) {
  const { can } = useAbilities(tenantSlug);
  const canCreate = can(Permissions.payment_requests.create);
  const [items, setItems] = useState<PaymentRequest[]>([]);
  const [meta, setMeta] = useState<PaymentRequestsListMeta | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [gatewayFilter, setGatewayFilter] = useState("all");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PaymentRequest | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(
    async (quiet = false) => {
      if (!quiet) setLoading(true);
      else setRefreshing(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page: String(page), per_page: "20" });
        if (statusFilter !== "all") params.set("status", statusFilter);
        if (gatewayFilter !== "all") params.set("gateway", gatewayFilter);
        if (reasonFilter !== "all") params.set("reason", reasonFilter);
        if (dateFrom) params.set("date_from", dateFrom);
        if (dateTo) params.set("date_to", dateTo);
        if (query.trim()) params.set("q", query.trim());

        const res = await createApiClient(getApiClientOptions()).get<PaymentRequestsResponse>(
          `/${tenantSlug}/payment-requests?${params}`
        );
        setItems(Array.isArray(res.data) ? res.data : []);
        setMeta(res.meta ?? null);
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Could not load payment requests";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [tenantSlug, page, statusFilter, gatewayFilter, reasonFilter, dateFrom, dateTo, query]
  );

  useEffect(() => {
    const timer = setTimeout(() => load(), query ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, query]);

  async function openDetail(row: PaymentRequest) {
    try {
      const res = await createApiClient(getApiClientOptions()).get<{ data: PaymentRequest }>(
        `/${tenantSlug}/payment-requests/${row.id}`
      );
      setSelected(res.data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not load details");
    }
  }

  const summary = meta?.summary;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Payment requests</h1>
          <p className="mt-1 text-muted-foreground">
            Send a mobile money request — your customer approves on their own phone
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => load(true)}
          disabled={refreshing}
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          Refresh
        </Button>
        {canCreate ? (
          <Button type="button" size="sm" className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New request
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Pending" value={String(summary?.pending ?? 0)} icon={Smartphone} />
        <StatCard title="Processing" value={String(summary?.processing ?? 0)} icon={Smartphone} />
        <StatCard title="Paid" value={String(summary?.success ?? 0)} icon={Smartphone} />
        <StatCard title="Failed" value={String(summary?.failed ?? 0)} icon={Smartphone} />
      </div>

      <Card className="rounded-2xl shadow-soft">
        <CardHeader className="flex flex-col gap-4">
          <CardTitle>All requests</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Search reference, phone, customer…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              className="max-w-xs rounded-xl"
            />
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[140px] rounded-xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="success">Paid</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={gatewayFilter}
              onValueChange={(v) => {
                setGatewayFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[140px] rounded-xl">
                <SelectValue placeholder="Gateway" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All gateways</SelectItem>
                <SelectItem value="mtn_momo">MTN MoMo Direct</SelectItem>
                <SelectItem value="paystack">Paystack</SelectItem>
                <SelectItem value="flutterwave">Flutterwave</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={reasonFilter}
              onValueChange={(v) => {
                setReasonFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[160px] rounded-xl">
                <SelectValue placeholder="Reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All reasons</SelectItem>
                {Object.entries(PAYMENT_REQUEST_REASON_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="w-[150px] rounded-xl"
              aria-label="From date"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="w-[150px] rounded-xl"
              aria-label="To date"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error && !loading ? (
            <div className="px-6 py-12 text-center text-sm text-destructive">{error}</div>
          ) : null}
          <DataTable
            columns={[
              {
                id: "when",
                header: "Created",
                cell: (r) =>
                  r.created_at ? format(new Date(r.created_at), "MMM d, yyyy · h:mm a") : "—",
              },
              {
                id: "customer",
                header: "Customer",
                cell: (r) => r.customer?.name ?? r.phone,
              },
              {
                id: "reason",
                header: "Reason",
                cell: (r) => PAYMENT_REQUEST_REASON_LABELS[r.reason] ?? r.reason,
              },
              {
                id: "gateway",
                header: "Gateway",
                cell: (r) => <span className="capitalize">{r.gateway}</span>,
              },
              {
                id: "amount",
                header: "Amount",
                className: "text-right",
                cell: (r) => (
                  <span className="font-medium">{formatMoney(r.amount_cents, r.currency || currency)}</span>
                ),
              },
              {
                id: "status",
                header: "Status",
                cell: (r) => <PaymentRequestStatusBadge status={r.status} />,
              },
              {
                id: "actions",
                header: "",
                className: "text-right",
                cell: (r) => (
                  <Button type="button" variant="ghost" size="sm" onClick={() => void openDetail(r)}>
                    View
                  </Button>
                ),
              },
            ]}
            data={items}
            rowKey={(r) => String(r.id)}
            loading={loading}
            emptyIcon={Smartphone}
            emptyTitle="No payment requests yet"
            emptyDescription="MoMo payment requests you send to customers will appear here with full status history."
          />
          <CrudPagination
            meta={
              meta
                ? {
                    current_page: meta.current_page,
                    last_page: meta.last_page,
                    total: meta.total,
                  }
                : null
            }
            page={page}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      {selected ? (
        <PaymentRequestDetailDrawer
          tenantSlug={tenantSlug}
          request={selected}
          currency={currency}
          onClose={() => setSelected(null)}
          onUpdated={(updated) => {
            setSelected(updated);
            setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
          }}
        />
      ) : null}

      <CreatePaymentRequestDialog
        tenantSlug={tenantSlug}
        currency={currency}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => void load(true)}
      />
    </div>
  );
}
