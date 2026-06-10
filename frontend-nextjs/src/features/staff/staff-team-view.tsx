"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, Plus, UserCircle, Users, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MetricCard } from "@/components/shared/metric-card";
import { PageTabs } from "@/components/shared/page-tabs";
import { SearchInput } from "@/components/shared/search-input";
import { BranchSelect } from "@/components/shared/entity-selects";
import { CrudPagination } from "@/features/crud/crud-pagination";
import { crudRequest } from "@/features/crud/use-paginated-resource";
import { useAbilities } from "@/hooks/use-abilities";
import { Permissions } from "@/lib/auth/permissions";
import { ApiError } from "@/lib/api/client";
import { createApiClient } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { StaffMember, StaffPayRole } from "@/lib/api/types";
import { StaffMemberCard } from "@/features/staff/staff-member-card";
import { StaffDetailPanel, type StaffDetailTab } from "@/features/staff/staff-detail-panel";
import { StaffPayRolesPanel } from "@/features/staff/staff-pay-roles-panel";
import { useStaffDirectory } from "@/features/staff/use-staff-directory";

type StaffTeamViewProps = {
  tenantSlug: string;
  currency?: string;
};

type PageSection = "team" | "pay_roles";

export function StaffTeamView({ tenantSlug, currency = "GHS" }: StaffTeamViewProps) {
  const { can } = useAbilities(tenantSlug);
  const canCreate = can(Permissions.staff.create);
  const canUpdate = can(Permissions.staff.update);
  const canDelete = can(Permissions.staff.delete);

  const [section, setSection] = useState<PageSection>("team");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"" | "active" | "inactive">("");
  const [bookableFilter, setBookableFilter] = useState<"" | "yes" | "no">("");
  const [locationFilter, setLocationFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [titleFilter, setTitleFilter] = useState("");
  const [page, setPage] = useState(1);

  const [selectedId, setSelectedId] = useState<number | "new" | null>(null);
  const [detailTab, setDetailTab] = useState<StaffDetailTab>("profile");
  const [payRoles, setPayRoles] = useState<StaffPayRole[]>([]);

  const filters = useMemo(
    () => ({
      search,
      activeFilter,
      bookableFilter,
      locationFilter,
      statusFilter,
      titleFilter,
      page,
    }),
    [search, activeFilter, bookableFilter, locationFilter, statusFilter, titleFilter, page]
  );

  const { items, meta, loading, stats, locations, refresh } = useStaffDirectory(tenantSlug, filters);

  const selectedStaff = useMemo(() => {
    if (selectedId === "new" || selectedId === null) return null;
    return items.find((s) => s.id === selectedId) ?? null;
  }, [items, selectedId]);

  const loadPayRoles = useCallback(async () => {
    try {
      const res = await createApiClient(getApiClientOptions()).get<{ data: StaffPayRole[] }>(
        `/${tenantSlug}/pay-roles`
      );
      setPayRoles(Array.isArray(res.data) ? res.data : []);
    } catch {
      /* optional */
    }
  }, [tenantSlug]);

  useEffect(() => {
    void loadPayRoles();
  }, [loadPayRoles]);

  useEffect(() => {
    if (selectedId === "new" || selectedId === null) return;
    if (!items.some((s) => s.id === selectedId) && items.length > 0) {
      setSelectedId(items[0]?.id ?? null);
    }
  }, [items, selectedId]);

  function handleRefresh() {
    void refresh();
    void loadPayRoles();
  }

  function openCreate() {
    setSection("team");
    setSelectedId("new");
    setDetailTab("profile");
  }

  async function deactivate(row: StaffMember) {
    try {
      await crudRequest(tenantSlug, "delete", `/staff-members/${row.id}`);
      toast.success("Staff deactivated");
      setSelectedId(null);
      handleRefresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not deactivate");
    }
  }

  return (
    <div className="space-y-6">
      {stats ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard title="Total staff" value={String(stats.total)} icon={Users} />
          <MetricCard title="Active" value={String(stats.active)} icon={UserCircle} />
          <MetricCard title="Bookable" value={String(stats.bookable)} icon={Calendar} />
          <MetricCard title="On leave today" value={String(stats.on_leave_today)} icon={Calendar} />
          <MetricCard title="Available now" value={String(stats.available_now)} icon={UserCircle} hint="Not in appointment" />
        </div>
      ) : null}

      <PageTabs
        tabs={[
          { id: "team", label: "Team directory" },
          { id: "pay_roles", label: "Pay roles & salaries", icon: <Wallet className="h-4 w-4" /> },
        ]}
        value={section}
        onChange={(id) => setSection(id as PageSection)}
      />

      {section === "pay_roles" ? (
        <StaffPayRolesPanel
          tenantSlug={tenantSlug}
          currency={currency}
          canEdit={canUpdate}
          onChange={handleRefresh}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(280px,360px)_1fr] xl:grid-cols-[minmax(300px,380px)_1fr]">
          <aside className="space-y-4 rounded-2xl border border-border/60 bg-card p-4 shadow-soft lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold">Team</h2>
              {canCreate ? (
                <Button size="sm" className="rounded-lg gap-1" onClick={openCreate}>
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </Button>
              ) : null}
            </div>

            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="Search team…"
            />

            <div className="grid grid-cols-2 gap-2">
              <select
                value={activeFilter}
                onChange={(e) => {
                  setActiveFilter(e.target.value as typeof activeFilter);
                  setPage(1);
                }}
                className="h-9 rounded-lg border border-input bg-background px-2 text-xs"
              >
                <option value="">All status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                value={bookableFilter}
                onChange={(e) => {
                  setBookableFilter(e.target.value as typeof bookableFilter);
                  setPage(1);
                }}
                className="h-9 rounded-lg border border-input bg-background px-2 text-xs"
              >
                <option value="">Bookable</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
              <BranchSelect
                tenantSlug={tenantSlug}
                items={locations}
                value={locationFilter || "all"}
                onValueChange={(v) => {
                  setLocationFilter(v === "all" ? "" : v);
                  setPage(1);
                }}
                allowAll
                className="col-span-2 h-9 text-xs"
              />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="col-span-2 h-9 rounded-lg border border-input bg-background px-2 text-xs"
              >
                <option value="">Employment status</option>
                <option value="active">Active</option>
                <option value="on_leave">On leave</option>
                <option value="inactive">Inactive</option>
                <option value="terminated">Terminated</option>
              </select>
              <Input
                value={titleFilter}
                onChange={(e) => setTitleFilter(e.target.value)}
                onBlur={() => setPage(1)}
                placeholder="Job title"
                className="col-span-2 h-9 rounded-lg text-xs"
              />
            </div>

            <div className="space-y-2">
              {loading ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
              ) : items.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No staff found.</p>
              ) : (
                items.map((row) => (
                  <StaffMemberCard
                    key={row.id}
                    member={row}
                    currency={currency}
                    selected={selectedId === row.id}
                    onSelect={() => {
                      setSelectedId(row.id);
                      setDetailTab("profile");
                    }}
                  />
                ))
              )}
            </div>

            <CrudPagination meta={meta} page={page} onPageChange={setPage} />
          </aside>

          <StaffDetailPanel
            tenantSlug={tenantSlug}
            currency={currency}
            mode={selectedId === "new" ? "create" : "view"}
            staff={selectedStaff}
            allStaff={items}
            tab={detailTab}
            onTabChange={setDetailTab}
            payRoles={payRoles}
            locations={locations}
            canUpdate={canUpdate}
            canDelete={canDelete}
            canCreate={canCreate}
            onSaved={() => {
              handleRefresh();
              if (selectedId === "new") setSelectedId(null);
            }}
            onDeactivate={deactivate}
            onCancelCreate={() => setSelectedId(null)}
          />
        </div>
      )}
    </div>
  );
}
