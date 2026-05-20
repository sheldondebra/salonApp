"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, addDays } from "date-fns";
import { CalendarPlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingConfirmSummary } from "@/features/booking/booking-confirm-summary";
import { BookingDateStrip } from "@/features/booking/booking-date-strip";
import { BookingServicePicker } from "@/features/booking/booking-service-picker";
import { BookingStepIndicator } from "@/features/booking/booking-step-indicator";
import { BookingTimeSlots } from "@/features/booking/booking-time-slots";
import { loadAvailabilitySlots } from "@/features/booking/load-availability-slots";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type {
  Location,
  Service,
  StaffMember,
  TenantBookingConfig,
  TenantClient,
} from "@/lib/api/types";
import { cn } from "@/lib/utils";

type StaffBookingStep = "services" | "staff" | "location" | "schedule" | "client" | "confirm";

const STEP_LABELS: Record<StaffBookingStep, string> = {
  services: "Services",
  staff: "Team",
  location: "Branch",
  schedule: "Schedule",
  client: "Client",
  confirm: "Confirm",
};

function activeStaffSteps(showLocation: boolean): StaffBookingStep[] {
  const steps: StaffBookingStep[] = ["services", "staff"];
  if (showLocation) steps.push("location");
  steps.push("schedule", "client", "confirm");
  return steps;
}

type StaffBookingPanelProps = {
  tenantSlug: string;
  currency?: string;
  booking?: TenantBookingConfig | null;
  onClose: () => void;
  onBooked: () => void;
};

function normalizeList<T>(payload: { data?: T[] } | T[] | undefined): T[] {
  if (!payload) return [];
  return Array.isArray(payload) ? payload : (payload.data ?? []);
}

