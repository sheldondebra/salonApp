"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, addDays } from "date-fns";
import { CalendarHeart, MapPin, Repeat, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Skeleton } from "@/components/ui/skeleton";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { bookingApiBase } from "@/lib/api/tenant-path";
import { BookingConfirmSummary } from "@/features/booking/booking-confirm-summary";
import { BookingDateStrip } from "@/features/booking/booking-date-strip";
import { BookingServicePicker } from "@/features/booking/booking-service-picker";
import { BookingStepIndicator } from "@/features/booking/booking-step-indicator";
import { BookingPaymentStep } from "@/features/booking/booking-payment-step";
import { BookingSuccess } from "@/features/booking/booking-success";
import { BookingTimeSlots } from "@/features/booking/booking-time-slots";
import { normalizeAppointmentsFromResponse } from "@/features/booking/booking-helpers";
import type {
  Appointment,
  BookingTimeSlot,
  Location,
  Service,
  StaffMember,
  Tenant,
  TenantBookingConfig,
} from "@/lib/api/types";

type BookingStepId = "location" | "services" | "staff" | "schedule" | "options" | "confirm";

const STEP_LABELS: Record<BookingStepId, string> = {
  location: "Location",
  services: "Services",
  staff: "Team",
  schedule: "Schedule",
  options: "Options",
  confirm: "Confirm",
};

/**
 * Branch picker only for tenants that enable multiple locations AND have 2+ branches.
 * Default SaaS tenant: location_mode "none" (one business, one address on tenant row).
 */
function activeBookingSteps(
  locationMode: TenantBookingConfig["location_mode"] | undefined,
  locationCount: number
): BookingStepId[] {
  const steps: BookingStepId[] = [];
  const showBranch =
    locationMode === "multi" || (locationMode === undefined && locationCount > 1);
  if (showBranch) {
    steps.push("location");
  }
  steps.push("services", "staff", "schedule", "options", "confirm");
  return steps;
}

type BookingWizardProps = {
  tenantSlug?: string | null;
  tenant?: Tenant | null;
  booking?: TenantBookingConfig | null;
};

