"use client";

import { useCallback, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Bell, CalendarClock, ListOrdered, Plus, RefreshCw, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchInput } from "@/components/shared/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmAction } from "@/features/crud/confirm-action";
import { WaitlistAddDialog } from "@/features/waitlist/waitlist-add-dialog";
import { SplitPageLayout } from "@/components/layout/page-layout";
import { useAbilities } from "@/hooks/use-abilities";
import { Permissions } from "@/lib/auth/permissions";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { WaitlistEntry, WaitlistListMeta, WaitlistOpening } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  waiting: "Waiting",
  notified: "Notified",
  booked: "Booked",
  cancelled: "Cancelled",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "warning"> = {
  waiting: "secondary",
  notified: "default",
  booked: "outline",
  cancelled: "warning",
};

type WaitlistViewProps = {
  tenantSlug: string;
};

export function WaitlistView({ tenantSlug }: WaitlistViewProps) {
  const { can } = useAbilities(tenantSlug);
  const canCreate = can(Permissions.bookings.create);
  const canUpdate = can(Permissions.bookings.update);

  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [meta, setMeta] = useState<WaitlistListMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("waiting");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [openings, setOpenings] = useState<WaitlistOpening[]>([]);
  const [openingsLoading, setOpeningsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const selected = entries.find((e) => e.uuid === selectedUuid) ?? null;

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(
    async (quiet = false) => {
      if (!quiet) setLoading(true);
      else setRefreshing(true);
      try {
        const params = new URLSearchParams({ per_page: "50" });
        if (statusFilter !== "all") params.set("status", statusFilter);
        if (searchDebounced) params.set("q", searchDebounced);
        const res = await createApiClient(getApiClientOptions()).get<{
          data: WaitlistEntry[];
          meta: WaitlistListMeta;
        }>(`/${tenantSlug}/waitlist?${params}`);
        setEntries(res.data);
        setMeta(res.meta);
        if (res.data.length && !selectedUuid) setSelectedUuid(res.data[0].uuid);
        else if (selectedUuid && !res.data.some((e) => e.uuid === selectedUuid)) {
          setSelectedUuid(res.data[0]?.uuid ?? null);
        }
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Could not load waitlist");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [tenantSlug, statusFilter, searchDebounced, selectedUuid]
  );

  useEffect(() => {
    void load();
  }, [load]);

  const loadOpenings = useCallback(async () => {
    if (!selectedUuid) {
      setOpenings([]);
      return;
    }
    setOpeningsLoading(true);
    try {
      const res = await createApiClient(getApiClientOptions()).get<{ data: WaitlistOpening[] }>(
        `/${tenantSlug}/waitlist/${selectedUuid}/openings`
      );
      setOpenings(res.data ?? []);
    } catch {
      setOpenings([]);
    } finally {
      setOpeningsLoading(false);
    }
  }, [tenantSlug, selectedUuid]);

  useEffect(() => {
    void loadOpenings();
  }, [loadOpenings]);

  async function notifyClient(entry: WaitlistEntry) {
    setActionLoading(true);
    try {
      await createApiClient(getApiClientOptions()).post(`/${tenantSlug}/waitlist/${entry.uuid}/notify`);
      toast.success("Client marked as notified");
      void load(true);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Notify failed");
    } finally {
      setActionLoading(false);
    }
  }

  async function convertEntry(entry: WaitlistEntry, opening: WaitlistOpening) {
    setActionLoading(true);
    try {
      const startsAt = new Date(`${opening.date}T${opening.time}:00`).toISOString();
      await createApiClient(getApiClientOptions()).post(`/${tenantSlug}/waitlist/${entry.uuid}/convert`, {
        starts_at: startsAt,
        staff_member_id: opening.staff_member_id,
      });
      toast.success("Converted to booking");
      void load(true);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not convert");
    } finally {
      setActionLoading(false);
    }
  }

  async function cancelEntry(entry: WaitlistEntry) {
    setActionLoading(true);
    try {
      await createApiClient(getApiClientOptions()).delete(`/${tenantSlug}/waitlist/${entry.uuid}`);
      toast.success("Waitlist entry removed");
      void load(true);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not cancel");
    } finally {
      setActionLoading(false);
    }
  }

  const listPanel = (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search client…" className="max-w-xs" />
        <select
          className="rounded-xl border border-input bg-background px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="waiting">Waiting</option>
          <option value="notified">Notified</option>
          <option value="booked">Booked</option>
          <option value="cancelled">Cancelled</option>
          <option value="all">All</option>
        </select>
        <Button type="button" variant="outline" size="sm" className="rounded-xl gap-1" onClick={() => void load(true)} disabled={refreshing}>
          <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          Refresh
        </Button>
        {canCreate ? (
          <Button type="button" size="sm" className="rounded-xl gap-1 ml-auto" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add to waitlist
          </Button>
        ) : null}
      </div>

      {meta ? (
        <p className="text-sm text-muted-foreground">{meta.total} entr{meta.total === 1 ? "y" : "ies"}</p>
      ) : null}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={ListOrdered}
          title="No waitlist entries"
          description="Clients join the waitlist online when slots are full, or add them here."
          action={
            canCreate ? (
              <Button type="button" className="rounded-xl gap-1" onClick={() => setAddOpen(true)}>
                <UserPlus className="h-4 w-4" />
                Quick add
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <button
              key={entry.uuid}
              type="button"
              onClick={() => setSelectedUuid(entry.uuid)}
              className={cn(
                "w-full rounded-xl border px-4 py-3 text-left transition-colors",
                selectedUuid === entry.uuid ? "border-primary bg-primary/5" : "border-border/60 hover:bg-muted/30"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">{entry.client_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(parseISO(entry.preferred_date), "EEE, MMM d")}
                    {entry.preferred_time ? ` · ${entry.preferred_time}` : ""}
                    {entry.staff_member?.name ? ` · ${entry.staff_member.name}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {(entry.services ?? []).map((s) => s.name).join(", ") || "Services"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge variant={STATUS_VARIANT[entry.status] ?? "secondary"}>{STATUS_LABELS[entry.status] ?? entry.status}</Badge>
                  {entry.priority > 0 ? (
                    <span className="text-[10px] font-semibold text-amber-600">P{entry.priority}</span>
                  ) : null}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const detailPanel = selected ? (
    <Card className="shadow-soft h-fit">
      <CardHeader>
        <CardTitle className="text-lg">{selected.client_name}</CardTitle>
        <CardDescription>
          {selected.client_email}
          {selected.client_phone ? ` · ${selected.client_phone}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <span className="text-muted-foreground">Preferred</span>
            <p className="font-medium">
              {format(parseISO(selected.preferred_date), "EEEE, MMM d")}
              {selected.preferred_time ? ` at ${selected.preferred_time}` : ""}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Staff</span>
            <p className="font-medium">{selected.staff_member?.name ?? "Any available"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Branch</span>
            <p className="font-medium">{selected.location?.name ?? "Any"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Party</span>
            <p className="font-medium">{selected.party_size}</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Services</p>
          <ul className="text-sm space-y-1">
            {(selected.services ?? []).map((s) => (
              <li key={s.id} className="flex justify-between">
                <span>{s.name}</span>
                <span className="text-muted-foreground">{s.duration_minutes} min</span>
              </li>
            ))}
          </ul>
        </div>

        {selected.notes ? (
          <p className="text-sm text-muted-foreground rounded-xl bg-muted/40 p-3">{selected.notes}</p>
        ) : null}

        {selected.converted_appointment ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-sm">
            <p className="font-medium text-emerald-800">Converted to booking</p>
            <p className="text-emerald-700">
              {selected.converted_appointment.starts_at
                ? format(parseISO(selected.converted_appointment.starts_at), "PPp")
                : selected.converted_appointment.uuid}
            </p>
          </div>
        ) : null}

        {canCreate && !["booked", "cancelled"].includes(selected.status) ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl gap-1"
              disabled={actionLoading}
              onClick={() => void notifyClient(selected)}
            >
              <Bell className="h-4 w-4" />
              Notify client
            </Button>
            {canUpdate ? (
              <ConfirmAction
                label="Remove"
                confirmMessage={`Remove ${selected.client_name} from the waitlist?`}
                onConfirm={() => void cancelEntry(selected)}
              />
            ) : null}
          </div>
        ) : null}

        {!["booked", "cancelled"].includes(selected.status) ? (
          <div>
            <p className="text-sm font-semibold flex items-center gap-1.5 mb-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              Matching openings
            </p>
            {openingsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 rounded-xl" />
                <Skeleton className="h-10 rounded-xl" />
              </div>
            ) : openings.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center rounded-xl border border-dashed">
                No openings found in the next 7 days for this request.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {openings.map((o) => (
                  <Button
                    key={`${o.date}-${o.time}`}
                    type="button"
                    variant="outline"
                    className="rounded-xl h-auto py-2 justify-start"
                    disabled={!canCreate || actionLoading}
                    onClick={() => void convertEntry(selected, o)}
                  >
                    <span className="text-left">
                      <span className="block font-medium">{format(parseISO(o.date), "EEE, MMM d")}</span>
                      <span className="block text-xs text-muted-foreground">{o.label}</span>
                    </span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  ) : (
    <Card className="shadow-soft border-dashed">
      <CardContent className="py-12 text-center text-sm text-muted-foreground">Select a waitlist entry</CardContent>
    </Card>
  );

  return (
    <>
      <SplitPageLayout sidebar={listPanel}>{detailPanel}</SplitPageLayout>

      <WaitlistAddDialog
        tenantSlug={tenantSlug}
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={() => {
          setAddOpen(false);
          void load(true);
        }}
      />
    </>
  );
}
