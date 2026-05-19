"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createApiClient } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { Appointment } from "@/lib/api/types";

type BookingsResponse = {
  data: Appointment[] | { data: Appointment[] };
  meta?: { total: number };
};

function normalizeAppointments(payload: BookingsResponse): Appointment[] {
  const raw = payload.data;
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object" && "data" in raw && Array.isArray(raw.data)) {
    return raw.data;
  }
  return [];
}

export default function AccountBookingsPage({ params }: { params: { tenantSlug: string } }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createApiClient(getApiClientOptions())
      .get<BookingsResponse>(`/${params.tenantSlug}/account/bookings`)
      .then((res) => setAppointments(normalizeAppointments(res)))
      .finally(() => setLoading(false));
  }, [params.tenantSlug]);

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle>Booking history</CardTitle>
        <CardDescription>Past and upcoming appointments at this salon.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : appointments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No appointments yet.</p>
        ) : (
          appointments.map((apt) => (
            <article
              key={apt.uuid}
              className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-border/60 bg-card p-4"
            >
              <div>
                <p className="font-medium">{apt.service?.name ?? "Service"}</p>
                <p className="text-sm text-muted-foreground">
                  {apt.staff_member?.display_name ?? "Staff"} ·{" "}
                  {apt.starts_at ? format(new Date(apt.starts_at), "MMM d, yyyy · h:mm a") : "—"}
                </p>
              </div>
              <Badge variant="secondary" className="capitalize">
                {apt.status}
              </Badge>
            </article>
          ))
        )}
      </CardContent>
    </Card>
  );
}
