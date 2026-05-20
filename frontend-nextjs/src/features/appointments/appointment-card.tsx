"use client";

import { format, formatDistanceToNow } from "date-fns";
import { Calendar, CalendarClock, Check, Clock, MapPin, Scissors, User, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Appointment, AppointmentStatus } from "@/lib/api/types";
import { STATUS_BADGE_VARIANT, STATUS_LABELS, isAppointmentStatus } from "@/lib/appointments/status";
import { cn } from "@/lib/utils";

function formatCurrency(cents: number, currency = "USD") {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100);
  } catch {
    return `$${(cents / 100).toFixed(2)}`;
  }
}

type AppointmentCardProps = {
  appointment: Appointment;
  currency?: string;
  canUpdate?: boolean;
  onStatusChange?: (uuid: string, status: AppointmentStatus) => void;
  onReschedule?: () => void;
  selected?: boolean;
  onSelect?: () => void;
};

export function AppointmentCard({
  appointment,
  currency = "USD",
  canUpdate,
  onStatusChange,
  onReschedule,
  selected,
  onSelect,
}: AppointmentCardProps) {
  const start = appointment.starts_at ? new Date(appointment.starts_at) : null;
  const end = appointment.ends_at ? new Date(appointment.ends_at) : null;
  const status = isAppointmentStatus(appointment.status) ? appointment.status : "pending";
  const variant = STATUS_BADGE_VARIANT[status] ?? "secondary";
  const isPast = end ? end < new Date() : false;
  const isTerminal = status === "completed" || status === "cancelled" || status === "no_show";

  return (
    <article
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (onSelect && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "flex gap-4 rounded-xl border bg-card p-4 transition-all",
        selected ? "border-accent ring-1 ring-accent/30 shadow-soft" : "border-border/60 hover:border-accent/30",
        onSelect && "cursor-pointer"
      )}
    >
      <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-lg bg-muted/50 py-2 text-center">
        {start ? (
          <>
            <span className="text-lg font-semibold leading-none">{format(start, "h:mm")}</span>
            <span className="mt-0.5 text-[10px] uppercase text-muted-foreground">{format(start, "a")}</span>
            {end ? (
              <span className="mt-1 text-[10px] text-muted-foreground">
                {format(end, "h:mm a")}
              </span>
            ) : null}
          </>
        ) : (
          <Clock className="h-5 w-5 text-muted-foreground" />
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold leading-tight">{appointment.service?.name ?? "Appointment"}</h3>
            <p className="text-sm text-muted-foreground">
              {start ? format(start, "EEE, MMM d, yyyy") : "—"}
              {start && !isPast ? (
                <span className="ml-1 text-accent">· {formatDistanceToNow(start, { addSuffix: true })}</span>
              ) : null}
            </p>
          </div>
          <Badge variant={variant} className="capitalize shrink-0">
            {STATUS_LABELS[status] ?? appointment.status}
          </Badge>
        </div>

        <ul className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
          <li className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 shrink-0 text-accent" />
            <span className="truncate">{appointment.client?.name ?? "Walk-in / guest"}</span>
          </li>
          {appointment.staff_member ? (
            <li className="flex items-center gap-1.5">
              <Scissors className="h-3.5 w-3.5 shrink-0 text-accent" />
              <span className="truncate">{appointment.staff_member.display_name}</span>
            </li>
          ) : null}
          {appointment.location?.name ? (
            <li className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-accent" />
              <span className="truncate">{appointment.location.name}</span>
            </li>
          ) : null}
          {appointment.service?.price_cents != null ? (
            <li className="flex items-center gap-1.5 font-medium text-foreground">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-accent" />
              {formatCurrency(appointment.service.price_cents, currency)}
              <span className="text-muted-foreground font-normal">
                · {appointment.service.duration_minutes} min
              </span>
            </li>
          ) : null}
        </ul>

        {appointment.notes ? (
          <p className="rounded-lg bg-muted/40 px-2 py-1.5 text-xs text-muted-foreground line-clamp-2">
            {appointment.notes}
          </p>
        ) : null}
      </div>

      {canUpdate && onStatusChange && !isTerminal ? (
        <div className="flex shrink-0 flex-col gap-1" onClick={(e) => e.stopPropagation()}>
          {onReschedule ? (
            <Button type="button" size="sm" variant="outline" className="h-8 gap-1" onClick={onReschedule}>
              <CalendarClock className="h-3.5 w-3.5" />
              Reschedule
            </Button>
          ) : null}
          {status === "pending" ? (
            <Button
              type="button"
              size="sm"
              className="h-8 gap-1"
              onClick={() => onStatusChange(appointment.uuid, "confirmed")}
            >
              <Check className="h-3.5 w-3.5" />
              Confirm
            </Button>
          ) : null}
          {status === "confirmed" ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-8 gap-1"
              onClick={() => onStatusChange(appointment.uuid, "completed")}
            >
              <Check className="h-3.5 w-3.5" />
              Complete
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={() => onStatusChange(appointment.uuid, "no_show")}
          >
            No show
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 gap-1 text-destructive hover:text-destructive"
            onClick={() => onStatusChange(appointment.uuid, "cancelled")}
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </Button>
        </div>
      ) : null}
    </article>
  );
}
