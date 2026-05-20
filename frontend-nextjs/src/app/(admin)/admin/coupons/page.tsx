"use client";

import { useCallback, useEffect, useState } from "react";
import { Tag } from "lucide-react";
import { toast } from "sonner";
import { RequirePlatformPermission } from "@/components/auth/require-platform-permission";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminToolbar } from "@/features/admin/admin-toolbar";
import { Permissions } from "@/lib/auth/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { Coupon } from "@/lib/api/types";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [code, setCode] = useState("");
  const [value, setValue] = useState("20");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [scope, setScope] = useState<"subscription" | "booking" | "both">("subscription");
  const [maxUses, setMaxUses] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [planIds, setPlanIds] = useState("");

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
    try {
      await createApiClient(getApiClientOptions()).post("/admin/coupons", {
        code: code.toUpperCase(),
        type,
        value: Number(value),
        scope,
        max_redemptions: maxUses ? Number(maxUses) : null,
        starts_at: startsAt || null,
        expires_at: expiresAt || null,
        is_active: true,
        metadata: planIds.trim()
          ? { plan_ids: planIds.split(",").map((s) => s.trim()).filter(Boolean) }
          : undefined,
      });
      toast.success("Coupon created");
      setCode("");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not create coupon");
    }
  }

  async function toggleActive(coupon: Coupon) {
    await createApiClient(getApiClientOptions()).patch(`/admin/coupons/${coupon.id}`, {
      is_active: !coupon.is_active,
    });
    load();
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
                <Input className="mt-1 rounded-xl" value={code} onChange={(e) => setCode(e.target.value)} />
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
                  <option value="both">Both</option>
                </select>
              </div>
              <div>
                <Label>Type</Label>
                <select
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                  value={type}
                  onChange={(e) => setType(e.target.value as "percent" | "fixed")}
                >
                  <option value="percent">Percent</option>
                  <option value="fixed">Fixed (cents)</option>
                </select>
              </div>
              <div>
                <Label>Value</Label>
                <Input type="number" className="mt-1 rounded-xl" value={value} onChange={(e) => setValue(e.target.value)} />
              </div>
              <div>
                <Label>Plan IDs (comma, optional)</Label>
                <Input
                  className="mt-1 rounded-xl"
                  placeholder="starter, growth, professional"
                  value={planIds}
                  onChange={(e) => setPlanIds(e.target.value)}
                />
              </div>
              <div>
                <Label>Max redemptions</Label>
                <Input type="number" className="mt-1 rounded-xl" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} />
              </div>
              <div>
                <Label>Starts</Label>
                <Input type="date" className="mt-1 rounded-xl" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
              </div>
              <div>
                <Label>Expires</Label>
                <Input type="date" className="mt-1 rounded-xl" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
              </div>
              <Button className="w-full rounded-xl" onClick={() => void createCoupon()} disabled={!code}>
                Create
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
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Scope</TableHead>
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
                        <TableCell className="capitalize">{c.scope ?? "subscription"}</TableCell>
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
        </div>
      </RequirePlatformPermission>
    </AdminShell>
  );
}
