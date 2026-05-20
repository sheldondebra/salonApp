"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Check, Clock, MapPin, Scissors } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Appointment } from "@/lib/api/types";
import { formatAppointmentWhen, formatMoney, shortReference } from "./booking-helpers";

type BookingSuccessProps = {
  tenantName: string;
  tenantSlug: string;
  waitlist: boolean;
  appointments: Appointment[];
  clientName: string;
  clientEmail: string;
  preferredDate?: string;
  preferredTimeLabel?: string | null;
  currency: string;
  onBookAgain: () => void;
};

export function BookingSuccess({
  tenantName,
  tenantSlug,
  waitlist,
  appointments,
  clientName,
  clientEmail,
  preferredDate,
  preferredTimeLabel,
  currency,
  onBookAgain,
}: BookingSuccessProps) {
  const totalCents = appointments.reduce((sum, a) => sum + (a.service?.price_cents ?? 0), 0);
  const reference = appointments[0]?.uuid ? shortReference(appointments[0].uuid) : null;

  return (
    <Card className="mx-auto max-w-lg shadow-soft">
      <CardContent className="flex flex-col items-center py-10 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Check className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-semibold">
          {waitlist ? "You're on the waitlist" : "You're booked!"}
        </h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {waitlist
            ? `We'll email ${clientEmail} when a slot opens at ${tenantName}.`
            : `Confirmation saved at ${tenantName}. A summary was sent to ${clientEmail}.`}
        </p>

        {reference && !waitlist ? (
          <p className="mt-3 rounded-full bg-muted px-3 py-1 text-xs font-medium tracking-wide">
            Reference · {reference}
          </p>
        ) : null}

        <ul className="mt-6 w-full space-y-3 text-left">
          {waitlist && preferredDate ? (
            <li className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
              <p className="font-medium">Preferred date</p>
              <p className="mt-1 text-muted-foreground">
                {format(parseISO(`${preferredDate}T12:00:00`), "EEEE, MMMM d")}
                {preferredTimeLabel ? ` · ${preferredTimeLabel}` : ""}
              </p>
              <p className="mt-2 text-muted-foreground">{clientName}</p>
            </li>
          ) : null}

          {appointments.map((apt) => (
            <li key={apt.uuid} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">{apt.service?.name ?? "Service"}</p>
                <Badge variant={apt.status === "pending" ? "warning" : "success"} className="capitalize shrink-0">
                  {apt.status}
                </Badge>
              </div>
              {apt.starts_at ? (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 text-accent" />
                  {formatAppointmentWhen(apt.starts_at)}
                </p>
              ) : null}
              {apt.staff_member ? (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Scissors className="h-3.5 w-3.5 text-accent" />
                  {apt.staff_member.display_name}
                </p>
              ) : null}
              {apt.location?.name ? (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-accent" />
                  {apt.location.name}
                </p>
              ) : null}
              {apt.service?.price_cents != null ? (
                <p className="mt-2 text-sm font-medium">{formatMoney(apt.service.price_cents, currency)}</p>
              ) : null}
            </li>
          ))}
        </ul>

        {!waitlist && appointments.length > 1 && totalCents > 0 ? (
          <p className="mt-4 w-full text-right text-sm font-semibold">
            Total · {formatMoney(totalCents, currency)}
          </p>
        ) : null}

        <div className="mt-8 flex w-full flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" className="flex-1" onClick={onBookAgain}>
            Book again
          </Button>
          <Button asChild className="flex-1">
            <Link href={`/${tenantSlug}/dashboard`}>Salon dashboard</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
