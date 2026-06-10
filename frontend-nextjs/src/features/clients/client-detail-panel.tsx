"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Pencil, Mail, Phone, Smartphone, Scissors, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmAction } from "@/features/crud/confirm-action";
import { StatusBadge } from "@/components/shared/status-badge";
import { createApiClient } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { Appointment, TenantClient } from "@/lib/api/types";

type ClientDetailPanelProps = {
  tenantSlug: string;
  client: TenantClient;
  canUpdate: boolean;
  canDelete: boolean;
  canRequestPayment: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onRequestPayment: () => void;
  onClose?: () => void;
};

function appointmentTone(status: string): "success" | "warning" | "danger" | "neutral" | "info" {
  switch (status) {
    case "completed":
      return "success";
    case "confirmed":
      return "info";
    case "pending":
      return "warning";
    case "cancelled":
    case "no_show":
      return "danger";
    default:
      return "neutral";
  }
}

function formatWhen(iso: string) {
  try {
    return format(parseISO(iso), "EEE, MMM d · h:mm a");
  } catch {
    return iso;
  }
}

export function ClientDetailPanel({
  tenantSlug,
  client,
  canUpdate,
  canDelete,
  canRequestPayment,
  onEdit,
  onRemove,
  onRequestPayment,
  onClose,
}: ClientDetailPanelProps) {
  const [bookings, setBookings] = useState<Appointment[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setBookingsLoading(true);

    createApiClient(getApiClientOptions())
      .get<{ data: Appointment[] }>(
        `/${tenantSlug}/appointments?filter=all&client_user_id=${client.id}&per_page=5`
      )
      .then((res) => {
        if (!cancelled) setBookings(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setBookings([]);
      })
      .finally(() => {
        if (!cancelled) setBookingsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tenantSlug, client.id]);

  const totalBookings = client.appointments_count ?? bookings.length;

  return (
    <Card className="h-full rounded-2xl shadow-soft">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 border-b border-border pb-4">
        <div className="min-w-0">
          <CardTitle className="truncate text-xl">{client.name}</CardTitle>
          <div className="mt-2">
            <StatusBadge label={client.is_active ? "Active" : "Inactive"} tone={client.is_active ? "success" : "neutral"} />
          </div>
        </div>
        {onClose ? (
          <Button variant="ghost" size="sm" className="shrink-0 rounded-xl md:hidden" onClick={onClose}>
            Back
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <dl className="space-y-4 text-sm">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium">{client.email}</dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <dt className="text-muted-foreground">Phone</dt>
              <dd className="font-medium">{client.phone ?? "—"}</dd>
            </div>
          </div>
        </dl>

        <section className="space-y-3 border-t border-border pt-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">Services booked</p>
            <span className="text-xs tabular-nums text-muted-foreground">{totalBookings} total</span>
          </div>

          {bookingsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : bookings.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
              No bookings yet for this client.
            </p>
          ) : (
            <div className="space-y-2">
              {bookings.map((apt) => (
                <article
                  key={apt.uuid}
                  className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 p-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Scissors className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm">{apt.service?.name ?? "Service"}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {apt.starts_at ? formatWhen(apt.starts_at) : "—"}
                      {apt.staff_member?.display_name ? ` · ${apt.staff_member.display_name}` : ""}
                    </p>
                  </div>
                  <StatusBadge
                    label={apt.status.replace("_", " ")}
                    tone={appointmentTone(apt.status)}
                    className="shrink-0 capitalize"
                  />
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="flex flex-col gap-2 border-t border-border pt-4">
          {canRequestPayment ? (
            <Button className="w-full justify-start gap-2 rounded-xl" variant="outline" onClick={onRequestPayment}>
              <Smartphone className="h-4 w-4" />
              Request MoMo payment
            </Button>
          ) : null}
          {canUpdate ? (
            <Button className="w-full justify-start gap-2 rounded-xl" variant="outline" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
              Edit client
            </Button>
          ) : null}
          {canDelete ? (
            <ConfirmAction
              label="Remove client"
              confirmLabel="Remove from directory"
              variant="destructive"
              icon={Trash2}
              className="h-10 w-full justify-start gap-2 rounded-xl px-4"
              title="Remove client from directory?"
              confirmMessage={`${client.name} will be removed from your client list and marked inactive. Their booking history is kept. You can re-add them later with the same email.`}
              onConfirm={onRemove}
            />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