export function BookingWizard({ tenantSlug, tenant, booking }: BookingWizardProps) {
  const resolvedSlug = tenantSlug ?? tenant?.slug ?? "";
  const apiBase = bookingApiBase(resolvedSlug || null);
  const bookingClient = useMemo(
    () => createApiClient(getApiClientOptions(undefined, resolvedSlug || undefined)),
    [resolvedSlug]
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [waitlistDone, setWaitlistDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [locations, setLocations] = useState<Location[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [slots, setSlots] = useState<BookingTimeSlot[]>([]);

  const [locationId, setLocationId] = useState("");
  const [serviceIds, setServiceIds] = useState<number[]>([]);
  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd"));
  const [time, setTime] = useState("");
  const [partySize, setPartySize] = useState(1);
  const [recurring, setRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<"weekly" | "biweekly" | "monthly">("weekly");
  const [recurrenceCount, setRecurrenceCount] = useState(4);
  const [joinWaitlist, setJoinWaitlist] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmedAppointments, setConfirmedAppointments] = useState<Appointment[]>([]);
  const [paymentSkipped, setPaymentSkipped] = useState(false);

  useEffect(() => {
    const client = bookingClient;
    Promise.all([
      client.get<{ data: Location[] }>(`${apiBase}/locations`),
      client.get<{ data: Service[] }>(`${apiBase}/services`),
      client.get<{ data: StaffMember[] }>(`${apiBase}/staff`),
    ])
      .then(([loc, svc, st]) => {
        const locList = Array.isArray(loc.data) ? loc.data : [];
        const svcList = Array.isArray(svc.data) ? svc.data : [];
        const staffList = Array.isArray(st.data) ? st.data : [];
        setLocations(locList);
        setServices(svcList);
        setStaff(staffList);
        if (locList.length === 1) {
          setLocationId(String(locList[0].id));
        }
        if (svcList.length === 0) {
          toast.error("No bookable services yet. Add services in your salon dashboard.");
        }
      })
      .catch((err) =>
        toast.error(
          err instanceof ApiError ? err.message : "Could not load booking catalog. Is the API running?"
        )
      )
      .finally(() => setLoading(false));
  }, [apiBase, bookingClient]);

  const selectedServices = useMemo(
    () => services.filter((s) => serviceIds.includes(s.id)),
    [services, serviceIds]
  );

  const totalDuration = useMemo(
    () => selectedServices.reduce((sum, s) => sum + s.duration_minutes, 0),
    [selectedServices]
  );

  const totalPrice = useMemo(
    () => selectedServices.reduce((sum, s) => sum + s.price_cents, 0),
    [selectedServices]
  );

  const currency = tenant?.currency ?? "USD";

  const timeLabel = useMemo(
    () => slots.find((s) => s.time === time)?.label ?? (time || null),
    [slots, time]
  );

  const staffName = useMemo(
    () => staff.find((s) => String(s.id) === staffId)?.display_name ?? null,
    [staff, staffId]
  );

  const staffOptions = useMemo(
    () => [
      { value: "", label: "Any available team member" },
      ...staff.map((s) => ({ value: String(s.id), label: s.display_name })),
    ],
    [staff]
  );

  const steps = useMemo(
    () => activeBookingSteps(booking?.location_mode, locations.length),
    [booking?.location_mode, locations.length]
  );
  const stepItems = useMemo(() => steps.map((id) => ({ id, label: STEP_LABELS[id] })), [steps]);
  const currentStep = steps[stepIndex] ?? "services";
  const showLocationStep = steps.includes("location");

  const locationSummary = useMemo(() => {
    if (locations.length === 0) {
      return tenant?.branding?.address ?? null;
    }
    const picked = locations.find((l) => String(l.id) === locationId);
    return picked?.label ?? picked?.name ?? null;
  }, [locations, locationId, tenant?.branding?.address]);

  const goNext = () => setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0));

  const loadSlots = useCallback(async () => {
    if (!serviceIds.length || !date) return;
    setLoadingSlots(true);
    try {
      const params = new URLSearchParams({
        date,
        ...Object.fromEntries(serviceIds.map((id, i) => [`service_ids[${i}]`, String(id)])),
      });
      if (staffId) params.set("staff_member_id", staffId);
      if (locationId) params.set("location_id", locationId);

      const res = await bookingClient.get<{
        data: BookingTimeSlot[];
        meta: { has_availability: boolean };
      }>(`${apiBase}/availability?${params}`);

      setSlots(res.data);
      const firstOpen = res.data.find((s) => s.available);
      if (firstOpen) {
        setTime(firstOpen.time);
        setJoinWaitlist(false);
      } else {
        setTime("");
        setJoinWaitlist(true);
      }
    } catch {
      toast.error("Could not load available times");
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [apiBase, date, serviceIds, staffId, locationId]);

  useEffect(() => {
    if (stepIndex >= steps.length) {
      setStepIndex(Math.max(0, steps.length - 1));
    }
  }, [steps.length, stepIndex]);

  useEffect(() => {
    if (currentStep === "schedule" && serviceIds.length > 0) {
      loadSlots();
    }
  }, [currentStep, loadSlots, serviceIds.length]);

  function toggleService(id: number) {
    setServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function buildStartsAt(): string {
    const [h, m] = time.split(":").map(Number);
    const d = new Date(date);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  }

  async function confirmBooking() {
    if (!serviceIds.length || !name || !email) {
      toast.error("Please complete all required fields");
      return;
    }
    if (!joinWaitlist && !time) {
      toast.error("Select a time or join the waitlist");
      return;
    }

    setSubmitting(true);
    try {
      const client = bookingClient;

      if (joinWaitlist) {
        await client.post(`${apiBase}/waitlist`, {
          service_ids: serviceIds,
          staff_member_id: staffId ? Number(staffId) : null,
          location_id: locationId ? Number(locationId) : null,
          preferred_date: date,
          preferred_time: time || null,
          party_size: partySize,
          client_name: name,
          client_email: email,
          client_phone: phone || null,
        });
        setConfirmedAppointments([]);
        setWaitlistDone(true);
        setDone(true);
        toast.success("Added to waitlist");
        return;
      }

      const res = await client.post<{ appointments?: unknown }>(`${apiBase}/appointments`, {
        service_ids: serviceIds,
        staff_member_id: staffId ? Number(staffId) : null,
        location_id: locationId ? Number(locationId) : null,
        starts_at: buildStartsAt(),
        party_size: partySize,
        recurrence:
          recurring && recurrenceCount > 1
            ? { frequency: recurrenceFrequency, occurrences: recurrenceCount }
            : undefined,
        client_name: name,
        client_email: email,
        client_phone: phone || null,
      });
      const booked = normalizeAppointmentsFromResponse(res.appointments);
      if (booked.length === 0) {
        throw new ApiError("Booking saved but no appointment details returned.", 500);
      }
      setConfirmedAppointments(booked);
      setWaitlistDone(false);
      setDone(true);
      toast.success("Appointment booked!");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Booking failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <Skeleton className="mx-auto h-[32rem] max-w-lg rounded-2xl" />;
  }

  function resetBooking() {
    setDone(false);
    setWaitlistDone(false);
    setConfirmedAppointments([]);
    setStepIndex(0);
    setServiceIds([]);
    setStaffId("");
    setTime("");
    setJoinWaitlist(false);
    setName("");
    setEmail("");
    setPhone("");
    setPaymentSkipped(false);
  }

  const primaryAppointment = confirmedAppointments[0];
  const needsOnlinePayment =
    Boolean(booking?.payments?.enabled) &&
    !waitlistDone &&
    !paymentSkipped &&
    primaryAppointment &&
    (primaryAppointment.amount_due_cents ?? 0) > 0 &&
    primaryAppointment.payment_status !== "paid";

  if (done && needsOnlinePayment) {
    return (
      <Card className="mx-auto max-w-lg shadow-soft">
        <CardHeader className="text-center">
          <CardTitle>Almost done</CardTitle>
          <CardDescription>Complete payment to secure your appointment.</CardDescription>
        </CardHeader>
        <CardContent>
          <BookingPaymentStep
            tenantSlug={tenantSlug ?? tenant?.slug ?? ""}
            appointment={primaryAppointment}
            booking={booking}
            clientEmail={email}
            clientName={name}
            onSkip={() => setPaymentSkipped(true)}
          />
        </CardContent>
      </Card>
    );
  }

  if (done) {
    return (
      <BookingSuccess
        tenantName={tenant?.name ?? "Salon"}
        tenantSlug={tenantSlug ?? tenant?.slug ?? ""}
        waitlist={waitlistDone}
        appointments={confirmedAppointments}
        clientName={name}
        clientEmail={email}
        preferredDate={date}
        preferredTimeLabel={timeLabel}
        currency={currency}
        onBookAgain={resetBooking}
      />
    );
  }

  return (
    <Card className="mx-auto max-w-xl shadow-soft">
      <CardHeader className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/30 text-accent">
          <CalendarHeart className="h-6 w-6" />
        </div>
        <div>
          <CardTitle className="text-2xl">Book with {tenant?.name ?? "us"}</CardTitle>
          <CardDescription className="mt-1">
            Choose services, pick a time, and confirm in a few steps
          </CardDescription>
        </div>
        <BookingStepIndicator steps={stepItems} currentIndex={stepIndex} />
      </CardHeader>
      <CardContent className="space-y-5 pb-28 sm:pb-6">
        {currentStep === "location" && showLocationStep && (
          <>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Choose a branch
            </div>
            <Combobox
              options={locations.map((l) => ({ value: String(l.id), label: l.label }))}
              value={locationId}
              onValueChange={setLocationId}
              placeholder="Choose a branch"
              searchPlaceholder="Search branches…"
            />
            <NavButtons onBack={null} onNext={goNext} nextDisabled={!locationId} />
          </>
        )}

        {currentStep === "services" && (
          <>
            <BookingServicePicker
              services={services}
              selectedIds={serviceIds}
              onToggle={toggleService}
              currency={currency}
              totalDuration={totalDuration}
              totalPrice={totalPrice}
            />
            <StepNav
              onBack={stepIndex > 0 ? goBack : null}
              onNext={goNext}
              nextDisabled={serviceIds.length === 0}
              sticky
            />
          </>
        )}

        {currentStep === "staff" && (
          <>
            <div className="space-y-2">
              <Label>Stylist / technician (optional)</Label>
              <Combobox
                options={staffOptions}
                value={staffId}
                onValueChange={setStaffId}
                placeholder="Any available team member"
                searchPlaceholder="Search team…"
                className="rounded-xl"
              />
            </div>
            <StepNav onBack={goBack} onNext={goNext} sticky />
          </>
        )}

        {currentStep === "schedule" && (
          <>
            <div className="space-y-2">
              <Label>Date</Label>
              <BookingDateStrip value={date} onChange={setDate} />
              <Input
                type="date"
                value={date}
                min={format(new Date(), "yyyy-MM-dd")}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <BookingTimeSlots
              slots={slots}
              value={time}
              onChange={setTime}
              loading={loadingSlots}
              onRefresh={loadSlots}
              joinWaitlist={joinWaitlist}
              onJoinWaitlistChange={setJoinWaitlist}
            />
            <StepNav onBack={goBack} onNext={goNext} nextDisabled={!joinWaitlist && !time} sticky />
          </>
        )}

        {currentStep === "options" && (
          <>
            <div className="space-y-4 rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4 text-accent" />
                Group booking
              </div>
              <div className="space-y-2">
                <Label htmlFor="party">Party size (guests)</Label>
                <Input
                  id="party"
                  type="number"
                  min={1}
                  max={10}
                  value={partySize}
                  onChange={(e) => setPartySize(Math.max(1, Number(e.target.value) || 1))}
                />
              </div>
            </div>
            <div className="space-y-4 rounded-xl border border-border p-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />
                <Repeat className="h-4 w-4 text-accent" />
                Recurring appointments
              </label>
              {recurring ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Combobox
                      options={[
                        { value: "weekly", label: "Weekly" },
                        { value: "biweekly", label: "Every 2 weeks" },
                        { value: "monthly", label: "Monthly" },
                      ]}
                      value={recurrenceFrequency}
                      onValueChange={(v) =>
                        setRecurrenceFrequency(v as "weekly" | "biweekly" | "monthly")
                      }
                      placeholder="Frequency"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="occurrences">Occurrences</Label>
                    <Input
                      id="occurrences"
                      type="number"
                      min={2}
                      max={12}
                      value={recurrenceCount}
                      onChange={(e) => setRecurrenceCount(Math.max(2, Number(e.target.value) || 2))}
                    />
                  </div>
                </div>
              ) : null}
            </div>
            <StepNav onBack={goBack} onNext={goNext} sticky />
          </>
        )}

        {currentStep === "confirm" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <BookingConfirmSummary
              services={selectedServices}
              date={date}
              timeLabel={timeLabel}
              joinWaitlist={joinWaitlist}
              locationSummary={locationSummary}
              staffName={staffName}
              partySize={partySize}
              recurring={recurring}
              recurrenceCount={recurrenceCount}
              recurrenceFrequency={recurrenceFrequency}
              totalDuration={totalDuration}
              totalPrice={totalPrice}
              currency={currency}
              name={name}
              email={email}
              phone={phone}
            />
            <StepNav
              onBack={goBack}
              onNext={confirmBooking}
              nextLabel={joinWaitlist ? "Join waitlist" : submitting ? "Saving…" : "Confirm & book"}
              nextDisabled={submitting || !name.trim() || !email.trim()}
              sticky
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function StepNav({
  sticky,
  ...props
}: {
  onBack: (() => void) | null;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  sticky?: boolean;
}) {
  return (
    <div
      className={
        sticky
          ? "fixed bottom-0 left-0 right-0 z-10 border-t border-border bg-background/95 p-4 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none"
          : undefined
      }
    >
      <div className="mx-auto max-w-xl">
        <NavButtons {...props} />
      </div>
    </div>
  );
}

function NavButtons({
  onBack,
  onNext,
  nextDisabled,
  nextLabel = "Continue",
}: {
  onBack: (() => void) | null;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
}) {
  return (
    <div className="flex gap-2 pt-2">
      {onBack ? (
        <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
          Back
        </Button>
      ) : (
        <div className="flex-1" />
      )}
      <Button type="button" className="flex-1 rounded-xl" disabled={nextDisabled} onClick={onNext}>
        {nextLabel}
      </Button>
    </div>
  );
}
