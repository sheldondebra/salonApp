"use client";

import { useCallback, useEffect, useState } from "react";
import { format, subDays } from "date-fns";
import { AlertTriangle, Banknote, CreditCard, Scale, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/shared/data-table";
import { MetricCard } from "@/components/shared/metric-card";
import { ConfirmAction } from "@/features/crud/confirm-action";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { useAbilities } from "@/hooks/use-abilities";
import { Permissions } from "@/lib/auth/permissions";
import { formatMoney } from "@/lib/format/money";
import type { CashDrawerSession, Location } from "@/lib/api/types";

type FinanceReconciliationViewProps = {
  tenantSlug: string;
  currency?: string;
};

function dollarsToCents(value: string): number {
  return Math.max(0, Math.round((parseFloat(value) || 0) * 100));
}

export function FinanceReconciliationView({ tenantSlug, currency = "GHS" }: FinanceReconciliationViewProps) {
  const { can } = useAbilities(tenantSlug);
  const canManage = can(Permissions.pos.create) || can(Permissions.finance.reconciliationManage);

  const [locations, setLocations] = useState<Location[]>([]);
  const [locationId, setLocationId] = useState("");
  const [active, setActive] = useState<CashDrawerSession | null>(null);
  const [history, setHistory] = useState<CashDrawerSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingCash, setOpeningCash] = useState("0");
  const [openingNotes, setOpeningNotes] = useState("");
  const [countedCash, setCountedCash] = useState("");
  const [closingNotes, setClosingNotes] = useState("");
  const [acting, setActing] = useState(false);

  const loadLocations = useCallback(async () => {
    try {
      const res = await createApiClient(getApiClientOptions()).get<{ data: Location[] }>(
        `/${tenantSlug}/locations?per_page=50&is_active=1`
      );
      const locs = res.data ?? [];
      setLocations(locs);
      setLocationId((prev) => prev || (locs[0] ? String(locs[0].id) : ""));
    } catch {
      setLocations([]);
    }
  }, [tenantSlug]);

  const loadActive = useCallback(async () => {
    if (!locationId) {
      setActive(null);
      return;
    }
    try {
      const res = await createApiClient(getApiClientOptions()).get<{ data: CashDrawerSession | null }>(
        `/${tenantSlug}/finance/cash-drawer/active?location_id=${locationId}`
      );
      setActive(res.data);
    } catch {
      setActive(null);
    }
  }, [tenantSlug, locationId]);

  const loadHistory = useCallback(async () => {
    try {
      const from = format(subDays(new Date(), 29), "yyyy-MM-dd");
      const to = format(new Date(), "yyyy-MM-dd");
      const params = new URLSearchParams({ from, to, per_page: "20" });
      if (locationId) params.set("location_id", locationId);
      const res = await createApiClient(getApiClientOptions()).get<{
        data: CashDrawerSession[];
      }>(`/${tenantSlug}/finance/cash-drawer/sessions?${params}`);
      setHistory(res.data ?? []);
    } catch {
      setHistory([]);
    }
  }, [tenantSlug, locationId]);

  const reload = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadActive(), loadHistory()]);
    setLoading(false);
  }, [loadActive, loadHistory]);

  useEffect(() => {
    void loadLocations();
  }, [loadLocations]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function openDrawer() {
    if (!locationId) return;
    setActing(true);
    try {
      await createApiClient(getApiClientOptions()).post(`/${tenantSlug}/finance/cash-drawer/open`, {
        location_id: Number(locationId),
        opening_cash_cents: dollarsToCents(openingCash),
        opening_notes: openingNotes.trim() || null,
      });
      toast.success("Cash drawer opened");
      setOpeningCash("0");
      setOpeningNotes("");
      await reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not open drawer");
    } finally {
      setActing(false);
    }
  }

  async function closeDrawer() {
    if (!active) return;
    setActing(true);
    try {
      await createApiClient(getApiClientOptions()).post(
        `/${tenantSlug}/finance/cash-drawer/sessions/${active.uuid}/close`,
        {
          counted_cash_cents: dollarsToCents(countedCash),
          closing_notes: closingNotes.trim() || null,
        }
      );
      toast.success("Cash drawer closed");
      setCountedCash("");
      setClosingNotes("");
      await reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not close drawer");
    } finally {
      setActing(false);
    }
  }

  const breakdown = active?.payment_breakdown;
  const hasDiscrepancy = active?.status === "discrepancy";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">End-of-day cash</h2>
        <p className="text-sm text-muted-foreground">
          Open the drawer at shift start, close at end of day, and match counted cash to POS sales.
        </p>
      </div>

      <div className="max-w-xs">
        <Label htmlFor="recon-location">Location</Label>
        <select
          id="recon-location"
          className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
        >
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </select>
      </div>

      {!active ? (
        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle>Open cash drawer</CardTitle>
            <CardDescription>Count the float in the till before the first sale.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-w-md">
            <div>
              <Label>Opening float ({currency})</Label>
              <Input
                className="mt-1 rounded-xl"
                type="number"
                min={0}
                step="0.01"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                disabled={!canManage}
              />
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Input
                className="mt-1 rounded-xl"
                value={openingNotes}
                onChange={(e) => setOpeningNotes(e.target.value)}
                disabled={!canManage}
              />
            </div>
            {canManage ? (
              <Button className="rounded-xl" disabled={acting || !locationId} onClick={() => void openDrawer()}>
                {acting ? "Opening…" : "Open drawer"}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">You need POS checkout permission to open the drawer.</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Expected cash"
              value={formatMoney(active.expected_cash_cents, currency)}
              icon={Scale}
              hint="Opening float + cash sales"
            />
            <MetricCard
              title="Cash sales"
              value={formatMoney(breakdown?.cash_cents ?? 0, currency)}
              icon={Banknote}
              hint={`${breakdown?.sale_count ?? 0} completed sales`}
            />
            <MetricCard title="Card" value={formatMoney(breakdown?.card_cents ?? 0, currency)} icon={CreditCard} />
            <MetricCard title="Mobile money" value={formatMoney(breakdown?.mobile_money_cents ?? 0, currency)} icon={Smartphone} />
          </div>

          <Card className="rounded-2xl border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Drawer open
                <Badge variant="secondary">since {active.opened_at ? format(new Date(active.opened_at), "MMM d, h:mm a") : "—"}</Badge>
              </CardTitle>
              <CardDescription>
                Opened by {active.opened_by?.name ?? "Staff"} · Float {formatMoney(active.opening_cash_cents, currency)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-lg">
              <div className="rounded-xl border bg-muted/30 p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Total sales (all methods)</span>
                  <span>{formatMoney(breakdown?.total_sales_cents ?? 0, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Other / gift card</span>
                  <span>{formatMoney(breakdown?.other_cents ?? 0, currency)}</span>
                </div>
              </div>
              <div>
                <Label>Counted cash in drawer ({currency})</Label>
                <Input
                  className="mt-1 rounded-xl"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder={String((active.expected_cash_cents / 100).toFixed(2))}
                  value={countedCash}
                  onChange={(e) => setCountedCash(e.target.value)}
                  disabled={!canManage}
                />
              </div>
              <div>
                <Label>Closing notes (optional)</Label>
                <Input
                  className="mt-1 rounded-xl"
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  disabled={!canManage}
                />
              </div>
              {canManage ? (
                <ConfirmAction
                  label={acting ? "Closing…" : "Close drawer & reconcile"}
                  title="Close cash drawer?"
                  confirmMessage="This records your counted cash and flags any difference from expected."
                  confirmLabel="Close drawer"
                  variant="outline"
                  disabled={acting || !countedCash.trim()}
                  onConfirm={closeDrawer}
                />
              ) : null}
            </CardContent>
          </Card>
        </>
      )}

      <Card className="rounded-2xl border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle>Recent sessions</CardTitle>
          <CardDescription>Last 30 days at this location</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={[
              {
                id: "opened",
                header: "Opened",
                mobilePrimary: true,
                cell: (row) =>
                  row.opened_at ? format(new Date(row.opened_at), "MMM d, yyyy h:mm a") : "—",
              },
              {
                id: "status",
                header: "Status",
                cell: (row) => (
                  <Badge
                    variant={
                      row.status === "discrepancy"
                        ? "warning"
                        : row.status === "closed"
                          ? "success"
                          : "secondary"
                    }
                  >
                    {row.status}
                  </Badge>
                ),
              },
              {
                id: "expected",
                header: "Expected",
                cell: (row) => formatMoney(row.expected_cash_cents, currency),
              },
              {
                id: "counted",
                header: "Counted",
                cell: (row) =>
                  row.counted_cash_cents != null ? formatMoney(row.counted_cash_cents, currency) : "—",
              },
              {
                id: "diff",
                header: "Difference",
                cell: (row) =>
                  row.difference_cents != null ? (
                    <span className={row.difference_cents !== 0 ? "text-amber-600 font-medium" : ""}>
                      {formatMoney(row.difference_cents, currency)}
                    </span>
                  ) : (
                    "—"
                  ),
              },
            ]}
            data={history}
            rowKey={(row) => row.uuid}
            loading={loading}
            emptyIcon={Scale}
            emptyTitle="No drawer sessions yet"
            emptyDescription="Open the cash drawer when you start the register day."
          />
        </CardContent>
      </Card>

      {hasDiscrepancy ? (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>Last closed session had a cash discrepancy. Review notes and sales before the next open.</p>
        </div>
      ) : null}
    </div>
  );
}
