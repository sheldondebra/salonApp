"use client";

import { useCallback, useEffect, useState } from "react";
import { format, subDays } from "date-fns";
import { Plus, Receipt, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/shared/data-table";
import { MetricCard } from "@/components/shared/metric-card";
import { CrudPagination } from "@/features/crud/crud-pagination";
import { ConfirmAction } from "@/features/crud/confirm-action";
import { CreateExpenseDialog } from "@/features/finance/create-expense-dialog";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatMoney } from "@/lib/format/money";
import type { ExpenseCategory, TenantExpense, TenantExpensesResponse } from "@/lib/api/types";

type FinanceExpensesViewProps = {
  tenantSlug: string;
  currency?: string;
};

export function FinanceExpensesView({ tenantSlug, currency = "GHS" }: FinanceExpensesViewProps) {
  const [rows, setRows] = useState<TenantExpense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [meta, setMeta] = useState<TenantExpensesResponse["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState("");
  const [from, setFrom] = useState(format(subDays(new Date(), 89), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [createOpen, setCreateOpen] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      const res = await createApiClient(getApiClientOptions()).get<{ data: ExpenseCategory[] }>(
        `/${tenantSlug}/finance/expenses/categories`
      );
      setCategories(res.data ?? []);
    } catch {
      setCategories([]);
    }
  }, [tenantSlug]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), per_page: "20", from, to });
      if (categoryId) params.set("category_id", categoryId);
      if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());

      const result = await createApiClient(getApiClientOptions()).get<TenantExpensesResponse>(
        `/${tenantSlug}/finance/expenses?${params}`
      );
      setRows(result.data ?? []);
      setMeta(result.meta);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load expenses");
      setRows([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, page, categoryId, from, to, debouncedQuery]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    void load();
  }, [load]);

  async function voidExpense(id: number) {
    try {
      await createApiClient(getApiClientOptions()).post(`/${tenantSlug}/finance/expenses/${id}/void`);
      toast.success("Expense removed");
      void load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not remove expense");
    }
  }

  const summary = meta?.summary;
  const trend = meta?.monthly_trend ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Expenses</h2>
          <p className="text-sm text-muted-foreground">Track rent, supplies, marketing, and operating costs</p>
        </div>
        <Button className="rounded-xl" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Record expense
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard title="This month" value={formatMoney(summary?.this_month_cents ?? 0, currency)} icon={Receipt} />
        <MetricCard title="In period" value={formatMoney(summary?.total_cents ?? 0, currency)} icon={Receipt} hint={`${summary?.total_count ?? 0} entries`} />
        <MetricCard title="Top vendor" value={meta?.vendors?.[0]?.vendor_name ?? "—"} icon={Search} hint={meta?.vendors?.[0] ? formatMoney(meta.vendors[0].amount_cents, currency) : undefined} />
      </div>

      {trend.length > 0 ? (
        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Monthly spending</CardTitle>
            <CardDescription>Last six months of recorded expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {trend.map((point) => (
                <div key={point.month} className="rounded-xl border border-border/60 p-3 text-center">
                  <p className="text-xs text-muted-foreground">{point.label}</p>
                  <p className="mt-1 font-semibold">{formatMoney(point.amount_cents, currency)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-2xl border-border/60 shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
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
            <Label className="text-xs">Category</Label>
            <select
              className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              value={categoryId}
              onChange={(e) => { setPage(1); setCategoryId(e.target.value); }}
            >
              <option value="">All categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs">Search</Label>
            <Input className="mt-1 rounded-xl" placeholder="Vendor or note…" value={query} onChange={(e) => { setPage(1); setQuery(e.target.value); }} />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle>Expense history</CardTitle>
          <CardDescription>Feeds into your profit overview on Money</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <DataTable
            columns={[
              {
                id: "expense_date",
                header: "Date",
                mobilePrimary: true,
                cell: (row) => row.expense_date ? format(new Date(row.expense_date), "MMM d, yyyy") : "—",
              },
              {
                id: "category",
                header: "Category",
                cell: (row) => row.category?.name ?? "—",
              },
              {
                id: "vendor_name",
                header: "Vendor",
                cell: (row) => row.vendor_name ?? "—",
              },
              {
                id: "payment_method",
                header: "Method",
                cell: (row) => row.payment_method.replace(/_/g, " "),
              },
              {
                id: "status",
                header: "Status",
                cell: (row) => <Badge variant={row.status === "posted" ? "success" : "outline"}>{row.status}</Badge>,
              },
              {
                id: "amount_cents",
                header: "Amount",
                className: "text-right",
                cell: (row) => formatMoney(row.amount_cents, row.currency || currency),
              },
              {
                id: "actions",
                header: "",
                cell: (row) =>
                  row.status === "posted" ? (
                    <ConfirmAction
                      label="Remove"
                      title="Remove this expense?"
                      confirmMessage="This expense will no longer count toward your totals."
                      confirmLabel="Remove"
                      variant="ghost"
                      onConfirm={() => voidExpense(row.id)}
                    />
                  ) : null,
              },
            ]}
            data={rows}
            rowKey={(row) => String(row.id)}
            loading={loading}
            emptyIcon={Receipt}
            emptyTitle="No expenses yet"
            emptyDescription="Record your first expense to track operating costs."
          />
          <CrudPagination meta={meta} page={page} onPageChange={setPage} />
        </CardContent>
      </Card>

      <CreateExpenseDialog
        tenantSlug={tenantSlug}
        open={createOpen}
        categories={categories}
        onClose={() => setCreateOpen(false)}
        onCreated={() => void load()}
      />
    </div>
  );
}
