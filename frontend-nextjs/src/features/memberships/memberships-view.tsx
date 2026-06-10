"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Crown, RefreshCw, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricCard } from "@/components/shared/metric-card";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MembershipPlanCard } from "@/features/memberships/membership-plan-card";
import { useAbilities } from "@/hooks/use-abilities";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { Permissions } from "@/lib/auth/permissions";
import { formatMoney } from "@/lib/format/money";
import type { ClientMembership, MembershipPlan, TenantClient } from "@/lib/api/types";

type MembershipsViewProps = {
  tenantSlug: string;
  currency?: string;
};

export function MembershipsView({ tenantSlug, currency = "GHS" }: MembershipsViewProps) {
  const { can } = useAbilities(tenantSlug);
  const canCreate = can(Permissions.memberships.create);

  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [memberships, setMemberships] = useState<ClientMembership[]>([]);
  const [clients, setClients] = useState<TenantClient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [startsAt, setStartsAt] = useState("");

  const filteredMemberships = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return memberships;
    return memberships.filter((item) =>
      [item.client?.name, item.client?.email, item.membership_plan?.name, item.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [memberships, search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const client = createApiClient(getApiClientOptions());
      const [plansRes, membershipsRes, clientsRes] = await Promise.all([
        client.get<{ data: MembershipPlan[] }>(`/${tenantSlug}/membership-plans?per_page=50`),
        client.get<{ data: ClientMembership[] }>(`/${tenantSlug}/client-memberships?per_page=50`),
        client.get<{ data: TenantClient[] }>(`/${tenantSlug}/clients?per_page=100&is_active=1`),
      ]);
      setPlans(Array.isArray(plansRes.data) ? plansRes.data : []);
      setMemberships(Array.isArray(membershipsRes.data) ? membershipsRes.data : []);
      setClients(Array.isArray(clientsRes.data) ? clientsRes.data : []);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load memberships");
      setPlans([]);
      setMemberships([]);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  async function assignMembership() {
    if (!selectedPlanId || !selectedClientId) {
      toast.error("Choose a client and membership plan");
      return;
    }
    setSaving(true);
    try {
      await createApiClient(getApiClientOptions()).post(`/${tenantSlug}/client-memberships`, {
        membership_plan_id: Number(selectedPlanId),
        client_user_id: Number(selectedClientId),
        starts_at: startsAt || undefined,
      });
      toast.success("Membership assigned");
      setSelectedClientId("");
      setStartsAt("");
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not assign membership");
    } finally {
      setSaving(false);
    }
  }

  const activePlans = plans.filter((plan) => plan.is_active);
  const activeMembers = memberships.filter((item) => item.status === "active");
  const recurringRevenue = activeMembers.reduce((sum, item) => sum + (item.amount_cents ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Plans" value={String(plans.length)} hint={`${activePlans.length} active`} icon={Crown} />
        <MetricCard title="Active members" value={String(activeMembers.length)} icon={Users} />
        <MetricCard
          title="Recurring value"
          value={formatMoney(recurringRevenue, currency)}
          hint="From active memberships"
          icon={RefreshCw}
        />
        <MetricCard
          title="Pending actions"
          value={String(memberships.filter((item) => item.status !== "active").length)}
          hint="Paused, pending, or expired"
          icon={UserPlus}
        />
      </div>

      <Card className="rounded-2xl border-border/60 shadow-soft">
        <CardHeader>
          <CardTitle>Assign membership</CardTitle>
          <CardDescription>Sell a plan to an existing client from the front desk.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="space-y-2">
            <Label>Client</Label>
            <select
              value={selectedClientId}
              onChange={(event) => setSelectedClientId(event.target.value)}
              className="min-h-touch rounded-xl border border-input bg-card px-3 text-sm"
              disabled={!canCreate}
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
            <Label>Plan</Label>
            <select
              value={selectedPlanId}
              onChange={(event) => setSelectedPlanId(event.target.value)}
              className="min-h-touch rounded-xl border border-input bg-card px-3 text-sm"
              disabled={!canCreate}
            >
              <option value="">Choose plan</option>
              {activePlans.map((plan) => (
                <option key={plan.id} value={String(plan.id)}>
                  {plan.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Start date</Label>
            <Input type="date" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} />
          </div>
          <div className="flex items-end">
            <Button className="w-full rounded-xl" disabled={!canCreate || saving} onClick={() => void assignMembership()}>
              {saving ? "Assigning…" : "Assign membership"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {plans.length === 0 && !loading ? (
        <EmptyState
          icon={Crown}
          title="No membership plans yet"
          description="Create plans in the backend and they will appear here for sales and renewals."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <MembershipPlanCard key={plan.id} plan={plan} currency={currency} />
          ))}
        </div>
      )}

      <Card className="rounded-2xl border-border/60 shadow-soft">
        <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Client memberships</CardTitle>
            <CardDescription>Track active subscriptions, renewals, and expiring plans.</CardDescription>
          </div>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search client or plan…"
            className="w-full sm:max-w-xs"
          />
        </CardHeader>
        <CardContent>
          <DataTable
            columns={[
              {
                id: "client",
                header: "Client",
                mobilePrimary: true,
                cell: (row) => (
                  <div>
                    <p className="font-medium">{row.client?.name ?? "Client"}</p>
                    <p className="text-xs text-muted-foreground">{row.client?.email ?? "No email"}</p>
                  </div>
                ),
              },
              {
                id: "plan",
                header: "Plan",
                cell: (row) => row.membership_plan?.name ?? "Membership plan",
              },
              {
                id: "status",
                header: "Status",
                cell: (row) => <span className="capitalize">{row.status.replace(/_/g, " ")}</span>,
              },
              {
                id: "term",
                header: "Dates",
                cell: (row) => (
                  <div className="text-sm">
                    <p>{row.started_at ? new Date(row.started_at).toLocaleDateString() : "Starts now"}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.ends_at ? `Ends ${new Date(row.ends_at).toLocaleDateString()}` : "No end date"}
                    </p>
                  </div>
                ),
              },
            ]}
            data={filteredMemberships}
            rowKey={(row) => String(row.id)}
            loading={loading}
            emptyIcon={Users}
            emptyTitle="No memberships assigned"
            emptyDescription="Assigned memberships will appear here once clients are enrolled."
          />
        </CardContent>
      </Card>
    </div>
  );
}
