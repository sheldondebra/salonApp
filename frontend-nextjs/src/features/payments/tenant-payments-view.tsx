"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { CreditCard, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatMoney } from "@/features/booking/booking-helpers";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { PaymentTransaction } from "@/lib/api/types";
import { cn } from "@/lib/utils";

type PaymentsResponse = {
  data: PaymentTransaction[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
    summary?: { paid: number; pending: number; failed: number };
  };
};

const PURPOSE_LABELS: Record<string, string> = {
  booking: "Full payment",
  deposit: "Deposit",
  subscription: "Subscription",
};

function statusVariant(status: string): "default" | "secondary" | "success" | "outline" {
  if (status === "paid") return "success";
  if (status === "failed") return "outline";
  return "secondary";
}

type TenantPaymentsViewProps = {
  tenantSlug: string;
  currency?: string;
};

export function TenantPaymentsView({ tenantSlug, currency = "GHS" }: TenantPaymentsViewProps) {
  const [items, setItems] = useState<PaymentTransaction[]>([]);
  const [meta, setMeta] = useState<PaymentsResponse["meta"] | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [purposeFilter, setPurposeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (quiet = false) => {
      if (!quiet) setLoading(true);
      else setRefreshing(true);
      try {
        const params = new URLSearchParams({ page: String(page), per_page: "20" });
        if (statusFilter !== "all") params.set("status", statusFilter);
        if (purposeFilter !== "all") params.set("purpose", purposeFilter);

        const res = await createApiClient(getApiClientOptions()).get<PaymentsResponse>(
          `/${tenantSlug}/payments?${params}`
        );
        setItems(Array.isArray(res.data) ? res.data : []);
        setMeta(res.meta ?? null);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Could not load payments");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [tenantSlug, page, statusFilter, purposeFilter]
  );

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Payments</h1>
          <p className="mt-1 text-muted-foreground">
            Booking deposits and online payments via Paystack & Flutterwave
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
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Paid" value={String(meta?.summary?.paid ?? 0)} icon={CreditCard} />
        <StatCard title="Pending" value={String(meta?.summary?.pending ?? 0)} icon={CreditCard} />
        <StatCard title="Failed" value={String(meta?.summary?.failed ?? 0)} icon={CreditCard} />
      </div>

      <Card className="rounded-2xl shadow-soft">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Payment history</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[140px] rounded-xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={purposeFilter} onValueChange={(v) => { setPurposeFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[140px] rounded-xl">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="deposit">Deposit</SelectItem>
                <SelectItem value="booking">Full payment</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={[
              {
                id: "when",
                header: "Date",
                cell: (r) =>
                  r.paid_at
                    ? format(new Date(r.paid_at), "MMM d, yyyy · h:mm a")
                    : r.created_at
                      ? format(new Date(r.created_at), "MMM d, yyyy")
                      : "—",
              },
              {
                id: "client",
                header: "Client",
                cell: (r) => r.client?.name ?? r.appointment?.client?.name ?? "—",
              },
              {
                id: "service",
                header: "Service",
                cell: (r) => r.appointment?.service?.name ?? "—",
              },
              {
                id: "purpose",
                header: "Type",
                cell: (r) => PURPOSE_LABELS[r.purpose] ?? r.purpose,
              },
              {
                id: "provider",
                header: "Gateway",
                cell: (r) => (
                  <span className="capitalize">{r.provider}</span>
                ),
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
                cell: (r) => (
                  <Badge variant={statusVariant(r.status)} className="capitalize">
                    {r.status}
                  </Badge>
                ),
              },
            ]}
            data={items}
            rowKey={(r) => r.uuid}
            loading={loading}
            emptyIcon={CreditCard}
            emptyTitle="No payments yet"
            emptyDescription="Online booking payments will appear here when clients pay deposits or in full."
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
    </div>
  );
}
