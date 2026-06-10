"use client";

import { format, parseISO } from "date-fns";
import { Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/format/money";
import { STATUS_LABELS } from "@/lib/appointments/status";
import type { Appointment, AppointmentStatus } from "@/lib/api/types";

type AppointmentDetailDrawerProps = {
  appointment: Appointment;
  currency?: string;
  canUpdate?: boolean;
  canRequestPayment?: boolean;
  onClose: () => void;
  onStatusChange?: (uuid: string, status: AppointmentStatus) => void;
  onReschedule?: () => void;
  onRequestPayment?: () => void;
};

export function AppointmentDetailDrawer({
  appointment,
  currency = "USD",
  canUpdate,
  canRequestPayment,
  onClose,
  onStatusChange,
  onReschedule,
  onRequestPayment,
}: AppointmentDetailDrawerProps) {
  const when = appointment.starts_at
    ? format(parseISO(appointment.starts_at), "EEE, MMM d · h:mm a")
    : "—";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-foreground/20 backdrop-blur-sm">
      <button type="button" className="flex-1" aria-label="Close" onClick={onClose} />
      <aside className="flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-elevated">
        <div className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div>
            <p className="text-sm text-muted-foreground">Appointment</p>
            <h2 className="text-xl font-semibold">{appointment.service?.name ?? "Service"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{when}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close drawer">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5 text-sm">
          <div>
            <p className="text-muted-foreground">Client</p>
            <p className="font-medium">{appointment.client?.name ?? "Walk-in"}</p>
            {appointment.client?.email ? (
              <p className="text-muted-foreground">{appointment.client.email}</p>
            ) : null}
          </div>
          <div>
            <p className="text-muted-foreground">Staff</p>
            <p className="font-medium">{appointment.staff_member?.display_name ?? "Any"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="capitalize">
              {STATUS_LABELS[appointment.status as AppointmentStatus] ?? appointment.status}
            </Badge>
            {appointment.payment_status ? (
              <Badge variant="secondary" className="capitalize">
                {appointment.payment_status}
              </Badge>
            ) : null}
          </div>
          {appointment.amount_due_cents != null ? (
            <div>
              <p className="text-muted-foreground">Amount due</p>
              <p className="font-medium">{formatMoney(appointment.amount_due_cents, currency)}</p>
            </div>
          ) : null}
          {appointment.notes ? (
            <div>
              <p className="text-muted-foreground">Notes</p>
              <p>{appointment.notes}</p>
            </div>
          ) : null}
        </div>

        {(canUpdate || canRequestPayment) ? (
          <div className="flex flex-wrap gap-2 border-t border-border p-5">
            {canRequestPayment && appointment.payment_status !== "paid" ? (
              <Button size="sm" variant="secondary" className="gap-1" onClick={onRequestPayment}>
                <Smartphone className="h-3.5 w-3.5" />
                Request MoMo
              </Button>
            ) : null}
            {canUpdate ? (
              <>
                {appointment.status === "pending" ? (
                  <Button size="sm" onClick={() => onStatusChange?.(appointment.uuid, "confirmed")}>
                    Confirm
                  </Button>
                ) : null}
                {["pending", "confirmed"].includes(appointment.status) ? (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onStatusChange?.(appointment.uuid, "completed")}
                    >
                      Complete
                    </Button>
                    <Button size="sm" variant="outline" onClick={onReschedule}>
                      Reschedule
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => onStatusChange?.(appointment.uuid, "cancelled")}
                    >
                      Cancel
                    </Button>
                  </>
                ) : null}
              </>
            ) : null}
          </div>
        ) : null}
      </aside>
    </div>
  );
}
