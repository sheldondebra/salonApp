"use client";

import { useCallback, useEffect, useState } from "react";
import { Tag } from "lucide-react";
import { toast } from "sonner";
import { RequirePlatformPermission } from "@/components/auth/require-platform-permission";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminToolbar } from "@/features/admin/admin-toolbar";
import { Permissions } from "@/lib/auth/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmAction } from "@/features/crud/confirm-action";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { Coupon } from "@/lib/api/types";
import {
  couponStatusLabel,
  fixedAmountToCents,
  formatCouponValue,
} from "@/lib/coupons/coupon-display";
import { plans as billingPlans } from "@/lib/pricing/plans";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [code, setCode] = useState("");
  const [value, setValue] = useState("20");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [scope, setScope] = useState<"subscription" | "booking" | "both">("subscription");
  const [maxUses, setMaxUses] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [planIds, setPlanIds] = useState<string[]>([]);
  const [minAmountMajor, setMinAmountMajor] = useState("");
  const currency = "GHS";

  const load = useCallback(() => {
    setLoading(true);
    const params = search ? `?q=${encodeURIComponent(search)}` : "";
    createApiClient(getApiClientOptions())
      .get<{ data: Coupon[] }>(`/admin/coupons${params}`)
      .then((res) => setCoupons(Array.isArray(res.data) ? res.data : []))
      .catch(() => setCoupons([]))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  async function createCoupon() {
    if (!code.trim()) {
      toast.error("Coupon code is required");
      return;
    }
    setSaving(true);
    const metadata: Record<string, unknown> = {};
    if (minAmountMajor.trim()) {
      metadata.min_amount_cents = fixedAmountToCents(Number(minAmountMajor));
    }
    if (planIds.length > 0) {
      metadata.plan_ids = planIds;
    }
    try {
      await createApiClient(getApiClientOptions()).post("/admin/coupons", {
        code: code.toUpperCase().trim(),
        type,
        value: type === "fixed" ? fixedAmountToCents(Number(value)) : Math.min(100, Number(value)),
        scope,
        max_redemptions: maxUses ? Number(maxUses) : null,
        starts_at: startsAt || null,
        expires_at: expiresAt || null,
        is_active: true,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      });
      toast.success("Coupon created");
      setCode("");
      setPlanIds([]);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not create coupon");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(coupon: Coupon) {
    try {
      await createApiClient(getApiClientOptions()).patch(`/admin/coupons/${coupon.id}`, {
        is_active: !coupon.is_active,
      });
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Update failed");
    }
  }

  async function removeCoupon(coupon: Coupon) {
    try {
      await createApiClient(getApiClientOptions()).delete(`/admin/coupons/${coupon.id}`);
      toast.success("Coupon removed");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not delete coupon");
    }
  }

  return (
    <AdminShell title="Coupons" description="Platform-wide codes for subscriptions and booking">
      <RequirePlatformPermission permission={Permissions.billing.manage}>
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="rounded-2xl shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Create platform coupon</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Code</Label>
                <Input
                  className="mt-1 rounded-xl font-mono uppercase"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="WELCOME20"
                />
              </div>
              <div>
                <Label>Scope</Label>
                <select
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                  value={scope}
                  onChange={(e) => setScope(e.target.value as typeof scope)}
                >
                  <option value="subscription">Subscription only</option>
                  <option value="booking">Booking only</option>
                  <option value="both">Subscription & booking</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <select
                    className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                    value={type}
                    onChange={(e) => setType(e.target.value as "percent" | "fixed")}
                  >
                    <option value="percent">Percent</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>
                <div>
                  <Label>{type === "percent" ? "Percent" : `Amount (${currency})`}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={type === "percent" ? 100 : undefined}
                    step={type === "fixed" ? "0.01" : "1"}
                    className="mt-1 rounded-xl"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>Plans (optional)</Label>
                <select
                  multiple
                  className="mt-1 max-h-28 w-full rounded-xl border border-input bg-background px-2 py-2 text-sm"
                  value={planIds}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
                    setPlanIds(selected);
                  }}
                >
                  {billingPlans
                    .filter((p) => p.id !== "enterprise")
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <Label>Minimum order ({currency})</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  className="mt-1 rounded-xl"
                  value={minAmountMajor}
                  onChange={(e) => setMinAmountMajor(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Max uses</Label>
                  <Input
                    type="number"
                    min={1}
                    className="mt-1 rounded-xl"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Starts</Label>
                  <Input
                    type="date"
                    className="mt-1 rounded-xl"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>Expires</Label>
                <Input
                  type="date"
                  className="mt-1 rounded-xl"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
              <Button
                className="w-full rounded-xl"
                onClick={() => void createCoupon()}
                disabled={saving || !code.trim()}
              >
                {saving ? "Creating…" : "Create coupon"}
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-soft lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-accent" />
                Platform coupons
              </CardTitle>
              <AdminToolbar search={search} onSearchChange={setSearch} />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-40 rounded-xl" />
              ) : coupons.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No coupons yet. Demo seeder includes WELCOME20 and SAVE10 for subscriptions.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border/60">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Scope</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead>Used</TableHead>
                        <TableHead>Validity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coupons.map((c) => {
                        const status = couponStatusLabel(c);
                        return (
                          <TableRow key={c.id}>
                            <TableCell className="font-mono font-medium">{c.code}</TableCell>
                            <TableCell className="capitalize">{c.scope ?? "subscription"}</TableCell>
                            <TableCell>{formatCouponValue(c, currency)}</TableCell>
                            <TableCell>
                              {c.redemptions_count}
                              {c.max_redemptions != null ? ` / ${c.max_redemptions}` : ""}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {c.starts_at ? new Date(c.starts_at).toLocaleDateString() : "—"}
                              {" → "}
                              {c.expires_at
                                ? new Date(c.expires_at).toLocaleDateString()
                                : "No expiry"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={status.variant}>{status.label}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap justify-end gap-1">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => void toggleActive(c)}
                                >
                                  {c.is_active ? "Deactivate" : "Activate"}
                                </Button>
                                <ConfirmAction
                                  label="Delete"
                                  variant="destructive"
                                  confirmMessage={`Delete coupon ${c.code}?`}
                                  onConfirm={() => removeCoupon(c)}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </RequirePlatformPermission>
    </AdminShell>
  );
}
