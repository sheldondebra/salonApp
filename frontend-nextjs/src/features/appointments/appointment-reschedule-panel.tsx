"use client";

import { useCallback, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { CalendarClock, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BookingDateStrip } from "@/features/booking/booking-date-strip";
import { BookingTimeSlots } from "@/features/booking/booking-time-slots";
import { loadAvailabilitySlots } from "@/features/booking/load-availability-slots";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { Appointment, BookingTimeSlot } from "@/lib/api/types";

type AppointmentReschedulePanelProps = {
  tenantSlug: string;
  appointment: Appointment;
  onClose: () => void;
  onRescheduled: (updated: Appointment) => void;
};

export function AppointmentReschedulePanel({
  tenantSlug,
  appointment,
  onClose,
  onRescheduled,
}: AppointmentReschedulePanelProps) {
  const serviceId = appointment.service?.id;
  const initialDate = appointment.starts_at
    ? format(parseISO(appointment.starts_at), "yyyy-MM-dd")
    : format(new Date(), "yyyy-MM-dd");
  const initialTime = appointment.starts_at
    ? format(parseISO(appointment.starts_at), "HH:mm")
    : "";

  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [slots, setSlots] = useState<BookingTimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadSlots = useCallback(async () => {
    if (!serviceId || !date) return;
    setLoadingSlots(true);
    try {
      const data = await loadAvailabilitySlots({
        tenantSlug,
        date,
        serviceIds: [serviceId],
        staffMemberId: appointment.staff_member?.id ?? null,
        locationId: appointment.location?.id ?? null,
        excludeAppointmentUuid: appointment.uuid,
      });
      setSlots(data);
      const stillValid = data.some((s) => s.time === time && s.available);
      if (!stillValid) {
        const first = data.find((s) => s.available);
        setTime(first?.time ?? "");
      }
    } catch {
      toast.error("Could not load available times");
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [tenantSlug, appointment, date, serviceId, time]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  function buildStartsAt(): string {
    const [h, m] = time.split(":").map(Number);
    const d = new Date(date);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  }

  async function save() {
    if (!time) {
      toast.error("Select an available time");
      return;
    }
    setSaving(true);
    try {
      const res = await createApiClient(getApiClientOptions()).patch<{ data: Appointment }>(
        `/${tenantSlug}/appointments/${appointment.uuid}`,
        { starts_at: buildStartsAt() }
      );
      toast.success("Appointment rescheduled");
      onRescheduled(res.data);
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not reschedule");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-accent/30 bg-accent/5 p-4 shadow-soft">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <CalendarClock className="h-4 w-4 text-accent" />
            Reschedule
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {appointment.service?.name} · {appointment.client?.name ?? "Guest"}
          </p>
        </div>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Date</Label>
          <BookingDateStrip value={date} onChange={setDate} daysAhead={21} />
        </div>
        <BookingTimeSlots
          slots={slots}
          value={time}
          onChange={setTime}
          loading={loadingSlots}
          onRefresh={loadSlots}
          joinWaitlist={false}
          onJoinWaitlistChange={() => {}}
        />
        <div className="flex gap-2 pt-1">
          <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" className="flex-1 rounded-xl" disabled={saving || !time} onClick={save}>
            {saving ? "Saving…" : "Save new time"}
          </Button>
        </div>
      </div>
    </div>
  );
}
