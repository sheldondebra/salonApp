"use client";

import { useCallback, useEffect, useState } from "react";
import { Gift, PackageCheck, Repeat2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/data-table";
import { MetricCard } from "@/components/shared/metric-card";
import { PageTabs } from "@/components/shared/page-tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmAction } from "@/features/crud/confirm-action";
import { useAbilities } from "@/hooks/use-abilities";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { Permissions } from "@/lib/auth/permissions";
import { formatMoney } from "@/lib/format/money";
import type {
  ClientPackage,
  PackageRedemption,
  Service,
  ServicePackage,
  TenantClient,
} from "@/lib/api/types";

type PackagesViewProps = {
  tenantSlug: string;
  currency?: string;
};

const emptyDraft = {
  id: "",
  name: "",
  description: "",
  price: "0",
  validity_days: "30",
  service_id: "",
  quantity: "1",
};

export function PackagesView({ tenantSlug, currency = "GHS" }: PackagesViewProps) {
  const { can } = useAbilities(tenantSlug);
  const canCreate = can(Permissions.packages.create);
  const canUpdate = can(Permissions.packages.update);
  const canDelete = can(Permissions.packages.delete);

  const [tab, setTab] = useState("catalog");
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [clientPackages, setClientPackages] = useState<ClientPackage[]>([]);
  const [redemptions, setRedemptions] = useState<PackageRedemption[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<TenantClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [sellClientId, setSellClientId] = useState("");
  const [sellPackageId, setSellPackageId] = useState("");
  const [redeemClientPackageId, setRedeemClientPackageId] = useState("");
  const [redeemQty, setRedeemQty] = useState("1");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const client = createApiClient(getApiClientOptions());
      const [packagesRes, clientPackagesRes, redemptionsRes, servicesRes, clientsRes] = await Promise.all([
        client.get<{ data: ServicePackage[] }>(`/${tenantSlug}/service-packages?per_page=50`),
        client.get<{ data: ClientPackage[] }>(`/${tenantSlug}/client-packages?per_page=50`),
        client.get<{ data: PackageRedemption[] }>(`/${tenantSlug}/package-redemptions?per_page=50`),
        client.get<{ data: Service[] }>(`/${tenantSlug}/services?per_page=100&is_active=1`),
        client.get<{ data: TenantClient[] }>(`/${tenantSlug}/clients?per_page=100&is_active=1`),
      ]);
      setPackages(Array.isArray(packagesRes.data) ? packagesRes.data : []);
      setClientPackages(Array.isArray(clientPackagesRes.data) ? clientPackagesRes.data : []);
      setRedemptions(Array.isArray(redemptionsRes.data) ? redemptionsRes.data : []);
      setServices(Array.isArray(servicesRes.data) ? servicesRes.data : []);
      setClients(Array.isArray(clientsRes.data) ? clientsRes.data : []);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load service packages");
      setPackages([]);
      setClientPackages([]);
      setRedemptions([]);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  function resetDraft() {
    setDraft(emptyDraft);
  }

  async function savePackage() {
    if (!draft.name.trim() || !draft.service_id) {
      toast.error("Add a name and at least one service");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        price_cents: Math.round(Number(draft.price || 0) * 100),
        validity_days: Number(draft.validity_days || 30),
        is_active: true,
        items: [
          {
            service_id: Number(draft.service_id),
            quantity: Number(draft.quantity || 1),
          },
        ],
      };
      const client = createApiClient(getApiClientOptions());
      if (draft.id) {
        await client.patch(`/${tenantSlug}/service-packages/${draft.id}`, payload);
        toast.success("Package updated");
      } else {
        await client.post(`/${tenantSlug}/service-packages`, payload);
        toast.success("Package created");
      }
      resetDraft();
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not save package");
    } finally {
      setSaving(false);
    }
  }

  async function sellPackage() {
    if (!sellClientId || !sellPackageId) {
      toast.error("Choose a client and package");
      return;
    }
    setSaving(true);
    try {
      await createApiClient(getApiClientOptions()).post(`/${tenantSlug}/client-packages/sell`, {
        client_user_id: Number(sellClientId),
        service_package_id: Number(sellPackageId),
      });
      toast.success("Package sold");
      setSellClientId("");
      setSellPackageId("");
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not sell package");
    } finally {
      setSaving(false);
    }
  }

  async function redeemPackage() {
    if (!redeemClientPackageId) {
      toast.error("Choose a sold package");
      return;
    }
    const selected = clientPackages.find((item) => String(item.id) === redeemClientPackageId);
    const serviceId = selected?.service_package?.id
      ? packages.find((item) => item.id === selected.service_package?.id)?.items?.[0]?.service_id
      : undefined;
    if (!serviceId) {
      toast.error("Package service is missing");
      return;
    }
    setSaving(true);
    try {
      await createApiClient(getApiClientOptions()).post(`/${tenantSlug}/package-redemptions`, {
        client_package_id: Number(redeemClientPackageId),
        service_id: serviceId,
        quantity: Number(redeemQty || 1),
      });
      toast.success("Package redeemed");
      setRedeemClientPackageId("");
      setRedeemQty("1");
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not redeem package");
    } finally {
      setSaving(false);
    }
  }

  async function removePackage(id: number) {
    try {
      await createApiClient(getApiClientOptions()).delete(`/${tenantSlug}/service-packages/${id}`);
      toast.success("Package deleted");
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not delete package");
    }
  }

  const packageRevenue = clientPackages.reduce((sum, item) => sum + packages
    .filter((pkg) => pkg.id === item.service_package_id)
    .reduce((pkgSum, pkg) => pkgSum + pkg.price_cents, 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Packages" value={String(packages.length)} hint="Reusable prepaid offers" icon={Gift} />
        <MetricCard title="Sold" value={String(clientPackages.length)} hint="Client package wallets" icon={PackageCheck} />
        <MetricCard title="Redemptions" value={String(redemptions.length)} hint="Visits consumed" icon={Repeat2} />
        <MetricCard title="Package sales" value={formatMoney(packageRevenue, currency)} icon={Gift} />
      </div>

      <PageTabs
        tabs={[
          { id: "catalog", label: "Catalog" },
          { id: "sales", label: "Sell & redeem" },
          { id: "activity", label: "Redemption log" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "catalog" ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <Card className="rounded-2xl border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle>Package catalog</CardTitle>
              <CardDescription>Build prepaid bundles of service visits.</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={[
                  {
                    id: "name",
                    header: "Package",
                    mobilePrimary: true,
                    cell: (row) => (
                      <div>
                        <p className="font-medium">{row.name}</p>
                        <p className="text-xs text-muted-foreground">{row.description || "No description"}</p>
                      </div>
                    ),
                  },
                  {
                    id: "value",
                    header: "Price",
                    cell: (row) => formatMoney(row.price_cents, currency),
                  },
                  {
                    id: "items",
                    header: "Included",
                    cell: (row) =>
                      row.items.map((item) => `${item.service_name} ×${item.quantity}`).join(", "),
                  },
                  {
                    id: "actions",
                    header: "",
                    className: "text-right",
                    cell: (row) => (
                      <div className="flex justify-end gap-2">
                        {canUpdate ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setDraft({
                                id: String(row.id),
                                name: row.name,
                                description: row.description ?? "",
                                price: String(row.price_cents / 100),
                                validity_days: String(row.validity_days ?? 30),
                                service_id: row.items[0] ? String(row.items[0].service_id) : "",
                                quantity: row.items[0] ? String(row.items[0].quantity) : "1",
                              })
                            }
                          >
                            Edit
                          </Button>
                        ) : null}
                        {canDelete ? (
                          <ConfirmAction
                            label=""
                            icon={Trash2}
                            title="Delete this package?"
                            confirmMessage="Clients who already bought this package will keep their balance. This removes the package from sale."
                            confirmLabel="Delete"
                            variant="ghost"
                            className="h-8 w-8 px-0"
                            onConfirm={() => removePackage(row.id)}
                          />
                        ) : null}
                      </div>
                    ),
                  },
                ]}
                data={packages}
                rowKey={(row) => String(row.id)}
                loading={loading}
                emptyIcon={Gift}
                emptyTitle="No service packages yet"
                emptyDescription="Create prepaid packages to bundle repeat visits."
              />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle>{draft.id ? "Edit package" : "New package"}</CardTitle>
              <CardDescription>Start simple with one core service and visit quantity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <textarea
                  value={draft.description}
                  onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                  className="min-h-24 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Price ({currency})</Label>
                  <Input type="number" min={0} step="0.01" value={draft.price} onChange={(event) => setDraft((current) => ({ ...current, price: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Valid for days</Label>
                  <Input type="number" min={1} value={draft.validity_days} onChange={(event) => setDraft((current) => ({ ...current, validity_days: event.target.value }))} />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Service</Label>
                  <select
                    value={draft.service_id}
                    onChange={(event) => setDraft((current) => ({ ...current, service_id: event.target.value }))}
                    className="min-h-touch rounded-xl border border-input bg-card px-3 text-sm"
                  >
                    <option value="">Choose service</option>
                    {services.map((service) => (
                      <option key={service.id} value={String(service.id)}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Visit quantity</Label>
                  <Input type="number" min={1} value={draft.quantity} onChange={(event) => setDraft((current) => ({ ...current, quantity: event.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="rounded-xl" disabled={!canCreate || saving} onClick={() => void savePackage()}>
                  {saving ? "Saving…" : draft.id ? "Update package" : "Create package"}
                </Button>
                <Button type="button" variant="outline" className="rounded-xl" onClick={resetDraft}>
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "sales" ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="rounded-2xl border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle>Sell package</CardTitle>
              <CardDescription>Assign a prepaid package to a client account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Client</Label>
                <select
                  value={sellClientId}
                  onChange={(event) => setSellClientId(event.target.value)}
                  className="min-h-touch rounded-xl border border-input bg-card px-3 text-sm"
                >
                  <option value="">Choose client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={String(client.id)}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Package</Label>
                <select
                  value={sellPackageId}
                  onChange={(event) => setSellPackageId(event.target.value)}
                  className="min-h-touch rounded-xl border border-input bg-card px-3 text-sm"
                >
                  <option value="">Choose package</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={String(pkg.id)}>
                      {pkg.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button className="rounded-xl" disabled={!canCreate || saving} onClick={() => void sellPackage()}>
                Sell package
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle>Redeem package</CardTitle>
              <CardDescription>Consume a package visit after the service is delivered.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Sold package</Label>
                <select
                  value={redeemClientPackageId}
                  onChange={(event) => setRedeemClientPackageId(event.target.value)}
                  className="min-h-touch rounded-xl border border-input bg-card px-3 text-sm"
                >
                  <option value="">Choose sold package</option>
                  {clientPackages.map((item) => (
                    <option key={item.id} value={String(item.id)}>
                      {(item.client?.name ?? "Client")} · {item.service_package?.name ?? "Package"} · {item.balance_remaining} left
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" min={1} value={redeemQty} onChange={(event) => setRedeemQty(event.target.value)} />
              </div>
              <Button className="rounded-xl" disabled={!canUpdate || saving} onClick={() => void redeemPackage()}>
                Redeem visit
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "activity" ? (
        <DataTable
          columns={[
            {
              id: "service",
              header: "Service",
              mobilePrimary: true,
              cell: (row) => row.service_name ?? "Package redemption",
            },
            {
              id: "quantity",
              header: "Qty",
              cell: (row) => row.quantity,
            },
            {
              id: "staff",
              header: "Team member",
              cell: (row) => row.staff_member_name ?? "Front desk",
            },
            {
              id: "date",
              header: "Redeemed",
              cell: (row) => row.redeemed_at ? new Date(row.redeemed_at).toLocaleString() : "Just now",
            },
          ]}
          data={redemptions}
          rowKey={(row) => String(row.id)}
          loading={loading}
          emptyIcon={Repeat2}
          emptyTitle="No package redemptions yet"
          emptyDescription="Redemption activity appears here after staff consume a package visit."
        />
      ) : null}
    </div>
  );
}