export function StaffBookingPanel({
  tenantSlug,
  currency = "USD",
  booking,
  onClose,
  onBooked,
}: StaffBookingPanelProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const [stepIndex, setStepIndex] = useState(0);
  const [serviceIds, setServiceIds] = useState<number[]>([]);
  const [staffId, setStaffId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [date, setDate] = useState(format(addDays(new Date(), 0), "yyyy-MM-dd"));
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<Awaited<ReturnType<typeof loadAvailabilitySlots>>>([]);
  const [partySize, setPartySize] = useState(1);
  const [notes, setNotes] = useState("");

  const [clientMode, setClientMode] = useState<"existing" | "walkin">("existing");
  const [clientUserId, setClientUserId] = useState("");
  const [selectedClientLabel, setSelectedClientLabel] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [clientOptions, setClientOptions] = useState<{ value: string; label: string }[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [walkInName, setWalkInName] = useState("");
  const [walkInEmail, setWalkInEmail] = useState("");
  const [walkInPhone, setWalkInPhone] = useState("");

  const showLocation =
    booking?.location_mode === "multi" ||
    (booking?.location_mode === undefined && locations.length > 1);

  const steps = useMemo(() => activeStaffSteps(showLocation), [showLocation]);
  const stepItems = useMemo(() => steps.map((id) => ({ id, label: STEP_LABELS[id] })), [steps]);
  const currentStep = steps[stepIndex] ?? "services";

  const selectedServices = useMemo(
    () => services.filter((s) => serviceIds.includes(s.id)),
    [services, serviceIds]
  );
  const totalDuration = selectedServices.reduce((n, s) => n + s.duration_minutes, 0);
  const totalPrice = selectedServices.reduce((n, s) => n + s.price_cents, 0);
  const timeLabel = slots.find((s) => s.time === time)?.label ?? time;
  const staffName = staff.find((s) => String(s.id) === staffId)?.display_name;
  const locationSummary = locations.find((l) => String(l.id) === locationId)?.label;

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const client = createApiClient(getApiClientOptions());
      const [svcRes, staffRes, locRes] = await Promise.all([
        client.get<{ data: Service[] }>(`/${tenantSlug}/services?per_page=100&is_active=1`),
        client.get<{ data: StaffMember[] }>(`/${tenantSlug}/staff-members?per_page=100&is_active=1`),
        client.get<{ data: Location[] }>(`/${tenantSlug}/locations`).catch(() => ({ data: [] as Location[] })),
      ]);
      const svcRows = normalizeList(svcRes);
      const staffRows = normalizeList(staffRes).filter((m) => m.is_bookable !== false);
      const locRows = normalizeList(locRes);
      setServices(svcRows);
      setStaff(staffRows);
      setLocations(locRows);
      if (locRows.length === 1) setLocationId(String(locRows[0].id));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not load booking catalog");
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const loadSlots = useCallback(async () => {
    if (!serviceIds.length) return;
    setLoadingSlots(true);
    try {
      const data = await loadAvailabilitySlots({
        tenantSlug,
        date,
        serviceIds,
        staffMemberId: staffId ? Number(staffId) : null,
        locationId: locationId ? Number(locationId) : null,
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
  }, [tenantSlug, date, serviceIds, staffId, locationId, time]);

  useEffect(() => {
    if (currentStep === "schedule" && serviceIds.length > 0) {
      loadSlots();
    }
  }, [currentStep, loadSlots, serviceIds.length]);

  useEffect(() => {
    if (currentStep !== "client" || clientMode !== "existing") return;
    const q = clientSearch.trim();
    if (q.length < 2) {
      setClientOptions([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoadingClients(true);
      try {
        const res = await createApiClient(getApiClientOptions()).get<{ data: TenantClient[] }>(
          `/${tenantSlug}/clients?q=${encodeURIComponent(q)}&per_page=20&is_active=1`
        );
        const rows = normalizeList(res);
        setClientOptions(rows.map((c) => ({ value: String(c.id), label: `${c.name} · ${c.email}` })));
      } catch {
        setClientOptions([]);
      } finally {
        setLoadingClients(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [clientSearch, clientMode, currentStep, tenantSlug]);

  const staffOptions = useMemo(
    () => [
      { value: "", label: "Any available stylist" },
      ...staff.map((m) => ({ value: String(m.id), label: m.title ? `${m.display_name} · ${m.title}` : m.display_name })),
    ],
    [staff]
  );

  const locationOptions = useMemo(
    () => locations.map((l) => ({ value: String(l.id), label: l.label || l.name })),
    [locations]
  );

  function toggleService(id: number) {
    setServiceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function goNext() {
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }

  function goBack() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  function buildStartsAt(): string {
    const [h, m] = time.split(":").map(Number);
    const d = new Date(date);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  }

  const primaryDisabled = useMemo(() => {
    if (currentStep === "services") return serviceIds.length === 0;
    if (currentStep === "location") return !locationId;
    if (currentStep === "schedule") return !time;
    if (currentStep === "client") {
      if (clientMode === "existing") return !clientUserId;
      return !walkInName.trim() || !walkInEmail.trim();
    }
    if (currentStep === "confirm") return submitting;
    return false;
  }, [
    currentStep,
    serviceIds.length,
    locationId,
    time,
    clientMode,
    clientUserId,
    walkInName,
    walkInEmail,
    submitting,
  ]);

  async function submitBooking() {
    if (!serviceIds.length || !time) {
      toast.error("Select services and a time slot");
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        service_ids: serviceIds,
        staff_member_id: staffId ? Number(staffId) : null,
        location_id: locationId ? Number(locationId) : null,
        starts_at: buildStartsAt(),
        party_size: partySize,
        notes: notes.trim() || null,
      };
      if (clientMode === "existing" && clientUserId) {
        body.client_user_id = Number(clientUserId);
      } else {
        body.client_name = walkInName.trim();
        body.client_email = walkInEmail.trim();
        body.client_phone = walkInPhone.trim() || null;
      }

      await createApiClient(getApiClientOptions()).post(`/${tenantSlug}/appointments`, body);
      toast.success("Booking created");
      onBooked();
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not create booking");
    } finally {
      setSubmitting(false);
    }
  }

  function handlePrimary() {
    if (currentStep === "confirm") {
      void submitBooking();
    } else {
      goNext();
    }
  }

  if (loading) {
    return (
      <Card className="rounded-2xl border-accent/20 shadow-soft">
        <CardContent className="space-y-3 p-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-accent/30 bg-accent/5 shadow-soft">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarPlus className="h-5 w-5 text-accent" />
            New booking
          </CardTitle>
          <CardDescription>Book a client on the calendar — slots update in real time.</CardDescription>
        </div>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <BookingStepIndicator steps={stepItems} currentIndex={stepIndex} />

        {currentStep === "services" ? (
          <BookingServicePicker
            services={services}
            selectedIds={serviceIds}
            onToggle={toggleService}
            currency={currency}
          />
        ) : null}

        {currentStep === "staff" ? (
          <div className="space-y-2">
            <Label>Assign team member</Label>
            <Combobox
              options={staffOptions}
              value={staffId}
              onValueChange={setStaffId}
              placeholder="Choose stylist (optional)"
              searchPlaceholder="Search team…"
            />
          </div>
        ) : null}

        {currentStep === "location" ? (
          <div className="space-y-2">
            <Label>Branch</Label>
            <Combobox
              options={locationOptions}
              value={locationId}
              onValueChange={setLocationId}
              placeholder="Select branch"
              searchPlaceholder="Search branches…"
            />
          </div>
        ) : null}

        {currentStep === "schedule" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <BookingDateStrip value={date} onChange={setDate} daysAhead={28} />
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
            <div className="space-y-2">
              <Label htmlFor="party-size">Party size</Label>
              <Input
                id="party-size"
                type="number"
                min={1}
                max={10}
                className="max-w-[8rem] rounded-xl"
                value={partySize}
                onChange={(e) => setPartySize(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
          </div>
        ) : null}

        {currentStep === "client" ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={clientMode === "existing" ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setClientMode("existing")}
              >
                Existing client
              </Button>
              <Button
                type="button"
                size="sm"
                variant={clientMode === "walkin" ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setClientMode("walkin")}
              >
                Walk-in / guest
              </Button>
            </div>
            {clientMode === "existing" ? (
              <div className="space-y-2">
                <Label>Search client</Label>
                <Input
                  className="rounded-xl"
                  placeholder="Type name or email…"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                />
                {loadingClients ? (
                  <p className="text-xs text-muted-foreground">Searching…</p>
                ) : clientOptions.length > 0 ? (
                  <Combobox
                    options={clientOptions}
                    value={clientUserId}
                    onValueChange={(value) => {
                      setClientUserId(value);
                      const match = clientOptions.find((o) => o.value === value);
                      setSelectedClientLabel(match?.label ?? "");
                    }}
                    placeholder="Select client"
                    searchPlaceholder="Filter results…"
                  />
                ) : clientSearch.trim().length >= 2 ? (
                  <p className="text-sm text-muted-foreground">No clients found. Try walk-in or add them under Clients.</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Enter at least 2 characters to search.</p>
                )}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Name</Label>
                  <Input className="rounded-xl" value={walkInName} onChange={(e) => setWalkInName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    className="rounded-xl"
                    value={walkInEmail}
                    onChange={(e) => setWalkInEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input className="rounded-xl" value={walkInPhone} onChange={(e) => setWalkInPhone(e.target.value)} />
                </div>
              </div>
            )}
          </div>
        ) : null}

        {currentStep === "confirm" ? (
          <div className="space-y-4">
            <BookingConfirmSummary
              services={selectedServices}
              currency={currency}
              totalDuration={totalDuration}
              totalPrice={totalPrice}
              date={date}
              timeLabel={timeLabel}
              staffName={staffName ?? null}
              locationSummary={locationSummary ?? null}
              joinWaitlist={false}
              partySize={partySize}
              recurring={false}
              recurrenceCount={0}
              recurrenceFrequency="weekly"
              name={
                clientMode === "existing"
                  ? (selectedClientLabel.split(" · ")[0] ?? "")
                  : walkInName
              }
              email={
                clientMode === "existing"
                  ? (selectedClientLabel.split(" · ")[1] ?? "")
                  : walkInEmail
              }
              phone={clientMode === "walkin" ? walkInPhone : ""}
            />
            <div className="space-y-2">
              <Label htmlFor="booking-notes">Notes (optional)</Label>
              <Input
                id="booking-notes"
                className="rounded-xl"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Allergies, preferences, internal notes…"
              />
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
          {stepIndex > 0 ? (
            <Button type="button" variant="outline" className="rounded-xl" onClick={goBack}>
              Back
            </Button>
          ) : (
            <Button type="button" variant="outline" className="rounded-xl" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button
            type="button"
            className={cn("rounded-xl", stepIndex === 0 && "ml-auto")}
            disabled={primaryDisabled}
            onClick={handlePrimary}
          >
            {currentStep === "confirm" ? (submitting ? "Creating…" : "Create booking") : "Continue"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
