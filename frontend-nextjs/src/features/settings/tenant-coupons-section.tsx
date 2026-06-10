"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Tag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SettingsSectionHeader } from "@/features/settings/settings-ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmAction } from "@/features/crud/confirm-action";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { Coupon, Service } from "@/lib/api/types";
import {
  couponStatusLabel,
  fixedAmountToCents,
  formatCouponValue,
} from "@/lib/coupons/coupon-display";

type TenantCouponsSectionProps = {
  tenantSlug: string;
  currency?: string;
};

export function TenantCouponsSection({
  tenantSlug,
  currency = "GHS",
}: TenantCouponsSectionProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [code, setCode] = useState("");
  const [value, setValue] = useState("10");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [maxUses, setMaxUses] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [minAmountMajor, setMinAmountMajor] = useState("");
  const [serviceIds, setServiceIds] = useState<number[]>([]);

  const load = useCallback(() => {
    setLoading(true);
    createApiClient(getApiClientOptions())
      .get<{ data: Coupon[] }>(`/${tenantSlug}/coupons`)
      .then((res) => setCoupons(Array.isArray(res.data) ? res.data : []))
      .catch(() => setCoupons([]))
      .finally(() => setLoading(false));
  }, [tenantSlug]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    createApiClient(getApiClientOptions())
      .get<{ data: Service[] }>(`/${tenantSlug}/services?per_page=100&is_active=1`)
      .then((res) => setServices(Array.isArray(res.data) ? res.data : []))
      .catch(() => setServices([]));
  }, [tenantSlug]);

  function toggleService(id: number) {
    setServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

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
    if (serviceIds.length > 0) {
      metadata.service_ids = serviceIds;
    }
    try {
      await createApiClient(getApiClientOptions()).post(`/${tenantSlug}/coupons`, {
        code: code.toUpperCase().trim(),
        type,
        value: type === "fixed" ? fixedAmountToCents(Number(value)) : Math.min(100, Number(value)),
        max_redemptions: maxUses ? Number(maxUses) : null,
        starts_at: startsAt || null,
        expires_at: expiresAt || null,
        is_active: true,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      });
      toast.success("Coupon created");
      setCode("");
      setServiceIds([]);
      setMinAmountMajor("");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not create coupon");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(coupon: Coupon) {
    try {
      await createApiClient(getApiClientOptions()).patch(`/${tenantSlug}/coupons/${coupon.id}`, {
        is_active: !coupon.is_active,
      });
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Update failed");
    }
  }

  async function removeCoupon(coupon: Coupon) {
    try {
      await createApiClient(getApiClientOptions()).delete(`/${tenantSlug}/coupons/${coupon.id}`);
      toast.success("Coupon removed");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not delete coupon");
    }
  }

  return (
    <Card className="rounded-2xl shadow-soft">
      <SettingsSectionHeader
        icon={Tag}
        title="Booking coupons"
        description="Discount codes clients apply at checkout. Validation runs on the server."
      />
      <CardContent className="space-y-6 pt-0">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Code</Label>
            <Input
              className="mt-1 rounded-xl font-mono uppercase"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="BOOK15"
            />
          </div>
          <div>
            <Label>Type</Label>
            <select
              className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              value={type}
              onChange={(e) => setType(e.target.value as "percent" | "fixed")}
            >
              <option value="percent">Percentage off</option>
              <option value="fixed">Fixed amount</option>
            </select>
          </div>
          <div>
            <Label>{type === "percent" ? "Percent off" : `Amount (${currency})`}</Label>
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
          {services.length > 0 ? (
            <div className="sm:col-span-2">
              <Label>Limit to services (optional)</Label>
              <div className="mt-1 max-h-28 space-y-1 overflow-y-auto rounded-xl border border-input p-2">
                {services.map((s) => (
                  <label key={s.id} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={serviceIds.includes(s.id)}
                      onChange={() => toggleService(s.id)}
                    />
                    <span className="truncate">{s.name}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}
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
          <div>
            <Label>Expires</Label>
            <Input
              type="date"
              className="mt-1 rounded-xl"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Button
              className="rounded-xl gap-2"
              onClick={() => void createCoupon()}
              disabled={saving || !code.trim()}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {saving ? "Creating…" : "Create coupon"}
            </Button>
          </div>
        </div>

        {loading ? (
          <Skeleton className="h-32 rounded-xl" />
        ) : coupons.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No coupons yet. Demo seeder creates BOOK15 for Luxe Bloom (15% off bookings).
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
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
                      <TableCell>{formatCouponValue(c, currency)}</TableCell>
                      <TableCell>
                        {c.redemptions_count}
                        {c.max_redemptions != null ? ` / ${c.max_redemptions}` : ""}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {c.starts_at ? new Date(c.starts_at).toLocaleDateString() : "—"}
                        {" → "}
                        {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "No expiry"}
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
  );
}
