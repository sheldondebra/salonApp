"use client";

import { format, parseISO } from "date-fns";
import { Calendar, Clock, Mail, MapPin, Phone, Scissors, User, Users } from "lucide-react";
import type { Service } from "@/lib/api/types";
import { formatMoney } from "./booking-helpers";

type BookingConfirmSummaryProps = {
  services: Service[];
  date: string;
  timeLabel: string | null;
  joinWaitlist: boolean;
  locationSummary: string | null;
  staffName: string | null;
  partySize: number;
  recurring: boolean;
  recurrenceCount: number;
  recurrenceFrequency: string;
  totalDuration: number;
  totalPrice: number;
  currency: string;
  name: string;
  email: string;
  phone: string;
};

export function BookingConfirmSummary({
  services,
  date,
  timeLabel,
  joinWaitlist,
  locationSummary,
  staffName,
  partySize,
  recurring,
  recurrenceCount,
  recurrenceFrequency,
  totalDuration,
  totalPrice,
  currency,
  name,
  email,
  phone,
}: BookingConfirmSummaryProps) {
  const dateLabel = date ? format(parseISO(`${date}T12:00:00`), "EEEE, MMMM d, yyyy") : "—";

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">Review your booking</p>
        <ul className="mt-3 space-y-2 text-sm">
          {services.map((s) => (
            <li key={s.id} className="flex items-start justify-between gap-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Scissors className="h-3.5 w-3.5 text-accent" />
                {s.name}
              </span>
              <span className="shrink-0 text-muted-foreground">
                {formatMoney(s.price_cents, currency)} · {s.duration_minutes}m
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 border-t border-border/60 pt-3 space-y-1.5 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-accent" />
            {dateLabel}
          </p>
          <p className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-accent" />
            {joinWaitlist ? "Waitlist — no slot selected" : timeLabel ?? "Select a time"}
          </p>
          {locationSummary ? (
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent" />
              {locationSummary}
            </p>
          ) : null}
          {staffName ? (
            <p className="flex items-center gap-2">
              <User className="h-4 w-4 text-accent" />
              {staffName}
            </p>
          ) : null}
          {partySize > 1 ? (
            <p className="flex items-center gap-2">
              <Users className="h-4 w-4 text-accent" />
              {partySize} guests
            </p>
          ) : null}
          {recurring ? (
            <p className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-accent" />
              Repeats {recurrenceCount}× ({recurrenceFrequency})
            </p>
          ) : null}
        </div>
        <p className="mt-3 text-right text-base font-semibold">
          {totalDuration} min total · {formatMoney(totalPrice, currency)}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your details</p>
        <p className="flex items-center gap-2">
          <User className="h-4 w-4 text-accent" />
          {name || "—"}
        </p>
        <p className="mt-1 flex items-center gap-2">
          <Mail className="h-4 w-4 text-accent" />
          {email || "—"}
        </p>
        {phone ? (
          <p className="mt-1 flex items-center gap-2">
            <Phone className="h-4 w-4 text-accent" />
            {phone}
          </p>
        ) : null}
      </div>
    </div>
  );
}
