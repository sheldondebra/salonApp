"use client";

import { useCallback, useEffect, useState } from "react";
import { Tag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { Coupon } from "@/lib/api/types";

type TenantCouponsSectionProps = {
  tenantSlug: string;
};

export function TenantCouponsSection({ tenantSlug }: TenantCouponsSectionProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [value, setValue] = useState("10");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

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

  async function createCoupon() {
    try {
      await createApiClient(getApiClientOptions()).post(`/${tenantSlug}/coupons`, {
        code: code.toUpperCase(),
        type,
        value: Number(value),
        max_redemptions: maxUses ? Number(maxUses) : null,
        expires_at: expiresAt || null,
        is_active: true,
      });
      toast.success("Coupon created");
      setCode("");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not create coupon");
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

  return (
    <Card className="max-w-3xl shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-accent" />
          Booking coupons
        </CardTitle>
        <CardDescription>
          Discount codes clients can apply when paying for appointments online.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Code</Label>
            <Input className="mt-1 rounded-xl" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <div>
            <Label>Type</Label>
            <select
              className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              value={type}
              onChange={(e) => setType(e.target.value as "percent" | "fixed")}
            >
              <option value="percent">Percentage off</option>
              <option value="fixed">Fixed amount (cents)</option>
            </select>
          </div>
          <div>
            <Label>Value</Label>
            <Input
              type="number"
              className="mt-1 rounded-xl"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <div>
            <Label>Max uses (optional)</Label>
            <Input
              type="number"
              className="mt-1 rounded-xl"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
            />
          </div>
          <div>
            <Label>Expires (optional)</Label>
            <Input
              type="date"
              className="mt-1 rounded-xl"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Button className="rounded-xl" onClick={() => void createCoupon()} disabled={!code.trim()}>
              Create coupon
            </Button>
          </div>
        </div>

        {loading ? (
          <Skeleton className="h-32 rounded-xl" />
        ) : coupons.length === 0 ? (
          <p className="text-sm text-muted-foreground">No coupons yet. Try BOOK15 after running the demo seeder.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Used</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-medium">{c.code}</TableCell>
                  <TableCell>{c.type === "percent" ? `${c.value}%` : `${c.value}¢`}</TableCell>
                  <TableCell>
                    {c.redemptions_count}
                    {c.max_redemptions != null ? ` / ${c.max_redemptions}` : ""}
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.is_active ? "default" : "secondary"}>
                      {c.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button type="button" size="sm" variant="outline" onClick={() => void toggleActive(c)}>
                      {c.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
