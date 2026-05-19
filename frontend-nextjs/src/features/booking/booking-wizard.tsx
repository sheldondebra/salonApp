"use client";

import { useEffect, useState } from "react";
import { format, addDays, setHours, setMinutes } from "date-fns";
import { CalendarHeart, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Skeleton } from "@/components/ui/skeleton";
import { createApiClient, ApiError } from "@/lib/api/client";
import { tenantApiBase } from "@/lib/api/tenant-path";
import type { Service, StaffMember, Tenant } from "@/lib/api/types";

const TIME_SLOTS = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];

type BookingWizardProps = {
  /** Omit on custom-domain public booking (API resolves tenant from Host). */
  tenantSlug?: string | null;
  tenant?: Tenant | null;
};

export function BookingWizard({ tenantSlug, tenant }: BookingWizardProps) {
  const apiBase = tenantApiBase(tenantSlug ?? tenant?.slug);
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [serviceId, setServiceId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd"));
  const [time, setTime] = useState("10:00");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const client = createApiClient();
    Promise.all([
      client.get<{ data: Service[] }>(`${apiBase}/services`),
      client.get<{ data: StaffMember[] }>(`${apiBase}/staff`),
    ])
      .then(([s, st]) => {
        setServices(s.data);
        setStaff(st.data);
      })
      .catch(() => toast.error("Could not load booking catalog. Is the API running?"))
      .finally(() => setLoading(false));
  }, [apiBase]);

  const selectedService = services.find((s) => String(s.id) === serviceId);

  async function confirmBooking() {
    if (!serviceId || !name || !email) {
      toast.error("Please complete all required fields");
      return;
    }
    setSubmitting(true);
    const [h, m] = time.split(":").map(Number);
    const startsAt = setMinutes(setHours(new Date(date), h), m);

    try {
      await createApiClient().post(`${apiBase}/appointments`, {
        service_id: Number(serviceId),
        staff_member_id: staffId ? Number(staffId) : null,
        starts_at: startsAt.toISOString(),
        client_name: name,
        client_email: email,
        client_phone: phone || null,
      });
      setStep(4);
      toast.success("Appointment booked!");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Booking failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <Skeleton className="mx-auto h-96 max-w-lg rounded-2xl" />;
  }

  if (step === 4) {
    return (
      <Card className="mx-auto max-w-lg shadow-soft">
        <CardContent className="flex flex-col items-center py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-accent">
            <Check className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-semibold">You&apos;re booked!</h2>
          <p className="mt-2 text-muted-foreground">
            {selectedService?.name} on {format(new Date(date), "EEEE, MMM d")} at {time}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-lg shadow-soft">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/30 text-accent">
          <CalendarHeart className="h-6 w-6" />
        </div>
        <CardTitle>Book with {tenant?.name ?? "us"}</CardTitle>
        <CardDescription>{tenant?.branding?.tagline ?? "Select a service and time"}</CardDescription>
        <div className="mt-4 flex justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <span
              key={s}
              className={`h-2 w-8 rounded-full transition-colors ${step >= s ? "bg-accent" : "bg-muted"}`}
            />
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 1 && (
          <>
            <div className="space-y-2">
              <Label>Service</Label>
              <Combobox
                options={services.map((s) => ({
                  value: String(s.id),
                  label: `${s.name} · $${s.price_formatted} · ${s.duration_minutes}min`,
                }))}
                value={serviceId}
                onValueChange={setServiceId}
                placeholder="Choose a service"
                searchPlaceholder="Search services…"
              />
            </div>
            <div className="space-y-2">
              <Label>Preferred stylist (optional)</Label>
              <Combobox
                options={staff.map((s) => ({ value: String(s.id), label: s.display_name }))}
                value={staffId}
                onValueChange={setStaffId}
                placeholder="Any available stylist"
                searchPlaceholder="Search team…"
              />
            </div>
            <Button className="w-full" disabled={!serviceId} onClick={() => setStep(2)}>
              Continue
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Combobox
                options={TIME_SLOTS.map((t) => ({ value: t, label: t }))}
                value={time}
                onValueChange={setTime}
                placeholder="Select time"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button className="flex-1" onClick={() => setStep(3)}>
                Continue
              </Button>
            </div>
          </>
        )}

        {step === 3 && (
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
            <div className="rounded-xl bg-muted/50 p-4 text-sm">
              <p className="font-medium">{selectedService?.name}</p>
              <p className="text-muted-foreground">
                {format(new Date(date), "PPP")} at {time} · ${selectedService?.price_formatted}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button className="flex-1" disabled={submitting} onClick={confirmBooking}>
                {submitting ? "Booking…" : "Confirm booking"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
