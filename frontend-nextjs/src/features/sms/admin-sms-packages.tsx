"use client";

import { useCallback, useEffect, useState } from "react";
import { Package, Plus } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format/money";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";

export type SmsPackageRow = {
  id: number;
  slug: string;
  name: string;
  sms_credits: number;
  bonus_credits: number;
  total_credits: number;
  price_cents: number;
  currency: string;
  validity_days: number | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
};

const emptyForm = {
  slug: "",
  name: "",
  sms_credits: "500",
  bonus_credits: "0",
  price_cents: "5000",
  currency: "GHS",
  validity_days: "365",
  description: "",
  sort_order: "0",
};

export function AdminSmsPackages() {
  const [packages, setPackages] = useState<SmsPackageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    createApiClient(getApiClientOptions())
      .get<{ data: SmsPackageRow[] }>("/admin/sms-packages")
      .then((res) => setPackages(Array.isArray(res.data) ? res.data : []))
      .catch(() => toast.error("Could not load SMS packages"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function savePackage() {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    const body = {
      slug: form.slug.trim() || undefined,
      name: form.name.trim(),
      sms_credits: Number(form.sms_credits),
      bonus_credits: Number(form.bonus_credits),
      price_cents: Number(form.price_cents),
      currency: form.currency.trim() || "GHS",
      validity_days: form.validity_days ? Number(form.validity_days) : null,
      description: form.description.trim() || null,
      sort_order: Number(form.sort_order),
    };
    try {
      const client = createApiClient(getApiClientOptions());
      if (editingId) {
        await client.patch(`/admin/sms-packages/${editingId}`, body);
        toast.success("Package updated");
      } else {
        await client.post("/admin/sms-packages", body);
        toast.success("Package created");
      }
      setForm(emptyForm);
      setEditingId(null);
      load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(p: SmsPackageRow) {
    setEditingId(p.id);
    setForm({
      slug: p.slug,
      name: p.name,
      sms_credits: String(p.sms_credits),
      bonus_credits: String(p.bonus_credits),
      price_cents: String(p.price_cents),
      currency: p.currency,
      validity_days: p.validity_days ? String(p.validity_days) : "",
      description: p.description ?? "",
      sort_order: String(p.sort_order),
    });
  }

  async function toggleActive(p: SmsPackageRow) {
    try {
      await createApiClient(getApiClientOptions()).patch(`/admin/sms-packages/${p.id}`, {
        is_active: !p.is_active,
      });
      load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Update failed");
    }
  }

  async function removePackage(id: number) {
    if (!confirm("Remove this SMS package?")) return;
    try {
      await createApiClient(getApiClientOptions()).delete(`/admin/sms-packages/${id}`);
      toast.success("Package removed");
      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm);
      }
      load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Delete failed");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="rounded-2xl shadow-soft lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4 text-accent" />
            {editingId ? "Edit package" : "New SMS package"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input
              className="mt-1 rounded-xl"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <Label>Slug (optional)</Label>
            <Input
              className="mt-1 rounded-xl"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="starter-sms-pack"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>SMS credits</Label>
              <Input
                type="number"
                className="mt-1 rounded-xl"
                value={form.sms_credits}
                onChange={(e) => setForm((f) => ({ ...f, sms_credits: e.target.value }))}
              />
            </div>
            <div>
              <Label>Bonus</Label>
              <Input
                type="number"
                className="mt-1 rounded-xl"
                value={form.bonus_credits}
                onChange={(e) => setForm((f) => ({ ...f, bonus_credits: e.target.value }))}
              />
            </div>
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
          <div>
            <Label>Description</Label>
            <Input
              className="mt-1 rounded-xl"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="flex gap-2">
            <Button
              className="flex-1 rounded-xl"
              onClick={() => void savePackage()}
              disabled={saving || !form.name}
            >
              {saving ? "Saving…" : editingId ? "Update" : "Create"}
            </Button>
            {editingId ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-soft lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-accent" />
            SMS packages for salons
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-40 rounded-xl" />
          ) : packages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No packages yet. Run the seeder or create one above.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Package</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.slug}</div>
                    </TableCell>
                    <TableCell>
                      {p.total_credits}
                      {p.bonus_credits > 0 ? (
                        <span className="text-xs text-muted-foreground">
                          {" "}
                          ({p.sms_credits}+{p.bonus_credits})
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>{formatMoney(p.price_cents, p.currency)}</TableCell>
                    <TableCell>
                      <Badge variant={p.is_active ? "default" : "secondary"}>
                        {p.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(p)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => void toggleActive(p)}>
                        {p.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => void removePackage(p.id)}>
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
  );
}
