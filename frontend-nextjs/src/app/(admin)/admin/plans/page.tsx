"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCard, Plus } from "lucide-react";
import { RequirePlatformPermission } from "@/components/auth/require-platform-permission";
import { AdminShell } from "@/components/layout/admin-shell";
import { Permissions } from "@/lib/auth/permissions";
import { formatMoney } from "@/lib/format/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { createApiClient } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";

type PlanRow = {
  id: number;
  slug: string;
  name: string;
  price_cents: number;
  interval: string;
  contact_sales: boolean;
  is_active: boolean;
  sort_order: number;
};

const emptyForm = {
  slug: "",
  name: "",
  price_cents: "0",
  interval: "month",
  contact_sales: false,
};

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    createApiClient(getApiClientOptions())
      .get<{ data: PlanRow[] }>("/admin/plans")
      .then((res) => setPlans(Array.isArray(res.data) ? res.data : []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const savePlan = async () => {
    setSaving(true);
    try {
      await createApiClient(getApiClientOptions()).post("/admin/plans", {
        slug: form.slug,
        name: form.name,
        price_cents: Number(form.price_cents),
        interval: form.interval,
        contact_sales: form.contact_sales,
        is_active: true,
      });
      setForm(emptyForm);
      load();
    } finally {
      setSaving(false);
    }
  };

  const removePlan = async (id: number) => {
    if (!confirm("Remove this plan?")) return;
    await createApiClient(getApiClientOptions()).delete(`/admin/plans/${id}`);
    load();
  };

  return (
    <AdminShell title="Plans" description="Subscription plans for salon owners">
      <RequirePlatformPermission permission={Permissions.billing.manage}>
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="rounded-2xl shadow-soft lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Plus className="h-4 w-4 text-accent" />
                New plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Slug</Label>
                <Input
                  className="mt-1 rounded-xl"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="professional"
                />
              </div>
              <div>
                <Label>Name</Label>
                <Input
                  className="mt-1 rounded-xl"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <Label>Price (cents)</Label>
                <Input
                  type="number"
                  className="mt-1 rounded-xl"
                  value={form.price_cents}
                  onChange={(e) => setForm((f) => ({ ...f, price_cents: e.target.value }))}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.contact_sales}
                  onChange={(e) => setForm((f) => ({ ...f, contact_sales: e.target.checked }))}
                />
                Contact sales only
              </label>
              <Button className="w-full rounded-xl" onClick={savePlan} disabled={saving || !form.slug || !form.name}>
                {saving ? "Saving…" : "Create plan"}
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-soft lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-accent" />
                Plans
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-40 rounded-xl" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{p.slug}</div>
                        </TableCell>
                        <TableCell>
                          {p.contact_sales ? "Contact sales" : formatMoney(p.price_cents)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={p.is_active ? "default" : "secondary"}>
                            {p.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => removePlan(p.id)}>
                            Delete
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
