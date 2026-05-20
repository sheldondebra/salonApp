"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, Plus } from "lucide-react";
import { RequirePlatformPermission } from "@/components/auth/require-platform-permission";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminToolbar } from "@/features/admin/admin-toolbar";
import { Permissions } from "@/lib/auth/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { createApiClient } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { Tenant } from "@/lib/api/types";
import type { OnboardingProgress } from "@/features/onboarding/types";

type TenantRow = Tenant & {
  onboarding?: OnboardingProgress;
  owner?: { name: string; email: string; onboarding_status: string };
};

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [plan, setPlan] = useState("starter");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (statusFilter) params.set("status", statusFilter);
    createApiClient(getApiClientOptions())
      .get<{ data: TenantRow[] }>(`/admin/tenants?${params}`)
      .then((res) => setTenants(Array.isArray(res.data) ? res.data : []))
      .finally(() => setLoading(false));
  }, [search, statusFilter]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const createTenant = async () => {
    setSaving(true);
    try {
      await createApiClient(getApiClientOptions()).post("/admin/tenants", {
        name,
        slug: slug || undefined,
        plan,
        status: "active",
      });
      setName("");
      setSlug("");
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (tenant: TenantRow, status: string) => {
    await createApiClient(getApiClientOptions()).patch(`/admin/tenants/${tenant.uuid}`, { status });
    load();
  };

  return (
    <AdminShell title="All tenants" description="Salon workspaces on the platform">
      <RequirePlatformPermission permission={Permissions.tenants.view}>
        <Card className="rounded-2xl shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-accent" />
                Tenants
              </span>
              <Button size="sm" className="rounded-xl gap-1" onClick={() => setShowForm((v) => !v)}>
                <Plus className="h-4 w-4" />
                Add tenant
              </Button>
            </CardTitle>
            <AdminToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Name or slug">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 w-36 rounded-xl border border-input bg-card px-3 text-sm"
              >
                <option value="">All status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </AdminToolbar>
          </CardHeader>
          <CardContent className="space-y-6">
            {showForm ? (
              <div className="grid gap-3 rounded-2xl border border-dashed border-border bg-muted/30 p-4 sm:grid-cols-4">
                <div>
                  <Label>Business name</Label>
                  <Input className="mt-1 rounded-xl" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <Label>Slug (optional)</Label>
                  <Input className="mt-1 rounded-xl" value={slug} onChange={(e) => setSlug(e.target.value)} />
                </div>
                <div>
                  <Label>Plan</Label>
                  <Input className="mt-1 rounded-xl" value={plan} onChange={(e) => setPlan(e.target.value)} />
                </div>
                <div className="flex items-end">
                  <Button className="w-full rounded-xl" onClick={createTenant} disabled={saving || !name}>
                    {saving ? "Creating…" : "Create"}
                  </Button>
                </div>
              </div>
            ) : null}

            {loading ? (
              <Skeleton className="h-48 w-full rounded-xl" />
            ) : tenants.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tenants yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Setup</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((tenant) => (
                    <TableRow key={tenant.uuid}>
                      <TableCell>
                        <div className="font-medium">{tenant.name}</div>
                        <div className="text-xs text-muted-foreground">/{tenant.slug}</div>
                      </TableCell>
                      <TableCell>
                        <div>{tenant.owner?.name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{tenant.owner?.email}</div>
                      </TableCell>
                      <TableCell>{tenant.plan}</TableCell>
                      <TableCell className="min-w-[120px]">
                        <div className="mb-1 text-xs">{tenant.onboarding?.percent ?? 0}%</div>
                        <Progress value={tenant.onboarding?.percent ?? 0} />
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{tenant.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <select
                          className="h-8 rounded-lg border border-input bg-card px-2 text-xs"
                          value={tenant.status}
                          onChange={(e) => updateStatus(tenant, e.target.value)}
                        >
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                          <option value="pending">Pending</option>
                        </select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </RequirePlatformPermission>
    </AdminShell>
  );
}
